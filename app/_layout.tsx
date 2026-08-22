import { useEffect, useState } from "react";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Linking from "expo-linking";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MMKV } from "react-native-mmkv";
import { parseDeepLink, jobsHref, learnHref } from "../src/linking/paths";
import { setKv } from "../src/storage/kv";

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
    const go = (url: string | null) => {
      try {
        if (!url) return;
        const parsed = parseDeepLink(url);
        if (parsed.type === "jobs") router.push(jobsHref(parsed.id));
        else if (parsed.type === "learn") router.push(learnHref(parsed.slug));
        else router.push("/+not-found");
      } catch {
        router.push("/+not-found");
      }
    };
    void Linking.getInitialURL().then(go).catch(() => {
      router.push("/+not-found");
    });
    const sub = Linking.addEventListener("url", (event) => go(event.url));
    return () => sub.remove();
  }, [router]);

  return (
    <QueryClientProvider client={client}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#001F3F" },
          headerTintColor: "#FFFFFF",
          headerTitleStyle: { fontWeight: "700" },
          headerBackVisible: true,
        }}
      >
        {/* Tab navigator manages its own header. */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        {/* Detail routes get a proper Android top app bar with back navigation. */}
        <Stack.Screen name="jobs/[id]" options={{ title: "Jobs" }} />
        <Stack.Screen name="learn/[slug]" options={{ title: "Academy" }} />
      </Stack>
    </QueryClientProvider>
  );
}
