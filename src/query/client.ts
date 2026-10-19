import { QueryClient } from "@tanstack/react-query";

/** Shared React Query defaults for the app shell and integration tests. */
export const appQueryClientOptions = {
  defaultOptions: {
    queries: {
      staleTime: 30 * 60 * 1000,
      retry: false,
      refetchOnReconnect: true,
      refetchOnWindowFocus: false,
      networkMode: "offlineFirst" as const,
    },
  },
};

export function createAppQueryClient(): QueryClient {
  return new QueryClient(appQueryClientOptions);
}
