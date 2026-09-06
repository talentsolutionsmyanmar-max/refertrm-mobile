import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Link } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HomeModule } from "../../src/components/home/HomeModule";
import { Skeleton } from "../../src/components/ui";
import { loadAcademy, loadHeroJob, loadJobs } from "../../src/api/load";
import { errorMessage } from "../../src/copy/error";
import { isTimeoutError, isTransportError } from "../../src/api/signal";
import {
  GAME_URL,
  MAYA_URL,
  REFERRALS_URL,
  TRINITY_URL,
  openStartInBrowser,
  openWeb,
} from "../../src/linking/start";
import { copy } from "../../src/copy/en";
import { color, tap, type, space } from "../../src/theme";

const CV_URL = "https://www.refertrm.com/eq/cv-builder";

/** G2 — the hero's visible loading state never outlives the ten-second budget. */
const HERO_VISIBLE_LOADING_MS = 8_000;

/** G2d — the failure explains itself: error class in the mono meta line. */
function heroErrorMeta(error: unknown): string {
  if (isTimeoutError(error)) return "jobs · timeout 8s";
  if (isTransportError(error)) return "jobs · transport";
  return "jobs · server";
}

function HeroJobSlot() {
  // G2 — dedicated minimal fetch (limit=1), not the 214-role catalogue. Cache-first.
  const query = useQuery({ queryKey: ["hero-job"], queryFn: ({ signal }) => loadHeroJob(signal) });
  const job = query.data?.job ?? null;

  // G2a — cap the visible skeleton at 8s; the fetch may still land and swap in.
  const [loadingBudgetSpent, setLoadingBudgetSpent] = useState(false);
  useEffect(() => {
    if (!query.isLoading || job) {
      setLoadingBudgetSpent(false);
      return;
    }
    const timer = setTimeout(() => setLoadingBudgetSpent(true), HERO_VISIBLE_LOADING_MS);
    return () => clearTimeout(timer);
  }, [query.isLoading, job]);

  const showLoading = query.isLoading && !job && !loadingBudgetSpent;
  const showError = !job && (query.isError || loadingBudgetSpent);

  if (showLoading) {
    return (
      <View
        style={{ borderWidth: 1, borderColor: color.line, borderRadius: 12, backgroundColor: color.cream, padding: 16, gap: 10 }}
        accessibilityLiveRegion="polite"
      >
        <Skeleton width="45%" />
        <Skeleton width="90%" height={22} />
        <Skeleton width="65%" height={16} />
        <Skeleton width="80%" height={14} />
      </View>
    );
  }

  if (showError) {
    // O2 — zero/failure is transport or empty, never "the market has no jobs".
    return (
      <View
        style={{ borderWidth: 1, borderColor: color.line, borderRadius: 12, backgroundColor: color.cream, padding: 16 }}
        accessibilityLiveRegion="polite"
      >
        <Text style={{ color: color.muted, ...type.monoLabel, fontWeight: "700" }}>{copy.home.heroJob.label}</Text>
        <Text style={{ color: color.navy, ...type.standard, fontWeight: "700", marginTop: 6 }}>
          {copy.home.heroJob.error}
        </Text>
        <Text style={{ color: color.muted, ...type.body, marginTop: 5 }}>
          {errorMessage(query.error)}
        </Text>
        <Text style={{ color: color.muted, ...type.monoLabel, marginTop: 6 }}>
          {query.isError ? heroErrorMeta(query.error) : "jobs · timeout 8s"}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.home.heroJob.retry}
          onPress={() => {
            setLoadingBudgetSpent(false);
            void query.refetch();
          }}
          style={({ pressed }) => ({
            minHeight: tap,
            marginTop: 12,
            borderRadius: 10,
            backgroundColor: color.navy,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.82 : 1,
          })}
        >
          <Text style={{ color: color.white, ...type.body, fontWeight: "700" }}>{copy.home.heroJob.retry}</Text>
        </Pressable>
      </View>
    );
  }

  if (!job) {
    // Unreachable: showLoading/showError cover the null paths. Guard for TS.
    return null;
  }

  return (
    <Link href="/jobs" asChild>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`${job.title}, ${job.location || copy.jobs.locationUnknown}. ${copy.home.primary.label}.`}
        style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
      >
        <View style={{ borderWidth: 1, borderColor: color.line, borderRadius: 12, backgroundColor: color.cream, padding: 16 }}>
          <Text style={{ color: color.muted, ...type.monoLabel, fontWeight: "700" }}>{copy.home.heroJob.label}</Text>
          <Text style={{ color: color.navy, ...type.hero, fontWeight: "700", marginTop: 6 }}>{job.title}</Text>
          <Text style={{ color: color.muted, ...type.body, marginTop: 5 }}>
            {job.location || copy.jobs.locationUnknown}
            {job.salaryDisplay ? ` · ${job.salaryDisplay}` : ` · ${copy.home.heroJob.salaryHidden}`}
          </Text>
        </View>
      </Pressable>
    </Link>
  );
}

function BrowserDoorRow({ label, url }: { label: string; url: string }) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${label}. ${copy.home.browserDoors.opensInBrowser}.`}
      onPress={() => void openWeb(url)}
      style={({ pressed }) => ({
        minHeight: tap,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: color.line,
        opacity: pressed ? 0.75 : 1,
      })}
    >
      <Text style={{ color: color.navy, ...type.bodySm, fontWeight: "600" }}>{label}</Text>
      <Text style={{ color: color.muted, ...type.monoLabel }}>{copy.home.browserDoors.opensInBrowser} ›</Text>
    </Pressable>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  useEffect(() => {
    void queryClient.prefetchQuery({ queryKey: ["jobs"], queryFn: ({ signal }) => loadJobs(signal) });
    void queryClient.prefetchQuery({ queryKey: ["academy"], queryFn: ({ signal }) => loadAcademy(signal) });
  }, [queryClient]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: color.paper }}
      contentContainerStyle={{
        paddingHorizontal: space[4],
        paddingTop: Math.max(insets.top, space[4]),
        paddingBottom: space[7],
        gap: space[4],
      }}
    >
      {/* 1 — MOB.HOME.HERO_JOB (hero): one real role, in-app */}
      <HeroJobSlot />

      {/* 2 — MOB.HOME.PRIMARY: the only gold fill in viewport one (R1).
          The no-fee line sits adjacent and state-independent (MUST-9):
          it renders on cold start, empty, and fetch failure alike. */}
      <View style={{ gap: space[2] }}>
        <Link href="/jobs" asChild>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={copy.home.primary.label}
            style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
          >
            {/* G1 — the box lives on the inner View, never on the asChild Pressable.
                Link asChild drops the child's own box styles on device; a Pressable
                under it keeps press feedback only. */}
            <View
              style={{
                minHeight: tap,
                borderRadius: 12,
                backgroundColor: color.gold,
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 16,
              }}
            >
              <Text style={{ color: color.navy, ...type.standard, fontWeight: "800" }}>{copy.home.primary.label}</Text>
            </View>
          </Pressable>
        </Link>
        <Text style={{ color: color.tealDark, ...type.bodySm, fontWeight: "600", textAlign: "center" }}>
          {copy.home.heroJob.nofee}
        </Text>
      </View>

      {/* 3 — MOB.HOME.LEARN (standard): in-app */}
      <Link href="/learn" asChild>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={copy.home.learn.title}
          style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
        >
          <HomeModule
            weight="standard"
            eyebrow={copy.home.learn.eyebrow}
            title={copy.home.learn.title}
            detail={copy.home.learn.detail}
          />
        </Pressable>
      </Link>

      {/* 4 — MOB.HOME.YDC (standard): browser → www /start only (O1) */}
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`${copy.home.ydc.title}. ${copy.home.ydc.detail}`}
        onPress={() => {
          void openStartInBrowser();
        }}
        style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
      >
        <HomeModule
          weight="standard"
          eyebrow={copy.home.ydc.eyebrow}
          title={copy.home.ydc.title}
          detail={copy.home.ydc.detail}
        />
      </Pressable>

      {/* 5 — MOB.HOME.BROWSER_DOORS (quiet, grouped): openWeb only, each row labelled */}
      <View
        style={{ borderWidth: 1, borderColor: color.line, borderRadius: 12, backgroundColor: color.cream, padding: 16 }}
      >
        <Text style={{ color: color.muted, ...type.monoLabel, fontWeight: "700" }}>{copy.home.browserDoors.header}</Text>
        <View style={{ marginTop: 6 }}>
          <BrowserDoorRow label={copy.home.browserDoors.rows.careerGame} url={GAME_URL} />
          <BrowserDoorRow label={copy.home.browserDoors.rows.askMaya} url={MAYA_URL} />
          <BrowserDoorRow label={copy.home.browserDoors.rows.trinity} url={TRINITY_URL} />
          <BrowserDoorRow label={copy.home.browserDoors.rows.cv} url={CV_URL} />
          <BrowserDoorRow label={copy.home.browserDoors.rows.referrals} url={REFERRALS_URL} />
        </View>
      </View>

      {/* 6 — MOB.HOME.PROVENANCE (quiet) */}
      <View
        style={{ borderWidth: 1, borderColor: color.line, borderRadius: 12, backgroundColor: color.paper, padding: 16 }}
      >
        <Text style={{ color: color.muted, ...type.bodySm }}>{copy.home.provenance.line}</Text>
      </View>
    </ScrollView>
  );
}
