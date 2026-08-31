import { useEffect, useMemo, useState } from "react";
import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { Link, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { catalog } from "../../src/cache/catalog";
import { safeHttpsUrl } from "../../src/api/https";
import { parseLessonBlocks, parseQuiz, showMmToggle } from "../../src/api/lesson";
import { loadAcademy, loadModule } from "../../src/api/load";
import { Banner, Chip, Loading, RetryState } from "../../src/components/ui";
import { copyMm } from "../../src/copy/mm";
import { color, tap } from "../../src/theme";

export default function LessonScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const routeSlug = Array.isArray(slug) ? slug[0] : slug;
  const catalogue = useQuery({ queryKey: ["academy"], queryFn: loadAcademy });
  const listed =
    catalogue.data?.modules.find((item) => item.slug === routeSlug || item.id === routeSlug) ??
    (routeSlug ? catalog.findModule(routeSlug) : undefined);
  const detail = useQuery({
    queryKey: ["academy-module", listed?.id],
    queryFn: () => loadModule(listed!.id),
    enabled: Boolean(listed?.id),
  });
  const cachedBody = listed ? catalog.findModuleBody(listed.id) : routeSlug ? catalog.findModuleBody(routeSlug) : undefined;
  const module = detail.data ?? cachedBody;
  const [mm, setMm] = useState(false);
  const canToggle = module ? showMmToggle(Boolean(listed?.mmReady ?? module.mmReady), module) : false;

  useEffect(() => {
    if (!canToggle) setMm(false);
  }, [canToggle]);

  const blocks = useMemo(
    () => (module ? parseLessonBlocks(mm ? module.contentMm : module.content) : []),
    [module, mm],
  );
  const quiz = useMemo(() => {
    if (!module) return [];
    if (mm) return parseQuiz(module.quizQuestionsMm);
    return parseQuiz(module.quizQuestions);
  }, [module, mm]);
  const further = module ? safeHttpsUrl(module.furtherReadingUrl) : null;

  if ((catalogue.isLoading && !listed) || (listed && detail.isLoading && !module)) {
    return <Loading label={copyMm.errors.loading} />;
  }

  if (!listed && !module) {
    if (catalogue.isError) {
      return (
        <View style={{ flex: 1, backgroundColor: color.bg, padding: 16 }}>
          <RetryState
            message={copyMm.errors.network}
            retryLabel={copyMm.errors.retry}
            onRetry={() => void catalogue.refetch()}
          />
        </View>
      );
    }
    return (
      <View style={{ flex: 1, backgroundColor: color.bg, padding: 16 }}>
        <Text style={{ color: color.muted, lineHeight: 24 }}>{copyMm.errors.notFound}</Text>
        <Link href="/academy" asChild>
          <Pressable style={{ minHeight: tap, justifyContent: "center" }}>
            <Text style={{ color: color.tealDark, fontWeight: "600" }}>{copyMm.nav.academy}</Text>
          </Pressable>
        </Link>
      </View>
    );
  }

  if (listed && !module && detail.isError) {
    return (
      <View style={{ flex: 1, backgroundColor: color.bg, padding: 16 }}>
        <Text style={{ color: color.muted, lineHeight: 28 }}>{copyMm.academy.bodyOffline}</Text>
        <RetryState
          message={copyMm.errors.network}
          retryLabel={copyMm.errors.retry}
          onRetry={() => void detail.refetch()}
        />
      </View>
    );
  }

  const title = mm && module?.titleMm ? module.titleMm : (module?.titleEn ?? listed?.titleEn ?? "");
  const lineHeight = mm ? 34 : 24;
  const stale = Boolean(catalogue.data?.fromCache) && !detail.data;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: color.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
    >
      {stale ? <Banner text={copyMm.offline.stale} /> : null}
      <Link href="/academy" asChild>
        <Pressable style={{ minHeight: tap, justifyContent: "center" }}>
          <Text style={{ color: color.tealDark, fontWeight: "600" }}>{copyMm.nav.academy}</Text>
        </Pressable>
      </Link>
      <Text style={{ color: color.teal, fontSize: 12, fontWeight: "600", marginTop: 8 }}>
        {(module?.category ?? listed?.category ?? "").toUpperCase()}
      </Text>
      <Text
        style={{
          color: color.navy,
          fontSize: 24,
          fontWeight: "800",
          marginTop: 4,
          lineHeight: mm ? 43 : 30,
        }}
      >
        {title}
      </Text>
      <Text style={{ color: color.muted, marginTop: 8, lineHeight: 22 }}>
        {listed?.durationMinutes ? copyMm.academy.minutes(listed.durationMinutes) : null}
        {listed?.durationMinutes && listed?.xpReward ? " · " : null}
        {listed?.xpReward ? copyMm.academy.xp(listed.xpReward) : null}
      </Text>
      {canToggle ? (
        <View style={{ flexDirection: "row", gap: 8, marginTop: 16 }}>
          <Chip active={!mm} label={copyMm.academy.languageEn} onPress={() => setMm(false)} />
          <Chip active={mm} label={copyMm.academy.languageMm} onPress={() => setMm(true)} />
        </View>
      ) : listed?.mmReady && module && !canToggle ? (
        <Text style={{ color: color.muted, marginTop: 12, lineHeight: 29 }}>{copyMm.academy.mmHidden}</Text>
      ) : null}

      {blocks.map((block, index) => (
        <View key={`${block.type}-${index}`} style={{ marginTop: 20 }}>
          {block.title ? (
            <Text style={{ color: color.navy, fontWeight: "700", fontSize: 16, lineHeight }}>{block.title}</Text>
          ) : null}
          {block.content ? (
            <Text style={{ color: color.navy, marginTop: 8, lineHeight, fontSize: 16 }}>{block.content}</Text>
          ) : null}
        </View>
      ))}

      {quiz.length ? (
        <View style={{ marginTop: 28, borderTopWidth: 1, borderTopColor: color.line, paddingTop: 20 }}>
          <Text style={{ color: color.navy, fontWeight: "700", lineHeight: mm ? 29 : 24 }}>
            {copyMm.academy.questions}
          </Text>
          {quiz.map((item, index) => (
            <View key={index} style={{ marginTop: 12 }}>
              <Text style={{ color: color.navy, fontWeight: "600", lineHeight }}>{item.question}</Text>
              {item.options.map((opt) => (
                <Text key={opt} style={{ color: color.muted, marginTop: 4, lineHeight }}>
                  {opt}
                </Text>
              ))}
            </View>
          ))}
        </View>
      ) : null}

      {further ? (
        <Pressable
          onPress={() => void Linking.openURL(further)}
          accessibilityRole="link"
          style={{ minHeight: tap, marginTop: 24, justifyContent: "center" }}
        >
          <Text style={{ color: color.tealDark, fontWeight: "600", lineHeight: 24 }}>
            {module?.furtherReadingLabel || copyMm.academy.furtherReading}
          </Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}
