import { useMemo, useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import { filterModules, uniqueCategories } from "../../src/api/filter";
import { loadAcademy } from "../../src/api/load";
import { Banner, Chip, Loading, RetryState } from "../../src/components/ui";
import { copyMm } from "../../src/copy/mm";
import { useOnline } from "../../src/hooks/useOnline";
import { color, tap } from "../../src/theme";

export default function AcademyScreen() {
  const online = useOnline();
  const query = useQuery({ queryKey: ["academy"], queryFn: loadAcademy });
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

  if (query.isLoading && modules.length === 0) return <Loading label={copyMm.errors.loading} />;

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      {stale && modules.length > 0 ? (
        <Banner text={online ? copyMm.offline.stale : copyMm.offline.banner} />
      ) : null}
      <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
        <Text style={{ color: color.muted, marginBottom: 8, lineHeight: 24 }}>
          {copyMm.academy.count(modules.length)}
        </Text>
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
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
          <Chip
            active={category === "all" && !mmOnly}
            label={copyMm.academy.allTopics}
            onPress={() => {
              setCategory("all");
              setMmOnly(false);
            }}
          />
          {mmReadyCount > 0 ? (
            <Chip
              active={mmOnly}
              label={copyMm.academy.myanmarAvailable}
              onPress={() => setMmOnly((value) => !value)}
            />
          ) : null}
          {categories.map((cat) => (
            <Chip
              key={cat}
              active={category === cat}
              label={cat}
              onPress={() => {
                setCategory(cat);
                setMmOnly(false);
              }}
            />
          ))}
        </View>
      </View>
      {modules.length === 0 && query.isError ? (
        <RetryState
          message={copyMm.errors.network}
          retryLabel={copyMm.errors.retry}
          onRetry={() => void query.refetch()}
        />
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}
          ListEmptyComponent={
            <Text style={{ color: color.muted, paddingVertical: 16, lineHeight: 28 }}>
              {modules.length === 0 ? copyMm.academy.emptyOffline : copyMm.academy.empty}
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
                <Text style={{ color: color.muted, marginTop: 8, fontSize: 12, lineHeight: 22 }}>
                  {item.durationMinutes ? copyMm.academy.minutes(item.durationMinutes) : null}
                  {item.durationMinutes && item.xpReward ? " · " : null}
                  {item.xpReward ? copyMm.academy.xp(item.xpReward) : null}
                </Text>
                {item.mmReady ? (
                  <Text style={{ color: color.tealDark, marginTop: 8, fontSize: 12, lineHeight: 22 }}>
                    {copyMm.academy.myanmarAvailable}
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
