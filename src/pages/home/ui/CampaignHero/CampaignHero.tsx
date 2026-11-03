import { Link } from 'react-router';
import { routes } from '../../../../app/router/routes';
import styles from '../../HomePage.module.scss';
import { DiceRoller } from '../../../../features/dice-roller';

export function CampaignHero() {
  return (
    <section className={styles.hero}>
      <div className={styles.heroContent}>
        <p className={styles.eyebrow}>Хроники одной большой истории</p>
        <h1 className={styles.heroTitle}>
          Банда
          <span>3.5</span>
        </h1>

        <div className={styles.heroActions}>
          <Link className={styles.primaryAction} to={routes.characters}>
            К персонажам
          </Link>
          <Link className={styles.secondaryAction} to={routes.notes}>
            Заметки
          </Link>
        </div>
      </div>
      <div className={styles.heroArtwork}>
        <div className={styles.orbit} aria-hidden="true" />
        <DiceRoller />
      </div>
      <span className={styles.heroIndex} aria-hidden="true">
        D&amp;D&nbsp; / &nbsp;01
      </span>
    </section>
  );
}
