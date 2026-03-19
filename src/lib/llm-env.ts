export const LLM_PROVIDERS = ['deepseek', 'minimax'] as const;

export type LlmProvider = (typeof LLM_PROVIDERS)[number];

type EnvSource = Record<string, string | undefined>;

type LlmEnvVarName =
  | 'LLM_PROVIDER'
  | 'DEEPSEEK_API_KEY'
  | 'DEEPSEEK_BASE_URL'
  | 'DEEPSEEK_MODEL'
  | 'MINIMAX_API_KEY'
  | 'MINIMAX_BASE_URL'
  | 'MINIMAX_MODEL';

export const REQUIRED_LLM_ENV_VARS: Record<LlmProvider, readonly LlmEnvVarName[]> = {
  deepseek: ['DEEPSEEK_API_KEY', 'DEEPSEEK_BASE_URL', 'DEEPSEEK_MODEL'],
  minimax: ['MINIMAX_API_KEY', 'MINIMAX_BASE_URL', 'MINIMAX_MODEL'],
};

export interface LlmRuntimeConfig {
  provider: LlmProvider;
  apiKey: string;
  baseUrl: string;
  model: string;
}

export type LlmRuntimeConfigResult =
  | {
      ok: true;
      config: LlmRuntimeConfig;
    }
  | {
      ok: false;
      missing: readonly LlmEnvVarName[];
    };

const normalizeEnvValue = (value: string | undefined) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const isProvider = (value: string | undefined): value is LlmProvider =>
  value === 'deepseek' || value === 'minimax';

const getProviderValue = (env: EnvSource = process.env) => normalizeEnvValue(env.LLM_PROVIDER);

export const getMissingLlmEnvVars = (env: EnvSource = process.env): readonly LlmEnvVarName[] => {
  const provider = getProviderValue(env);
  if (!isProvider(provider)) {
    return ['LLM_PROVIDER'];
  }

  return REQUIRED_LLM_ENV_VARS[provider].filter((name) => !normalizeEnvValue(env[name]));
};

export const formatMissingLlmEnvMessage = (missing: readonly string[]) =>
  `Missing required LLM environment variables: ${missing.join(
    ', '
  )}. Add them in Vercel Project Settings -> Environment Variables.`;

export const createLlmRuntimeConfig = (env: EnvSource = process.env): LlmRuntimeConfigResult => {
  const provider = getProviderValue(env);
  if (!isProvider(provider)) {
    return {
      ok: false,
      missing: ['LLM_PROVIDER'],
    };
  }

  const missing = getMissingLlmEnvVars(env);
  if (missing.length > 0) {
    return {
      ok: false,
      missing,
    };
  }

  if (provider === 'deepseek') {
    return {
      ok: true,
      config: {
        provider,
        apiKey: normalizeEnvValue(env.DEEPSEEK_API_KEY)!,
        baseUrl: normalizeEnvValue(env.DEEPSEEK_BASE_URL)!,
        model: normalizeEnvValue(env.DEEPSEEK_MODEL)!,
      },
    };
  }

  return {
    ok: true,
    config: {
      provider,
      apiKey: normalizeEnvValue(env.MINIMAX_API_KEY)!,
      baseUrl: normalizeEnvValue(env.MINIMAX_BASE_URL)!,
      model: normalizeEnvValue(env.MINIMAX_MODEL)!,
    },
  };
};
