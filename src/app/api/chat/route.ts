import { NextRequest, NextResponse } from 'next/server';
import { createLlmRuntimeConfig, formatMissingLlmEnvMessage } from '@/lib/llm-env';
import { streamChatCompletion } from '@/lib/llm-provider';
import { buildChatSystemPrompt } from '@/lib/persona-prompt';

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

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { messages, systemPrompt, lifeEvents, questionnaireData } = body;

    if (!messages || messages.length === 0) {
      return new Response('缺少消息内容', { status: 400 });
    }

    if (!systemPrompt?.trim()) {
      return new Response('缺少 System Prompt', { status: 400 });
    }

    const llmConfig = createLlmRuntimeConfig();
    if (!llmConfig.ok) {
      return NextResponse.json(
        {
          success: false,
          error: formatMissingLlmEnvMessage(llmConfig.missing),
          missingEnvVars: llmConfig.missing,
        },
        { status: 503 }
      );
    }

    const llmMessages = [
      {
        role: 'system' as const,
        content: buildChatSystemPrompt({
          systemPrompt,
          questionnaireData,
          lifeEvents,
        }),
      },
      ...messages,
    ];

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
          for await (const chunk of streamChatCompletion(llmConfig.config, llmMessages, { temperature: 0.78 })) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`));
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        } catch (error) {
          console.error('Streaming chat response failed:', error);
          const message = error instanceof Error ? error.message : '生成响应时发生错误';
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readableStream, { headers });
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response('处理请求时发生错误', { status: 500 });
  }
}
