import type { HTMLAttributes } from 'react';
import styles from './PageHeading.module.scss';

interface PageHeadingProps extends HTMLAttributes<HTMLElement> {
  description?: string;
  eyebrow: string;
  title: string;
}

export function PageHeading({
  className,
  description,
  eyebrow,
  title,
  ...props
}: PageHeadingProps) {
  return (
    <header
      className={[styles.heading, className].filter(Boolean).join(' ')}
      {...props}
    >
      <p className={styles.eyebrow}>{eyebrow}</p>
      <h1 className={styles.title}>{title}</h1>
      {description && <p className={styles.description}>{description}</p>}
      <span className={styles.divider} aria-hidden="true" />
    </header>
  );
}
