import type { PropsWithChildren } from 'react';
import { PageHeading } from '../PageHeading/PageHeading';
import styles from './PageFrame.module.scss';

interface PageFrameProps extends PropsWithChildren {
  className?: string;
  description: string;
  eyebrow: string;
  title: string;
}

export function PageFrame({
  children,
  className,
  description,
  eyebrow,
  title,
}: PageFrameProps) {
  return (
    <section className={[styles.page, className].filter(Boolean).join(' ')} aria-label={title}>
      <PageHeading
        className={styles.header}
        description={description}
        eyebrow={eyebrow}
        title={title}
      />
      {children && <div className={styles.content}>{children}</div>}
    </section>
  );
}
