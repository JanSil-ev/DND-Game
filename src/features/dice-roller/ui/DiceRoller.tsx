import { useEffect, useState } from 'react';
import { useDiceRoll } from '../model/useDiceRoll';
import { rollDice, type DiceSides } from '../../../shared/dice';
import styles from './DiceRoller.module.scss';

interface DiceRollerProps {
  sides?: DiceSides;
}

export function DiceRoller({ sides = 20 }: DiceRollerProps) {
  const { result, isRolling, roll } = useDiceRoll(sides);
  const [displayResult, setDisplayResult] = useState<number>(sides);

  useEffect(() => {
    if (!isRolling) {
      return;
    }

    const startedAt = performance.now();
    let timeout: ReturnType<typeof setTimeout>;

    const advanceNumber = () => {
      const progress = Math.min((performance.now() - startedAt) / 1150, 1);
      setDisplayResult(rollDice(sides));

      if (progress < 1) {
        timeout = setTimeout(advanceNumber, 45 + 110 * progress ** 2);
      }
    };

    advanceNumber();
    return () => clearTimeout(timeout);
  }, [isRolling, sides]);

  useEffect(() => {
    if (!isRolling && result !== null) setDisplayResult(result);
  }, [isRolling, result]);

  return (
    <div className={styles.roller}>
      <button
        aria-label={`Бросить кубик d${sides}`}
        className={`${styles.dieButton} ${isRolling ? styles.rolling : ''}`}
        data-sides={sides}
        disabled={isRolling}
        onClick={roll}
        type="button"
      >
        <span className={styles.dieFace}>
          <span
            aria-atomic="true"
            aria-live={isRolling ? 'off' : 'polite'}
            className={`${styles.result} ${isRolling ? styles.numberRolling : ''}`}
            key={displayResult}
          >
            {displayResult}
          </span>
        </span>
      </button>
      <span className={styles.rollHint} aria-live="polite">
        {isRolling ? 'Прокрутка…' : 'Бросить кубик'}
      </span>
    </div>
  );
}