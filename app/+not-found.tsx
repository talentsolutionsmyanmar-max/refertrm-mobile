import { Link, Stack } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { copy } from "../src/copy/en";
import { tap } from "../src/theme";
import { useTheme } from "../src/theme/ThemeProvider";

export default function NotFound() {
  const t = useTheme();
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ flex: 1, backgroundColor: t.colors.bg0, padding: 16, justifyContent: "center" }}>
        <Text style={{ color: t.colors.mut }}>{copy.errors.notFound}</Text>
        <Link href="/" asChild>
          <Pressable accessibilityRole="button" accessibilityLabel={copy.nav.jobs} style={({ pressed }) => ({ minHeight: tap, justifyContent: "center", opacity: pressed ? 0.7 : 1 })}>
            <Text style={{ color: t.derived.accentTextTeal, fontWeight: "600", fontSize: 16 }}>{copy.nav.jobs}</Text>
          </Pressable>
        </Link>
      </View>
    </>
  );
}
