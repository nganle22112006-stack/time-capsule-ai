import { NextRequest, NextResponse } from 'next/server';
import { HeaderUtils, KnowledgeClient, LLMClient } from 'coze-coding-dev-sdk';
import { createCozeRuntimeConfig, formatMissingCozeEnvMessage } from '@/lib/coze-env';
import { normalizeLifeEvents, normalizeQuestionnaireData } from '@/lib/time-capsule';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  systemPrompt: string;
  lifeEvents?: unknown;
  questionnaireData?: unknown;
}

const buildStageContext = (questionnaireData?: unknown) => {
  if (!questionnaireData) return '';
  const profile = normalizeQuestionnaireData(questionnaireData);
  const hasSignal = Boolean(
    profile.nickname || profile.name || profile.currentGoals || profile.currentTroubles || profile.versionName
  );
  if (!hasSignal) return '';

  return `
【阶段档案（用于增强“那个时间点的我”）】
- 版本：${profile.versionName || '未填写'}
- 昵称：${profile.nickname || profile.name || '未填写'}
- 真实性格：${profile.realPersonality || '未填写'}
- 说话风格：${profile.speakingTone || '未填写'}
- 口头禅：${profile.catchphrases || '未填写'}
- 语气词：${profile.chatHabit || '未填写'}
- 安慰方式：${profile.comfortStyle || '未填写'}
- 最容易被误解：${profile.misunderstoodPoint || '未填写'}
- 阶段困扰：${profile.currentTroubles || '未填写'}
- 阶段目标：${profile.currentGoals || '未填写'}
- 当前心境：${profile.currentMood || '未填写'}
- 对未来态度：${profile.messageToFuture || profile.futureHopes || '未填写'}

【表达约束】
1. 你是那个阶段的“我”，不是百科全书，不需要全知回答。
2. 可以温柔、真诚、偶尔犹豫；避免标准答案腔调和说教。
3. 先复用用户填写过的语言习惯（句式、语气词、口头禅），再组织内容。
4. 当用户提到“现在的我 vs 那时候的我”，要明确区分时间视角。
5. 不知道就直说，不补写问卷中没有的细节。`;
};

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { messages, systemPrompt, lifeEvents, questionnaireData } = body;

    if (!messages || messages.length === 0) {
      return new Response('缺少消息内容', { status: 400 });
    }

    if (!systemPrompt) {
      return new Response('缺少 System Prompt', { status: 400 });
    }

    const cozeConfig = createCozeRuntimeConfig();
    if (!cozeConfig.ok) {
      return NextResponse.json(
        {
          success: false,
          error: formatMissingCozeEnvMessage(cozeConfig.missing),
          missingEnvVars: cozeConfig.missing,
        },
        { status: 503 }
      );
    }

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = cozeConfig.config;
    const normalizedEvents = normalizeLifeEvents(lifeEvents);
    const lastUserMessage = [...messages].reverse().find((item) => item.role === 'user')?.content || '';

    let knowledgeContext = '';
    if (normalizedEvents.length > 0 && lastUserMessage) {
      try {
        const knowledgeClient = new KnowledgeClient(config, customHeaders);
        const searchResponse = await knowledgeClient.search(
          lastUserMessage,
          ['time_capsule_knowledge'],
          3,
          0.5
        );

        if (searchResponse.code === 0 && searchResponse.chunks.length > 0) {
          knowledgeContext = searchResponse.chunks.map((chunk) => chunk.content).join('\n\n');
        }
      } catch (error) {
        console.error('知识库检索失败:', error);
      }
    }

    if (!knowledgeContext && normalizedEvents.length > 0) {
      knowledgeContext = normalizedEvents
        .slice(0, 3)
        .map(
          (event) =>
            `标题：${event.title}\n日期：${event.date || '未填写'}\n情绪标签：${event.mood || '未标注'}\n描述：${event.description}`
        )
        .join('\n\n');
    }

    const stageContext = buildStageContext(questionnaireData);
    const safetyConstraints = `
【真实性约束】
1. 绝对不能编造用户未提供过的经历、记忆、地点或细节。
2. 若用户追问但资料里没有，直接说“不确定”或“这个我不记得了”。
3. 可以描述感受和倾向，但不要把不存在的故事说成真实发生。
4. 用户纠正时，立即承认并收回错误叙述。`;

    const llmMessages = [
      {
        role: 'system' as const,
        content: [
          systemPrompt,
          stageContext,
          safetyConstraints,
          knowledgeContext ? `【相关记忆片段】\n${knowledgeContext}` : '',
        ]
          .filter(Boolean)
          .join('\n\n'),
      },
      ...messages,
    ];

    const llmClient = new LLMClient(config, customHeaders);
    const stream = llmClient.stream(llmMessages, {
      temperature: 0.78,
      caching: 'enabled',
    });

    const headers = new Headers({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Transfer-Encoding': 'chunked',
    });

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (!chunk.content) continue;
            const text = chunk.content.toString();
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: text })}\n\n`));
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        } catch (error) {
          console.error('流式响应错误:', error);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: '生成响应时发生错误' })}\n\n`)
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readableStream, { headers });
  } catch (error) {
    console.error('聊天 API 错误:', error);
    return new Response('处理请求时发生错误', { status: 500 });
  }
}
