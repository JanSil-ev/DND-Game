import { useEffect, useRef, useState } from 'react';
import { rollDice } from '../../../shared/dice/rollDice';
import type { DiceSides } from '../../../shared/dice/dice.types';

export function useDiceRoll(sides: DiceSides = 20) {
  const [result, setResult] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const delayTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finishTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rollInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = () => {
    if (delayTimeout.current) clearTimeout(delayTimeout.current);
    if (finishTimeout.current) clearTimeout(finishTimeout.current);
    if (rollInterval.current) clearInterval(rollInterval.current);
    delayTimeout.current = null;
    finishTimeout.current = null;
    rollInterval.current = null;
  };

  const roll = () => {
    if (isRolling) return;

    const finalResult = rollDice(sides);
    setIsRolling(true);

    delayTimeout.current = setTimeout(() => {
      setResult(rollDice(sides));
      rollInterval.current = setInterval(() => {
        setResult(rollDice(sides));
      }, 65);

      finishTimeout.current = setTimeout(() => {
        if (rollInterval.current) clearInterval(rollInterval.current);
        rollInterval.current = null;
        finishTimeout.current = null;
        setResult(finalResult);
        setIsRolling(false);
      }, 1150);
    }, 220);
  };

  const reset = () => {
    clearTimers();
    setResult(null);
    setIsRolling(false);
  };

  useEffect(() => clearTimers, []);

  return { result, isRolling, roll, reset };
}
