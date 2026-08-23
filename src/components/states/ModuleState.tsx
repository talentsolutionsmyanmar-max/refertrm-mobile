import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { color, tap } from "../../theme";

export type ModuleStateKind = "loading" | "empty" | "error" | "offline" | "auth-required";

export function ModuleState({
  kind,
  title,
  detail,
  actionLabel,
  onAction,
}: {
  kind: ModuleStateKind;
  title: string;
  detail: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View
      accessibilityLiveRegion={kind === "loading" ? "polite" : "none"}
      style={{ borderWidth: 1, borderColor: color.line, borderRadius: 12, backgroundColor: color.cream, padding: 16 }}
    >
      {kind === "loading" ? <ActivityIndicator color={color.teal} style={{ alignSelf: "flex-start", marginBottom: 10 }} /> : null}
      <Text style={{ color: color.navy, fontSize: 16, lineHeight: 22, fontWeight: "700" }}>{title}</Text>
      <Text style={{ color: color.muted, fontSize: 14, lineHeight: 21, marginTop: 5 }}>{detail}</Text>
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole={kind === "auth-required" ? "link" : "button"}
          accessibilityLabel={actionLabel}
          onPress={onAction}
          style={({ pressed }) => ({
            minHeight: tap,
            alignSelf: "stretch",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: color.teal,
            borderRadius: 9,
            paddingHorizontal: 16,
            marginTop: 14,
            opacity: pressed ? 0.82 : 1,
          })}
        >
          <Text style={{ color: color.white, fontSize: 15, fontWeight: "700" }}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
