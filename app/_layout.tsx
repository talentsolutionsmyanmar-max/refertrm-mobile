import { useEffect, useState } from "react";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Linking from "expo-linking";
import NetInfo from "@react-native-community/netinfo";
import { QueryClient, QueryClientProvider, onlineManager } from "@tanstack/react-query";
import { ThemeProvider } from "../src/theme/ThemeProvider";
import { parseDeepLink } from "../src/linking/paths";
import { isHttpsStartUrl, openStartInBrowser } from "../src/linking/start";
import { copy } from "../src/copy/en";

/**
 * T1/K1 — TanStack Query v5 does not auto-wire NetInfo in React Native; its
 * default onlineManager listens for window online/offline events that do not
 * exist here, so isOnline() would stay true forever and query fetchStatus would
 * never reach "paused". Wire the real connectivity signal so the hero's offline
 * state (and refetchOnReconnect) actually work on a phone with no connectivity.
 *
 * The listener is set inside RootLayout's useEffect, never at module scope: a
 * module-scope side effect touching a native module at import time is the same
 * risk shape as the two launch crashes this repo already ate. A throw is
 * swallowed and logged — worst case, the app degrades to pre-T1 behaviour
 * (isOnline() stays true, offline surfaces as jobs · transport), which is
 * survivable. A one-tick race where a query mounts before the listener is wired
 * is acceptable: the default is "online", i.e. current behaviour.
 */
function wireOnlineManager() {
  try {
    onlineManager.setEventListener((setOnline) =>
      NetInfo.addEventListener((state) => {
        setOnline(state.isConnected !== false && state.isInternetReachable !== false);
      }),
    );
  } catch (error) {
    console.warn("refertrm: online wiring unavailable; degrading to pre-T1 behaviour", error);
  }
}

export default function RootLayout() {
  const router = useRouter();
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 60 * 1000,
            retry: false,
            refetchOnReconnect: true,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  useEffect(() => {
    wireOnlineManager();
  }, []);

  useEffect(() => {
    function onUrl(url: string) {
      if (isHttpsStartUrl(url)) {
        void openStartInBrowser();
        return;
      }
      const parsed = parseDeepLink(url);
      if (parsed.type === "start") {
        router.push("/start");
      }
    }

    const sub = Linking.addEventListener("url", (event) => {
      onUrl(event.url);
    });
    void Linking.getInitialURL().then((url) => {
      if (url) onUrl(url);
    });
    return () => sub.remove();
  }, [router]);

  return (
    <QueryClientProvider client={client}>
      <ThemeProvider>
        <StatusBar style="light" />
        <Stack
        screenOptions={{
          headerShown: false,
          headerStyle: { backgroundColor: "#070B18" },
          headerTintColor: "#F2F5FF",
          headerTitleStyle: { fontWeight: "700" },
          headerBackVisible: true,
        }}
      >
        {/* Tab navigator manages its own header. */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        {/* Detail routes get a proper Android top app bar with back navigation. */}
        <Stack.Screen name="jobs/[id]" options={{ headerShown: true, title: "Jobs" }} />
        <Stack.Screen name="learn/[slug]" options={{ headerShown: true, title: "Academy" }} />
        <Stack.Screen
          name="start"
          options={{
            headerShown: true,
            title: copy.start.title,
            headerTintColor: "#F2F5FF",
            headerStyle: { backgroundColor: "#070B18" },
          }}
        />
      </Stack>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
