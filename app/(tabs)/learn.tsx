import { useMemo, useState } from "react";
import { FlatList, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import { filterModules, uniqueCategories } from "../../src/api/filter";
import { loadAcademy } from "../../src/api/load";
import { Banner, Chip, RetryState, Skeleton } from "../../src/components/ui";
import { errorMessage } from "../../src/copy/error";
import { copy } from "../../src/copy/en";
import { useOnline } from "../../src/hooks/useOnline";
import { color, tap } from "../../src/theme";
import { useTheme } from "../../src/theme/ThemeProvider";

export default function AcademyScreen() {
  const t = useTheme();
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
    <View style={{ flex: 1, backgroundColor: t.colors.bg0 }}>
      {stale && modules.length > 0 ? (
        <Banner text={online ? copy.offline.stale : copy.offline.banner} />
      ) : null}
      <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
        <Text style={{ color: t.colors.mut, marginBottom: 8 }}>{copy.academy.count(modules.length)}</Text>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={copy.academy.search}
          placeholderTextColor={t.colors.dim}
          autoCorrect={false}
          autoCapitalize="none"
          style={{
            minHeight: tap,
            borderWidth: 1,
            borderColor: t.colors.line,
            borderRadius: 8,
            paddingHorizontal: 12,
            color: t.colors.ink,
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
        <View style={{ padding: 24, gap: 8 }}>
          <Skeleton width="40%" height={12} />
          <Skeleton width="85%" height={16} />
          <Skeleton width="65%" height={16} />
          <Text style={{ color: t.colors.mut }}>{copy.errors.connecting}</Text>
        </View>
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={visible}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingTop: 4, gap: 12, paddingBottom: 32 }}
          ListEmptyComponent={
            <Text style={{ color: t.colors.mut, paddingVertical: 16 }}>
              {modules.length === 0 ? copy.academy.emptyOffline : copy.academy.empty}
            </Text>
          }
          renderItem={({ item }) => (
            <Link href={`/learn/${item.slug}`} asChild>
              {/* G1 — box on the inner View; the asChild Pressable carries press feedback only. */}
              <Pressable
                accessibilityRole="button"
                style={({ pressed }) => ({ minHeight: tap, opacity: pressed ? 0.9 : 1 })}
              >
                <View
                  style={{
                    borderWidth: 1,
                    borderColor: t.colors.line,
                    borderRadius: 8,
                    padding: 16,
                    backgroundColor: t.colors.ink,
                  }}
                >
                <Text style={{ color: t.colors.ink, fontWeight: "700", fontSize: 16 }}>{item.titleEn}</Text>
                <Text style={{ color: t.colors.mut, marginTop: 4 }}>{item.category}</Text>
                <Text style={{ color: t.colors.mut, marginTop: 8, fontSize: 12 }}>
                  {item.durationMinutes ? copy.academy.minutes(item.durationMinutes) : null}
                  {item.durationMinutes && item.xpReward ? " · " : null}
                  {item.xpReward ? copy.academy.xp(item.xpReward) : null}
                </Text>
                {item.mmReady ? (
                  <Text style={{ color: t.accents.teal, marginTop: 8, fontSize: 12 }}>
                    {copy.academy.myanmarAvailable}
                  </Text>
                ) : null}
                </View>
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
