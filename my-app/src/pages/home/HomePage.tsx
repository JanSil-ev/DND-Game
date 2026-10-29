import styles from './HomePage.module.scss'

export function HomePage() {
  return (
    <section className={styles.page}>
      <p className={styles.eyebrow}>Кампания Dungeons &amp; Dragons</p>
      <h1>Привет</h1>
      <p>Твоя кампания — в одном месте.</p>
    </section>
  )
}
