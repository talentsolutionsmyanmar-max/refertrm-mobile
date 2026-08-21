import { useMemo, useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import { filterJobs, type JobPlace } from "../../src/api/filter";
import { loadJobs } from "../../src/api/load";
import { jobTypeLabel } from "../../src/api/project";
import { Banner, Chip, Loading, RetryState } from "../../src/components/ui";
import { copy } from "../../src/copy/en";
import { useOnline } from "../../src/hooks/useOnline";
import { color, tap } from "../../src/theme";

const PLACES: { id: JobPlace; label: string }[] = [
  { id: "all", label: copy.jobs.filterAll },
  { id: "yangon", label: copy.jobs.yangon },
  { id: "mandalay", label: copy.jobs.mandalay },
  { id: "remote", label: copy.jobs.remote },
  { id: "urgent", label: copy.jobs.urgent },
];

export default function JobsScreen() {
  const online = useOnline();
  const query = useQuery({ queryKey: ["jobs"], queryFn: ({ signal }) => loadJobs(signal) });
  const [search, setSearch] = useState("");
  const [place, setPlace] = useState<JobPlace>("all");
  const jobs = query.data?.jobs ?? [];
  const visible = useMemo(() => filterJobs(jobs, search, place), [jobs, search, place]);
  const stale = Boolean(query.data?.fromCache) || !online;

  if (query.isLoading && jobs.length === 0) return <Loading />;

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      {stale && jobs.length > 0 ? <Banner text={online ? copy.offline.stale : copy.offline.banner} /> : null}
      <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
        <Text style={{ color: color.muted, marginBottom: 8 }}>{copy.jobs.count(jobs.length)}</Text>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={copy.jobs.search}
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
          {PLACES.map((item) => (
            <Chip key={item.id} active={place === item.id} label={item.label} onPress={() => setPlace(item.id)} />
          ))}
        </View>
      </View>
      {jobs.length === 0 && query.isError ? (
        <RetryState message={copy.errors.network} onRetry={() => void query.refetch()} />
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}
          ListEmptyComponent={
            <Text style={{ color: color.muted, paddingVertical: 16 }}>
              {jobs.length === 0 ? copy.jobs.emptyOffline : copy.jobs.empty}
            </Text>
          }
          renderItem={({ item }) => (
            <Link href={`/jobs/${item.id}`} asChild>
              <Pressable
                accessibilityRole="button"
                style={{
                  borderWidth: 1,
                  borderColor: color.line,
                  borderRadius: 8,
                  padding: 16,
                  backgroundColor: color.white,
                  minHeight: tap,
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
                  <Text style={{ color: color.navy, fontWeight: "700", fontSize: 16, flex: 1 }}>{item.title}</Text>
                  {item.urgent ? (
                    <Text style={{ color: color.navy, fontSize: 12, fontWeight: "700" }}>{copy.jobs.urgent}</Text>
                  ) : null}
                </View>
                <Text style={{ color: color.muted, marginTop: 4 }}>{item.company?.name}</Text>
                <Text style={{ color: color.muted, marginTop: 8, fontSize: 12 }}>
                  {item.location || copy.jobs.locationUnknown}
                  {" · "}
                  {item.salaryDisplay || copy.jobs.salaryHidden}
                  {jobTypeLabel(item.type) ? ` · ${jobTypeLabel(item.type)}` : ""}
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
