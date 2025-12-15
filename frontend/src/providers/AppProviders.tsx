import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';

import { queryClient } from '../config/queryClient';
import { theme } from '../theme/theme';

import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';

interface AppProvidersProps {
  children: React. ReactNode;
}

const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <MantineProvider theme={theme}>
      <Notifications position="top-right" zIndex={2077} />
      <ModalsProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            {children}
          </BrowserRouter>
        </QueryClientProvider>
      </ModalsProvider>
    </MantineProvider>
  );
};

export default AppProviders;