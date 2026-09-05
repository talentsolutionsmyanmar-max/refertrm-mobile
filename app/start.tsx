import { Linking, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { copy } from "../src/copy/en";
import { GAME_URL, openStartInBrowser } from "@/src/linking/start";

export default function StartScreen() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF", padding: 16 }}>
      <Text style={{ color: "#001F3F", fontSize: 24, fontWeight: "800" }}>{copy.start.title}</Text>
      <Text style={{ color: "#64748B", marginTop: 8, marginBottom: 24 }}>{copy.start.subtitle}</Text>

      <Pressable
        onPress={() => router.push("/")}
        style={{
          minHeight: 44,
          borderWidth: 1,
          borderColor: "rgba(0,31,63,0.1)",
          borderRadius: 8,
          padding: 16,
          marginBottom: 12,
          justifyContent: "center",
        }}
      >
        <Text style={{ color: "#001F3F", fontWeight: "700", fontSize: 16 }}>{copy.start.jobs}</Text>
      </Pressable>

      <Pressable
        onPress={() => router.push("/learn")}
        style={{
          minHeight: 44,
          borderWidth: 1,
          borderColor: "rgba(0,31,63,0.1)",
          borderRadius: 8,
          padding: 16,
          marginBottom: 12,
          justifyContent: "center",
        }}
      >
        <Text style={{ color: "#001F3F", fontWeight: "700", fontSize: 16 }}>{copy.start.academy}</Text>
      </Pressable>

      <Pressable
        onPress={() => {
          void Linking.openURL(GAME_URL);
        }}
        style={{
          minHeight: 44,
          borderWidth: 1,
          borderColor: "rgba(0,31,63,0.1)",
          borderRadius: 8,
          padding: 16,
          marginBottom: 12,
          justifyContent: "center",
        }}
      >
        <Text style={{ color: "#001F3F", fontWeight: "700", fontSize: 16 }}>{copy.start.careerGame}</Text>
      </Pressable>

      <Pressable
        onPress={() => {
          void openStartInBrowser();
        }}
        style={{
          minHeight: 44,
          borderWidth: 1,
          borderColor: "rgba(0,31,63,0.1)",
          borderRadius: 8,
          padding: 16,
          marginBottom: 12,
          justifyContent: "center",
        }}
      >
        <Text style={{ color: "#001F3F", fontWeight: "700", fontSize: 16 }}>{copy.ydc.title}</Text>
      </Pressable>

      <Pressable
        onPress={() => {
          void openStartInBrowser();
        }}
        style={{
          minHeight: 44,
          borderWidth: 1,
          borderColor: "rgba(0,31,63,0.1)",
          borderRadius: 8,
          padding: 16,
          marginBottom: 12,
          justifyContent: "center",
        }}
      >
        <Text style={{ color: "#001F3F", fontWeight: "700", fontSize: 16 }}>{copy.start.overflow}</Text>
      </Pressable>
    </View>
  );
}
