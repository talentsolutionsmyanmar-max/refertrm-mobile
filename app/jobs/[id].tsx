import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { Link, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { fetchJobs } from "../../src/api/client";
import { jobTypeLabel } from "../../src/api/project";
import { copy } from "../../src/copy/en";

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useQuery({ queryKey: ["jobs"], queryFn: fetchJobs });
  const job = query.data?.jobs.find((j) => j.id === id || j.slug === id);

  if (query.isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#001F3F", justifyContent: "center" }}>
        <ActivityIndicator color="#D4AF37" />
      </View>
    );
  }

  if (!job) {
    return (
      <View style={{ flex: 1, backgroundColor: "#FFFFFF", padding: 16 }}>
        <Text style={{ color: "#64748B" }}>{copy.errors.notFound}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#FFFFFF" }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <Link href="/" asChild>
        <Pressable style={{ minHeight: 44, justifyContent: "center" }}>
          <Text style={{ color: "#0F766E", fontWeight: "600" }}>{copy.nav.jobs}</Text>
        </Pressable>
      </Link>
      <Text style={{ color: "#001F3F", fontSize: 24, fontWeight: "800", marginTop: 8 }}>{job.title}</Text>
      <Text style={{ color: "#64748B", marginTop: 8 }}>{job.company?.name}</Text>
      <Text style={{ color: "#64748B", marginTop: 8 }}>
        {job.location || copy.jobs.locationUnknown}
        {" · "}
        {job.salaryDisplay || copy.jobs.salaryHidden}
        {jobTypeLabel(job.type) ? ` · ${jobTypeLabel(job.type)}` : ""}
      </Text>
      {job.description ? (
        <Text style={{ color: "#001F3F", marginTop: 24, lineHeight: 22 }}>{job.description}</Text>
      ) : (
        <Text style={{ color: "#64748B", marginTop: 24 }}>{copy.jobs.descriptionOffline}</Text>
      )}
      {job.requirements ? (
        <View style={{ marginTop: 24 }}>
          <Text style={{ color: "#001F3F", fontWeight: "700" }}>{copy.jobs.requirements}</Text>
          <Text style={{ color: "#001F3F", marginTop: 8, lineHeight: 22 }}>{job.requirements}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}
