import { afterEach, describe, expect, it, vi } from 'vitest';
import { rollFormula, rollPool } from './rollPool';

afterEach(() => vi.restoreAllMocks());
describe('dice tool', () => {
  it('adds every die and applies a modifier once', () => {
    vi.spyOn(Math, 'random').mockReturnValueOnce(0.5).mockReturnValueOnce(0.7);
    expect(rollPool({ sides: 6, count: 2, modifier: 3, mode: 'normal' })).toMatchObject({ values: [4, 5], subtotal: 9, total: 12, keptIndex: null });
  });
  it('keeps the higher d20 before adding a modifier', () => {
    vi.spyOn(Math, 'random').mockReturnValueOnce(0.05).mockReturnValueOnce(0.95);
    expect(rollPool({ sides: 20, count: 1, modifier: -3, mode: 'advantage' })).toMatchObject({ values: [2, 20], keptIndex: 1, subtotal: 20, total: 17, natural: 20 });
  });
  it('keeps the lower d20 and identifies natural one independently of total', () => {
    vi.spyOn(Math, 'random').mockReturnValueOnce(0.9).mockReturnValueOnce(0);
    expect(rollPool({ sides: 20, count: 1, modifier: 5, mode: 'disadvantage' })).toMatchObject({ values: [19, 1], keptIndex: 1, total: 6, natural: 1 });
  });
  it('keeps one die on a tie and does not treat a sum of 20 as a natural 20', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.45);
    expect(rollPool({ sides: 20, count: 1, modifier: 0, mode: 'advantage' })).toMatchObject({ values: [10, 10], keptIndex: 0, total: 10 });
    expect(rollPool({ sides: 20, count: 2, modifier: 0, mode: 'normal' })).toMatchObject({ total: 20, natural: null });
  });
  it('supports negative totals and explicit notation', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const settings = { sides: 4 as const, count: 1, modifier: -5, mode: 'normal' as const };
    expect(rollPool(settings).total).toBe(-4);
    expect(rollFormula(settings)).toBe('1d4 − 5');
    expect(rollFormula({ ...settings, modifier: 0 })).toBe('1d4');
  });
  it('rejects invalid amounts, fractional modifiers and inappropriate advantage', () => {
    expect(() => rollPool({ sides: 6, count: 0, modifier: 0, mode: 'normal' })).toThrow();
    expect(() => rollPool({ sides: 6, count: 21, modifier: 0, mode: 'normal' })).toThrow();
    expect(() => rollPool({ sides: 6, count: 1, modifier: 0.5, mode: 'normal' })).toThrow();
    expect(() => rollPool({ sides: 6, count: 1, modifier: 0, mode: 'advantage' })).toThrow();
    expect(() => rollPool({ sides: 20, count: 2, modifier: 0, mode: 'disadvantage' })).toThrow();
  });
});
