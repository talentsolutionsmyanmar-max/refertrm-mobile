import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { Link, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { loadAcademy, loadModule } from "../../src/api/load";
import { staleContentBanner } from "../../src/api/catalogue-presentation";
import { parseLessonBlocks, parseQuiz, showMmToggle } from "../../src/api/lesson";
import { Banner, RetryState } from "../../src/components/ui";
import { webLessonUrl } from "../../src/linking/lessonWeb";
import { openWeb } from "../../src/linking/start";
import { errorMessage } from "../../src/copy/error";
import { copy } from "../../src/copy/en";
import { useOnline } from "../../src/hooks/useOnline";
import { color, font, tap } from "../../src/theme";

/** Myanmar lesson content line geometry (~1.8). EN path keeps prior literals. */
const MM_LH = 1.8;

export default function LessonScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const online = useOnline();
  const catalogue = useQuery({ queryKey: ["academy"], queryFn: ({ signal }) => loadAcademy(signal) });
  const listed = catalogue.data?.modules.find((m) => m.slug === slug || m.id === slug);
  const detail = useQuery({
    queryKey: ["academy-module", listed?.id],
    queryFn: ({ signal }) => loadModule(listed!.id, signal),
    enabled: Boolean(listed?.id),
  });
  const module = detail.data?.module;
  const fromCache = Boolean(catalogue.data?.fromCache || detail.data?.fromCache);
  const fetchFailed =
    (catalogue.isError && !listed) || (detail.isError && !module && Boolean(listed));
  const banner = staleContentBanner({
    hasContent: Boolean(module ?? listed),
    fromCache,
    isError: catalogue.isError || detail.isError,
    online,
  });
  const [mm, setMm] = useState(false);
  const canToggle = module ? showMmToggle(Boolean(listed?.mmReady ?? module.mmReady), module) : false;
  const blocks = useMemo(
    () => (module ? parseLessonBlocks(mm ? module.contentMm : module.content) : []),
    [module, mm],
  );
  const quiz = module && !mm ? parseQuiz(module.quizQuestions) : [];

  function retry() {
    void catalogue.refetch();
    if (listed?.id) void detail.refetch();
  }

  if (!listed && !module && catalogue.isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: color.navy, justifyContent: "center", alignItems: "center", gap: 10 }}>
        <ActivityIndicator color={color.gold} />
        <Text style={{ color: color.white, fontSize: 14 }}>{copy.errors.connecting}</Text>
      </View>
    );
  }

  if (!listed && !module && fetchFailed) {
    return (
      <View style={{ flex: 1, backgroundColor: color.bg }}>
        <RetryState message={errorMessage(detail.error ?? catalogue.error)} onRetry={retry} />
      </View>
    );
  }

  if (!listed && !module) {
    // Not an Academy lesson (e.g. a public help article on the website).
    // Offer the website page instead of a dead end. No auto-open, so a
    // link the website hands back to the app can never loop.
    const webUrl = webLessonUrl(slug);
    return (
      <View style={{ flex: 1, backgroundColor: color.white, padding: 16 }}>
        <Text style={{ color: color.muted }}>{webUrl ? copy.academy.notInApp : copy.errors.notFound}</Text>
        {webUrl ? (
          <Pressable
            onPress={() => void openWeb(webUrl).catch(() => undefined)}
            accessibilityRole="link"
            accessibilityLabel={copy.academy.openOnWebsite}
            style={{
              minHeight: tap,
              marginTop: 12,
              paddingHorizontal: 16,
              borderRadius: 8,
              justifyContent: "center",
              backgroundColor: color.navy,
              alignSelf: "flex-start",
            }}
          >
            <Text style={{ color: color.white, fontWeight: "600" }}>{copy.academy.openOnWebsite}</Text>
          </Pressable>
        ) : null}
        <Link href="/learn" asChild>
          <Pressable style={{ minHeight: tap, justifyContent: "center", marginTop: 8 }}>
            <Text style={{ color: color.tealDark, fontWeight: "600" }}>{copy.nav.academy}</Text>
          </Pressable>
        </Link>
      </View>
    );
  }

  const title = mm && module?.titleMm ? module.titleMm : (module?.titleEn ?? listed?.titleEn ?? "");

  return (
    <ScrollView style={{ flex: 1, backgroundColor: color.white }} contentContainerStyle={{ paddingBottom: 40 }}>
      {banner ? <Banner text={banner} /> : null}
      <View style={{ padding: 16 }}>
        <Link href="/learn" asChild>
          <Pressable style={{ minHeight: tap, justifyContent: "center" }}>
            <Text style={{ color: color.tealDark, fontWeight: "600" }}>{copy.nav.academy}</Text>
          </Pressable>
        </Link>
        <Text style={{ color: color.teal, fontSize: 12, fontWeight: "600", marginTop: 8 }}>
          {(module?.category ?? listed?.category ?? "").toUpperCase()}
        </Text>
        <Text
          style={
            mm
              ? {
                  color: "#001F3F",
                  fontSize: 24,
                  fontFamily: font.myanmarBold,
                  lineHeight: Math.round(24 * MM_LH),
                  marginTop: 4,
                }
              : { color: "#001F3F", fontSize: 24, fontWeight: "800", marginTop: 4 }
          }
        >
          {title}
        </Text>
        {!module && listed && detail.isLoading ? (
          <View style={{ marginTop: 24, alignItems: "flex-start", gap: 8 }}>
            <ActivityIndicator color={color.teal} />
            <Text style={{ color: color.muted }}>{copy.errors.connecting}</Text>
          </View>
        ) : null}
        {!module && listed && detail.isError ? (
          <View style={{ marginTop: 24 }}>
            <Text style={{ color: color.muted }}>{copy.academy.bodyOffline}</Text>
            <Pressable
              onPress={() => void detail.refetch()}
              accessibilityRole="button"
              style={{
                minHeight: tap,
                marginTop: 12,
                paddingHorizontal: 16,
                borderRadius: 8,
                justifyContent: "center",
                backgroundColor: color.navy,
                alignSelf: "flex-start",
              }}
            >
              <Text style={{ color: color.white, fontWeight: "600" }}>{copy.errors.retry}</Text>
            </Pressable>
          </View>
        ) : null}
        {canToggle ? (
          <View style={{ flexDirection: "row", gap: 8, marginTop: 16 }}>
            <Pressable
              onPress={() => setMm(false)}
              style={{
                height: 44,
                paddingHorizontal: 16,
                borderRadius: 999,
                justifyContent: "center",
                backgroundColor: !mm ? color.navy : color.white,
                borderWidth: 1,
                borderColor: "rgba(0,31,63,0.1)",
              }}
            >
              <Text style={{ color: !mm ? color.white : color.navy, fontWeight: "600" }}>{copy.academy.languageEn}</Text>
            </Pressable>
            <Pressable
              onPress={() => setMm(true)}
              style={{
                height: 44,
                paddingHorizontal: 16,
                borderRadius: 999,
                justifyContent: "center",
                backgroundColor: mm ? color.navy : color.white,
                borderWidth: 1,
                borderColor: "rgba(0,31,63,0.1)",
              }}
            >
              <Text style={{ color: mm ? color.white : color.navy, fontWeight: "600" }}>{copy.academy.languageMm}</Text>
            </Pressable>
          </View>
        ) : null}
        {blocks.map((block, i) => (
          <View key={`${block.type}-${i}`} style={{ marginTop: 20 }}>
            {block.title ? (
              <Text
                style={
                  mm
                    ? {
                        color: "#001F3F",
                        fontSize: 16,
                        fontFamily: font.myanmarBold,
                        lineHeight: Math.round(16 * MM_LH),
                      }
                    : { color: "#001F3F", fontWeight: "700", fontSize: 16 }
                }
              >
                {block.title}
              </Text>
            ) : null}
            {block.content ? (
              <Text
                style={
                  mm
                    ? {
                        color: "#001F3F",
                        marginTop: 8,
                        fontSize: 16,
                        fontFamily: font.myanmar,
                        lineHeight: Math.round(16 * MM_LH),
                      }
                    : { color: "#001F3F", marginTop: 8, lineHeight: 22 }
                }
              >
                {block.content}
              </Text>
            ) : null}
          </View>
        ))}
        {quiz.length ? (
          <View style={{ marginTop: 28, borderTopWidth: 1, borderTopColor: "rgba(0,31,63,0.1)", paddingTop: 20 }}>
            <Text style={{ color: color.navy, fontWeight: "700" }}>{copy.academy.questions}</Text>
            {quiz.map((item, i) => (
              <View key={i} style={{ marginTop: 12 }}>
                <Text style={{ color: color.navy, fontWeight: "600" }}>{item.question}</Text>
                {item.options.map((opt) => (
                  <Text key={opt} style={{ color: color.muted, marginTop: 4 }}>
                    {opt}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}
