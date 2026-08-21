import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { copy } from "../copy/en";
import { color, tap } from "../theme";

export function Chip({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={{
        minHeight: tap,
        paddingHorizontal: 16,
        borderRadius: 999,
        justifyContent: "center",
        backgroundColor: active ? color.navy : color.white,
        borderWidth: 1,
        borderColor: color.line,
      }}
    >
      <Text style={{ color: active ? color.white : color.navy, fontWeight: "600" }}>{label}</Text>
    </Pressable>
  );
}

export function Banner({ text }: { text: string }) {
  return (
    <View
      style={{
        marginHorizontal: 16,
        marginTop: 8,
        padding: 12,
        borderRadius: 8,
        backgroundColor: "rgba(212,175,55,0.16)",
      }}
    >
      <Text style={{ color: color.navy, fontSize: 13 }}>{text}</Text>
    </View>
  );
}

export function Loading() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: color.bg }}>
      <ActivityIndicator color={color.teal} />
      <Text style={{ color: color.muted, marginTop: 12 }}>{copy.errors.loading}</Text>
    </View>
  );
}

export function RetryState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <View style={{ padding: 16, alignItems: "flex-start" }}>
      <Text style={{ color: color.muted }}>{message}</Text>
      <Pressable
        onPress={onRetry}
        accessibilityRole="button"
        style={{
          minHeight: tap,
          marginTop: 12,
          paddingHorizontal: 16,
          borderRadius: 8,
          justifyContent: "center",
          backgroundColor: color.navy,
        }}
      >
        <Text style={{ color: color.white, fontWeight: "600" }}>{copy.errors.retry}</Text>
      </Pressable>
    </View>
  );
}
