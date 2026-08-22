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
          <Pressable style={{ minHeight: tap, justifyContent: "center" }}>
            <Text style={{ color: color.tealDark, fontWeight: "600" }}>{copy.nav.jobs}</Text>
          </Pressable>
        </Link>
      </View>
    </>
  );
}
