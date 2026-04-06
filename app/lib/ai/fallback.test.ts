import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.mock factories are hoisted above top-level imports, so any variables
// they close over must be declared via vi.hoisted to preserve hoisting order.
const {
  getModelIdMock,
  languageModelMock,
  warnMock,
  errorMock,
  debugMock,
  infoMock,
} = vi.hoisted(() => ({
  getModelIdMock: vi.fn(),
  languageModelMock: vi.fn(),
  warnMock: vi.fn(),
  errorMock: vi.fn(),
  debugMock: vi.fn(),
  infoMock: vi.fn(),
}));

vi.mock('./config', () => ({
  getModelId: (...args: unknown[]) => getModelIdMock(...args),
}));

vi.mock('./registry', () => ({
  registry: {
    languageModel: (...args: unknown[]) => languageModelMock(...args),
  },
}));

vi.mock('@/lib/logging/logger', () => ({
  createLogger: () => ({
    warn: warnMock,
    error: errorMock,
    debug: debugMock,
    info: infoMock,
  }),
}));

import { withProviderFallback, FALLBACK_CHAIN } from './fallback';

describe('FALLBACK_CHAIN', () => {
  it('maps each purpose to openai fallback ids', () => {
    expect(FALLBACK_CHAIN.generate).toBe('openai:gpt-4o');
    expect(FALLBACK_CHAIN.template).toBe('openai:gpt-4o');
    expect(FALLBACK_CHAIN.transcription).toBe('openai:whisper-1');
  });
});

describe('withProviderFallback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: primary is Groq, distinct from fallback
    getModelIdMock.mockReturnValue('groq:llama-4-scout-17b-16e-instruct');
    // languageModel returns a sentinel keyed by the id we pass in
    languageModelMock.mockImplementation((id: string) => ({ __sentinel: id }));
  });

  it('returns primary result when operation succeeds on primary (fellBack=false)', async () => {
    const operation = vi.fn(async (_model: unknown, modelId: string) => `ok:${modelId}`);

    const wrapped = await withProviderFallback('generate', operation);

    expect(wrapped.fellBack).toBe(false);
    expect(wrapped.modelId).toBe('groq:llama-4-scout-17b-16e-instruct');
    expect(wrapped.result).toBe('ok:groq:llama-4-scout-17b-16e-instruct');
    expect(operation).toHaveBeenCalledTimes(1);
    expect(warnMock).not.toHaveBeenCalled();
  });

  it('falls back to openai when primary throws and warns once', async () => {
    const operation = vi
      .fn()
      .mockImplementationOnce(async () => {
        throw new Error('groq boom');
      })
      .mockImplementationOnce(async (_model: unknown, modelId: string) => `ok:${modelId}`);

    const wrapped = await withProviderFallback('generate', operation);

    expect(wrapped.fellBack).toBe(true);
    expect(wrapped.modelId).toBe('openai:gpt-4o');
    expect(wrapped.result).toBe('ok:openai:gpt-4o');
    expect(operation).toHaveBeenCalledTimes(2);
    expect(warnMock).toHaveBeenCalledTimes(1);
    const warnMsg = String(warnMock.mock.calls[0][0]);
    expect(warnMsg).toContain('groq:llama-4-scout-17b-16e-instruct');
    expect(warnMsg).toContain('openai:gpt-4o');
    expect(warnMsg).toContain('groq boom');
  });

  it('throws the fallback error (not the primary error) when both providers fail', async () => {
    const primaryErr = new Error('primary-error');
    const fallbackErr = new Error('fallback-error');
    const operation = vi
      .fn()
      .mockImplementationOnce(async () => {
        throw primaryErr;
      })
      .mockImplementationOnce(async () => {
        throw fallbackErr;
      });

    await expect(withProviderFallback('generate', operation)).rejects.toBe(fallbackErr);
    expect(operation).toHaveBeenCalledTimes(2);
    expect(errorMock).toHaveBeenCalledTimes(1);
  });

  it('rethrows primary error without invoking fallback when primary equals fallback', async () => {
    // Simulate AI_GENERATE_MODEL=openai:gpt-4o (primary is same as fallback)
    getModelIdMock.mockReturnValue('openai:gpt-4o');
    const primaryErr = new Error('only-provider-down');
    const operation = vi.fn(async () => {
      throw primaryErr;
    });

    await expect(withProviderFallback('generate', operation)).rejects.toBe(primaryErr);
    expect(operation).toHaveBeenCalledTimes(1);
    expect(warnMock).not.toHaveBeenCalled();
  });

  it('invokes operation exactly once on happy path and twice on fallback path', async () => {
    // Happy path
    const happyOp = vi.fn(async () => 'yay');
    await withProviderFallback('template', happyOp);
    expect(happyOp).toHaveBeenCalledTimes(1);

    // Fallback path
    const fallbackOp = vi
      .fn()
      .mockImplementationOnce(async () => {
        throw new Error('primary fail');
      })
      .mockImplementationOnce(async () => 'recovered');
    const res = await withProviderFallback('template', fallbackOp);
    expect(fallbackOp).toHaveBeenCalledTimes(2);
    expect(res.fellBack).toBe(true);
    expect(res.modelId).toBe('openai:gpt-4o');
    expect(res.result).toBe('recovered');
  });
});
