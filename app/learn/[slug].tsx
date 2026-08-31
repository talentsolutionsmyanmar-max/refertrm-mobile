import { useEffect, useMemo, useState } from "react";
import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { Link, Stack, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { catalog } from "../../src/cache/catalog";
import { safeHttpsUrl } from "../../src/api/https";
import {
  parseLessonBlocks,
  parseQuiz,
  parseStringList,
  parseVocabulary,
  showMmToggle,
} from "../../src/api/lesson";
import { loadAcademy, loadModule } from "../../src/api/load";
import { Banner, Card, CardText, Chip, Loading, RetryState } from "../../src/components/ui";
import { QuizRunner } from "../../src/components/QuizRunner";
import { copy, errorMessage } from "../../src/copy/en";
import { copyMm } from "../../src/copy/mm";
import { isLikelyModuleId, parseRouteSegment } from "../../src/linking/ids";
import { color, tap } from "../../src/theme";

export default function LessonScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const insets = useSafeAreaInsets();
  const rawSlug = Array.isArray(slug) ? slug[0] : slug;
  const routeSlug = parseRouteSegment(rawSlug);
  const catalogue = useQuery({
    queryKey: ["academy"],
    queryFn: ({ signal }) => loadAcademy(signal),
    enabled: Boolean(routeSlug),
  });
  const listed = routeSlug
    ? catalogue.data?.modules.find((item) => item.slug === routeSlug || item.id === routeSlug) ??
      catalog.findModule(routeSlug)
    : undefined;
  const moduleId = listed?.id ?? (routeSlug && isLikelyModuleId(routeSlug) ? routeSlug : undefined);
  const detail = useQuery({
    queryKey: ["academy-module", moduleId],
    queryFn: ({ signal }) => loadModule(moduleId!, signal),
    enabled: Boolean(moduleId),
  });
  const cachedBody = moduleId
    ? catalog.findModuleBody(moduleId)
    : routeSlug
      ? catalog.findModuleBody(routeSlug)
      : undefined;
  const module = detail.data ?? cachedBody;

  const [mm, setMm] = useState(false);
  const canToggle = module ? showMmToggle(listed?.mmReady, module) : false;

  useEffect(() => {
    if (!canToggle) {
      setMm(false);
    }
  }, [canToggle]);

  const blocks = useMemo(
    () => (module ? parseLessonBlocks(mm ? module.contentMm : module.content) : []),
    [module, mm],
  );
  const quiz = useMemo(() => {
    if (!module) return [];
    return parseQuiz(module.quizQuestions);
  }, [module]);
  const objectives = useMemo(() => (module ? parseStringList(module.learningObjectives) : []), [module]);
  const actionSteps = useMemo(
    () => (module ? parseStringList(mm ? module.actionStepsMm : module.actionSteps) : []),
    [module, mm],
  );
  const vocabulary = useMemo(() => (module ? parseVocabulary(module.vocabularyMm) : []), [module]);
  const further = module ? safeHttpsUrl(module.furtherReadingUrl) : null;

  const backFallback = (
    <View style={{ flex: 1, backgroundColor: color.bg, padding: 16 }}>
      <Stack.Screen options={{ title: copy.nav.academy, headerBackTitle: copy.nav.academy }} />
      <Text style={{ color: color.muted, fontSize: 16, lineHeight: 24 }}>{copyMm.errors.notFound}</Text>
      <Link href="/learn" asChild>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.nav.academy}
          style={({ pressed }) => ({ minHeight: tap, justifyContent: "center", opacity: pressed ? 0.7 : 1 })}
        >
          <Text style={{ color: color.tealDark, fontWeight: "600", fontSize: 16 }}>{copy.nav.academy}</Text>
        </Pressable>
      </Link>
    </View>
  );

  if (!routeSlug) return backFallback;

  if ((catalogue.isLoading && !listed && !module) || (moduleId && detail.isLoading && !module)) {
    return (
      <>
        <Stack.Screen options={{ title: copy.nav.academy, headerBackTitle: copy.nav.academy }} />
        <Loading />
      </>
    );
  }

  if (!listed && !module) {
    if (catalogue.isError) {
      return (
        <View style={{ flex: 1, backgroundColor: color.bg, padding: 16 }}>
          <Stack.Screen options={{ title: copy.nav.academy, headerBackTitle: copy.nav.academy }} />
          <RetryState message={errorMessage(catalogue.error)} onRetry={() => void catalogue.refetch()} />
        </View>
      );
    }
    return backFallback;
  }

  if (moduleId && !module && detail.isError) {
    return (
      <View style={{ flex: 1, backgroundColor: color.bg, padding: 16 }}>
        <Stack.Screen options={{ title: copy.nav.academy, headerBackTitle: copy.nav.academy }} />
        <Text style={{ color: color.muted, fontSize: 16, lineHeight: 24 }}>{copy.academy.bodyOffline}</Text>
        <RetryState message={errorMessage(detail.error)} onRetry={() => void detail.refetch()} />
      </View>
    );
  }

  const title = mm && module?.titleMm ? module.titleMm : (module?.titleEn ?? listed?.titleEn ?? "");
  const lineHeight = mm ? 32 : 26;
  const stale = Boolean(catalogue.data?.fromCache) && !detail.data;
  const category = (module?.category ?? listed?.category ?? "").toUpperCase();

  // Supporting fields: MM variants ride with the MM body; EN variants render
  // only when the detail payload carries them (never fabricated).
  const keyTakeaway = mm ? (module?.keyTakeawayMm ?? null) : (module?.keyTakeaway ?? null);
  const commonMistake = mm ? (module?.commonMistakeMm ?? null) : (module?.commonMistake ?? null);
  const decisionScenario = mm
    ? (module?.decisionScenarioMm ?? null)
    : (module?.decisionScenario ?? null);

  return (
    <>
      <Stack.Screen
        options={{
          title: title || copy.nav.academy,
          headerBackTitle: copy.nav.academy,
          headerStyle: { backgroundColor: color.navy },
          headerTintColor: color.white,
          headerTitleStyle: { fontWeight: "700" },
        }}
      />
      <ScrollView
        style={{ flex: 1, backgroundColor: color.paper }}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 32 + insets.bottom,
          gap: 16,
        }}
      >
        {stale ? <Banner text={copy.offline.stale} /> : null}

        {/* Module header */}
        <View style={{ gap: 6 }}>
          {category ? (
            <Text style={{ color: color.teal, fontSize: 12, fontWeight: "700", letterSpacing: 1.6 }}>
              {category}
            </Text>
          ) : null}
          <Text
            style={{
              color: color.navy,
              fontSize: 24,
              fontWeight: "800",
              lineHeight: mm ? 38 : 31,
              fontFamily: mm ? "Padauk" : undefined,
            }}
            accessibilityRole="header"
          >
            {title}
          </Text>
          <Text style={{ color: color.muted, fontSize: 15 }}>
            {listed?.durationMinutes ? copy.academy.minutes(listed.durationMinutes) : null}
            {listed?.durationMinutes && listed?.xpReward ? " · " : null}
            {listed?.xpReward ? copy.academy.xp(listed.xpReward) : null}
            {listed?.quizCount ? ` · ${listed.quizCount} ${copy.academy.questions.toLowerCase()}` : null}
          </Text>
          {canToggle ? (
            <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
              <Chip
                active={!mm}
                label={copyMm.academy.languageEn}
                onPress={() => setMm(false)}
              />
              <Chip
                active={mm}
                label={copyMm.academy.languageMm}
                onPress={() => setMm(true)}
              />
            </View>
          ) : null}
        </View>

        {/* What you will learn */}
        {objectives.length > 0 ? (
          <Card label={copy.academy.whatYouLearn}>
            <View style={{ gap: 8 }}>
              {objectives.map((objective, index) => (
                <View key={index} style={{ flexDirection: "row", gap: 10 }}>
                  <Text style={{ color: color.tealDark, fontWeight: "700", fontSize: 16, lineHeight }}>•</Text>
                  <Text style={{ flex: 1, color: color.navy, fontSize: 16, lineHeight }}>{objective}</Text>
                </View>
              ))}
            </View>
          </Card>
        ) : null}

        {/* Key takeaway */}
        {keyTakeaway ? (
          <Card label={copy.academy.keyTakeaway} accent="gold">
            <CardText text={keyTakeaway} mm={mm} />
          </Card>
        ) : null}

        {/* Lesson cards — typed blocks, never one plain word stream */}
        {blocks.map((block, index) => (
          <Card key={`${block.type}-${index}`} label={block.title || undefined}>
            {block.content ? <CardText text={block.content} mm={mm} /> : null}
          </Card>
        ))}

        {/* Common mistake */}
        {commonMistake ? (
          <Card label={copy.academy.commonMistake}>
            <CardText text={commonMistake} mm={mm} />
          </Card>
        ) : null}

        {/* Action steps */}
        {actionSteps.length > 0 ? (
          <Card label={copy.academy.actionSteps}>
            <View style={{ gap: 8 }}>
              {actionSteps.map((step, index) => (
                <View key={index} style={{ flexDirection: "row", gap: 10 }}>
                  <Text style={{ color: color.tealDark, fontWeight: "700", fontSize: 16, lineHeight }}>
                    {index + 1}.
                  </Text>
                  <Text
                    style={{
                      flex: 1,
                      color: color.navy,
                      fontSize: 16,
                      lineHeight,
                      fontFamily: mm ? "Padauk" : undefined,
                    }}
                  >
                    {step}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        ) : null}

        {/* Decision scenario */}
        {decisionScenario ? (
          <Card label={copy.academy.decisionScenario} accent="teal">
            <CardText text={decisionScenario} mm={mm} />
          </Card>
        ) : null}

        {/* Vocabulary — the footnote glossary (platform standard) */}
        {vocabulary.length > 0 ? (
          <Card label={copy.academy.vocabulary} accent="gold">
            <View style={{ gap: 12 }}>
              {vocabulary.map((entry, index) => (
                <View key={index} style={{ gap: 2 }}>
                  <Text style={{ color: color.navy, fontWeight: "700", fontSize: 16 }}>
                    {entry.term}
                    <Text style={{ color: color.goldText, fontWeight: "600", fontFamily: "Padauk" }}>
                      {"  "}
                      {entry.meaning}
                    </Text>
                  </Text>
                  {entry.definition ? (
                    <Text style={{ color: color.muted, fontSize: 14, lineHeight: 21 }}>{entry.definition}</Text>
                  ) : null}
                </View>
              ))}
            </View>
          </Card>
        ) : null}

        {/* Practice quiz — tappable options with source-keyed feedback */}
        {quiz.length ? (
          <Card label={copyMm.academy.questions}>
            <QuizRunner items={quiz} mm={false} />
          </Card>
        ) : null}

        {/* Further reading */}
        {further ? (
          <Pressable
            onPress={() => void Linking.openURL(further)}
            accessibilityRole="link"
            accessibilityLabel={module?.furtherReadingLabel || copy.academy.furtherReading}
            style={({ pressed }) => ({
              minHeight: tap,
              justifyContent: "center",
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={{ color: color.tealDark, fontWeight: "600", fontSize: 16 }}>
              {module?.furtherReadingLabel || copy.academy.furtherReading}
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </>
  );
}
