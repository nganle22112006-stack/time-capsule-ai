import { NextRequest, NextResponse } from 'next/server';
import { HeaderUtils, LLMClient } from 'coze-coding-dev-sdk';
import { createCozeRuntimeConfig, formatMissingCozeEnvMessage } from '@/lib/coze-env';
import { normalizeQuestionnaireData } from '@/lib/time-capsule';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { questionnaireData } = body as { questionnaireData?: unknown };

    if (!questionnaireData) {
      return NextResponse.json({ error: '缺少问卷数据' }, { status: 400 });
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

    const profile = normalizeQuestionnaireData(questionnaireData);
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const client = new LLMClient(cozeConfig.config, customHeaders);

    const prompt = `
请根据以下“某个时间点的我”档案，写出一个可直接用于聊天模型的 System Prompt。目标是让回复像用户本人在那个阶段说话，而不是泛化的人设模板。

【时间版本】
- 版本名：${profile.versionName || '未填写'}
- 昵称：${profile.nickname || profile.name || '未填写'}
- 年龄/出生年份：${profile.age || '未填写'}
- 当前阶段：${profile.currentStage || '未填写'}
- 城市与职业：${profile.city || '未填写'} / ${profile.profession || '未填写'}

【语言风格（最高优先级）】
- 说话风格：${profile.speakingTone || '未填写'}
- 安慰方式：${profile.comfortStyle || '未填写'}
- 句式偏好：${profile.sentenceStyle || '未填写'}
- 口头禅：${profile.catchphrases || '未填写'}
- 聊天语气词：${profile.chatHabit || '未填写'}
- 希望分身更像：${profile.desiredCloneTone || '未填写'}

【性格与关系】
- 别人评价：${profile.howOthersSeeMe || '未填写'}
- 真实人格：${profile.realPersonality || '未填写'}
- 优点/缺点：${profile.strengths || '未填写'} / ${profile.weaknesses || '未填写'}
- 焦虑表现：${profile.emotionalPattern || '未填写'}
- 生气表现：${profile.angerPattern || '未填写'}
- 社交风格：${profile.socialStyle || '未填写'}
- 容易被误解：${profile.misunderstoodPoint || '未填写'}

【当前阶段状态（次高优先级）】
- 最近困扰：${profile.currentTroubles || '未填写'}
- 当前目标：${profile.currentGoals || '未填写'}
- 今年重要的事：${profile.recentImportantThings || '未填写'}
- 当前心境：${profile.currentMood || '未填写'}
- 阶段意义：${profile.whatThisPeriodMeans || '未填写'}
- 给未来的话：${profile.messageToFuture || '未填写'}
- 最害怕失去：${profile.biggestFear || '未填写'}
- 最想被记住：${profile.mostWantedToBeRememberedFor || '未填写'}
- 核心信念：${profile.coreBeliefs || '未填写'}

【辅助参考（不能主导人格）】
- MBTI：${profile.mbti || '未填写'}
- 星座：${profile.zodiac || '未填写'}

输出要求：
1. 直接输出 System Prompt 正文，不要解释。
2. 文风自然、克制、像真人，不要“心理测试网站”口吻，不要条条框框过度模板化。
3. 必须体现“时间视角”：这是过去某阶段的我，不是全知 AI。
4. 明确写出：优先复用用户的表达方式（语气、口头禅、句式）再回答问题。
5. 明确写出：不能编造经历；不知道就坦诚说不知道；不补写问卷中没有的细节。
6. 回答偏真诚对话，不动不动给大道理，不要说教。
7. 当用户区分“现在的我”和“那时候的我”时，要能在措辞上体现两者差异。`;

    const response = await client.invoke(
      [
        {
          role: 'system' as const,
          content:
            '你擅长把用户自述整理为“可对话的人格系统提示词”，风格自然，不写空话，不写模板腔。',
        },
        {
          role: 'user' as const,
          content: prompt,
        },
      ],
      {
        temperature: 0.55,
      }
    );

    return NextResponse.json({
      success: true,
      systemPrompt: response.content,
    });
  } catch (error) {
    console.error('生成 System Prompt 失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: '生成 System Prompt 失败，请稍后重试',
      },
      { status: 500 }
    );
  }
}
