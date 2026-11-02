import { AppShell } from "@mantine/core";
import { Outlet } from "react-router";
import { useDisclosure } from "@mantine/hooks";

import styles from "./MainLayout.module.scss";
import { AppHeader } from "./components/AppHeader/AppHeader";
import { AppNavbar } from "./components/AppNavbar/AppNavbar";



export function MainLayout() {
  const [opened, { toggle, close }] = useDisclosure(false);

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{
        width: 260,
        breakpoint: "sm",
        collapsed: { mobile: !opened },
      }}
      padding="md"
      className={styles.shell}
    >
      <AppHeader opened={opened} onToggle={toggle} />

      <AppNavbar onNavigate={close} />

      <AppShell.Main className={styles.main}>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
