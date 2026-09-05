import { Pressable, Text, View } from "react-native";
import { color, tap } from "../../theme";

/** Static skeleton bar — CONSUMER-UIUX-1 V7: skeletons, not spinners. */
function SkeletonBar({ width }: { width: `${number}%` }) {
  return <View style={{ width, height: 12, borderRadius: 6, backgroundColor: "rgba(0,31,63,0.08)" }} />;
}

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
      {kind === "loading" ? (
        <View style={{ gap: 8, marginBottom: 10 }} accessibilityElementsHidden importantForAccessibility="no">
          <SkeletonBar width="55%" />
          <SkeletonBar width="85%" />
        </View>
      ) : null}
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
