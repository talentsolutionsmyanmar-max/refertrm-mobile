import { useMemo, useState } from "react";
import { FlatList, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import { filterModules, uniqueCategories } from "../../src/api/filter";
import { loadAcademy } from "../../src/api/load";
import { Banner, Chip, Loading, RetryState } from "../../src/components/ui";
import { copy, errorMessage } from "../../src/copy/en";
import { copyMm } from "../../src/copy/mm";
import { useOnline } from "../../src/hooks/useOnline";
import { color, tap } from "../../src/theme";

export default function AcademyScreen() {
  const online = useOnline();
  const query = useQuery({ queryKey: ["academy"], queryFn: ({ signal }) => loadAcademy(signal) });
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const modules = query.data?.modules ?? [];
  const categories = useMemo(() => uniqueCategories(modules), [modules]);
  const visible = useMemo(
    () => filterModules(modules, search, category, false),
    [modules, search, category],
  );
  const stale = Boolean(query.data?.fromCache) || !online;

  if (query.isLoading && modules.length === 0) return <Loading />;

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      {stale && modules.length > 0 ? (
        <Banner text={online ? copy.offline.stale : copy.offline.banner} />
      ) : null}
      <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
        <Text style={{ color: color.muted, marginBottom: 8 }}>{copyMm.academy.count(modules.length)}</Text>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={copyMm.academy.search}
          placeholderTextColor="#94A3B8"
          autoCorrect={false}
          autoCapitalize="none"
          style={{
            minHeight: tap,
            borderWidth: 1,
            borderColor: color.line,
            borderRadius: 8,
            paddingHorizontal: 12,
            color: color.navy,
          }}
        />
      </View>
      <ScrollView
        horizontal
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8, gap: 8, alignItems: "center" }}
      >
        <Chip
          active={category === "all"}
          label={copyMm.academy.allTopics}
          onPress={() => setCategory("all")}
        />
        {categories.map((cat) => (
          <Chip
            key={cat}
            active={category === cat}
            label={cat}
            onPress={() => setCategory(cat)}
          />
        ))}
      </ScrollView>
      {modules.length === 0 && query.isError ? (
        <RetryState message={errorMessage(query.error)} onRetry={() => void query.refetch()} />
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={visible}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingTop: 4, gap: 12, paddingBottom: 32 }}
          ListEmptyComponent={
            <Text style={{ color: color.muted, paddingVertical: 16 }}>
              {copyMm.academy.empty}
            </Text>
          }
          renderItem={({ item }) => (
            <Link href={`/learn/${item.slug}`} asChild>
              <Pressable
                accessibilityRole="button"
                style={{
                  borderWidth: 1,
                  borderColor: color.line,
                  borderRadius: 8,
                  padding: 16,
                  minHeight: tap,
                }}
              >
                <Text style={{ color: color.navy, fontWeight: "700", fontSize: 16 }}>{item.titleEn}</Text>
                <Text style={{ color: color.muted, marginTop: 4 }}>{item.category}</Text>
                <Text style={{ color: color.muted, marginTop: 8, fontSize: 12 }}>
                  {item.durationMinutes ? copy.academy.minutes(item.durationMinutes) : null}
                  {item.durationMinutes && item.xpReward ? " · " : null}
                  {item.xpReward ? copy.academy.xp(item.xpReward) : null}
                </Text>
              </Pressable>
            </Link>
          )}
          onRefresh={() => void query.refetch()}
          refreshing={query.isRefetching}
        />
      )}
    </View>
  );
}
