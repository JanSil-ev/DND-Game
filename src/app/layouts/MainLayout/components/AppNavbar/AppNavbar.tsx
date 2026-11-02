import { AppShell, Stack } from "@mantine/core";

import { navigation } from "../../config/navigation";
import { NavigationItem } from "../NavigationItem";

interface AppNavbarProps {
  onNavigate: () => void;
}

export function AppNavbar({ onNavigate }: AppNavbarProps) {
  return (
    <AppShell.Navbar>
      <Stack gap="xs">
        {navigation.map((item) => (
          <NavigationItem
            key={item.path}
            label={item.label}
            path={item.path}
            onNavigate={onNavigate}
          />
        ))}
      </Stack>
    </AppShell.Navbar>
  );
}
