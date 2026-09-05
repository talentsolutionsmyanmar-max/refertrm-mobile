import { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import { filterModules, uniqueCategories } from "../../src/api/filter";
import { loadAcademy } from "../../src/api/load";
import { Banner, Chip, RetryState } from "../../src/components/ui";
import { errorMessage } from "../../src/copy/error";
import { copy } from "../../src/copy/en";
import { useOnline } from "../../src/hooks/useOnline";
import { color, tap } from "../../src/theme";

export default function AcademyScreen() {
  const online = useOnline();
  const query = useQuery({ queryKey: ["academy"], queryFn: ({ signal }) => loadAcademy(signal) });
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [mmOnly, setMmOnly] = useState(false);
  const modules = query.data?.modules ?? [];
  const categories = useMemo(() => uniqueCategories(modules), [modules]);
  const mmReadyCount = useMemo(() => modules.filter((item) => item.mmReady).length, [modules]);
  const visible = useMemo(
    () => filterModules(modules, search, category, mmOnly),
    [modules, search, category, mmOnly],
  );
  const stale = Boolean(query.data?.fromCache) || !online;

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      {stale && modules.length > 0 ? (
        <Banner text={online ? copy.offline.stale : copy.offline.banner} />
      ) : null}
      <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
        <Text style={{ color: color.muted, marginBottom: 8 }}>{copy.academy.count(modules.length)}</Text>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={copy.academy.search}
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
        {mmReadyCount > 0 ? (
          <View style={{ marginTop: 12, flexDirection: "row" }}>
            <Chip active={mmOnly} label={copy.academy.myanmarAvailable} onPress={() => setMmOnly((value) => !value)} />
          </View>
        ) : null}
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
          label={copy.academy.allTopics}
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
      ) : modules.length === 0 && query.isLoading ? (
        <View style={{ padding: 24, alignItems: "center", gap: 8 }}>
          <ActivityIndicator color="#0D9488" />
          <Text style={{ color: color.muted }}>{copy.errors.connecting}</Text>
        </View>
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={visible}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingTop: 4, gap: 12, paddingBottom: 32 }}
          ListEmptyComponent={
            <Text style={{ color: color.muted, paddingVertical: 16 }}>
              {modules.length === 0 ? copy.academy.emptyOffline : copy.academy.empty}
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
                {item.mmReady ? (
                  <Text style={{ color: color.tealDark, marginTop: 8, fontSize: 12 }}>
                    {copy.academy.myanmarAvailable}
                  </Text>
                ) : null}
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
