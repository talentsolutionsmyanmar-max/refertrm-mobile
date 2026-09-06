import { Pressable, Text, View } from "react-native";
import { tap, type } from "../../theme";
import { useTheme } from "../../theme/ThemeProvider";

/** Static skeleton bar — CONSUMER-UIUX-1 V7: skeletons, not spinners. Themed. */
function SkeletonBar({ width }: { width: `${number}%` }) {
  const t = useTheme();
  return <View style={{ width, height: 12, borderRadius: 6, backgroundColor: t.derived.skeletonBg }} />;
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
  const t = useTheme();
  return (
    <View
      accessibilityLiveRegion={kind === "loading" ? "polite" : "none"}
      style={{ borderWidth: 1, borderColor: t.colors.line, borderRadius: 12, backgroundColor: t.colors.panel, padding: 16 }}
    >
      {kind === "loading" ? (
        <View style={{ gap: 8, marginBottom: 10 }} accessibilityElementsHidden importantForAccessibility="no">
          <SkeletonBar width="55%" />
          <SkeletonBar width="85%" />
        </View>
      ) : null}
      <Text style={{ color: t.colors.ink, ...type.standard, fontWeight: "700" }}>{title}</Text>
      <Text style={{ color: t.colors.mut, ...type.body, marginTop: 5 }}>{detail}</Text>
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
            backgroundColor: t.colors.ink,
            borderRadius: 9,
            paddingHorizontal: 16,
            marginTop: 14,
            opacity: pressed ? 0.82 : 1,
          })}
        >
          <Text style={{ color: t.colors.bg0, ...type.body, fontWeight: "700" }}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
