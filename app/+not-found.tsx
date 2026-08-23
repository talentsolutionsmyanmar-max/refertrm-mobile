import { Link, Stack } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { copy } from "../src/copy/en";
import { color, tap } from "../src/theme";

export default function NotFound() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ flex: 1, backgroundColor: color.bg, padding: 16, justifyContent: "center" }}>
        <Text style={{ color: color.muted }}>{copy.errors.notFound}</Text>
        <Link href="/" asChild>
          <Pressable accessibilityRole="button" accessibilityLabel={copy.nav.jobs} style={({ pressed }) => ({ minHeight: tap, justifyContent: "center", opacity: pressed ? 0.7 : 1 })}>
            <Text style={{ color: color.tealDark, fontWeight: "600", fontSize: 16 }}>{copy.nav.jobs}</Text>
          </Pressable>
        </Link>
      </View>
    </>
  );
}
