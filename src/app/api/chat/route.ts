import { NextRequest, NextResponse } from 'next/server';
import { createLlmRuntimeConfig, formatMissingLlmEnvMessage } from '@/lib/llm-env';
import { LlmProviderError, requestChatCompletion } from '@/lib/llm-provider';
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
      return NextResponse.json({ error: 'missing messages' }, { status: 400 });
    }

    if (!systemPrompt?.trim()) {
      return NextResponse.json({ error: 'missing system prompt' }, { status: 400 });
    }

    const llmConfig = createLlmRuntimeConfig();
    if (!llmConfig.ok) {
      return NextResponse.json(
        {
          error: formatMissingLlmEnvMessage(llmConfig.missing),
          missingEnvVars: llmConfig.missing,
        },
        { status: 503 }
      );
    }

    const { provider } = llmConfig.config;
    console.log(`[chat] provider=${provider} messageCount=${messages.length}`);

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

    const result = await requestChatCompletion(llmConfig.config, llmMessages, { temperature: 0.78 });
    const reply = result.reply?.trim() || '';

    console.log(`[chat] provider=${provider} requestSuccess=true replyLength=${reply.length}`);

    if (!reply) {
      console.error('[chat] empty model reply', {
        provider,
        messageCount: messages.length,
        raw: result.raw,
      });
      return NextResponse.json({ error: 'empty model reply' }, { status: 502 });
    }

    return NextResponse.json({
      reply,
      provider,
    });
  } catch (error) {
    if (error instanceof LlmProviderError) {
      console.error('[chat] provider request failed', {
        status: error.status,
        message: error.message,
        details: error.details,
        stack: error.stack,
      });
      return NextResponse.json(
        {
          error: error.message,
        },
        { status: error.status || 502 }
      );
    }

    console.error('[chat] unexpected error', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'unexpected chat api error',
      },
      { status: 500 }
    );
  }
}
