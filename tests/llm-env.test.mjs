import test from 'node:test';
import assert from 'node:assert/strict';

const {
  REQUIRED_LLM_ENV_VARS,
  createLlmRuntimeConfig,
  formatMissingLlmEnvMessage,
} = await import('../src/lib/llm-env.ts');

test('createLlmRuntimeConfig reports missing env vars for deepseek', () => {
  const result = createLlmRuntimeConfig({
    LLM_PROVIDER: 'deepseek',
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.missing, REQUIRED_LLM_ENV_VARS.deepseek);
  assert.match(formatMissingLlmEnvMessage(result.missing), /DEEPSEEK_API_KEY/);
});

test('createLlmRuntimeConfig reports missing env vars for minimax', () => {
  const result = createLlmRuntimeConfig({
    LLM_PROVIDER: 'minimax',
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.missing, REQUIRED_LLM_ENV_VARS.minimax);
  assert.match(formatMissingLlmEnvMessage(result.missing), /MINIMAX_API_KEY/);
});

test('createLlmRuntimeConfig returns provider config when env vars are present', () => {
  const result = createLlmRuntimeConfig({
    LLM_PROVIDER: 'deepseek',
    DEEPSEEK_API_KEY: 'test-key',
    DEEPSEEK_BASE_URL: 'https://api.deepseek.example',
    DEEPSEEK_MODEL: 'deepseek-chat',
  });

  assert.equal(result.ok, true);
  assert.equal(result.config.provider, 'deepseek');
  assert.equal(result.config.apiKey, 'test-key');
  assert.equal(result.config.baseUrl, 'https://api.deepseek.example');
  assert.equal(result.config.model, 'deepseek-chat');
});
