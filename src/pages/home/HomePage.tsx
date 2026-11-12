import { Container } from '@mantine/core';
import { CampaignHero } from './ui/CampaignHero/CampaignHero';
import { CampaignStats } from './ui/CampaignStats/CampaignStats';
import { CampaignBrief } from './ui/CampaignBrief/CampaignBrief';
import { NavigationCard } from './ui/NavigationCard/NavigationCard';
import { homeNavigation } from './config/homeNavigation';
import styles from './HomePage.module.scss';

export function HomePage() {
  return (
    <div className={styles.page}>
      <Container className={styles.content} size="xl">
        <CampaignHero />

        <section className={styles.statsSection} aria-label="Статистика кампании">
          <div className={styles.sectionHeading}>
            <p className={styles.sectionEyebrow}>На данный момент</p>
            <h2 className={styles.sectionTitle}>Наша кампания</h2>
          </div>
          <CampaignStats />
        </section>

        <CampaignBrief />

        <section className={styles.navigationSection}>
          <div className={styles.sectionHeading}>
            <p className={styles.sectionEyebrow}>Всё для приключения</p>
            <h2 className={styles.sectionTitle}>Заглянуть в...</h2>
          </div>
          <div className={styles.navigationGrid}>
            {homeNavigation.map((item, index) => (
              <NavigationCard
                key={item.to}
                index={index + 1}
                title={item.title}
                description={item.description}
                to={item.to}
                icon={item.icon}
              />
            ))}
          </div>
        </section>

        <footer className={styles.footer}>
          <span>Банда 3.5</span>
          <span>БЛА бла бла</span>
        </footer>
      </Container>
    </div>
  );
}
