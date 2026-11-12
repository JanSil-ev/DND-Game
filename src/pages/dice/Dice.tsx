import { useState } from 'react';
import { PageFrame } from '../../app/layouts/PageFrame/PageFrame';
import { DiceRoller } from '../../features/dice-roller';
import type { DiceSides } from '../../shared/dice';
import styles from './Dice.module.scss';

const diceSides: DiceSides[] = [4, 6, 8, 10, 12, 20, 100];

export function Dice() {
  const [selectedSides, setSelectedSides] = useState<DiceSides>(20);

  return (
    <PageFrame
      eyebrow="Случай решает"
      title="Кости судьбы"
      description="Кидай дерьмо!"
    >
      <section className={styles.dicePanel} aria-label="Бросок кубика">
        <p className={styles.selectorLabel}>Выбери свою кость</p>
        <div className={styles.diceSelector} role="group" aria-label="Тип кубика">
          {diceSides.map((sides) => (
            <button
              aria-pressed={selectedSides === sides}
              className={styles.dieOption}
              key={sides}
              onClick={() => setSelectedSides(sides)}
              type="button"
            >
              <span className={styles.optionIcon} aria-hidden="true">
                {sides === 4 ? '△' : sides === 6 ? '□' : '⬡'}
              </span>
              <span>d{sides}</span>
            </button>
          ))}
        </div>
        <div className={styles.rollArea}>
          <DiceRoller key={selectedSides} sides={selectedSides} />
        </div>
      </section>
    </PageFrame>
  );
}