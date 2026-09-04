import { useEffect, useState } from "react";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Linking from "expo-linking";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MMKV } from "react-native-mmkv";
import { parseDeepLink } from "../src/linking/paths";
import { setKv } from "../src/storage/kv";
import { copy } from "../src/copy/en";

// A failed native MMKV init must never kill first paint: the store keeps the
// in-memory default from src/storage/kv and the app renders without persistence.
try {
  const mmkv = new MMKV({ id: "refertrm-p1" });
  setKv({
    getString: (key) => mmkv.getString(key),
    set: (key, value) => {
      mmkv.set(key, value);
    },
    delete: (key) => {
      mmkv.delete(key);
    },
  });
} catch {
  // Native storage unavailable this launch; memoryKv stays active.
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
    function onUrl(url: string) {
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
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          headerStyle: { backgroundColor: "#001F3F" },
          headerTintColor: "#FFFFFF",
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
            headerTintColor: "#FFFFFF",
            headerStyle: { backgroundColor: "#001F3F" },
          }}
        />
      </Stack>
    </QueryClientProvider>
  );
}
