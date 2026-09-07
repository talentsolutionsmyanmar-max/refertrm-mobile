import { View } from "react-native";
import { color } from "../theme";

/** Chevron — shaft + rotated head. Position with left/top only; rotate is the only transform. */
export function ArrowGlyph({ tone = "ink" }: { tone?: "ink" | "gold" | "inverse" }) {
  const c = tone === "gold" ? color.gold : tone === "inverse" ? color.gold : color.ink;
  return (
    <View style={{ width: 11, height: 11 }}>
      <View
        style={{
          position: "absolute",
          left: 0,
          top: 5,
          width: 8,
          height: 1.5,
          backgroundColor: c,
          borderRadius: 1,
        }}
      />
      <View
        style={{
          position: "absolute",
          left: 4,
          top: 2.2,
          width: 6,
          height: 6,
          borderRightWidth: 1.5,
          borderTopWidth: 1.5,
          borderColor: c,
          transform: [{ rotate: "45deg" }],
        }}
      />
    </View>
  );
}

/** CSS triangle play mark — border trick. No SVG. */
export function PlayGlyph() {
  return (
    <View
      style={{
        width: 0,
        height: 0,
        marginLeft: 2,
        borderStyle: "solid",
        borderLeftWidth: 9,
        borderTopWidth: 5.5,
        borderBottomWidth: 5.5,
        borderLeftColor: color.gold,
        borderTopColor: "transparent",
        borderBottomColor: "transparent",
      }}
    />
  );
}

/** Four dots + three thin edges. No SVG. */
export function ConstellationGlyph() {
  const edge = "rgba(15,118,110,0.42)";
  const nodes: Array<{ left: number; top: number; size: number; fill: string }> = [
    { left: 8, top: 28, size: 5, fill: color.teal },
    { left: 28, top: 8, size: 5, fill: color.teal },
    { left: 48, top: 22, size: 6, fill: color.gold },
    { left: 36, top: 38, size: 4, fill: color.teal },
  ];
  return (
    <View style={{ position: "absolute", right: -6, bottom: -4, width: 66, height: 52, zIndex: 0 }} pointerEvents="none">
      <View
        style={{
          position: "absolute",
          left: 12,
          top: 20,
          width: 22,
          height: 1,
          backgroundColor: edge,
          transform: [{ rotate: "-35deg" }],
        }}
      />
      <View
        style={{
          position: "absolute",
          left: 30,
          top: 16,
          width: 20,
          height: 1,
          backgroundColor: edge,
          transform: [{ rotate: "28deg" }],
        }}
      />
      <View
        style={{
          position: "absolute",
          left: 34,
          top: 28,
          width: 16,
          height: 1,
          backgroundColor: edge,
          transform: [{ rotate: "55deg" }],
        }}
      />
      {nodes.map((n, i) => (
        <View
          key={i}
          style={{
            position: "absolute",
            left: n.left,
            top: n.top,
            width: n.size,
            height: n.size,
            borderRadius: n.size / 2,
            backgroundColor: n.fill,
          }}
        />
      ))}
    </View>
  );
}
