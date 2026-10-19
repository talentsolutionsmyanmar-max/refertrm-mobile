import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { Link, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { loadJob, loadJobs } from "../../src/api/load";
import { staleContentBanner } from "../../src/api/catalogue-presentation";
import { jobTypeLabel } from "../../src/api/project";
import { Banner, RetryState } from "../../src/components/ui";
import { errorMessage } from "../../src/copy/error";
import { copy } from "../../src/copy/en";
import { useOnline } from "../../src/hooks/useOnline";
import { color, tap } from "../../src/theme";

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const online = useOnline();
  const listed = useQuery({ queryKey: ["jobs"], queryFn: ({ signal }) => loadJobs(signal) });
  const detail = useQuery({
    queryKey: ["job", id],
    queryFn: ({ signal }) => loadJob(id, signal),
    enabled: Boolean(id),
  });
  const header = listed.data?.jobs.find((j) => j.id === id || j.slug === id);
  const body = detail.data?.job;
  const job = body ?? header;
  const fromCache = Boolean(listed.data?.fromCache || detail.data?.fromCache);
  const fetchFailed = (listed.isError && !header) || (detail.isError && !body && !header);
  const banner = staleContentBanner({
    hasContent: Boolean(job),
    fromCache,
    isError: listed.isError || detail.isError,
    online,
  });

  function retry() {
    void listed.refetch();
    if (id) void detail.refetch();
  }

  if (!job && (listed.isLoading || detail.isLoading)) {
    return (
      <View style={{ flex: 1, backgroundColor: color.navy, justifyContent: "center", alignItems: "center", gap: 10 }}>
        <ActivityIndicator color={color.gold} />
        <Text style={{ color: color.white, fontSize: 14 }}>{copy.errors.connecting}</Text>
      </View>
    );
  }

  if (!job && fetchFailed) {
    return (
      <View style={{ flex: 1, backgroundColor: color.bg }}>
        <RetryState
          message={errorMessage(detail.error ?? listed.error)}
          onRetry={retry}
        />
      </View>
    );
  }

  if (!job) {
    return (
      <View style={{ flex: 1, backgroundColor: color.white, padding: 16 }}>
        <Text style={{ color: color.muted }}>{copy.errors.notFound}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: color.white }} contentContainerStyle={{ paddingBottom: 40 }}>
      {banner ? <Banner text={banner} /> : null}
      <View style={{ padding: 16 }}>
        <Link href="/jobs" asChild>
          <Pressable style={{ minHeight: tap, justifyContent: "center" }}>
            <Text style={{ color: color.tealDark, fontWeight: "600" }}>{copy.nav.jobs}</Text>
          </Pressable>
        </Link>
        <Text style={{ color: color.navy, fontSize: 24, fontWeight: "800", marginTop: 8 }}>{job.title}</Text>
        <Text style={{ color: color.muted, marginTop: 8 }}>{job.company?.name}</Text>
        <Text style={{ color: color.muted, marginTop: 8 }}>
          {job.location || copy.jobs.locationUnknown}
          {" · "}
          {job.salaryDisplay || copy.jobs.salaryHidden}
          {jobTypeLabel(job.type) ? ` · ${jobTypeLabel(job.type)}` : ""}
        </Text>
        {body?.description ? (
          <Text style={{ color: color.navy, marginTop: 24, lineHeight: 22 }}>{body.description}</Text>
        ) : detail.isLoading ? (
          <View style={{ marginTop: 24, alignItems: "flex-start", gap: 8 }}>
            <ActivityIndicator color={color.teal} />
            <Text style={{ color: color.muted }}>{copy.errors.connecting}</Text>
          </View>
        ) : detail.isError && !body?.description ? (
          <View style={{ marginTop: 24 }}>
            <Text style={{ color: color.muted }}>{copy.jobs.descriptionOffline}</Text>
            <Pressable
              onPress={() => void detail.refetch()}
              accessibilityRole="button"
              style={{
                minHeight: tap,
                marginTop: 12,
                paddingHorizontal: 16,
                borderRadius: 8,
                justifyContent: "center",
                backgroundColor: color.navy,
                alignSelf: "flex-start",
              }}
            >
              <Text style={{ color: color.white, fontWeight: "600" }}>{copy.errors.retry}</Text>
            </Pressable>
          </View>
        ) : (
          <Text style={{ color: color.muted, marginTop: 24 }}>{copy.jobs.descriptionOffline}</Text>
        )}
        {body?.requirements ? (
          <View style={{ marginTop: 24 }}>
            <Text style={{ color: color.navy, fontWeight: "700" }}>{copy.jobs.requirements}</Text>
            <Text style={{ color: color.navy, marginTop: 8, lineHeight: 22 }}>{body.requirements}</Text>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}
