import { NavLink as MantineNavLink } from '@mantine/core';
import { NavLink as RouterNavLink } from 'react-router';

interface NavigationItemProps {
  label: string;
  path: string;
  onNavigate: () => void;
}

export function NavigationItem({
  label,
  path,
  onNavigate,
}: NavigationItemProps) {
  return (
    <RouterNavLink
      to={path}
      end={path === '/'}
      onClick={onNavigate}
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      {({ isActive }) => (
        <MantineNavLink
          component="span"
          label={label}
          active={isActive}
        />
      )}
    </RouterNavLink>
  );
}