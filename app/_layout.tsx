import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import * as Linking from "expo-linking";
import { parseDeepLink } from "../src/linking/paths";
import { copy } from "../src/copy/en";

export default function RootLayout() {
  const router = useRouter();
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 30 * 60 * 1000, retry: 1 } },
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
      <Stack screenOptions={{ headerShown: false }}>
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
