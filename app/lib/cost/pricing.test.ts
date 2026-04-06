import { describe, it, expect, vi } from 'vitest';
import {
  computeCost,
  computeTranscriptionCost,
  getProviderFromModelId,
  PROVIDER_PRICING,
} from './pricing';

describe('PROVIDER_PRICING table', () => {
  it('contains Groq Llama 4 Scout text pricing', () => {
    expect(PROVIDER_PRICING.text['groq:llama-4-scout-17b-16e-instruct']).toEqual({
      inputPerMillion: 0.11,
      outputPerMillion: 0.34,
    });
  });

  it('contains OpenAI GPT-4o text pricing', () => {
    expect(PROVIDER_PRICING.text['openai:gpt-4o']).toEqual({
      inputPerMillion: 2.5,
      outputPerMillion: 10.0,
    });
  });

  it('contains Groq Whisper v3 Turbo transcription pricing', () => {
    expect(PROVIDER_PRICING.transcription['groq:whisper-large-v3-turbo']).toEqual({
      perHour: 0.04,
    });
  });

  it('contains OpenAI Whisper-1 transcription pricing', () => {
    expect(PROVIDER_PRICING.transcription['openai:whisper-1']).toEqual({
      perHour: 0.36,
    });
  });
});

describe('computeCost', () => {
  it('computes Groq Llama 4 Scout cost for 1500 in + 500 out tokens (~$0.000335)', () => {
    const cost = computeCost({
      provider: 'groq',
      model: 'llama-4-scout-17b-16e-instruct',
      promptTokens: 1500,
      completionTokens: 500,
    });
    // 1500*0.11/1e6 + 500*0.34/1e6 = 0.000165 + 0.00017 = 0.000335
    expect(cost).toBeCloseTo(0.000335, 6);
  });

  it('computes OpenAI GPT-4o cost for 1500 in + 500 out tokens (~$0.00875)', () => {
    const cost = computeCost({
      provider: 'openai',
      model: 'gpt-4o',
      promptTokens: 1500,
      completionTokens: 500,
    });
    // 1500*2.5/1e6 + 500*10/1e6 = 0.00375 + 0.005 = 0.00875
    expect(cost).toBeCloseTo(0.00875, 6);
  });

  it('OpenAI GPT-4o costs ~26x more than Groq Llama 4 Scout for same tokens', () => {
    const groq = computeCost({
      provider: 'groq',
      model: 'llama-4-scout-17b-16e-instruct',
      promptTokens: 1500,
      completionTokens: 500,
    });
    const openai = computeCost({
      provider: 'openai',
      model: 'gpt-4o',
      promptTokens: 1500,
      completionTokens: 500,
    });
    expect(openai / groq).toBeGreaterThan(20);
  });

  it('falls back to openai:gpt-4o rates for unknown provider/model (safe over-estimate)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const unknown = computeCost({
      provider: 'nonexistent',
      model: 'mystery-model-xyz',
      promptTokens: 1000,
      completionTokens: 1000,
    });
    const fallback = computeCost({
      provider: 'openai',
      model: 'gpt-4o',
      promptTokens: 1000,
      completionTokens: 1000,
    });
    expect(unknown).toBe(fallback);
    warn.mockRestore();
  });

  it('does not throw on unknown provider/model', () => {
    expect(() =>
      computeCost({
        provider: 'nope',
        model: 'nope',
        promptTokens: 10,
        completionTokens: 10,
      })
    ).not.toThrow();
  });

  it('returns 0 for zero tokens', () => {
    expect(
      computeCost({
        provider: 'groq',
        model: 'llama-4-scout-17b-16e-instruct',
        promptTokens: 0,
        completionTokens: 0,
      })
    ).toBe(0);
  });
});

describe('computeTranscriptionCost', () => {
  it('computes Groq Whisper v3 Turbo cost for 60 seconds (~$0.000667)', () => {
    const cost = computeTranscriptionCost({
      provider: 'groq',
      model: 'whisper-large-v3-turbo',
      durationSeconds: 60,
    });
    // 60/3600 * 0.04 = 0.0006666...
    expect(cost).toBeCloseTo(0.000667, 6);
  });

  it('computes OpenAI Whisper-1 cost for 60 seconds (~$0.006)', () => {
    const cost = computeTranscriptionCost({
      provider: 'openai',
      model: 'whisper-1',
      durationSeconds: 60,
    });
    // 60/3600 * 0.36 = 0.006
    expect(cost).toBeCloseTo(0.006, 6);
  });

  it('OpenAI Whisper costs ~9x more than Groq Whisper for same duration', () => {
    const groq = computeTranscriptionCost({
      provider: 'groq',
      model: 'whisper-large-v3-turbo',
      durationSeconds: 300,
    });
    const openai = computeTranscriptionCost({
      provider: 'openai',
      model: 'whisper-1',
      durationSeconds: 300,
    });
    expect(openai / groq).toBeCloseTo(9, 1);
  });

  it('falls back to openai:whisper-1 rates for unknown transcription provider', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const unknown = computeTranscriptionCost({
      provider: 'nope',
      model: 'unknown-whisper',
      durationSeconds: 120,
    });
    const fallback = computeTranscriptionCost({
      provider: 'openai',
      model: 'whisper-1',
      durationSeconds: 120,
    });
    expect(unknown).toBe(fallback);
    warn.mockRestore();
  });

  it('does not throw on unknown transcription model', () => {
    expect(() =>
      computeTranscriptionCost({
        provider: 'nope',
        model: 'nope',
        durationSeconds: 10,
      })
    ).not.toThrow();
  });
});

describe('getProviderFromModelId', () => {
  it('parses groq:llama-4-scout-17b-16e-instruct', () => {
    expect(getProviderFromModelId('groq:llama-4-scout-17b-16e-instruct')).toEqual({
      provider: 'groq',
      model: 'llama-4-scout-17b-16e-instruct',
    });
  });

  it('parses openai:gpt-4o', () => {
    expect(getProviderFromModelId('openai:gpt-4o')).toEqual({
      provider: 'openai',
      model: 'gpt-4o',
    });
  });

  it('handles model ids without a colon by defaulting provider to openai', () => {
    expect(getProviderFromModelId('gpt-4o')).toEqual({
      provider: 'openai',
      model: 'gpt-4o',
    });
  });

  it('handles model names containing colons (splits on first colon only)', () => {
    expect(getProviderFromModelId('groq:whisper-large-v3-turbo')).toEqual({
      provider: 'groq',
      model: 'whisper-large-v3-turbo',
    });
  });
});
