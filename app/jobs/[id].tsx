import { useEffect } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Link, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { catalog } from "../../src/cache/catalog";
import { loadJobs } from "../../src/api/load";
import { jobTypeLabel } from "../../src/api/project";
import { Banner, Loading, RetryState } from "../../src/components/ui";
import { copy } from "../../src/copy/en";
import { color, tap } from "../../src/theme";

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const jobId = Array.isArray(id) ? id[0] : id;
  const query = useQuery({ queryKey: ["jobs"], queryFn: loadJobs });
  const job = query.data?.jobs.find((item) => item.id === jobId || item.slug === jobId);
  const cachedMeta = jobId ? catalog.findJob(jobId) : undefined;
  const cachedBody = jobId ? catalog.findJobBody(jobId) : undefined;
  const meta = job ?? cachedMeta;

  useEffect(() => {
    if (job) catalog.writeJobBody(job);
  }, [job]);

  if (query.isLoading && !meta) return <Loading />;

  if (!jobId || (!meta && query.isError && !cachedMeta)) {
    return (
      <View style={{ flex: 1, backgroundColor: color.bg, padding: 16 }}>
        <RetryState message={copy.errors.network} onRetry={() => void query.refetch()} />
      </View>
    );
  }

  if (!meta) {
    return (
      <View style={{ flex: 1, backgroundColor: color.bg, padding: 16 }}>
        <Text style={{ color: color.muted }}>{copy.errors.notFound}</Text>
        <Link href="/" asChild>
          <Pressable style={{ minHeight: tap, justifyContent: "center" }}>
            <Text style={{ color: color.tealDark, fontWeight: "600" }}>{copy.nav.jobs}</Text>
          </Pressable>
        </Link>
      </View>
    );
  }

  const description = job?.description ?? cachedBody?.description ?? null;
  const requirements = job?.requirements ?? cachedBody?.requirements ?? null;
  const stale = Boolean(query.data?.fromCache);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: color.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {stale ? <Banner text={copy.offline.stale} /> : null}
      <Link href="/" asChild>
        <Pressable style={{ minHeight: tap, justifyContent: "center" }}>
          <Text style={{ color: color.tealDark, fontWeight: "600" }}>{copy.nav.jobs}</Text>
        </Pressable>
      </Link>
      <Text style={{ color: color.navy, fontSize: 24, fontWeight: "800", marginTop: 8 }}>{meta.title}</Text>
      <Text style={{ color: color.muted, marginTop: 8 }}>{meta.company?.name}</Text>
      <Text style={{ color: color.muted, marginTop: 8 }}>
        {meta.location || copy.jobs.locationUnknown}
        {" · "}
        {meta.salaryDisplay || copy.jobs.salaryHidden}
        {jobTypeLabel(meta.type) ? ` · ${jobTypeLabel(meta.type)}` : ""}
      </Text>
      {meta.urgent ? (
        <Text style={{ color: color.navy, marginTop: 8, fontWeight: "700" }}>{copy.jobs.urgent}</Text>
      ) : null}

      {description ? (
        <Text style={{ color: color.navy, marginTop: 24, lineHeight: 24 }}>{description}</Text>
      ) : (
        <Text style={{ color: color.muted, marginTop: 24 }}>{copy.jobs.descriptionOffline}</Text>
      )}
      {requirements ? (
        <View style={{ marginTop: 24 }}>
          <Text style={{ color: color.navy, fontWeight: "700" }}>{copy.jobs.requirements}</Text>
          <Text style={{ color: color.navy, marginTop: 8, lineHeight: 24 }}>{requirements}</Text>
        </View>
      ) : null}

      <View
        style={{
          marginTop: 28,
          padding: 12,
          borderRadius: 8,
          backgroundColor: "rgba(0,31,63,0.04)",
        }}
      >
        <Text style={{ color: color.muted, lineHeight: 20 }}>{copy.jobs.applyUnavailable}</Text>
      </View>
    </ScrollView>
  );
}
