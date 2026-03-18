import test from 'node:test';
import assert from 'node:assert/strict';

const {
  REQUIRED_COZE_ENV_VARS,
  createCozeRuntimeConfig,
  formatMissingCozeEnvMessage,
} = await import('../src/lib/coze-env.ts');

test('createCozeRuntimeConfig reports missing env vars clearly', () => {
  const result = createCozeRuntimeConfig({});

  assert.equal(result.ok, false);
  assert.deepEqual(result.missing, REQUIRED_COZE_ENV_VARS);
  assert.match(
    formatMissingCozeEnvMessage(result.missing),
    /COZE_WORKLOAD_IDENTITY_API_KEY/
  );
});

test('createCozeRuntimeConfig creates config when env vars are present', () => {
  const result = createCozeRuntimeConfig({
    COZE_WORKLOAD_IDENTITY_API_KEY: 'test-key',
    COZE_INTEGRATION_BASE_URL: 'https://api.example.com',
    COZE_INTEGRATION_MODEL_BASE_URL: 'https://model.example.com',
  });

  assert.equal(result.ok, true);
  assert.equal(result.config.apiKey, 'test-key');
  assert.equal(result.config.baseUrl, 'https://api.example.com');
  assert.equal(result.config.modelBaseUrl, 'https://model.example.com');
});
