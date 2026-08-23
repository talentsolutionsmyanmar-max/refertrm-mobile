import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { copy } from "../copy/en";
import { color, tap } from "../theme";

/** Cream content card — the ReferTRM learner surface (matches web #fffdf8). */
export function Card({
  label,
  accent,
  children,
}: {
  label?: string;
  accent?: "gold" | "teal";
  children: React.ReactNode;
}) {
  const accentColor = accent === "gold" ? color.goldText : accent === "teal" ? color.tealDark : color.muted;
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: accent === "gold" ? color.goldSoftBorder : color.line,
        borderRadius: 10,
        backgroundColor: color.cream,
        overflow: "hidden",
      }}
    >
      {label ? (
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 10,
            backgroundColor: accent === "gold" ? color.goldSoftBg : "rgba(0,31,63,0.03)",
            borderBottomWidth: 1,
            borderBottomColor: accent === "gold" ? color.goldSoftBorder : color.line,
          }}
        >
          <Text
            style={{
              color: accentColor,
              fontSize: 11,
              fontWeight: "700",
              letterSpacing: 1.6,
              textTransform: "uppercase",
            }}
          >
            {label}
          </Text>
        </View>
      ) : null}
      <View style={{ padding: 16 }}>{children}</View>
    </View>
  );
}

export function CardText({ text, mm }: { text: string; mm?: boolean }) {
  return (
    <Text
      style={{
        color: color.navy,
        fontSize: 16,
        lineHeight: mm ? 32 : 26,
        fontFamily: mm ? "Padauk" : undefined,
      }}
    >
      {text}
    </Text>
  );
}

/** Intentional compact empty state — never a giant blank page. */
export function EmptyNote({ text }: { text: string }) {
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: color.line,
        borderRadius: 10,
        backgroundColor: color.paper,
        padding: 16,
      }}
    >
      <Text style={{ color: color.muted, fontSize: 15, lineHeight: 22 }}>{text}</Text>
    </View>
  );
}

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
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      style={({ pressed }) => ({
        minHeight: tap,
        flexShrink: 0,
        paddingHorizontal: 16,
        borderRadius: 999,
        justifyContent: "center",
        backgroundColor: active ? color.navy : color.white,
        borderWidth: 1,
        borderColor: color.line,
        opacity: pressed ? 0.8 : 1,
      })}
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
