import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { Link, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { fetchAcademy, fetchModule } from "../../src/api/client";
import { parseLessonBlocks, parseQuiz, showMmToggle } from "../../src/api/lesson";
import { copy } from "../../src/copy/en";

export default function LessonScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const catalogue = useQuery({ queryKey: ["academy"], queryFn: fetchAcademy });
  const listed = catalogue.data?.modules.find((m) => m.slug === slug || m.id === slug);
  const detail = useQuery({
    queryKey: ["academy-module", listed?.id],
    queryFn: () => fetchModule(listed!.id),
    enabled: Boolean(listed?.id),
  });
  const module = detail.data?.module;
  const [mm, setMm] = useState(false);
  const canToggle = module ? showMmToggle(Boolean(listed?.mmReady ?? module.mmReady), module) : false;
  const blocks = useMemo(
    () => (module ? parseLessonBlocks(mm ? module.contentMm : module.content) : []),
    [module, mm],
  );
  const quiz = module && !mm ? parseQuiz(module.quizQuestions) : [];

  if (catalogue.isLoading || (listed && detail.isLoading)) {
    return (
      <View style={{ flex: 1, backgroundColor: "#001F3F", justifyContent: "center" }}>
        <ActivityIndicator color="#D4AF37" />
      </View>
    );
  }

  if (!listed && !module) {
    return (
      <View style={{ flex: 1, backgroundColor: "#FFFFFF", padding: 16 }}>
        <Text style={{ color: "#64748B" }}>{copy.errors.notFound}</Text>
      </View>
    );
  }

  const title = mm && module?.titleMm ? module.titleMm : (module?.titleEn ?? listed?.titleEn ?? "");

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#FFFFFF" }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <Link href="/academy" asChild>
        <Pressable style={{ minHeight: 44, justifyContent: "center" }}>
          <Text style={{ color: "#0F766E", fontWeight: "600" }}>{copy.nav.academy}</Text>
        </Pressable>
      </Link>
      <Text style={{ color: "#0D9488", fontSize: 12, fontWeight: "600", marginTop: 8 }}>
        {(module?.category ?? listed?.category ?? "").toUpperCase()}
      </Text>
      <Text style={{ color: "#001F3F", fontSize: 24, fontWeight: "800", marginTop: 4 }}>{title}</Text>
      {canToggle ? (
        <View style={{ flexDirection: "row", gap: 8, marginTop: 16 }}>
          <Pressable
            onPress={() => setMm(false)}
            style={{
              height: 44,
              paddingHorizontal: 16,
              borderRadius: 999,
              justifyContent: "center",
              backgroundColor: !mm ? "#001F3F" : "#FFFFFF",
              borderWidth: 1,
              borderColor: "rgba(0,31,63,0.1)",
            }}
          >
            <Text style={{ color: !mm ? "#FFFFFF" : "#001F3F", fontWeight: "600" }}>{copy.academy.languageEn}</Text>
          </Pressable>
          <Pressable
            onPress={() => setMm(true)}
            style={{
              height: 44,
              paddingHorizontal: 16,
              borderRadius: 999,
              justifyContent: "center",
              backgroundColor: mm ? "#001F3F" : "#FFFFFF",
              borderWidth: 1,
              borderColor: "rgba(0,31,63,0.1)",
            }}
          >
            <Text style={{ color: mm ? "#FFFFFF" : "#001F3F", fontWeight: "600" }}>{copy.academy.languageMm}</Text>
          </Pressable>
        </View>
      ) : null}
      {blocks.map((block, i) => (
        <View key={`${block.type}-${i}`} style={{ marginTop: 20 }}>
          {block.title ? (
            <Text style={{ color: "#001F3F", fontWeight: "700", fontSize: 16 }}>{block.title}</Text>
          ) : null}
          {block.content ? (
            <Text style={{ color: "#001F3F", marginTop: 8, lineHeight: 22 }}>{block.content}</Text>
          ) : null}
        </View>
      ))}
      {quiz.length ? (
        <View style={{ marginTop: 28, borderTopWidth: 1, borderTopColor: "rgba(0,31,63,0.1)", paddingTop: 20 }}>
          <Text style={{ color: "#001F3F", fontWeight: "700" }}>{copy.academy.questions}</Text>
          {quiz.map((item, i) => (
            <View key={i} style={{ marginTop: 12 }}>
              <Text style={{ color: "#001F3F", fontWeight: "600" }}>{item.question}</Text>
              {item.options.map((opt) => (
                <Text key={opt} style={{ color: "#64748B", marginTop: 4 }}>
                  {opt}
                </Text>
              ))}
            </View>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}
