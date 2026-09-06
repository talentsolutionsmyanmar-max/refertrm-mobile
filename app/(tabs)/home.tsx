import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Link } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HomeModule } from "../../src/components/home/HomeModule";
import { Skeleton } from "../../src/components/ui";
import { loadAcademy, loadHeroJob, loadJobs } from "../../src/api/load";
import { errorMessage } from "../../src/copy/error";
import { isTimeoutError, isTransportError } from "../../src/api/signal";
import { HERO_TIMEOUT_MS } from "../../src/api/endpoints";
import { getDeviceSettings, setDeviceSetting } from "../../src/storage/settings";
import {
  GAME_URL,
  MAYA_URL,
  REFERRALS_URL,
  TRINITY_URL,
  openStartInBrowser,
  openWeb,
} from "../../src/linking/start";
import { copy } from "../../src/copy/en";
import { radii, tap, type, space } from "../../src/theme";
import { useTheme } from "../../src/theme/ThemeProvider";

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
  const t = useTheme();
  const job = query.data?.job ?? null;

  // S4 — extract the headcount from the polluted API title. Verified against the
  // live feed: 13/214 titles carry an em-dash, all 13 are exactly
  // "— Hiring N positions", zero multi-em-dash collisions. Strict regex; anything
  // else falls through to the raw title with no badge.
  const titleMatch = job ? /^(.*?)\s*—\s*Hiring\s+(\d+)\s+positions?\s*$/i.exec(job.title) : null;
  const heroTitle = titleMatch ? titleMatch[1].trim() : job?.title;
  const headcount = titleMatch ? copy.home.heroJob.headcount(Number(titleMatch[2])).toUpperCase() : null;

  // G2a — cap the visible skeleton at 5s (HERO_VISIBLE_LOADING_MS); the fetch
  // runs to 8s (HERO_TIMEOUT_MS), so the role can still land during SLOW.
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
        style={{ borderWidth: 1, borderColor: t.colors.line, borderRadius: 12, backgroundColor: t.colors.panel, padding: 16, gap: 10 }}
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
        style={{ borderWidth: 1, borderColor: t.colors.line, borderRadius: 12, backgroundColor: t.colors.panel, padding: 16 }}
        accessibilityLiveRegion="polite"
      >
        <Text style={{ color: t.colors.mut, ...type.monoLabel, fontWeight: "700" }}>{copy.home.heroJob.label}</Text>
        <Text style={{ color: t.colors.ink, ...type.standard, fontWeight: "700", marginTop: 6 }}>
          {copy.home.heroJob.error}
        </Text>
        <Text style={{ color: t.colors.mut, ...type.body, marginTop: 5 }}>
          {errorMessage(query.error)}
        </Text>
        <Text style={{ color: t.colors.mut, ...type.monoLabel, marginTop: 6 }}>
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
            backgroundColor: t.colors.ink,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.82 : 1,
          })}
        >
          <Text style={{ color: t.colors.ink, ...type.body, fontWeight: "700" }}>{copy.home.heroJob.retry}</Text>
        </Pressable>
      </View>
    );
  }

  if (showSlow) {
    // H2 — still loading past the budget: say so honestly, point at the working gold button.
    return (
      <View
        style={{ borderWidth: 1, borderColor: t.colors.line, borderRadius: 12, backgroundColor: t.colors.panel, padding: 16 }}
        accessibilityLiveRegion="polite"
      >
        <Text style={{ color: t.colors.mut, ...type.monoLabel, fontWeight: "700" }}>{copy.home.heroJob.label}</Text>
        <Text style={{ color: t.colors.ink, ...type.standard, fontWeight: "700", marginTop: 6 }}>
          {copy.home.heroJob.slow}
        </Text>
        <Text style={{ color: t.colors.mut, ...type.monoLabel, marginTop: 6 }}>
          {`jobs · slow ${Math.round(HERO_VISIBLE_LOADING_MS / 1000)}s`}
        </Text>
      </View>
    );
  }

  if (showOffline) {
    // J2 — paused query (offline): waiting for a connection, never "no jobs".
    return (
      <View
        style={{ borderWidth: 1, borderColor: t.colors.line, borderRadius: 12, backgroundColor: t.colors.panel, padding: 16 }}
        accessibilityLiveRegion="polite"
      >
        <Text style={{ color: t.colors.mut, ...type.monoLabel, fontWeight: "700" }}>{copy.home.heroJob.label}</Text>
        <Text style={{ color: t.colors.ink, ...type.standard, fontWeight: "700", marginTop: 6 }}>
          {copy.home.heroJob.offline}
        </Text>
        <Text style={{ color: t.colors.mut, ...type.monoLabel, marginTop: 6 }}>jobs · offline</Text>
      </View>
    );
  }

  if (showEmpty) {
    // H1 — fetch succeeded, zero roles, no cache: honest empty, not a vanished slot.
    return (
      <View
        style={{ borderWidth: 1, borderColor: t.colors.line, borderRadius: 12, backgroundColor: t.colors.panel, padding: 16 }}
        accessibilityLiveRegion="polite"
      >
        <Text style={{ color: t.colors.mut, ...type.monoLabel, fontWeight: "700" }}>{copy.home.heroJob.label}</Text>
        <Text style={{ color: t.colors.ink, ...type.standard, fontWeight: "700", marginTop: 6 }}>
          {copy.home.heroJob.empty}
        </Text>
        <Text style={{ color: t.colors.mut, ...type.monoLabel, marginTop: 6 }}>jobs · empty</Text>
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
            backgroundColor: t.colors.ink,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.82 : 1,
          })}
        >
          <Text style={{ color: t.colors.ink, ...type.body, fontWeight: "700" }}>{copy.home.heroJob.retry}</Text>
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
        style={{ borderWidth: 1, borderColor: t.colors.line, borderRadius: 12, backgroundColor: t.colors.panel, padding: 16 }}
        accessibilityLiveRegion="polite"
      >
        <Text style={{ color: t.colors.mut, ...type.monoLabel, fontWeight: "700" }}>{copy.home.heroJob.label}</Text>
        <Text style={{ color: t.colors.ink, ...type.standard, fontWeight: "700", marginTop: 6 }}>
          {copy.home.heroJob.empty}
        </Text>
        <Text style={{ color: t.colors.mut, ...type.monoLabel, marginTop: 6 }}>jobs · empty</Text>
      </View>
    );
  }

  return (
    <Link href="/jobs" asChild>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`${heroTitle}, ${job.location || copy.jobs.locationUnknown}. ${copy.home.primary.label}.`}
        style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}
      >
        {/* T3 — panel surface, radius lg, shadow from the active theme, NO border. */}
        <View style={{ borderRadius: radii.lg, backgroundColor: t.colors.panel, padding: 16, shadowColor: "#000" /* lint-ok — shadow base, matches the tokens' rgba(0,0,0) shadow */, shadowOpacity: t.name === "night" ? 0.45 : 0.16, shadowRadius: t.name === "night" ? 40 : 32, shadowOffset: { width: 0, height: t.name === "night" ? 14 : 12 }, elevation: 6 }}>
          <Text style={{ color: t.colors.dim, ...type.monoLabel, fontWeight: "700" }}>{copy.home.heroJob.label}</Text>
          {/* T3 — role title ink at display 26. */}
          <Text style={{ color: t.colors.ink, ...type.display, fontWeight: "800", marginTop: 8 }}>{heroTitle}</Text>
          {headcount ? (
            /* T4 — the headcount is a selling point, extracted from the polluted API title. */
            <View
              style={{
                alignSelf: "flex-start",
                marginTop: 10,
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: radii.pill,
                borderWidth: 1,
                borderColor: t.accents.gold,
              }}
            >
              <Text style={{ color: t.accents.gold, ...type.monoLabel, fontWeight: "700" }}>{headcount}</Text>
            </View>
          ) : null}
          <Text style={{ color: t.colors.mut, ...type.body, marginTop: 10 }}>
            {job.location || copy.jobs.locationUnknown}
          </Text>
          {/* T3 — SALARY in gold, its own line, the largest number on the screen. */}
          <Text style={{ color: t.accents.gold, ...type.standard, fontWeight: "800", marginTop: 6 }}>
            {job.salaryDisplay || copy.home.heroJob.salaryHidden}
          </Text>
        </View>
      </Pressable>
    </Link>
  );
}

/**
 * T3 — the slot-1 region adopts the Academy's vocabulary. Above the hero card:
 * eyebrow (dim mono) · time-aware greeting (display 26) · "Add your name"
 * (dotted-underline affordance, stored LOCALLY, never sent, never required) ·
 * conviction line (teal mono caps) · substance line (runtime numbers, never baked).
 */
function SlotOneHeader() {
  const t = useTheme();
  const [name, setName] = useState(() => getDeviceSettings().guestName);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const h = new Date().getHours();
  const greeting =
    h < 12 ? copy.home.greeting.morning : h < 17 ? copy.home.greeting.afternoon : h < 21 ? copy.home.greeting.evening : copy.home.greeting.night;
  const jobsQuery = useQuery({ queryKey: ["jobs"], queryFn: ({ signal }) => loadJobs(signal) });
  const roles = jobsQuery.data?.jobs.length;
  const substance =
    typeof roles === "number" && roles > 0 ? copy.home.substance(roles) : copy.home.substanceFallback;

  return (
    <View style={{ gap: space[2], paddingHorizontal: 2 }}>
      <Text style={{ color: t.colors.dim, ...type.monoLabel, fontWeight: "700" }}>REFERTRM</Text>
      <Text style={{ color: t.colors.ink, ...type.display, fontWeight: "800" }}>{greeting}</Text>
      {editing ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, minHeight: tap }}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder={copy.home.namePrompt}
            placeholderTextColor={t.colors.dim}
            autoFocus
            autoCapitalize="words"
            autoCorrect={false}
            accessibilityLabel={copy.home.namePrompt}
            style={{
              flex: 1,
              minHeight: tap,
              color: t.colors.ink,
              ...type.body,
              borderBottomWidth: 1,
              borderBottomColor: t.colors.mut,
              paddingVertical: 4,
            }}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Save name"
            onPress={() => {
              const trimmed = draft.trim();
              setDeviceSetting("guestName", trimmed);
              setName(trimmed);
              setEditing(false);
            }}
            style={({ pressed }) => ({ minHeight: tap, justifyContent: "center", paddingHorizontal: 12, opacity: pressed ? 0.75 : 1 })}
          >
            <Text style={{ color: t.accents.teal, ...type.body, fontWeight: "700" }}>Save</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={name ? `Your name is ${name}. Tap to edit.` : copy.home.namePrompt}
          onPress={() => {
            setDraft(name);
            setEditing(true);
          }}
          style={({ pressed }) => ({ alignSelf: "flex-start", minHeight: tap, justifyContent: "center", opacity: pressed ? 0.75 : 1 })}
        >
          <Text
            style={{
              color: name ? t.colors.ink : t.colors.mut,
              ...type.body,
              fontWeight: "600",
              borderBottomWidth: 1,
              borderBottomColor: t.colors.mut,
              borderStyle: "dotted",
            }}
          >
            {name || copy.home.namePrompt}
          </Text>
        </Pressable>
      )}
      {/* T3d — the offer stated with conviction (replaces the orphaned no-fee caption). */}
      <Text style={{ color: t.accents.teal, ...type.monoLabel, fontWeight: "700", marginTop: space[2] }}>
        {copy.home.conviction}
      </Text>
      {/* T3e — real prod numbers, read at runtime, never baked. */}
      <Text style={{ color: t.colors.mut, ...type.body }}>{substance}</Text>
    </View>
  );
}

function BrowserDoorRow({ label, url }: { label: string; url: string }) {
  const t = useTheme();
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
        borderTopColor: t.colors.line,
        opacity: pressed ? 0.75 : 1,
      })}
    >
      <Text style={{ color: t.colors.ink, ...type.bodySm, fontWeight: "600" }}>{label}</Text>
      <Text style={{ color: t.colors.mut, ...type.monoLabel }}>{copy.home.browserDoors.opensInBrowser} ›</Text>
    </Pressable>
  );
}

export default function HomeScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  useEffect(() => {
    void queryClient.prefetchQuery({ queryKey: ["jobs"], queryFn: ({ signal }) => loadJobs(signal) });
    void queryClient.prefetchQuery({ queryKey: ["academy"], queryFn: ({ signal }) => loadAcademy(signal) });
  }, [queryClient]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.colors.bg0 }}
      contentContainerStyle={{
        paddingHorizontal: space[4],
        paddingTop: Math.max(insets.top, space[4]),
        paddingBottom: space[7],
        gap: space[4],
      }}
    >
      {/* T3 — slot-1 region: the Academy's vocabulary, above the hero. */}
      <SlotOneHeader />

      {/* 1 — MOB.HOME.HERO_JOB (hero): one real role, in-app */}
      <HeroJobSlot />

      {/* 2 — MOB.HOME.PRIMARY: the only gold fill in viewport one (R1).
          The no-fee line is bound to the button as a deliberate pair (S7) —
          it renders state-independent (MUST-9): cold start, empty, failure alike. */}
      <View style={{ gap: space[2] }}>
        <Link href="/jobs" asChild>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${copy.home.primary.label}. ${copy.home.heroJob.nofee}`}
            style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
          >
            {/* G1 — the box lives on the inner View, never on the asChild Pressable.
                Link asChild drops the child's own box styles on device; a Pressable
                under it keeps press feedback only. */}
            <View
              style={{
                minHeight: tap,
                borderRadius: 12,
                backgroundColor: t.accents.gold,
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 16,
                paddingVertical: 10,
              }}
            >
              <Text style={{ color: t.colors.ink, ...type.standard, fontWeight: "800" }}>{copy.home.primary.label}</Text>
              {/* S7 — the no-fee line is part of the button, not a floating caption. */}
              <Text style={{ color: "rgba(0,31,63,0.7)", ...type.monoLabel, fontWeight: "700", marginTop: 3 }}>
                {copy.home.heroJob.nofee}
              </Text>
            </View>
          </Pressable>
        </Link>
      </View>

      {/* 3 — MOB.HOME.LEARN (standard): in-app */}
      <Link href="/learn" asChild>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={copy.home.learn.title}
          style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
        >
          {/* S6 — teal tile differentiates the card at a glance (typographic mark, no emoji, no icon font). */}
          <HomeModule
            weight="standard"
            eyebrow={copy.home.learn.eyebrow}
            title={copy.home.learn.title}
            detail={copy.home.learn.detail}
            tile="book"
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
        {/* S6 — the sprout tile echoes the YDC zone header's own marker. */}
        <HomeModule
          weight="standard"
          eyebrow={copy.home.ydc.eyebrow}
          title={copy.home.ydc.title}
          detail={copy.home.ydc.detail}
          tile="sprout"
        />
      </Pressable>

      {/* 5 — MOB.HOME.BROWSER_DOORS (quiet, grouped): openWeb only, each row labelled */}
      <View
        style={{ borderWidth: 1, borderColor: t.colors.line, borderRadius: 12, backgroundColor: t.colors.panel, padding: 16 }}
      >
        <Text style={{ color: t.colors.mut, ...type.monoLabel, fontWeight: "700" }}>{copy.home.browserDoors.header}</Text>
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
        style={{ borderWidth: 1, borderColor: t.colors.line, borderRadius: 12, backgroundColor: t.colors.bg0, padding: 16 }}
      >
        <Text style={{ color: t.colors.mut, ...type.bodySm }}>{copy.home.provenance.line}</Text>
      </View>
    </ScrollView>
  );
}
