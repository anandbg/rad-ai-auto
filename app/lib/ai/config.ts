/**
 * AI Configuration Module
 *
 * Environment-driven AI model resolution with provider:model format.
 * Phase 32: Defaults switched from OpenAI GPT-4o to Groq Llama 4 Scout
 * Override via env vars: AI_GENERATE_MODEL=openai:gpt-4o to revert
 */

export type AIPurpose = 'generate' | 'template' | 'transcription';

export interface AIProviderConfig {
  provider: string;  // e.g. 'openai', 'groq', 'together'
  model: string;     // e.g. 'gpt-4o', 'llama-4-scout-17b-16e-instruct'
  modelId: string;   // combined 'provider:model' format for registry
}

/**
 * Default model IDs per purpose.
 * Generate and template default to Groq Llama 4 Scout (~96% cost reduction).
 * Transcription defaults to Groq Whisper v3 Turbo (~89% cost reduction).
 * Override any default by setting the corresponding env var (e.g. AI_GENERATE_MODEL=openai:gpt-4o).
 */
export const AI_ENV_DEFAULTS: Record<AIPurpose, string> = {
  generate: 'groq:llama-4-scout-17b-16e-instruct',
  template: 'groq:llama-4-scout-17b-16e-instruct',
  transcription: 'groq:whisper-large-v3-turbo',
};

/**
 * Environment variable names mapped to each AI purpose.
 */
const ENV_VAR_MAP: Record<AIPurpose, string> = {
  generate: 'AI_GENERATE_MODEL',
  template: 'AI_TEMPLATE_MODEL',
  transcription: 'AI_TRANSCRIPTION_MODEL',
};

/**
 * Provider-to-API-key environment variable mapping.
 */
const PROVIDER_API_KEY_MAP: Record<string, string> = {
  openai: 'OPENAI_API_KEY',
  groq: 'GROQ_API_KEY',
  together: 'TOGETHER_API_KEY',
};

/**
 * Get the model ID for a given AI purpose.
 * Reads from environment variables, falls back to OpenAI defaults.
 *
 * @param purpose - 'generate' | 'template' | 'transcription'
 * @returns Model ID in 'provider:model' format (e.g. 'openai:gpt-4o')
 */
export function getModelId(purpose: AIPurpose): string {
  const envVar = ENV_VAR_MAP[purpose];
  const envValue = process.env[envVar];

  if (envValue && envValue.includes(':')) {
    return envValue;
  }

  return AI_ENV_DEFAULTS[purpose];
}

/**
 * Parse a model ID into provider and model components.
 */
function parseModelId(modelId: string): { provider: string; model: string } {
  const colonIndex = modelId.indexOf(':');
  if (colonIndex === -1) {
    return { provider: 'openai', model: modelId };
  }
  return {
    provider: modelId.slice(0, colonIndex),
    model: modelId.slice(colonIndex + 1),
  };
}

/**
 * Get transcription configuration parsed from environment.
 * Returns provider and model separately for use by the transcription route.
 *
 * @returns Object with provider (e.g. 'openai') and model (e.g. 'whisper-1')
 */
export function getTranscriptionConfig(): { provider: string; model: string } {
  const modelId = getModelId('transcription');
  return parseModelId(modelId);
}

/**
 * Validate that required API keys exist for all configured AI providers.
 * Checks OPENAI_API_KEY always (required as fallback), plus any provider-specific
 * keys based on configured model environment variables.
 *
 * @returns Validation result with errors array
 */
export function validateAIConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // OPENAI_API_KEY is always required (default/fallback provider)
  if (!process.env.OPENAI_API_KEY) {
    errors.push('Missing OPENAI_API_KEY (required as default/fallback provider)');
  }

  // Check each purpose for non-OpenAI providers that need their own API key
  const purposes: AIPurpose[] = ['generate', 'template', 'transcription'];
  const checkedProviders = new Set<string>();

  for (const purpose of purposes) {
    const modelId = getModelId(purpose);
    const { provider } = parseModelId(modelId);

    // Skip OpenAI (already checked above) and already-checked providers
    if (provider === 'openai' || checkedProviders.has(provider)) {
      continue;
    }
    checkedProviders.add(provider);

    const apiKeyEnv = PROVIDER_API_KEY_MAP[provider];
    if (apiKeyEnv && !process.env[apiKeyEnv]) {
      errors.push(`Missing ${apiKeyEnv} for configured ${provider} provider`);
    }
  }

  if (errors.length > 0) {
    for (const error of errors) {
      console.error(`[AI Config] ${error}`);
    }
  }

  return { valid: errors.length === 0, errors };
}
