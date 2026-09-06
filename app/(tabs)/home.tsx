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
import { HERO_TIMEOUT_MS } from "../../src/api/endpoints";
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

/** G2a/J1 — the visible skeleton budget (5s) is strictly shorter than the fetch
 *  budget (HERO_TIMEOUT_MS, 8s). The 3s window is where SLOW shows and the role
 *  can still land; the fetch dies at 8s. Never equalise the two budgets — that
 *  makes SLOW unreachable and kills the swap-in promise. */
const HERO_VISIBLE_LOADING_MS = 5_000;

/** G2d/H3 — the failure explains itself with the true error class, never conflated. */
function heroErrorMeta(error: unknown): string {
  // Distinct events, distinct strings: the fetch timing out (the request died at
  // the hero's own HERO_TIMEOUT_MS) vs the visible-skeleton budget expiring while
  // the fetch is still alive (handled by the slow branch) vs a transport failure
  // vs a server error vs a successful empty fetch.
  if (isTimeoutError(error)) return `jobs · timeout ${Math.round(HERO_TIMEOUT_MS / 1000)}s fetch`;
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
  // H1 — three distinct states, not two. Zero-role success is its own state.
  const showError = !job && query.isError; // fetch failed
  // J2 — offline pauses the query (default networkMode 'online'): isPending true,
  // isFetching false, isLoading false, isError false, isFetched false. Detect the
  // pause explicitly so a connectionless phone never renders nothing.
  const showOffline = !job && query.fetchStatus === "paused";
  const showSlow = !job && !query.isError && !showOffline && loadingBudgetSpent; // budget spent, fetch still alive
  const showEmpty = !job && !query.isError && !showOffline && !query.isLoading && query.isFetched; // fetch ok, zero roles

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
    // O2 — failure is transport, never "the market has no jobs".
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
          {heroErrorMeta(query.error)}
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

  if (showSlow) {
    // H2 — still loading past the budget: say so honestly, point at the working gold button.
    return (
      <View
        style={{ borderWidth: 1, borderColor: color.line, borderRadius: 12, backgroundColor: color.cream, padding: 16 }}
        accessibilityLiveRegion="polite"
      >
        <Text style={{ color: color.muted, ...type.monoLabel, fontWeight: "700" }}>{copy.home.heroJob.label}</Text>
        <Text style={{ color: color.navy, ...type.standard, fontWeight: "700", marginTop: 6 }}>
          {copy.home.heroJob.slow}
        </Text>
        <Text style={{ color: color.muted, ...type.monoLabel, marginTop: 6 }}>
          {`jobs · slow ${Math.round(HERO_VISIBLE_LOADING_MS / 1000)}s`}
        </Text>
      </View>
    );
  }

  if (showOffline) {
    // J2 — paused query (offline): waiting for a connection, never "no jobs".
    return (
      <View
        style={{ borderWidth: 1, borderColor: color.line, borderRadius: 12, backgroundColor: color.cream, padding: 16 }}
        accessibilityLiveRegion="polite"
      >
        <Text style={{ color: color.muted, ...type.monoLabel, fontWeight: "700" }}>{copy.home.heroJob.label}</Text>
        <Text style={{ color: color.navy, ...type.standard, fontWeight: "700", marginTop: 6 }}>
          {copy.home.heroJob.offline}
        </Text>
        <Text style={{ color: color.muted, ...type.monoLabel, marginTop: 6 }}>jobs · offline</Text>
      </View>
    );
  }

  if (showEmpty) {
    // H1 — fetch succeeded, zero roles, no cache: honest empty, not a vanished slot.
    return (
      <View
        style={{ borderWidth: 1, borderColor: color.line, borderRadius: 12, backgroundColor: color.cream, padding: 16 }}
        accessibilityLiveRegion="polite"
      >
        <Text style={{ color: color.muted, ...type.monoLabel, fontWeight: "700" }}>{copy.home.heroJob.label}</Text>
        <Text style={{ color: color.navy, ...type.standard, fontWeight: "700", marginTop: 6 }}>
          {copy.home.heroJob.empty}
        </Text>
        <Text style={{ color: color.muted, ...type.monoLabel, marginTop: 6 }}>jobs · empty</Text>
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
    // J2 — terminal fallback for any unclassified null-job path: render the
    // honest empty card, never nothing. (The gate asserts this component has no
    // bare null return — this is the third time a null path with no rendered
    // state shipped, and it does not ship again.)
    return (
      <View
        style={{ borderWidth: 1, borderColor: color.line, borderRadius: 12, backgroundColor: color.cream, padding: 16 }}
        accessibilityLiveRegion="polite"
      >
        <Text style={{ color: color.muted, ...type.monoLabel, fontWeight: "700" }}>{copy.home.heroJob.label}</Text>
        <Text style={{ color: color.navy, ...type.standard, fontWeight: "700", marginTop: 6 }}>
          {copy.home.heroJob.empty}
        </Text>
        <Text style={{ color: color.muted, ...type.monoLabel, marginTop: 6 }}>jobs · empty</Text>
      </View>
    );
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
