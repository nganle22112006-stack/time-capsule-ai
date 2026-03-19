import test from 'node:test';
import assert from 'node:assert/strict';

const { extractText, requestChatCompletion, LlmProviderError } = await import('../src/lib/llm-provider.ts');

const baseConfig = {
  provider: 'deepseek',
  apiKey: 'test-key',
  baseUrl: 'https://example.com/v1',
  model: 'test-model',
};

test('extractText parses output_text', () => {
  const reply = extractText({ output_text: 'hello from output_text' });
  assert.equal(reply, 'hello from output_text');
});

test('extractText parses choices[0].message.content as string', () => {
  const reply = extractText({ choices: [{ message: { content: 'hello from message content' } }] });
  assert.equal(reply, 'hello from message content');
});

test('extractText parses choices[0].message.content as array', () => {
  const reply = extractText({
    choices: [
      {
        message: {
          content: [
            { type: 'text', text: 'hello ' },
            { type: 'text', text: 'from ' },
            { type: 'text', text: 'array' },
          ],
        },
      },
    ],
  });
  assert.equal(reply, 'hello from array');
});

test('extractText parses choices[0].text', () => {
  const reply = extractText({ choices: [{ text: 'hello from text field' }] });
  assert.equal(reply, 'hello from text field');
});

test('requestChatCompletion throws when parsed reply is empty', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ choices: [{ message: { content: '' } }] }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });

  await assert.rejects(
    () => requestChatCompletion(baseConfig, [{ role: 'user', content: 'hi' }]),
    (error) => {
      assert.ok(error instanceof LlmProviderError);
      assert.match(error.message, /empty model reply/i);
      return true;
    }
  );

  globalThis.fetch = originalFetch;
});
