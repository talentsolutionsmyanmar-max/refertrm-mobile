import { Linking, Pressable, ScrollView, Share, Text, View } from "react-native";
import { Link, Stack, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { catalog } from "../../src/cache/catalog";
import { safeHttpsUrl } from "../../src/api/https";
import { resolveJobField } from "../../src/api/jobField";
import { loadJob } from "../../src/api/load";
import { jobTypeLabel } from "../../src/api/project";
import { Banner, Card, CardText, EmptyNote, Loading, RetryState } from "../../src/components/ui";
import { copy, errorMessage } from "../../src/copy/en";
import { parseRouteSegment } from "../../src/linking/ids";
import { color, tap } from "../../src/theme";

/** Canonical public job page on the web platform. Keyed by slug (see /jobs list links). */
function canonicalJobUrl(slug: string | null | undefined, id: string): string | null {
  const candidate = `https://www.refertrm.com/jobs/${slug && slug.trim() ? slug.trim() : id}`;
  return safeHttpsUrl(candidate);
}

function formatMmk(value: number): string {
  return `${value.toLocaleString("en-US")} MMK`;
}

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
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

  const backFallback = (
    <View style={{ flex: 1, backgroundColor: color.bg, padding: 16 }}>
      <Stack.Screen options={{ title: copy.nav.jobs, headerBackTitle: copy.nav.jobs }} />
      <Text style={{ color: color.muted, fontSize: 16, lineHeight: 24 }}>{copy.errors.notFound}</Text>
      <Link href="/jobs" asChild>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.nav.jobs}
          style={({ pressed }) => ({ minHeight: tap, justifyContent: "center", opacity: pressed ? 0.7 : 1 })}
        >
          <Text style={{ color: color.tealDark, fontWeight: "600", fontSize: 16 }}>{copy.nav.jobs}</Text>
        </Pressable>
      </Link>
    </View>
  );

  if (!jobId) return backFallback;
  if (query.isLoading && !meta) {
    return (
      <>
        <Stack.Screen options={{ title: copy.nav.jobs, headerBackTitle: copy.nav.jobs }} />
        <Loading />
      </>
    );
  }
  if (!meta && notFound) return backFallback;
  if (!meta && query.isError) {
    return (
      <View style={{ flex: 1, backgroundColor: color.bg, padding: 16 }}>
        <Stack.Screen options={{ title: copy.nav.jobs, headerBackTitle: copy.nav.jobs }} />
        <RetryState message={errorMessage(query.error)} onRetry={() => void query.refetch()} />
      </View>
    );
  }
  if (!meta) return backFallback;

  const typeLabel = jobTypeLabel(meta.type);
  const applyUrl = canonicalJobUrl(meta.slug, meta.id);
  const reward = meta.reward && meta.reward > 0 ? formatMmk(meta.reward) : null;
  const shareDetail = reward
    ? "Referral reward where the role is eligible · details after eligibility is confirmed"
    : "Sharing stays available · referral reward not offered on this role";

  return (
    <>
      <Stack.Screen
        options={{
          title: meta.title,
          headerBackTitle: copy.nav.jobs,
          headerStyle: { backgroundColor: color.navy },
          headerTintColor: color.white,
          headerTitleStyle: { fontWeight: "700" },
        }}
      />
      <ScrollView
        style={{ flex: 1, backgroundColor: color.paper }}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 32 + insets.bottom,
          gap: 16,
        }}
      >
        {stale ? <Banner text={copy.offline.stale} /> : null}

        {/* Branded job summary surface */}
        <View
          style={{
            borderRadius: 12,
            backgroundColor: color.navy,
            padding: 20,
            gap: 8,
          }}
        >
          {meta.urgent ? (
            <Text style={{ color: color.gold, fontWeight: "700", fontSize: 12, letterSpacing: 1.4, textTransform: "uppercase" }}>
              {copy.jobs.urgent}
            </Text>
          ) : null}
          <Text
            style={{ color: color.white, fontSize: 24, fontWeight: "800", lineHeight: 31 }}
            accessibilityRole="header"
          >
            {meta.title}
          </Text>
          {meta.company?.name ? (
            <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 16, fontWeight: "600" }}>
              {meta.company.name}
            </Text>
          ) : null}
          <View style={{ height: 1, backgroundColor: "rgba(212,175,55,0.35)", marginVertical: 4 }} />
          <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 16, lineHeight: 24 }}>
            {meta.location || copy.jobs.locationUnknown}
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 16, lineHeight: 24 }}>
            {meta.salaryDisplay || copy.jobs.salaryHidden}
            {typeLabel ? ` · ${typeLabel}` : ""}
          </Text>
          {reward ? (
            <Text style={{ color: color.gold, fontSize: 15, fontWeight: "700", lineHeight: 22 }}>
              {copy.jobs.referralReward(reward)}
            </Text>
          ) : null}
        </View>

        {/* About this role */}
        <Card label={copy.jobs.aboutRole}>
          {description.state === "text" ? (
            <CardText text={description.text!} />
          ) : description.state === "empty" ? (
            <EmptyNote text={copy.jobs.descriptionEmpty} />
          ) : pendingBody ? null : (
            <RetryState message={copy.jobs.descriptionOffline} onRetry={() => void query.refetch()} />
          )}
        </Card>

        {/* Requirements */}
        <Card label={copy.jobs.requirements}>
          {requirements.state === "text" ? (
            <CardText text={requirements.text!} />
          ) : pendingBody && requirements.state === "unavailable" ? null : requirements.state === "unavailable" ? (
            <RetryState message={copy.jobs.requirementsOffline} onRetry={() => void query.refetch()} />
          ) : (
            <EmptyNote text={copy.jobs.requirementsEmpty} />
          )}
        </Card>

        {/* Primary action — opens the canonical web job page */}
        {applyUrl ? (
          <>
            <Pressable
              onPress={() => void Linking.openURL(applyUrl)}
              accessibilityRole="link"
              accessibilityLabel={copy.jobs.applyOnline}
              style={({ pressed }) => ({
                minHeight: tap,
                borderRadius: 10,
                backgroundColor: color.teal,
                justifyContent: "center",
                alignItems: "center",
                paddingHorizontal: 20,
                paddingVertical: 14,
                opacity: pressed ? 0.85 : 1,
                marginTop: 4,
              })}
            >
              <Text style={{ color: color.white, fontWeight: "700", fontSize: 16 }}>{copy.jobs.applyOnline}</Text>
            </Pressable>
            <Pressable
              onPress={() => void Share.share({ message: `${meta.title}\n${applyUrl}` })}
              accessibilityRole="button"
              accessibilityLabel={copy.jobs.referOrShare}
              style={({ pressed }) => ({
                minHeight: tap,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: color.navy,
                justifyContent: "center",
                alignItems: "center",
                paddingHorizontal: 20,
                opacity: pressed ? 0.72 : 1,
              })}
            >
              <Text style={{ color: color.navy, fontWeight: "700", fontSize: 16 }}>{copy.jobs.referOrShare}</Text>
            </Pressable>
            <Text style={{ color: color.muted, fontSize: 12, lineHeight: 18, textAlign: "center" }}>{shareDetail}</Text>
          </>
        ) : (
          <View
            style={{
              padding: 16,
              borderRadius: 10,
              backgroundColor: "rgba(0,31,63,0.04)",
            }}
          >
            <Text style={{ color: color.muted, fontSize: 15, lineHeight: 22 }}>{copy.jobs.applyUnavailable}</Text>
          </View>
        )}
      </ScrollView>
    </>
  );
}
