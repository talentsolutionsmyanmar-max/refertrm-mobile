import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import type { QuizItem } from "../api/lesson";
import { copy } from "../copy/en";
import { color, tap } from "../theme";

/**
 * Mobile quiz runner. Mirrors the web QuizRunner behavior:
 * one question at a time, 48dp options, tap reveals correctness from the
 * source key, explanation shown after reveal, progress + score summary.
 * Never invents keys — items without a correctIndex reveal no answer.
 */
export function QuizRunner({ items, mm }: { items: QuizItem[]; mm?: boolean }) {
  const [index, setIndex] = useState(0);
  const [picks, setPicks] = useState<Record<number, number>>({});
  const [finished, setFinished] = useState(false);

  const total = items.length;
  const item = items[index];
  const pick = picks[index];
  const revealed = pick !== undefined;
  const isLast = index === total - 1;
  const lineHeight = mm ? 34 : 24;

  const correctCount = items.reduce(
    (sum, q, i) => (q.correctIndex !== null && picks[i] === q.correctIndex ? sum + 1 : sum),
    0,
  );

  if (finished) {
    return (
      <View
        style={{
          borderRadius: 10,
          borderWidth: 1,
          borderColor: color.correctBorder,
          backgroundColor: color.cream,
          padding: 24,
          alignItems: "center",
          gap: 8,
        }}
      >
        <Text
          style={{
            color: color.tealDark,
            fontSize: 11,
            fontWeight: "700",
            letterSpacing: 1.6,
            textTransform: "uppercase",
          }}
        >
          {copy.academy.quizComplete}
        </Text>
        <Text style={{ color: color.navy, fontSize: 32, fontWeight: "800" }}>
          {copy.academy.quizScore(correctCount, total)}
        </Text>
        <Pressable
          onPress={() => {
            setIndex(0);
            setPicks({});
            setFinished(false);
          }}
          accessibilityRole="button"
          accessibilityLabel={copy.academy.quizRetake}
          style={({ pressed }) => ({
            minHeight: tap,
            marginTop: 8,
            paddingHorizontal: 20,
            paddingVertical: 12,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: color.gold,
            justifyContent: "center",
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Text style={{ color: color.navy, fontWeight: "700", fontSize: 15 }}>{copy.academy.quizRetake}</Text>
        </Pressable>
      </View>
    );
  }

  if (!item) return null;

  return (
    <View>
      {/* Progress */}
      <View style={{ marginBottom: 16, gap: 6 }}>
        <Text style={{ color: color.muted, fontSize: 13 }}>{copy.academy.quizProgress(index + 1, total)}</Text>
        <View style={{ height: 4, borderRadius: 2, backgroundColor: "rgba(0,31,63,0.08)", overflow: "hidden" }}>
          <View style={{ width: `${((index + 1) / total) * 100}%`, height: "100%", backgroundColor: color.teal }} />
        </View>
      </View>

      {/* Question */}
      <Text
        style={{
          color: color.navy,
          fontSize: 17,
          fontWeight: "700",
          lineHeight: mm ? 34 : 26,
          marginBottom: 14,
          fontFamily: mm ? "Padauk" : undefined,
        }}
      >
        {item.question}
      </Text>

      {/* Options — 48dp, tap reveals */}
      <View style={{ gap: 10, marginBottom: 14 }}>
        {item.options.map((opt, oi) => {
          const isPicked = pick === oi;
          const isCorrect = item.correctIndex !== null && item.correctIndex === oi;
          let borderColor: string = color.line;
          let backgroundColor: string = color.white;
          if (revealed && item.correctIndex !== null) {
            if (isCorrect) {
              borderColor = color.correctBorder;
              backgroundColor = color.correctBg;
            } else if (isPicked) {
              borderColor = color.wrongBorder;
              backgroundColor = color.wrongBg;
            }
          } else if (isPicked) {
            borderColor = color.tealDark;
            backgroundColor = "rgba(13,148,136,0.08)";
          }
          const letter = String.fromCharCode(65 + oi);
          return (
            <Pressable
              key={`${oi}-${opt}`}
              disabled={revealed}
              onPress={() => setPicks((p) => ({ ...p, [index]: oi }))}
              accessibilityRole="button"
              accessibilityLabel={copy.academy.optionLabel(letter, opt)}
              accessibilityState={{ selected: isPicked, disabled: revealed }}
              style={({ pressed }) => ({
                minHeight: tap,
                borderRadius: 10,
                borderWidth: 1.5,
                borderColor,
                backgroundColor,
                paddingHorizontal: 16,
                paddingVertical: 12,
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <View
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  borderWidth: 1.5,
                  borderColor,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text style={{ color: color.navy, fontSize: 12, fontWeight: "700" }}>{letter}</Text>
              </View>
              <Text
                style={{
                  flex: 1,
                  color: color.navy,
                  fontSize: 16,
                  lineHeight,
                  fontFamily: mm ? "Padauk" : undefined,
                }}
              >
                {opt}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Feedback */}
      {revealed && item.correctIndex !== null ? (
        <View
          style={{
            borderRadius: 10,
            borderWidth: 1,
            borderColor: pick === item.correctIndex ? color.correctBorder : color.wrongBorder,
            backgroundColor: pick === item.correctIndex ? color.correctBg : color.wrongBg,
            padding: 14,
            marginBottom: 14,
            gap: 4,
          }}
        >
          <Text
            style={{
              color: pick === item.correctIndex ? color.tealDark : color.wrongBorder,
              fontWeight: "700",
              fontSize: 14,
            }}
          >
            {pick === item.correctIndex ? copy.academy.quizCorrect : copy.academy.quizNotQuite}
          </Text>
          {item.explanation ? (
            <Text
              style={{
                color: color.navy,
                fontSize: 15,
                lineHeight: mm ? 30 : 23,
                fontFamily: mm ? "Padauk" : undefined,
              }}
            >
              {item.explanation}
            </Text>
          ) : null}
        </View>
      ) : null}

      {/* Next */}
      {revealed ? (
        <Pressable
          onPress={() => (isLast ? setFinished(true) : setIndex((i) => i + 1))}
          accessibilityRole="button"
          accessibilityLabel={isLast ? copy.academy.quizSeeScore : copy.academy.quizNext}
          style={({ pressed }) => ({
            minHeight: tap,
            borderRadius: 10,
            backgroundColor: color.gold,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 20,
            paddingVertical: 13,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Text style={{ color: color.navy, fontWeight: "700", fontSize: 16 }}>
            {isLast ? copy.academy.quizSeeScore : copy.academy.quizNext}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
