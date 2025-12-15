import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions:  {
    queries:  {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      retry:  (failureCount, error:  any) => {
        if (error?. response?.status === 401 || error?.response?.status === 403) {
          return false;
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: false,
    },
  },
});