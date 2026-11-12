import { Link } from 'react-router';
import styles from '../../HomePage.module.scss';
import { HomeIcon } from './HomeIcon';
import type { HomeIconName } from './HomeIcon';

interface NavigationCardProps {
  description: string;
  index: number;
  title: string;
  to: string;
  icon: HomeIconName;
}

export function NavigationCard({
  description,
  index,
  title,
  to,
  icon,
}: NavigationCardProps) {
  return (
    <Link className={styles.navigationCard} to={to}>
      <span className={styles.cardGlyph}><HomeIcon name={icon} /></span>
      <span className={styles.cardIndex}>
        {String(index).padStart(2, '0')}
      </span>
      <span className={styles.cardContent}>
        <span className={styles.cardTitle}>{title}</span>
        <span className={styles.cardDescription}>{description}</span>
      </span>
      <span className={styles.cardArrow} aria-hidden="true">
        ↗
      </span>
    </Link>
  );
}
