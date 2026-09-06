import { Pressable, Text, View } from "react-native";
import { tap, type } from "../../theme";
import { useTheme } from "../../theme/ThemeProvider";

/**
 * CONSUMER-UIUX-1 §3 R2 — three weights, no fourth.
 * The 3px borderTop-as-only-difference pattern is retired: weight is
 * carried by type size, spacing, and grouping, not coloured borders.
 * hero (display 26) · standard 20/28 · quiet 13/18 grouped.
 *
 * NIGHT-TOKENS-008/010: themed via useTheme(). The legacy `color` shim's
 * polysemous keys (navy/cream/…) are deleted — text resolves to ink/mut,
 * surfaces to panel, never one ambiguous name.
 */
export type HomeWeight = "hero" | "standard" | "quiet";

/**
 * S6 — a teal icon tile differentiates a card without emoji or an icon font.
 * The dependency lock forbids react-native-svg and @expo/vector-icons is
 * banned on the launch path, so the mark is typographic: a teal tile carrying
 * a two-letter monogram, palette-legal and distinct per card. If a real
 * SVG/PNG asset is later supplied per card, this prop's union is the seam it
 * lands in.
 */
export type HomeTile = "book" | "sprout";

const TILE_MARK: Record<HomeTile, string> = {
  book: "BK",
  sprout: "SP",
};

function Tile({ kind }: { kind: HomeTile }) {
  const t = useTheme();
  // The teal tile is a light fill on day, dark on night — the mark's ink
  // follows the fill's brightness, not the theme's page ink (bg0 is dark on
  // night, light on day; the tile needs the OPPOSITE on day: dark ink).
  const markColor = t.name === "night" ? t.colors.bg0 : "#141B33";
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={{
        width: 44,
        height: 44,
        borderRadius: 10,
        backgroundColor: t.accents.teal,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 10,
      }}
    >
      <Text style={{ color: markColor, ...type.monoLabel, fontWeight: "800", letterSpacing: 1 }}>{TILE_MARK[kind]}</Text>
    </View>
  );
}

export function HomeModule({
  eyebrow,
  title,
  detail,
  weight = "standard",
  fill = false,
  tile,
  children,
}: {
  eyebrow: string;
  title: string;
  detail?: string;
  weight?: HomeWeight;
  fill?: boolean;
  /** S6 — optional teal icon tile rendered above the eyebrow. */
  tile?: HomeTile;
  /** @deprecated R2 — accepted for backward compatibility, ignored. Weight is carried by the weight prop. */
  accent?: "navy" | "gold" | "teal";
  children?: React.ReactNode;
}) {
  const t = useTheme();
  const titleStyle = weight === "hero" ? type.display : weight === "quiet" ? type.bodySm : type.standard;
  const detailStyle = weight === "quiet" ? type.bodySm : type.body;
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: t.colors.line,
        borderRadius: 12,
        backgroundColor: t.colors.panel,
        padding: 16,
        flex: fill ? 1 : undefined,
      }}
    >
      {tile ? <Tile kind={tile} /> : null}
      <Text style={{ color: t.colors.mut, ...type.monoLabel, fontWeight: "700" }}>{eyebrow}</Text>
      <Text style={{ color: t.colors.ink, ...titleStyle, fontWeight: "700", marginTop: 6 }}>{title}</Text>
      {detail ? <Text style={{ color: t.colors.mut, ...detailStyle, marginTop: 5 }}>{detail}</Text> : null}
      {children}
    </View>
  );
}
