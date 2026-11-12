import { MantineProvider } from '@mantine/core';
import { BrowserRouter } from 'react-router';
import type { PropsWithChildren } from 'react';
import { Provider } from 'react-redux';
import { store } from '../store/store';

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <MantineProvider defaultColorScheme="light">
      <Provider store={store}>
        <BrowserRouter basename="/DND-Game">{children}</BrowserRouter>
      </Provider>
    </MantineProvider>
  );
}