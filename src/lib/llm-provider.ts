import type { LlmRuntimeConfig } from './llm-env.ts';

export interface ChatCompletionMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionResult {
  reply: string;
  raw: unknown;
}

export class LlmProviderError extends Error {
  status: number;
  details?: string;

  constructor(message: string, status = 500, details?: string) {
    super(message);
    this.name = 'LlmProviderError';
    this.status = status;
    this.details = details;
  }
}

const resolveChatEndpoint = (baseUrl: string) => {
  const normalized = baseUrl.replace(/\/+$/, '');
  if (normalized.endsWith('/chat/completions')) {
    return normalized;
  }
  return `${normalized}/chat/completions`;
};

const toText = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
};

const stringifyUnknown = (value: unknown) => {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const normalizeContentArray = (content: unknown[]): string =>
  content
    .map((item) => {
      if (typeof item === 'string') return item;
      if (!item || typeof item !== 'object') return '';
      const record = item as Record<string, unknown>;
      return toText(record.text) || toText(record.content) || '';
    })
    .join('');

export function extractText(response: any): string {
  if (!response) return '';
  if (typeof response === 'string') return response;

  if (typeof response.output_text === 'string') return response.output_text;
  if (Array.isArray(response.output_text)) return normalizeContentArray(response.output_text);

  const content = response?.choices?.[0]?.message?.content;

  if (typeof content === 'string') return content;

  if (Array.isArray(content)) {
    return content.map((item) => toText(item?.text) || toText(item?.content) || '').join('');
  }

  if (response?.choices?.[0]?.text) return toText(response.choices[0].text);

  return '';
}

export const extractReplyText = extractText;

export async function requestChatCompletion(
  config: LlmRuntimeConfig,
  messages: ChatCompletionMessage[],
  options: { temperature?: number } = {}
): Promise<ChatCompletionResult> {
  const response = await fetch(resolveChatEndpoint(config.baseUrl), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      stream: false,
      temperature: options.temperature ?? 0.75,
    }),
  });

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  let rawResponse: unknown = null;
  if (isJson) {
    try {
      rawResponse = await response.json();
    } catch (error) {
      throw new LlmProviderError(
        `failed to parse model JSON response: ${error instanceof Error ? error.message : String(error)}`,
        502
      );
    }
  } else {
    rawResponse = await response.text();
  }

  if (!response.ok) {
    const details = typeof rawResponse === 'string' ? rawResponse : stringifyUnknown(rawResponse);
    const message = `model request failed (${response.status}): ${details || 'unknown provider error'}`;
    throw new LlmProviderError(message, response.status, details);
  }

  console.log('LLM RAW RESPONSE:', JSON.stringify(rawResponse, null, 2));
  const reply = extractText(rawResponse).trim();
  console.log('PARSED REPLY:', reply);

  if (!reply) {
    throw new LlmProviderError('empty model reply', 502, stringifyUnknown(rawResponse));
  }

  return {
    reply,
    raw: rawResponse,
  };
}
