import { MantineProvider } from '@mantine/core';
import { BrowserRouter } from 'react-router';
import type { PropsWithChildren } from 'react';



export function AppProviders({ children }: PropsWithChildren) {
  return (
    <MantineProvider defaultColorScheme="light">
      <BrowserRouter>{children}</BrowserRouter>
    </MantineProvider>
  );
}