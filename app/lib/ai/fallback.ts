/**
 * Provider fallback orchestrator.
 *
 * When the primary AI provider (e.g. Groq) fails — whether due to an error,
 * timeout, or rate limit — `withProviderFallback` re-invokes the caller's
 * operation against a secondary provider (OpenAI GPT-4o) so the end user is
 * transparently served from the fallback.
 *
 * Design notes:
 * - This is a pure orchestrator. Retry logic lives in `lib/openai/retry.ts`
 *   and should wrap each inner attempt; fallback is "after all retries on
 *   provider A are exhausted, try provider B once".
 * - The caller receives `fellBack` + `modelId` so the eventual `trackCost`
 *   call can use the real provider that served the request (a fallback call
 *   to OpenAI is ~30x more expensive than Groq and must be tracked as such
 *   to keep the daily cost ceiling honest — see COST-01 in phase 34).
 * - If the primary model id is identical to the fallback id (e.g. a user
 *   overrides AI_GENERATE_MODEL to `openai:gpt-4o`), we do NOT attempt a
 *   second call — that would double-charge and add latency for no benefit.
 */

import { registry } from './registry';
import { getModelId } from './config';
import { createLogger } from '@/lib/logging/logger';
import type { LanguageModel } from 'ai';

const logger = createLogger('AIFallback');

/**
 * Fallback model id for each purpose. OpenAI is the emergency fallback
 * across the board because it is the most reliable (and most expensive)
 * provider in our stack — see .planning/research/STACK.md for rationale.
 */
export const FALLBACK_CHAIN = {
  generate: 'openai:gpt-4o',
  template: 'openai:gpt-4o',
  transcription: 'openai:whisper-1',
} as const;

export type FallbackPurpose = keyof typeof FALLBACK_CHAIN;

export interface FallbackResult<T> {
  /** The value returned by `operation`. */
  result: T;
  /** The `provider:model` id that ultimately served the request. */
  modelId: string;
  /** True if the primary provider failed and the fallback handled the call. */
  fellBack: boolean;
}

/**
 * Invoke `operation` against the primary model for `purpose`. On any thrown
 * error, invoke it once more against the fallback model. Returns which model
 * actually produced the result so the caller can track cost accurately.
 *
 * @throws the fallback error (not the primary error) when both providers fail.
 */
export async function withProviderFallback<T>(
  purpose: Exclude<FallbackPurpose, 'transcription'>,
  operation: (model: LanguageModel, modelId: string) => Promise<T>
): Promise<FallbackResult<T>> {
  const primaryId = getModelId(purpose);
  const fallbackId = FALLBACK_CHAIN[purpose];

  try {
    const primaryModel = registry.languageModel(
      primaryId as Parameters<typeof registry.languageModel>[0]
    );
    const result = await operation(primaryModel, primaryId);
    return { result, modelId: primaryId, fellBack: false };
  } catch (primaryError) {
    // Don't fall back if primary IS the fallback — avoids double-charging
    // and redundant latency when a user has explicitly configured the
    // fallback provider as their primary.
    if (primaryId === fallbackId) {
      throw primaryError;
    }

    const primaryMessage =
      primaryError instanceof Error ? primaryError.message : String(primaryError);
    logger.warn(
      `Primary ${primaryId} failed, falling back to ${fallbackId}: ${primaryMessage}`
    );

    try {
      const fallbackModel = registry.languageModel(
        fallbackId as Parameters<typeof registry.languageModel>[0]
      );
      const result = await operation(fallbackModel, fallbackId);
      return { result, modelId: fallbackId, fellBack: true };
    } catch (fallbackError) {
      const fallbackMessage =
        fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
      logger.error(
        `Both providers failed. Primary (${primaryId}): ${primaryMessage}. ` +
          `Fallback (${fallbackId}): ${fallbackMessage}`
      );
      throw fallbackError;
    }
  }
}
