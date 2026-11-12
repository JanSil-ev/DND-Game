import { Paper, SimpleGrid, Text, Title } from '@mantine/core';
import { useAppSelector } from '../../../../app/store/hooks';
import styles from '../../HomePage.module.scss';

export function CampaignStats() {
  const stats = useAppSelector((state) => state.campaignStats.stats);

  return (
    <SimpleGrid className={styles.statsGrid} cols={{ base: 2, xs: 3 }}>
      {stats.map((stat) => (
        <Paper
          className={styles.statCard}
          key={stat.label}
          withBorder
          p="lg"
          radius="md"
        >
          <Title className={styles.statValue} order={2}>
            {stat.value}
          </Title>
          <Text className={styles.statLabel} size="sm">
            {stat.label}
          </Text>
        </Paper>
      ))}
    </SimpleGrid>
  );
}