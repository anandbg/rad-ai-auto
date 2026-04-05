/**
 * AI Provider Registry
 *
 * Central registry that resolves environment-driven model IDs to AI SDK model objects.
 * Currently registers OpenAI and Groq. Together AI will be added as fallback in Phase 32-03.
 *
 * Usage in route handlers:
 *   Replace `openai('gpt-4o')` with `getModel('generate')`
 */

import { createProviderRegistry } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createGroq } from '@ai-sdk/groq';
import { getModelId, validateAIConfig } from './config';
import type { AIPurpose } from './config';

// Validate config on module load (fail-fast in production)
const configResult = validateAIConfig();
if (!configResult.valid) {
  const errorMsg = `[AI Registry] Configuration errors:\n${configResult.errors.join('\n')}`;
  if (process.env.NODE_ENV === 'production') {
    throw new Error(errorMsg);
  } else {
    console.warn(errorMsg);
  }
}

/**
 * Provider registry with all configured AI providers.
 * OpenAI (default/fallback) and Groq (cost-optimized) are registered.
 * Together AI will be added as secondary fallback in Phase 32-03.
 */
export const registry = createProviderRegistry({
  openai: createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  }),
  groq: createGroq({
    apiKey: process.env.GROQ_API_KEY,
  }),
});

/**
 * Get an AI language model for the specified purpose.
 * Reads model ID from environment variables, defaults to OpenAI GPT-4o.
 *
 * @param purpose - 'generate' | 'template' (transcription uses a different API)
 * @returns AI SDK LanguageModel instance
 *
 * Usage: Replace `openai('gpt-4o')` with `getModel('generate')` in route handlers.
 */
export function getModel(purpose: Exclude<AIPurpose, 'transcription'>) {
  const modelId = getModelId(purpose);
  return registry.languageModel(modelId as Parameters<typeof registry.languageModel>[0]);
}
