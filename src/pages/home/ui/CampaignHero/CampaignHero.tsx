import { Link } from 'react-router';
import { routes } from '../../../../app/router/routes';
import { PageHeading } from '../../../../app/layouts/PageHeading/PageHeading';
import styles from '../../HomePage.module.scss';
import { DiceRoller } from '../../../../features/dice-roller';

export function CampaignHero() {
  return (
    <section className={styles.hero}>
      <div className={styles.heroContent}>
        <PageHeading eyebrow="Хроники одной большой истории" title="Банда 3.5" />

        <div className={styles.heroActions}>
          <Link className={styles.primaryAction} to={`${routes.notes}?new=1`}>
            ＋ Добавить заметку
          </Link>
          <Link className={styles.secondaryAction} to={routes.map}>
            Открыть карту
          </Link>
          <Link className={styles.secondaryAction} to={routes.dice}>Бросить кости</Link>
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
