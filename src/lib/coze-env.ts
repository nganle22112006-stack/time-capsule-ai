import { Config } from 'coze-coding-dev-sdk';

export const REQUIRED_COZE_ENV_VARS = [
  'COZE_WORKLOAD_IDENTITY_API_KEY',
  'COZE_INTEGRATION_BASE_URL',
  'COZE_INTEGRATION_MODEL_BASE_URL',
] as const;

type CozeEnvVarName = (typeof REQUIRED_COZE_ENV_VARS)[number];

type EnvSource = Record<string, string | undefined>;

export type CozeRuntimeConfigResult =
  | {
      ok: true;
      config: Config;
    }
  | {
      ok: false;
      missing: CozeEnvVarName[];
    };

const normalizeEnvValue = (value: string | undefined) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

export const getMissingCozeEnvVars = (env: EnvSource = process.env) =>
  REQUIRED_COZE_ENV_VARS.filter((name) => !normalizeEnvValue(env[name]));

export const formatMissingCozeEnvMessage = (missing: readonly string[]) =>
  `Missing required Coze environment variables: ${missing.join(
    ', '
  )}. Add them in Vercel Project Settings -> Environment Variables.`;

export const createCozeRuntimeConfig = (
  env: EnvSource = process.env
): CozeRuntimeConfigResult => {
  const missing = getMissingCozeEnvVars(env);
  if (missing.length > 0) {
    return {
      ok: false,
      missing,
    };
  }

  return {
    ok: true,
    config: new Config({
      apiKey: normalizeEnvValue(env.COZE_WORKLOAD_IDENTITY_API_KEY),
      baseUrl: normalizeEnvValue(env.COZE_INTEGRATION_BASE_URL),
      modelBaseUrl: normalizeEnvValue(env.COZE_INTEGRATION_MODEL_BASE_URL),
    }),
  };
};
