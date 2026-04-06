import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock tracker so we can control getCurrentDailyCost
const getCurrentDailyCostMock = vi.fn<[], Promise<number>>();

vi.mock('./tracker', () => ({
  getCurrentDailyCost: () => getCurrentDailyCostMock(),
}));

import { checkCostCeiling, getCostStatus } from './ceiling';

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  getCurrentDailyCostMock.mockReset();
  delete process.env.AI_DAILY_COST_CEILING;
  delete process.env.OPENAI_DAILY_COST_CEILING;
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe('checkCostCeiling — default $5 ceiling', () => {
  it('returns normal when cost is well under 80% of $5 default', async () => {
    getCurrentDailyCostMock.mockResolvedValue(2.0);
    const result = await checkCostCeiling('free');
    expect(result.mode).toBe('normal');
    expect(result.allowed).toBe(true);
    expect(result.ceiling).toBe(5);
    expect(result.percentUsed).toBeLessThan(80);
  });

  it('returns warning at 80-95% of ceiling ($4.20 = 84%)', async () => {
    getCurrentDailyCostMock.mockResolvedValue(4.2);
    const result = await checkCostCeiling('free');
    expect(result.mode).toBe('warning');
    expect(result.allowed).toBe(true);
    expect(result.ceiling).toBe(5);
  });

  it('returns degraded at 95-100% of ceiling ($4.80 = 96%): pro allowed, free denied', async () => {
    getCurrentDailyCostMock.mockResolvedValue(4.8);

    const proResult = await checkCostCeiling('pro');
    expect(proResult.mode).toBe('degraded');
    expect(proResult.allowed).toBe(true);

    getCurrentDailyCostMock.mockResolvedValue(4.8);
    const freeResult = await checkCostCeiling('free');
    expect(freeResult.mode).toBe('degraded');
    expect(freeResult.allowed).toBe(false);
  });

  it('returns emergency and denies all users above ceiling ($6.00)', async () => {
    getCurrentDailyCostMock.mockResolvedValue(6.0);

    const proResult = await checkCostCeiling('pro');
    expect(proResult.mode).toBe('emergency');
    expect(proResult.allowed).toBe(false);

    getCurrentDailyCostMock.mockResolvedValue(6.0);
    const freeResult = await checkCostCeiling('free');
    expect(freeResult.mode).toBe('emergency');
    expect(freeResult.allowed).toBe(false);
  });
});

describe('checkCostCeiling — env var overrides', () => {
  it('AI_DAILY_COST_CEILING=10 overrides default: $5 cost becomes 50% (normal)', async () => {
    process.env.AI_DAILY_COST_CEILING = '10';
    getCurrentDailyCostMock.mockResolvedValue(5.0);
    const result = await checkCostCeiling('free');
    expect(result.ceiling).toBe(10);
    expect(result.mode).toBe('normal');
    expect(result.percentUsed).toBe(50);
  });

  it('legacy OPENAI_DAILY_COST_CEILING=8 still honored when AI_DAILY_COST_CEILING unset', async () => {
    process.env.OPENAI_DAILY_COST_CEILING = '8';
    getCurrentDailyCostMock.mockResolvedValue(4.0);
    const result = await checkCostCeiling('free');
    expect(result.ceiling).toBe(8);
    expect(result.mode).toBe('normal');
    expect(result.percentUsed).toBe(50);
  });

  it('AI_DAILY_COST_CEILING takes precedence over OPENAI_DAILY_COST_CEILING when both set', async () => {
    process.env.AI_DAILY_COST_CEILING = '15';
    process.env.OPENAI_DAILY_COST_CEILING = '8';
    getCurrentDailyCostMock.mockResolvedValue(7.5);
    const result = await checkCostCeiling('free');
    expect(result.ceiling).toBe(15);
    expect(result.mode).toBe('normal');
    expect(result.percentUsed).toBe(50);
  });
});

describe('getCostStatus — default $5 ceiling', () => {
  it('reports ceiling=$5 and correct mode after threshold change', async () => {
    getCurrentDailyCostMock.mockResolvedValue(1.0);
    const status = await getCostStatus();
    expect(status.ceiling).toBe(5);
    expect(status.mode).toBe('normal');
  });
});
