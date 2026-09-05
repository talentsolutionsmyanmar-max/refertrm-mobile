import { Pressable, Text, View } from "react-native";
import { color, tap, type } from "../../theme";

/**
 * CONSUMER-UIUX-1 §3 R2 — three weights, no fourth.
 * The 3px borderTop-as-only-difference pattern is retired: weight is
 * carried by type size, spacing, and grouping, not coloured borders.
 * hero 22/28 full width · standard 16/22 · quiet 13/18 grouped.
 */
export type HomeWeight = "hero" | "standard" | "quiet";

export function HomeModule({
  eyebrow,
  title,
  detail,
  weight = "standard",
  fill = false,
  children,
}: {
  eyebrow: string;
  title: string;
  detail?: string;
  weight?: HomeWeight;
  fill?: boolean;
  /** @deprecated R2 — accepted for backward compatibility, ignored. Weight is carried by the weight prop. */
  accent?: "navy" | "gold" | "teal";
  children?: React.ReactNode;
}) {
  const titleStyle =
    weight === "hero" ? type.hero : weight === "quiet" ? type.bodySm : { fontSize: 16, lineHeight: 22 };
  const detailStyle = weight === "quiet" ? type.bodySm : type.body;
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: color.line,
        borderRadius: 12,
        backgroundColor: color.cream,
        padding: 16,
        flex: fill ? 1 : undefined,
      }}
    >
      <Text style={{ color: color.muted, ...type.monoLabel, fontWeight: "700" }}>{eyebrow}</Text>
      <Text style={{ color: color.navy, ...titleStyle, fontWeight: "700", marginTop: 6 }}>{title}</Text>
      {detail ? <Text style={{ color: color.muted, ...detailStyle, marginTop: 5 }}>{detail}</Text> : null}
      {children}
    </View>
  );
}

export function HomeAction({
  label,
  tone,
  onPress,
}: {
  label: string;
  tone: "navy" | "gold";
  onPress: () => void;
}) {
  const backgroundColor = tone === "gold" ? color.gold : color.navy;
  const foreground = tone === "gold" ? color.navy : color.white;
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${label}. Opens ReferTRM.com in your browser.`}
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        minHeight: tap,
        borderRadius: 10,
        backgroundColor,
        paddingHorizontal: 10,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 7,
        opacity: pressed ? 0.82 : 1,
      })}
    >
      <Text style={{ color: foreground, ...type.bodySm, fontWeight: "700", textAlign: "center", flexShrink: 1 }}>
        {label}
      </Text>
    </Pressable>
  );
}
