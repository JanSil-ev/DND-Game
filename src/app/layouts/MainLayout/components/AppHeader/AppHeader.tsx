import { AppShell, Burger, Group, Text } from "@mantine/core";
import styles from "../../MainLayout.module.scss";

interface AppHeaderProps {
  opened: boolean;
  onToggle: () => void;
}

export function AppHeader({ opened, onToggle }: AppHeaderProps) {
  return (
    <AppShell.Header className={styles.header}>
      <Group h="100%" px="md">
        <Burger
          opened={opened}
          onClick={onToggle}
          size="sm"
          aria-label={opened ? "Закрыть меню" : "Открыть меню"}
        />
        <Text fw={700} size="md">
          3/5 DND Game
        </Text>
      </Group>
    </AppShell.Header>
  );
}