import { Pressable, Text, View } from "react-native";
import { copy } from "../copy/en";
import { tap, type } from "../theme";
import { useTheme } from "../theme/ThemeProvider";

/**
 * Shared component layer — themed via useTheme() (H1).
 * The legacy `color` shim is retired here: no single key can serve both ink
 * (text) and surface (fill) roles across a dark palette. Text resolves to
 * ink/mut; surfaces resolve to panel/panel2. Derived alphas come from the
 * theme (H2) — ink at low alpha on the active backdrop, never dark-ink-on-dark.
 */

export function Card({
  label,
  accent,
  children,
}: {
  label?: string;
  accent?: "gold" | "teal";
  children: React.ReactNode;
}) {
  const t = useTheme();
  const accentColor = accent === "gold" ? t.derived.accentTextGold : accent === "teal" ? t.derived.accentTextTeal : t.colors.mut;
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: accent === "gold" ? t.accents.gold : t.colors.line,
        borderRadius: 10,
        backgroundColor: t.colors.panel,
        overflow: "hidden",
      }}
    >
      {label ? (
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 10,
            backgroundColor: accent === "gold" ? t.derived.goldFillBg : t.derived.labelStripBg,
            borderBottomWidth: 1,
            borderBottomColor: accent === "gold" ? t.accents.gold : t.colors.line,
          }}
        >
          <Text
            style={{
              color: accentColor,
              ...type.monoLabel,
              fontWeight: "700",
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
  const t = useTheme();
  return (
    <Text
      style={{
        color: t.colors.ink,
        fontSize: 16,
        lineHeight: mm ? 32 : 26,
        fontFamily: mm ? "Padauk" : "Nunito",
      }}
    >
      {text}
    </Text>
  );
}

/** Intentional compact empty state — never a giant blank page. */
export function EmptyNote({ text }: { text: string }) {
  const t = useTheme();
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: t.colors.line,
        borderRadius: 10,
        backgroundColor: t.colors.bg1,
        padding: 16,
      }}
    >
      <Text style={{ color: t.colors.mut, ...type.body }}>{text}</Text>
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
  const t = useTheme();
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
        backgroundColor: active ? t.colors.ink : t.colors.panel,
        borderWidth: 1,
        borderColor: t.colors.line,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <Text style={{ color: active ? t.colors.bg0 : t.colors.ink, fontWeight: "600" }}>{label}</Text>
    </Pressable>
  );
}

export function Banner({ text }: { text: string }) {
  const t = useTheme();
  return (
    <View
      style={{
        marginHorizontal: 16,
        marginTop: 8,
        padding: 12,
        borderRadius: 8,
        backgroundColor: t.derived.goldFillBg,
      }}
    >
      {/* The banner is a gold fill (light in both themes) — text is dark ink. */}
      <Text style={{ color: t.derived.bannerText, ...type.bodySm }}>{text}</Text>
    </View>
  );
}

/**
 * CONSUMER-UIUX-1 V7 — skeletons, not spinners. Static skeleton bars shaped
 * like the content being loaded. Skeleton bars derive from the active theme
 * (ink at low alpha), so they stay visible on a dark panel (H2).
 */
export function Skeleton({ width, height = 14 }: { width: number | `${number}%`; height?: number }) {
  const t = useTheme();
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={{ width, height, borderRadius: 6, backgroundColor: t.derived.skeletonBg }}
    />
  );
}

export function Loading() {
  const t = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg0, padding: 16, gap: 12 }}>
      <Skeleton width="40%" height={12} />
      <Skeleton width="75%" height={22} />
      <View style={{ borderWidth: 1, borderColor: t.colors.line, borderRadius: 12, backgroundColor: t.colors.panel, padding: 16, gap: 10 }}>
        <Skeleton width="45%" />
        <Skeleton width="90%" height={18} />
        <Skeleton width="70%" height={18} />
      </View>
      <View style={{ borderWidth: 1, borderColor: t.colors.line, borderRadius: 12, backgroundColor: t.colors.panel, padding: 16, gap: 10 }}>
        <Skeleton width="45%" />
        <Skeleton width="85%" height={18} />
        <Skeleton width="60%" height={18} />
      </View>
      <Text style={{ color: t.colors.mut, marginTop: 4, fontFamily: "Nunito" }}>{copy.errors.loading}</Text>
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
  const t = useTheme();
  return (
    <View style={{ padding: 16, alignItems: "flex-start" }}>
      <Text style={{ color: t.colors.mut, fontFamily: "Nunito" }}>{message}</Text>
      <Pressable
        onPress={onRetry}
        accessibilityRole="button"
        style={{
          minHeight: tap,
          marginTop: 12,
          paddingHorizontal: 16,
          borderRadius: 8,
          justifyContent: "center",
          backgroundColor: t.colors.ink,
        }}
      >
        <Text style={{ color: t.colors.bg0, fontWeight: "600", fontFamily: "Nunito" }}>{copy.errors.retry}</Text>
      </Pressable>
    </View>
  );
}
