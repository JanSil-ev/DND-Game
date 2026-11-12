import { AppShell } from "@mantine/core";
import { Outlet } from "react-router";
import { useDisclosure, useReducedMotion } from "@mantine/hooks";

import styles from "./MainLayout.module.scss";
import { AppHeader } from "./components/AppHeader/AppHeader";
import { AppNavbar } from "./components/AppNavbar/AppNavbar";



export function MainLayout() {
  const [opened, { toggle, close }] = useDisclosure(false);
  const reducedMotion = useReducedMotion();

  return (
    <AppShell
      transitionDuration={reducedMotion ? 0 : 280}
      transitionTimingFunction="cubic-bezier(0.22, 1, 0.36, 1)"
      header={{ height: 56 }}
      navbar={{
        width: 260,
        breakpoint: "64em",
        collapsed: { mobile: !opened },
      }}
      padding={0}
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
