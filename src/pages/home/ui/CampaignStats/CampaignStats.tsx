import { Paper, SimpleGrid, Text, Title } from '@mantine/core';
import { useAppSelector } from '../../../../app/store/hooks';
import styles from '../../HomePage.module.scss';
import { selectCharacterCount } from '../../../../modules/characters/model/charactersSlice';

export function CampaignStats() {
  const campaignStats = useAppSelector((state) => state.campaignStats.stats);
  const characterCount = useAppSelector(selectCharacterCount);
  const noteCount = useAppSelector((state) => state.notes.items.length);
  const npcCount = useAppSelector((state) => state.npcs.items.length);
  const stats = [{ label: 'Персонажей', value: characterCount }, { label: 'NPC', value: npcCount }, ...campaignStats, { label: 'Заметок', value: noteCount }];

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
