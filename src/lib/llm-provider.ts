import type { LlmRuntimeConfig } from './llm-env.ts';

export interface ChatCompletionMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const resolveChatEndpoint = (baseUrl: string) => {
  const normalized = baseUrl.replace(/\/+$/, '');
  if (normalized.endsWith('/chat/completions')) {
    return normalized;
  }
  return `${normalized}/chat/completions`;
};

const extractContentDelta = (payload: unknown) => {
  if (!payload || typeof payload !== 'object') return '';
  const record = payload as {
    choices?: Array<{
      delta?: { content?: string | null };
      message?: { content?: string | null };
      text?: string | null;
    }>;
  };
  const choice = record.choices?.[0];
  if (!choice) return '';
  return choice.delta?.content || choice.message?.content || choice.text || '';
};

async function* streamSseResponse(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const frames = buffer.split('\n\n');
    buffer = frames.pop() || '';

    for (const frame of frames) {
      const lines = frame
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.startsWith('data:'));

      for (const line of lines) {
        const data = line.slice(5).trim();
        if (!data || data === '[DONE]') continue;
        const parsed = JSON.parse(data) as unknown;
        const content = extractContentDelta(parsed);
        if (content) {
          yield content;
        }
      }
    }
  }
}

export async function* streamChatCompletion(
  config: LlmRuntimeConfig,
  messages: ChatCompletionMessage[],
  options: { temperature?: number } = {}
) {
  const response = await fetch(resolveChatEndpoint(config.baseUrl), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      stream: true,
      temperature: options.temperature ?? 0.75,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `LLM request failed with status ${response.status}`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('text/event-stream')) {
    const body = response.body;
    if (!body) {
      throw new Error('LLM response did not include a response body.');
    }

    for await (const chunk of streamSseResponse(body)) {
      yield chunk;
    }
    return;
  }

  const payload = (await response.json()) as unknown;
  const content = extractContentDelta(payload);
  if (content) {
    yield content;
  }
}
