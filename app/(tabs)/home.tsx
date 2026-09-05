import { useEffect } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Link } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HomeModule } from "../../src/components/home/HomeModule";
import { Skeleton } from "../../src/components/ui";
import { loadAcademy, loadJobs } from "../../src/api/load";
import { errorMessage } from "../../src/copy/error";
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

/**
 * CONSUMER-UIUX-1 §4 — Home is six slots, in order. The eleven equal
 * deferral cards are deleted (Earn / Settings / Saved / Notifications /
 * Journey progress leave Home; Earn keeps its tab).
 * Slot 2 is the only gold fill in viewport one (§3 R1).
 */

function HeroJobSlot() {
  const query = useQuery({ queryKey: ["jobs"], queryFn: ({ signal }) => loadJobs(signal) });
  const job = query.data?.jobs[0];

  if (query.isLoading && !job) {
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

  if (!job) {
    // O2 — zero/failure is transport or empty, never "the market has no jobs".
    const failed = query.isError;
    return (
      <View
        style={{ borderWidth: 1, borderColor: color.line, borderRadius: 12, backgroundColor: color.cream, padding: 16 }}
        accessibilityLiveRegion="polite"
      >
        <Text style={{ color: color.muted, ...type.monoLabel, fontWeight: "700" }}>{copy.home.heroJob.label}</Text>
        <Text style={{ color: color.navy, ...type.standard, fontWeight: "700", marginTop: 6 }}>
          {failed ? copy.home.heroJob.error : copy.jobs.empty}
        </Text>
        <Text style={{ color: color.muted, ...type.body, marginTop: 5 }}>
          {failed ? errorMessage(query.error) : copy.home.heroJob.empty}
        </Text>
        {failed ? (
          <Text style={{ color: color.muted, ...type.monoLabel, marginTop: 6 }}>jobs · guest-public summary</Text>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.home.heroJob.retry}
          onPress={() => void query.refetch()}
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
            style={({ pressed }) => ({
              minHeight: tap,
              borderRadius: 12,
              backgroundColor: color.gold,
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text style={{ color: color.navy, ...type.standard, fontWeight: "800" }}>{copy.home.primary.label}</Text>
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
