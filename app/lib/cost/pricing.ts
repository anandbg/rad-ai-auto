/**
 * Provider-aware AI cost pricing.
 *
 * Pure functions that translate token counts / audio duration into dollar
 * cost using published provider rates. No I/O, no Redis, no async — designed
 * to be trivially testable and safe to call on every request without ever
 * breaking the request flow.
 *
 * Pricing verified from .planning/research/STACK.md on 2026-04-05. Update
 * PROVIDER_PRICING when provider rates change.
 *
 * v3.0 rates:
 *   - Groq Llama 4 Scout:     $0.11  / 1M input, $0.34  / 1M output
 *   - Groq Whisper v3 Turbo:  $0.04  / hour
 *   - OpenAI GPT-4o:          $2.50  / 1M input, $10.00 / 1M output
 *   - OpenAI GPT-4o-mini:     $0.15  / 1M input, $0.60  / 1M output
 *   - OpenAI Whisper-1:       $0.36  / hour  ($0.006 / minute)
 */

import { createLogger } from '@/lib/logging/logger';

const logger = createLogger('Pricing');

interface TextRate {
  readonly inputPerMillion: number;
  readonly outputPerMillion: number;
}

interface TranscriptionRate {
  readonly perHour: number;
}

/**
 * Per-provider pricing table keyed by `provider:model`.
 * Add new provider/model combinations here as they are adopted.
 */
export const PROVIDER_PRICING = {
  text: {
    'groq:meta-llama/llama-4-scout-17b-16e-instruct': { inputPerMillion: 0.11, outputPerMillion: 0.34 },
    'openai:gpt-4o':                        { inputPerMillion: 2.5,  outputPerMillion: 10.0 },
    'openai:gpt-4o-mini':                   { inputPerMillion: 0.15, outputPerMillion: 0.6 },
  } satisfies Record<string, TextRate>,
  transcription: {
    'groq:whisper-large-v3-turbo': { perHour: 0.04 },
    'openai:whisper-1':            { perHour: 0.36 },
  } satisfies Record<string, TranscriptionRate>,
} as const;

/**
 * Safe fallback keys used when an unknown provider/model is encountered.
 * OpenAI GPT-4o is deliberately chosen as the text fallback because it is
 * the most expensive model in our stack — if we must guess we should guess
 * high so the daily cost ceiling still triggers rather than under-counting.
 */
const TEXT_FALLBACK_KEY = 'openai:gpt-4o';
const TRANSCRIPTION_FALLBACK_KEY = 'openai:whisper-1';

export interface TextUsage {
  provider: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
}

export interface TranscriptionUsage {
  provider: string;
  model: string;
  durationSeconds: number;
}

function buildKey(provider: string, model: string): string {
  return `${provider}:${model}`;
}

function lookupTextRate(provider: string, model: string): TextRate {
  const key = buildKey(provider, model) as keyof typeof PROVIDER_PRICING.text;
  const rate = PROVIDER_PRICING.text[key];
  if (rate) {
    return rate;
  }
  logger.warn(
    `Unknown text model "${provider}:${model}" — falling back to ${TEXT_FALLBACK_KEY} rates (safe over-estimate)`
  );
  return PROVIDER_PRICING.text[TEXT_FALLBACK_KEY];
}

function lookupTranscriptionRate(provider: string, model: string): TranscriptionRate {
  const key = buildKey(provider, model) as keyof typeof PROVIDER_PRICING.transcription;
  const rate = PROVIDER_PRICING.transcription[key];
  if (rate) {
    return rate;
  }
  logger.warn(
    `Unknown transcription model "${provider}:${model}" — falling back to ${TRANSCRIPTION_FALLBACK_KEY} rates (safe over-estimate)`
  );
  return PROVIDER_PRICING.transcription[TRANSCRIPTION_FALLBACK_KEY];
}

/**
 * Compute the dollar cost of a text generation call.
 * Never throws — unknown providers fall back to GPT-4o rates.
 */
export function computeCost(usage: TextUsage): number {
  const rate = lookupTextRate(usage.provider, usage.model);
  const inputCost = (usage.promptTokens * rate.inputPerMillion) / 1_000_000;
  const outputCost = (usage.completionTokens * rate.outputPerMillion) / 1_000_000;
  return inputCost + outputCost;
}

/**
 * Compute the dollar cost of a transcription call.
 * Never throws — unknown providers fall back to Whisper-1 rates.
 */
export function computeTranscriptionCost(usage: TranscriptionUsage): number {
  const rate = lookupTranscriptionRate(usage.provider, usage.model);
  const hours = usage.durationSeconds / 3600;
  return hours * rate.perHour;
}

/**
 * Parse a `provider:model` string (the format used by AI_ENV_DEFAULTS and
 * getModelId in lib/ai/config.ts). Model ids without a colon default to
 * the openai provider so legacy callers keep working.
 */
export function getProviderFromModelId(modelId: string): { provider: string; model: string } {
  const colonIndex = modelId.indexOf(':');
  if (colonIndex === -1) {
    return { provider: 'openai', model: modelId };
  }
  return {
    provider: modelId.slice(0, colonIndex),
    model: modelId.slice(colonIndex + 1),
  };
}
