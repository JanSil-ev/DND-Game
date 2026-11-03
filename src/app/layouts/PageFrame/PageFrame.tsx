import type { PropsWithChildren } from 'react';
import styles from './PageFrame.module.scss';

interface PageFrameProps extends PropsWithChildren {
  description: string;
  eyebrow: string;
  title: string;
}

export function PageFrame({
  children,
  description,
  eyebrow,
  title,
}: PageFrameProps) {
  return (
    <section className={styles.page} aria-label={title}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.description}>{description}</p>
      </header>
      {children && <div className={styles.content}>{children}</div>}
    </section>
  );
}
