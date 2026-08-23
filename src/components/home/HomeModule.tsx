import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { color, tap } from "../../theme";

export function HomeModule({
  eyebrow,
  title,
  detail,
  accent = "navy",
  children,
}: {
  eyebrow: string;
  title: string;
  detail?: string;
  accent?: "navy" | "gold" | "teal";
  children?: React.ReactNode;
}) {
  const borderColor = accent === "gold" ? color.gold : accent === "teal" ? color.teal : color.line;
  return (
    <View
      style={{
        borderWidth: 1,
        borderTopWidth: accent === "navy" ? 1 : 3,
        borderColor,
        borderRadius: 12,
        backgroundColor: color.cream,
        padding: 14,
      }}
    >
      <Text style={{ color: color.muted, fontSize: 10, fontWeight: "700", letterSpacing: 1.5, textTransform: "uppercase" }}>
        {eyebrow}
      </Text>
      <Text style={{ color: color.navy, fontSize: 16, lineHeight: 22, fontWeight: "700", marginTop: 6 }}>{title}</Text>
      {detail ? <Text style={{ color: color.muted, fontSize: 13, lineHeight: 19, marginTop: 5 }}>{detail}</Text> : null}
      {children}
    </View>
  );
}

export function HomeAction({
  label,
  icon,
  tone,
  onPress,
}: {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
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
      <Ionicons name={icon} size={18} color={foreground} accessibilityElementsHidden />
      <Text style={{ color: foreground, fontSize: 13, lineHeight: 18, fontWeight: "700", textAlign: "center", flexShrink: 1 }}>
        {label}
      </Text>
    </Pressable>
  );
}
