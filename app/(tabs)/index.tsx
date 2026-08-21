import { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import { fetchJobs } from "../../src/api/client";
import { filterJobs, type JobPlace } from "../../src/api/filter";
import { jobTypeLabel } from "../../src/api/project";
import { copy } from "../../src/copy/en";

const PLACES: { id: JobPlace; label: string }[] = [
  { id: "all", label: copy.jobs.filterAll },
  { id: "yangon", label: copy.jobs.yangon },
  { id: "mandalay", label: copy.jobs.mandalay },
  { id: "remote", label: copy.jobs.remote },
  { id: "urgent", label: copy.jobs.urgent },
];

export default function JobsScreen() {
  const query = useQuery({ queryKey: ["jobs"], queryFn: fetchJobs });
  const [search, setSearch] = useState("");
  const [place, setPlace] = useState<JobPlace>("all");
  const jobs = query.data?.jobs ?? [];
  const visible = useMemo(() => filterJobs(jobs, search, place), [jobs, search, place]);

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
        <Text style={{ color: "#64748B", marginBottom: 8 }}>{copy.jobs.count(jobs.length)}</Text>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={copy.jobs.search}
          placeholderTextColor="#94A3B8"
          style={{
            height: 44,
            borderWidth: 1,
            borderColor: "rgba(0,31,63,0.1)",
            borderRadius: 8,
            paddingHorizontal: 12,
            color: "#001F3F",
          }}
        />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
          {PLACES.map((p) => (
            <Pressable
              key={p.id}
              onPress={() => setPlace(p.id)}
              style={{
                height: 44,
                paddingHorizontal: 16,
                borderRadius: 999,
                justifyContent: "center",
                backgroundColor: place === p.id ? "#001F3F" : "#FFFFFF",
                borderWidth: 1,
                borderColor: "rgba(0,31,63,0.1)",
              }}
            >
              <Text style={{ color: place === p.id ? "#FFFFFF" : "#001F3F", fontWeight: "600" }}>
                {p.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      {query.isLoading ? (
        <ActivityIndicator color="#0D9488" style={{ marginTop: 32 }} />
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}
          ListEmptyComponent={
            <Text style={{ color: "#64748B", padding: 16 }}>
              {jobs.length === 0 ? copy.jobs.emptyOffline : copy.jobs.empty}
            </Text>
          }
          renderItem={({ item }) => (
            <Link href={`/jobs/${item.id}`} asChild>
              <Pressable
                style={{
                  borderWidth: 1,
                  borderColor: "rgba(0,31,63,0.1)",
                  borderRadius: 8,
                  padding: 16,
                  backgroundColor: "#FFFFFF",
                }}
              >
                <Text style={{ color: "#001F3F", fontWeight: "700", fontSize: 16 }}>{item.title}</Text>
                <Text style={{ color: "#64748B", marginTop: 4 }}>{item.company?.name}</Text>
                <Text style={{ color: "#64748B", marginTop: 8, fontSize: 12 }}>
                  {item.location || copy.jobs.locationUnknown}
                  {" · "}
                  {item.salaryDisplay || copy.jobs.salaryHidden}
                  {jobTypeLabel(item.type) ? ` · ${jobTypeLabel(item.type)}` : ""}
                </Text>
              </Pressable>
            </Link>
          )}
          onRefresh={() => query.refetch()}
          refreshing={query.isRefetching}
        />
      )}
    </View>
  );
}
