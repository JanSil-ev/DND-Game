import { AppShell, Group, Text } from "@mantine/core";
import styles from "../../MainLayout.module.scss";

interface AppHeaderProps {
  opened: boolean;
  onToggle: () => void;
}

export function AppHeader({ opened, onToggle }: AppHeaderProps) {
  return (
    <AppShell.Header className={styles.header}>
      <Group h="100%" px="md">
        <button
          type="button"
          className={styles.burger}
          data-opened={opened}
          onClick={onToggle}
          aria-label={opened ? "Закрыть меню" : "Открыть меню"}
          aria-expanded={opened}
          aria-controls="main-navigation"
          title={opened ? "Закрыть меню" : "Открыть меню"}
        >
          <svg className={styles.menuSigil} width="28" height="28" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <g className={styles.menuBladeTop}>
              <path d="m16 4-2.5 4v13h5V8L16 4Z" fill="currentColor" fillOpacity="0.2" />
              <path d="M11 22h10m-5 0v5m-2 0h4M16 8v10" />
            </g>
            <path className={styles.menuRune} d="M7 16h18" />
            <g className={styles.menuBladeBottom}>
              <path d="m16 4-2.5 4v13h5V8L16 4Z" fill="currentColor" fillOpacity="0.2" />
              <path d="M11 22h10m-5 0v5m-2 0h4M16 8v10" />
            </g>
          </svg>
        </button>
        <Text className={styles.brand} fw={700} size="md">
          3/5 DND Game
        </Text>
      </Group>
    </AppShell.Header>
  );
}
