import { Pressable, ScrollView, Text, View } from "react-native";
import { Link, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { catalog } from "../../src/cache/catalog";
import { resolveJobField } from "../../src/api/jobField";
import { loadJob } from "../../src/api/load";
import { jobTypeLabel } from "../../src/api/project";
import { Banner, Loading, RetryState } from "../../src/components/ui";
import { copy, errorMessage } from "../../src/copy/en";
import { parseRouteSegment } from "../../src/linking/ids";
import { color, tap } from "../../src/theme";

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const rawId = Array.isArray(id) ? id[0] : id;
  const jobId = parseRouteSegment(rawId);
  const listed = jobId ? catalog.findJob(jobId) : undefined;
  const cachedBody = jobId ? catalog.findJobBody(jobId) : undefined;
  const query = useQuery({
    queryKey: ["job", jobId],
    queryFn: ({ signal }) => loadJob(jobId!, signal),
    enabled: Boolean(jobId),
  });
  const loaded = query.data?.job;
  const meta = loaded ?? listed;
  const description = resolveJobField({
    loaded: Boolean(loaded) && query.isSuccess,
    loadedValue: loaded?.description,
    cached: Boolean(cachedBody),
    cachedValue: cachedBody?.description,
    listed: listed?.hasDescription,
  });
  const requirements = resolveJobField({
    loaded: Boolean(loaded) && query.isSuccess,
    loadedValue: loaded?.requirements,
    cached: Boolean(cachedBody),
    cachedValue: cachedBody?.requirements,
    listed: listed?.hasRequirements,
  });
  const notFound = query.error instanceof Error && query.error.message === "refertrm_404";
  const stale = Boolean(query.data?.fromCache);
  const pendingBody = query.isLoading && !loaded && !cachedBody;

  if (!jobId) {
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

  if (query.isLoading && !meta) return <Loading />;

  if (!meta && notFound) {
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

  if (!meta && query.isError) {
    return (
      <View style={{ flex: 1, backgroundColor: color.bg, padding: 16 }}>
        <RetryState message={errorMessage(query.error)} onRetry={() => void query.refetch()} />
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

      {description.state === "text" ? (
        <Text style={{ color: color.navy, marginTop: 24, lineHeight: 24 }}>{description.text}</Text>
      ) : description.state === "empty" ? (
        <Text style={{ color: color.muted, marginTop: 24 }}>{copy.jobs.descriptionEmpty}</Text>
      ) : pendingBody ? null : (
        <View style={{ marginTop: 24 }}>
          <RetryState message={copy.jobs.descriptionOffline} onRetry={() => void query.refetch()} />
        </View>
      )}

      {requirements.state === "text" ? (
        <View style={{ marginTop: 24 }}>
          <Text style={{ color: color.navy, fontWeight: "700" }}>{copy.jobs.requirements}</Text>
          <Text style={{ color: color.navy, marginTop: 8, lineHeight: 24 }}>{requirements.text}</Text>
        </View>
      ) : pendingBody && requirements.state === "unavailable" ? null : requirements.state === "unavailable" ? (
        <View style={{ marginTop: 24 }}>
          <Text style={{ color: color.navy, fontWeight: "700" }}>{copy.jobs.requirements}</Text>
          <RetryState message={copy.jobs.requirementsOffline} onRetry={() => void query.refetch()} />
        </View>
      ) : (
        <View style={{ marginTop: 24 }}>
          <Text style={{ color: color.navy, fontWeight: "700" }}>{copy.jobs.requirements}</Text>
          <Text style={{ color: color.muted, marginTop: 8 }}>{copy.jobs.requirementsEmpty}</Text>
        </View>
      )}

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
