import type { DiceSides } from './dice.types';
import { rollDice } from './rollDice';

export type RollMode = 'normal' | 'advantage' | 'disadvantage';
export interface RollRequest { sides: DiceSides; count: number; modifier: number; mode: RollMode }
export interface PoolResult extends RollRequest {
  values: number[]; keptIndex: number | null; subtotal: number; total: number; natural: 1 | 20 | null;
}
export const rollModeNames: Record<RollMode, string> = {
  normal: 'Обычный', advantage: 'Преимущество', disadvantage: 'Помеха',
};

export function rollFormula(request: RollRequest): string {
  const dice = request.mode === 'normal' ? `${request.count}d${request.sides}` : '2d20';
  return `${dice}${request.modifier ? ` ${request.modifier > 0 ? '+' : '−'} ${Math.abs(request.modifier)}` : ''}`;
}

export function rollPool(request: RollRequest): PoolResult {
  const { count, sides, modifier, mode } = request;
  if (![4, 6, 8, 10, 12, 20, 100].includes(sides) || !Number.isInteger(count) || count < 1 || count > 20 ||
    !Number.isInteger(modifier) || modifier < -100 || modifier > 100 ||
    !Object.prototype.hasOwnProperty.call(rollModeNames, mode) || mode !== 'normal' && (sides !== 20 || count !== 1)) {
    throw new Error('Некорректные параметры броска');
  }
  const values = Array.from({ length: mode === 'normal' ? count : 2 }, () => rollDice(sides));
  const keptIndex = mode === 'normal' ? null : values.indexOf(mode === 'advantage' ? Math.max(...values) : Math.min(...values));
  const subtotal = keptIndex === null ? values.reduce((sum, value) => sum + value, 0) : values[keptIndex];
  const natural = sides === 20 && count === 1 && (subtotal === 1 || subtotal === 20) ? subtotal : null;
  return { ...request, values, keptIndex, subtotal, total: subtotal + modifier, natural };
}
