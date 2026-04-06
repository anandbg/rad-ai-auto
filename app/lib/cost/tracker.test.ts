import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Redis before importing tracker
const incrbyMock = vi.fn().mockResolvedValue(1);
const expireMock = vi.fn().mockResolvedValue(1);
const getMock = vi.fn().mockResolvedValue(null);

vi.mock('@/lib/ratelimit/client', () => ({
  get redis() {
    return redisRef.current;
  },
}));

const redisRef: { current: unknown } = {
  current: {
    incrby: incrbyMock,
    expire: expireMock,
    get: getMock,
  },
};

import { trackCost, getCostEstimate, getCurrentDailyCost } from './tracker';
import { computeCost, computeTranscriptionCost } from './pricing';

beforeEach(() => {
  incrbyMock.mockClear();
  expireMock.mockClear();
  getMock.mockClear();
  redisRef.current = {
    incrby: incrbyMock,
    expire: expireMock,
    get: getMock,
  };
});

describe('trackCost - legacy 2-arg signature (backward compat)', () => {
  it('tracks report with legacy COST_ESTIMATES.report ($0.05 = 5 cents)', async () => {
    await trackCost('report', 'user-1');
    expect(incrbyMock).toHaveBeenCalledTimes(1);
    expect(incrbyMock.mock.calls[0][1]).toBe(5); // 0.05 * 100 = 5 cents
  });

  it('tracks transcription with legacy COST_ESTIMATES.transcription ($0.06 = 6 cents)', async () => {
    await trackCost('transcription', 'user-1');
    expect(incrbyMock.mock.calls[0][1]).toBe(6);
  });

  it('tracks template with legacy COST_ESTIMATES.template ($0.03 = 3 cents)', async () => {
    await trackCost('template', 'user-1');
    expect(incrbyMock.mock.calls[0][1]).toBe(3);
  });
});

describe('trackCost - legacy number arg (backward compat)', () => {
  it('accepts numeric actualCost and increments by rounded cents', async () => {
    await trackCost('report', 'user-1', 0.02);
    expect(incrbyMock.mock.calls[0][1]).toBe(2); // 0.02 * 100 = 2 cents
  });

  it('rounds fractional cents', async () => {
    await trackCost('report', 'user-1', 0.0123);
    expect(incrbyMock.mock.calls[0][1]).toBe(1); // Math.round(1.23) = 1
  });
});

describe('trackCost - explicit { actualCost } override', () => {
  it('accepts object with actualCost field', async () => {
    await trackCost('report', 'user-1', { actualCost: 0.042 });
    expect(incrbyMock.mock.calls[0][1]).toBe(4); // Math.round(4.2) = 4
  });
});

describe('trackCost - new { usage } overload for text generation', () => {
  it('computes Groq Llama 4 Scout cost from token counts', async () => {
    // Use LARGE counts so rounded cents > 0
    await trackCost('report', 'user-1', {
      usage: {
        provider: 'groq',
        model: 'llama-4-scout-17b-16e-instruct',
        promptTokens: 15_000,
        completionTokens: 5_000,
      },
    });
    // cost = 15000*0.11/1e6 + 5000*0.34/1e6 = 0.00165 + 0.0017 = 0.00335
    // cents = Math.round(0.335) = 0
    const expected = computeCost({
      provider: 'groq',
      model: 'llama-4-scout-17b-16e-instruct',
      promptTokens: 15_000,
      completionTokens: 5_000,
    });
    expect(incrbyMock.mock.calls[0][1]).toBe(Math.round(expected * 100));
  });

  it('OpenAI GPT-4o call produces ~26x more cents than same tokens on Groq', async () => {
    const tokens = { promptTokens: 500_000, completionTokens: 500_000 };

    incrbyMock.mockClear();
    await trackCost('report', 'groq-user', {
      usage: { provider: 'groq', model: 'llama-4-scout-17b-16e-instruct', ...tokens },
    });
    const groqCents = incrbyMock.mock.calls[0][1] as number;

    incrbyMock.mockClear();
    await trackCost('report', 'openai-user', {
      usage: { provider: 'openai', model: 'gpt-4o', ...tokens },
    });
    const openaiCents = incrbyMock.mock.calls[0][1] as number;

    expect(openaiCents).toBeGreaterThan(groqCents * 20);
  });

  it('computes integer cents for substantial OpenAI usage', async () => {
    await trackCost('report', 'user-1', {
      usage: {
        provider: 'openai',
        model: 'gpt-4o',
        promptTokens: 2000,
        completionTokens: 2000,
      },
    });
    // cost = 2000*2.5/1e6 + 2000*10/1e6 = 0.005 + 0.02 = 0.025 -> 3 cents rounded
    expect(incrbyMock.mock.calls[0][1]).toBe(3);
  });
});

describe('trackCost - new { transcription } overload', () => {
  it('computes Groq Whisper v3 Turbo cost from duration', async () => {
    await trackCost('transcription', 'user-1', {
      transcription: {
        provider: 'groq',
        model: 'whisper-large-v3-turbo',
        durationSeconds: 45,
      },
    });
    const expected = computeTranscriptionCost({
      provider: 'groq',
      model: 'whisper-large-v3-turbo',
      durationSeconds: 45,
    });
    expect(incrbyMock.mock.calls[0][1]).toBe(Math.round(expected * 100));
  });

  it('OpenAI Whisper-1 produces ~9x more cents than Groq Whisper for same duration', async () => {
    const durationSeconds = 3600; // 1 hour

    incrbyMock.mockClear();
    await trackCost('transcription', 'g', {
      transcription: { provider: 'groq', model: 'whisper-large-v3-turbo', durationSeconds },
    });
    const groqCents = incrbyMock.mock.calls[0][1] as number;

    incrbyMock.mockClear();
    await trackCost('transcription', 'o', {
      transcription: { provider: 'openai', model: 'whisper-1', durationSeconds },
    });
    const openaiCents = incrbyMock.mock.calls[0][1] as number;

    // Groq: 0.04 -> 4 cents; OpenAI: 0.36 -> 36 cents
    expect(groqCents).toBe(4);
    expect(openaiCents).toBe(36);
  });
});

describe('trackCost - redis unavailable', () => {
  it('does not throw when redis is null', async () => {
    redisRef.current = null;
    await expect(trackCost('report', 'user-1')).resolves.toBeUndefined();
    await expect(
      trackCost('report', 'user-1', {
        usage: { provider: 'groq', model: 'llama-4-scout-17b-16e-instruct', promptTokens: 100, completionTokens: 100 },
      })
    ).resolves.toBeUndefined();
  });

  it('does not throw when redis.incrby rejects', async () => {
    incrbyMock.mockRejectedValueOnce(new Error('redis down'));
    await expect(trackCost('report', 'user-1', 0.05)).resolves.toBeUndefined();
  });
});

describe('getCostEstimate (unchanged)', () => {
  it('still returns legacy estimate', () => {
    expect(getCostEstimate('report')).toBe(0.05);
    expect(getCostEstimate('transcription')).toBe(0.06);
    expect(getCostEstimate('template')).toBe(0.03);
  });
});

describe('getCurrentDailyCost (unchanged)', () => {
  it('returns 0 when redis is null', async () => {
    redisRef.current = null;
    expect(await getCurrentDailyCost()).toBe(0);
  });

  it('converts cents to dollars', async () => {
    getMock.mockResolvedValueOnce(250);
    expect(await getCurrentDailyCost()).toBe(2.5);
  });

  it('returns 0 when key is missing', async () => {
    getMock.mockResolvedValueOnce(null);
    expect(await getCurrentDailyCost()).toBe(0);
  });
});
