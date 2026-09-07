import { useEffect, useMemo, useRef, useState } from "react";
import {
  AppState,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  type AppStateStatus,
} from "react-native";
import { Link } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { loadAcademy, loadJobs } from "../../src/api/load";
import { isTimeoutError, isTransportError } from "../../src/api/signal";
import { errorMessage } from "../../src/copy/error";
import { Skeleton } from "../../src/components/ui";
import { ArrowGlyph, ConstellationGlyph, PlayGlyph } from "../../src/home/glyphs";
import {
  formatGreeting,
  hydrateNickname,
  persistNickname,
  setNicknameBackend,
} from "../../src/home/nickname";
import { fileNicknameBackend } from "../../src/storage/nicknameFile";
import {
  bandForSeed,
  bandIndex,
  classifyJobBand,
  heroSeed,
  HERO_BAND_ORDER,
  pickHeroJob,
  positionsFromTitle,
  shouldReseedAfterBackground,
} from "../../src/home/pickHeroJob";
import {
  CV_URL,
  GAME_URL,
  LOGIN_TRINITY,
  MAYA_URL,
  REFERRALS_URL,
  openStartInBrowser,
  openWeb,
} from "../../src/linking/start";
import { copy } from "../../src/copy/en";
import { color, font, radii, tap } from "../../src/theme";
import type { JobListItem } from "../../src/api/types";

// Wire nickname to the existing expo-file-system persist layer (catalogue pattern).
setNicknameBackend(fileNicknameBackend);

const HERO_VISIBLE_LOADING_MS = 5_000;
const HERO_TIMEOUT_MS = 8_000;

function greetingLine(name: string | null): string {
  const h = new Date().getHours();
  const base = h < 12 ? copy.home.greetMorning : h < 17 ? copy.home.greetAfternoon : copy.home.greetEvening;
  return formatGreeting(base, name);
}

function ArrowButton({ tone = "ink" }: { tone?: "ink" | "gold" | "inverse" }) {
  const border = tone === "inverse" ? color.lineInverse : color.line;
  return (
    <View
      style={{
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: border,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <ArrowGlyph tone={tone} />
    </View>
  );
}

function RoleRings() {
  const shared = {
    position: "absolute" as const,
    borderRadius: 999,
    borderWidth: 1,
    right: -62,
    bottom: -86,
  };
  return (
    <>
      <View style={{ ...shared, width: 152, height: 152, borderColor: "rgba(212,175,55,0.34)", right: -62, bottom: -86 }} />
      <View
        style={{
          ...shared,
          width: 216,
          height: 216,
          borderColor: "rgba(212,175,55,0.035)",
          right: -62 - 32,
          bottom: -86 - 32,
        }}
      />
      <View
        style={{
          ...shared,
          width: 280,
          height: 280,
          borderColor: "rgba(212,175,55,0.025)",
          right: -62 - 64,
          bottom: -86 - 64,
        }}
      />
    </>
  );
}

function HeroRoleCard({
  job,
  openCount,
  bandIndex,
}: {
  job: JobListItem;
  openCount: number | null;
  bandIndex: number;
}) {
  const band = classifyJobBand(job);
  const salary = job.salaryDisplay?.trim() || null;
  const location = job.location?.trim() || copy.jobs.locationUnknown;
  const titleMatch = /^(.*?)\s*—\s*Hiring\s+(\d+)\s+positions?\s*$/i.exec(job.title);
  const title = titleMatch ? titleMatch[1].trim() : job.title;
  const positions = positionsFromTitle(job.title);

  return (
    <Link href={`/jobs/${job.id}` as `/jobs/${string}`} asChild>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`${title}. ${location}. ${salary ?? ""}`}
        style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}
      >
        <View
          style={{
            width: "100%",
            backgroundColor: color.navy,
            borderColor: color.navy,
            borderWidth: 1,
            borderRadius: radii.r3,
            padding: 14,
            minHeight: 178,
            overflow: "hidden",
          }}
        >
          <RoleRings />
          <View style={{ zIndex: 1, flex: 1, justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 7 }}>
              <Text style={{ color: color.gold, fontFamily: font.mono, fontSize: 7.5, letterSpacing: 0.08 * 7.5 }}>
                {copy.home.roleLabel}
              </Text>
              <ArrowButton tone="inverse" />
            </View>
            <View>
              <Text
                style={{
                  color: color.white,
                  fontFamily: font.display,
                  fontSize: 21,
                  lineHeight: 21 * 1.06,
                  letterSpacing: -0.04 * 21,
                  marginTop: 7,
                  maxWidth: "70%",
                }}
                numberOfLines={3}
              >
                {title}
              </Text>
              <Text style={{ color: "#b9c6d3", fontFamily: font.body, fontSize: 9, marginTop: 3 }}>{location}</Text>
              {salary ? (
                <Text
                  style={{
                    color: color.gold,
                    fontFamily: font.display,
                    fontSize: 21,
                    letterSpacing: -0.04 * 21,
                    marginTop: 4,
                    fontVariant: ["tabular-nums"],
                  }}
                >
                  {salary}
                </Text>
              ) : null}
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 7 }}>
                {band ? (
                  <View
                    style={{
                      minHeight: 18,
                      paddingHorizontal: 7,
                      borderRadius: radii.pill,
                      borderWidth: 1,
                      borderColor: color.lineInverse,
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ color: "#dbe5ed", fontFamily: font.mono, fontSize: 6.5, letterSpacing: 0.035 * 6.5 }}>
                      {band.toUpperCase()}
                    </Text>
                  </View>
                ) : null}
                {salary ? (
                  <View
                    style={{
                      minHeight: 18,
                      paddingHorizontal: 7,
                      borderRadius: radii.pill,
                      borderWidth: 1,
                      borderColor: color.lineInverse,
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ color: "#dbe5ed", fontFamily: font.mono, fontSize: 6.5, letterSpacing: 0.035 * 6.5 }}>
                      {copy.home.salaryShown}
                    </Text>
                  </View>
                ) : null}
                {positions != null ? (
                  <View
                    style={{
                      minHeight: 18,
                      paddingHorizontal: 7,
                      borderRadius: radii.pill,
                      borderWidth: 1,
                      borderColor: color.lineInverse,
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: "#dbe5ed",
                        fontFamily: font.mono,
                        fontSize: 6.5,
                        fontWeight: "600",
                        letterSpacing: 0.035 * 6.5,
                      }}
                    >
                      {`${positions} POSITIONS`}
                    </Text>
                  </View>
                ) : null}
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 7 }}>
                {HERO_BAND_ORDER.map((_, i) => (
                  <View
                    key={i}
                    style={
                      i === bandIndex
                        ? {
                            width: 12,
                            height: 4,
                            borderRadius: radii.pill,
                            backgroundColor: color.gold,
                          }
                        : {
                            width: 4,
                            height: 4,
                            borderRadius: 2,
                            backgroundColor: "rgba(255,255,255,0.28)",
                          }
                    }
                  />
                ))}
                <Text
                  style={{
                    marginLeft: 2,
                    color: "#8fa3b5",
                    fontFamily: font.mono,
                    fontSize: 6.5,
                    letterSpacing: 0.07 * 6.5,
                  }}
                >
                  {copy.home.visitHint}
                  {openCount != null ? ` · ${copy.home.openRoles(openCount)}` : ""}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

function HeroStateCard({
  title,
  detail,
  meta,
  onRetry,
}: {
  title: string;
  detail?: string;
  meta: string;
  onRetry?: () => void;
}) {
  return (
    <View
      style={{
        width: "100%",
        backgroundColor: color.navy,
        borderColor: color.navy,
        borderWidth: 1,
        borderRadius: radii.r3,
        padding: 14,
        minHeight: 178,
        overflow: "hidden",
      }}
      accessibilityLiveRegion="polite"
    >
      <RoleRings />
      <View style={{ zIndex: 1 }}>
        <Text style={{ color: color.gold, fontFamily: font.mono, fontSize: 7.5, letterSpacing: 0.08 * 7.5 }}>
          {copy.home.heroJob.label}
        </Text>
        <Text
          style={{
            color: color.white,
            fontFamily: font.display,
            fontSize: 21,
            lineHeight: 21 * 1.06,
            letterSpacing: -0.04 * 21,
            marginTop: 7,
            maxWidth: "80%",
          }}
        >
          {title}
        </Text>
        {detail ? (
          <Text style={{ color: "#b9c6d3", fontFamily: font.body, fontSize: 9, marginTop: 5, lineHeight: 14 }}>
            {detail}
          </Text>
        ) : null}
        <Text style={{ color: "#8fa3b5", fontFamily: font.mono, fontSize: 6.5, marginTop: 8 }}>{meta}</Text>
        {onRetry ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={copy.home.heroJob.retry}
            onPress={onRetry}
            style={({ pressed }) => ({
              minHeight: tap,
              marginTop: 12,
              borderRadius: 10,
              backgroundColor: color.gold,
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text style={{ color: color.navyDeep, fontFamily: font.bodySemi, fontSize: 12 }}>{copy.home.heroJob.retry}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function HeroSlot({ seed }: { seed: number }) {
  const query = useQuery({
    queryKey: ["jobs"],
    queryFn: ({ signal }) => loadJobs(signal),
  });
  const jobs = query.data?.jobs ?? [];
  const job = useMemo(() => pickHeroJob(jobs, seed), [jobs, seed]);
  const openCount = jobs.length > 0 ? jobs.length : null;
  const activeBand = bandForSeed(seed);
  const activeBandIndex = bandIndex(activeBand);

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
  const showError = !job && query.isError;
  const showOffline = !job && query.fetchStatus === "paused";
  const showSlow = !job && !query.isError && !showOffline && loadingBudgetSpent;
  const showEmpty = !job && !query.isError && !showOffline && !query.isLoading && query.isFetched;

  if (showLoading) {
    return (
      <View
        style={{
          width: "100%",
          backgroundColor: color.navy,
          borderRadius: radii.r3,
          padding: 14,
          minHeight: 178,
          gap: 10,
        }}
        accessibilityLiveRegion="polite"
      >
        <Skeleton width="45%" height={10} />
        <Skeleton width="90%" height={22} />
        <Skeleton width="65%" height={16} />
        <Skeleton width="80%" height={14} />
      </View>
    );
  }

  if (showError) {
    const meta = isTimeoutError(query.error)
      ? `jobs · timeout ${Math.round(HERO_TIMEOUT_MS / 1000)}s fetch`
      : isTransportError(query.error)
        ? "jobs · transport"
        : "jobs · server";
    return (
      <HeroStateCard
        title={copy.home.heroJob.error}
        detail={errorMessage(query.error)}
        meta={meta}
        onRetry={() => {
          setLoadingBudgetSpent(false);
          void query.refetch();
        }}
      />
    );
  }

  if (showOffline) {
    return <HeroStateCard title={copy.home.heroJob.offline} meta="jobs · offline" />;
  }

  if (showSlow) {
    return (
      <HeroStateCard
        title={copy.home.heroJob.slow}
        meta={`jobs · slow ${Math.round(HERO_VISIBLE_LOADING_MS / 1000)}s`}
      />
    );
  }

  if (showEmpty || !job) {
    return (
      <HeroStateCard
        title={copy.home.heroJob.empty}
        meta="jobs · empty"
        onRetry={() => {
          setLoadingBudgetSpent(false);
          void query.refetch();
        }}
      />
    );
  }

  return <HeroRoleCard job={job} openCount={openCount} bandIndex={activeBandIndex} />;
}

function JobsActionRow({ openCount }: { openCount: number | null }) {
  return (
    <View style={{ width: "100%", gap: 5 }}>
      <Link href="/jobs" asChild>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={copy.home.seeAllJobs}
          style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}
        >
          <View
            style={{
              minHeight: 42,
              width: "100%",
              backgroundColor: color.gold,
              borderRadius: radii.pill,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 7,
            }}
          >
            <Text style={{ color: color.navyDeep, fontFamily: font.bodySemi, fontSize: 12, fontWeight: "700" }}>
              {copy.home.seeAllJobs}
            </Text>
            <ArrowGlyph tone="ink" />
          </View>
        </Pressable>
      </Link>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 5, paddingLeft: 2 }}>
        <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: color.teal }} />
        {openCount != null ? (
          <Text style={{ color: color.teal, fontFamily: font.mono, fontSize: 8, letterSpacing: 0.05 * 8, textTransform: "uppercase" }}>
            {copy.home.openRoles(openCount)}
          </Text>
        ) : null}
        <Text style={{ color: color.slate, fontFamily: font.body, fontSize: 8.5 }}>
          {openCount != null ? `· ${copy.home.noFee}` : copy.home.noFee}
        </Text>
      </View>
    </View>
  );
}

function DoorCard({
  children,
  onPress,
  accessibilityLabel,
  style,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  accessibilityLabel: string;
  style?: object;
}) {
  const body = (
    <View
      style={[
        {
          flex: 1,
          minHeight: 84,
          paddingVertical: 9,
          paddingHorizontal: 10,
          borderRadius: radii.r2,
          borderWidth: 1,
          borderColor: color.line,
          backgroundColor: color.paper,
          overflow: "hidden",
          justifyContent: "flex-start",
        },
        style,
      ]}
    >
      {children}
    </View>
  );
  if (!onPress) return body;
  return (
    <Pressable accessibilityRole="link" accessibilityLabel={accessibilityLabel} onPress={onPress} style={{ flex: 1 }}>
      {body}
    </Pressable>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  // Mount seed + AppState reseed after >20s background (Android resumes without remount).
  const [seed, setSeed] = useState(() => heroSeed());
  const backgroundedAtMs = useRef<number | null>(null);

  useEffect(() => {
    const onChange = (next: AppStateStatus) => {
      if (next === "background" || next === "inactive") {
        if (backgroundedAtMs.current == null) backgroundedAtMs.current = Date.now();
        return;
      }
      if (next !== "active") return;
      const started = backgroundedAtMs.current;
      backgroundedAtMs.current = null;
      if (started == null) return;
      const now = Date.now();
      if (shouldReseedAfterBackground(started, now)) {
        setSeed(heroSeed(now));
      }
    };
    const sub = AppState.addEventListener("change", onChange);
    return () => sub.remove();
  }, []);

  const jobsQuery = useQuery({
    queryKey: ["jobs"],
    queryFn: ({ signal }) => loadJobs(signal),
  });
  const academyQuery = useQuery({
    queryKey: ["academy"],
    queryFn: ({ signal }) => loadAcademy(signal),
  });
  const openCount = (jobsQuery.data?.jobs?.length ?? 0) > 0 ? jobsQuery.data!.jobs.length : null;
  // AcademyModule public count — NOT academy_courses. Omit until a real positive count lands.
  const lessonCount =
    academyQuery.isSuccess && (academyQuery.data?.modules?.length ?? 0) > 0
      ? academyQuery.data!.modules.length
      : null;

  useEffect(() => {
    void queryClient.prefetchQuery({ queryKey: ["jobs"], queryFn: ({ signal }) => loadJobs(signal) });
    void queryClient.prefetchQuery({ queryKey: ["academy"], queryFn: ({ signal }) => loadAcademy(signal) });
  }, [queryClient]);

  const [nickname, setNickname] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");

  useEffect(() => {
    let cancelled = false;
    void hydrateNickname().then((n) => {
      if (!cancelled) setNickname(n);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function commitNickname(raw: string) {
    const stored = await persistNickname(raw);
    setNickname(stored);
    setEditingName(false);
    setNameDraft("");
  }

  const greet = greetingLine(nickname);
  const greetParts = greet.match(/^(Good\s+)(.+)$/i);
  const greetLead = greetParts?.[1] ?? "Good ";
  const greetTail = greetParts?.[2] ?? greet;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: color.ivory }}
      contentContainerStyle={{
        paddingTop: Math.max(insets.top, 11),
        paddingHorizontal: 12,
        paddingBottom: 8 + insets.bottom,
      }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 26 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Image
            source={require("../../assets/brand/trm-mark.png")}
            style={{ width: 37, height: 22, borderRadius: 4 }}
            resizeMode="contain"
            accessibilityLabel="ReferTRM"
          />
          <Text style={{ fontFamily: font.display, fontSize: 10.5, letterSpacing: -0.015 * 10.5, color: color.ink }}>
            ReferTRM
          </Text>
        </View>
        <View
          style={{
            paddingHorizontal: 8,
            minHeight: 22,
            borderWidth: 1,
            borderColor: color.line,
            borderRadius: radii.pill,
            justifyContent: "center",
          }}
        >
          <Text style={{ fontFamily: font.mono, fontSize: 8, letterSpacing: 0.05 * 8, color: color.ink }}>
            {copy.home.employers}
          </Text>
        </View>
      </View>

      <Text
        style={{
          marginTop: 5,
          fontFamily: font.mono,
          fontSize: 7.5,
          letterSpacing: 0.11 * 7.5,
          textTransform: "uppercase",
          color: color.teal,
        }}
      >
        {copy.home.fig}
      </Text>

      <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: 10, marginTop: 4 }}>
        <Text style={{ fontFamily: font.display, fontSize: 28, lineHeight: 28 * 0.94, letterSpacing: -0.055 * 28, color: color.ink, flexShrink: 1 }}>
          {greetLead}
          <Text style={{ color: color.navy }}>{greetTail}</Text>
        </Text>
        {editingName ? (
          <TextInput
            autoFocus
            value={nameDraft}
            onChangeText={setNameDraft}
            onSubmitEditing={() => void commitNickname(nameDraft)}
            onBlur={() => void commitNickname(nameDraft)}
            maxLength={24}
            placeholder={copy.home.addName}
            placeholderTextColor={color.slate}
            accessibilityLabel={copy.home.addName}
            style={{
              borderBottomWidth: 1,
              borderStyle: "dashed",
              borderBottomColor: "rgba(0,31,63,0.34)",
              color: color.ink,
              fontFamily: font.body,
              fontSize: 10.5,
              flexShrink: 0,
              minWidth: 88,
              paddingVertical: 0,
              margin: 0,
            }}
          />
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={nickname ?? copy.home.addName}
            onPress={() => {
              setNameDraft(nickname ?? "");
              setEditingName(true);
            }}
            hitSlop={8}
          >
            <Text
              style={{
                borderBottomWidth: 1,
                borderStyle: "dashed",
                borderBottomColor: "rgba(0,31,63,0.34)",
                color: color.slate,
                fontFamily: font.body,
                fontSize: 10.5,
                flexShrink: 0,
              }}
            >
              {nickname ?? copy.home.addName}
            </Text>
          </Pressable>
        )}
      </View>

      <View style={{ marginTop: 9, gap: 7 }}>
        <HeroSlot seed={seed} />
        <JobsActionRow openCount={openCount} />

        {/* 02 LEARN + 03 GAME */}
        <View style={{ flexDirection: "row", gap: 7 }}>
          <Link href="/learn" asChild>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={copy.home.learnTitle}
              style={({ pressed }) => ({ flex: 1, opacity: pressed ? 0.88 : 1 })}
            >
              <View
                style={{
                  flex: 1,
                  minHeight: 178,
                  borderWidth: 1,
                  borderColor: color.line,
                  borderRadius: radii.r3,
                  backgroundColor: color.paper,
                  padding: 11,
                  overflow: "hidden",
                }}
              >
                <Image
                  source={require("../../assets/home/classroom-card.webp")}
                  style={{ position: "absolute", right: 3, bottom: 5, width: 88, height: 99, zIndex: 0 }}
                  resizeMode="contain"
                />
                <View style={{ zIndex: 1, maxWidth: "56%" }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <Text style={{ color: color.teal, fontFamily: font.mono, fontSize: 7.5, letterSpacing: 0.08 * 7.5 }}>
                      {copy.home.learnLabel}
                    </Text>
                    <ArrowButton />
                  </View>
                  <Text
                    style={{
                      marginTop: 8,
                      fontFamily: font.display,
                      fontSize: 15,
                      lineHeight: 15 * 1.06,
                      letterSpacing: -0.035 * 15,
                      color: color.ink,
                    }}
                  >
                    {copy.home.learnTitle}
                  </Text>
                  {lessonCount != null ? (
                    <View style={{ marginTop: 8, borderTopWidth: 1, borderTopColor: color.line, paddingTop: 8 }}>
                      <Text
                        style={{
                          fontFamily: font.mono,
                          fontSize: 6,
                          fontWeight: "500",
                          color: color.slate,
                          letterSpacing: 0.04 * 6,
                        }}
                      >
                        {copy.home.learnLessons(lessonCount)}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </Pressable>
          </Link>

          <Pressable
            accessibilityRole="link"
            accessibilityLabel={copy.home.gameTitle}
            onPress={() => void openWeb(GAME_URL)}
            style={{
              flex: 1,
              minHeight: 178,
              borderWidth: 1,
              borderColor: color.line,
              borderRadius: radii.r3,
              backgroundColor: color.paper,
              padding: 11,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                bottom: 0,
                left: "46%",
                overflow: "hidden",
                zIndex: 0,
                borderTopRightRadius: radii.r3,
                borderBottomRightRadius: radii.r3,
              }}
            >
              <Image
                source={require("../../assets/home/game-card-faded.webp")}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
            </View>
            <View style={{ zIndex: 1, maxWidth: "54%" }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <Text style={{ color: color.amber, fontFamily: font.mono, fontSize: 7.5, letterSpacing: 0.08 * 7.5 }}>
                  {copy.home.gameLabel}
                </Text>
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: color.line,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <PlayGlyph />
                </View>
              </View>
              <Text
                style={{
                  marginTop: 8,
                  fontFamily: font.display,
                  fontSize: 15,
                  lineHeight: 15 * 1.06,
                  letterSpacing: -0.035 * 15,
                  color: color.ink,
                }}
              >
                {copy.home.gameTitle}
              </Text>
              <Text style={{ marginTop: 3, fontFamily: font.body, fontSize: 8.5, color: color.slate, lineHeight: 8.5 * 1.5 }}>
                {copy.home.gameDetail}
              </Text>
            </View>
            <View
              style={{
                position: "absolute",
                right: 7,
                bottom: 7,
                zIndex: 2,
                minHeight: 18,
                paddingHorizontal: 6,
                borderRadius: radii.pill,
                borderWidth: 1,
                borderColor: "rgba(0,31,63,0.2)",
                backgroundColor: "rgba(255,253,248,0.86)",
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Text style={{ fontFamily: font.mono, fontSize: 6.5, letterSpacing: 0.06 * 6.5, color: color.navy }}>
                <Text style={{ color: color.amber }}>01</Text>
                {" of 10 · demo"}
              </Text>
            </View>
          </Pressable>
        </View>

        {/* 04 YDC — glyph deferred: book cannot be View-built; awaiting KoKo PNG-or-drop. */}
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={copy.home.ydcTitle}
          onPress={() => void openStartInBrowser()}
          style={{
            width: "100%",
            backgroundColor: "#fff8df",
            borderWidth: 1,
            borderColor: "rgba(212,175,55,0.42)",
            borderRadius: radii.r3,
            paddingVertical: 10,
            paddingHorizontal: 11,
            flexDirection: "row",
            alignItems: "center",
            gap: 9,
            overflow: "hidden",
          }}
        >
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              right: -26,
              bottom: -1,
              width: 126,
              height: 70,
              borderTopLeftRadius: 63,
              borderTopRightRadius: 63,
              borderWidth: 1,
              borderBottomWidth: 0,
              borderColor: "rgba(212,175,55,0.30)",
            }}
          />
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              right: -6,
              bottom: -1,
              width: 86,
              height: 48,
              borderTopLeftRadius: 43,
              borderTopRightRadius: 43,
              borderWidth: 1,
              borderBottomWidth: 0,
              borderColor: "rgba(212,175,55,0.22)",
            }}
          />
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              right: 14,
              bottom: -1,
              width: 46,
              height: 26,
              borderTopLeftRadius: 23,
              borderTopRightRadius: 23,
              borderWidth: 1,
              borderBottomWidth: 0,
              borderColor: "rgba(212,175,55,0.16)",
            }}
          />
          <Text
            pointerEvents="none"
            style={{
              position: "absolute",
              right: 44,
              bottom: -16,
              fontFamily: font.display,
              fontSize: 56,
              fontWeight: "700",
              letterSpacing: -0.06 * 56,
              color: "rgba(212,175,55,0.16)",
              lineHeight: 56,
              zIndex: 0,
            }}
          >
            04
          </Text>
          <Image
            source={require("../../assets/home/ydc-glyph.png")}
            style={{ width: 26, height: 26, zIndex: 1 }}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
          <View style={{ flex: 1, zIndex: 1 }}>
            <Text style={{ color: color.amber, fontFamily: font.mono, fontSize: 7.5, letterSpacing: 0.08 * 7.5, marginBottom: 2 }}>
              {copy.home.ydcLabel} / YOUTH DEVELOPMENT CENTER
            </Text>
            <Text style={{ fontFamily: font.display, fontSize: 13, letterSpacing: -0.025 * 13, color: color.ink }}>
              {copy.home.ydcDetail}
            </Text>
          </View>
          <ArrowButton />
        </Pressable>

        <Text
          style={{
            marginTop: 3,
            fontFamily: font.mono,
            fontSize: 7.5,
            letterSpacing: 0.09 * 7.5,
            textTransform: "uppercase",
            color: color.amber,
          }}
        >
          {copy.home.doorsLabel}
        </Text>

        {/* 05–08 */}
        <View style={{ flexDirection: "row", gap: 7 }}>
          <DoorCard accessibilityLabel={copy.home.mayaTitle} onPress={() => void openWeb(MAYA_URL)}>
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                width: 118,
                height: 118,
                right: -44,
                top: -38,
                borderRadius: 59,
                borderWidth: 1,
                borderColor: "rgba(15,118,110,0.24)",
              }}
            />
            <View
              pointerEvents="none"
              style={{ position: "absolute", width: 1, height: 130, right: 14, top: -22, backgroundColor: "rgba(15,118,110,0.16)" }}
            />
            <View
              pointerEvents="none"
              style={{ position: "absolute", width: 132, height: 1, right: -18, top: 40, backgroundColor: "rgba(15,118,110,0.16)" }}
            />
            <ConstellationGlyph />
            <Text style={{ color: color.teal, fontFamily: font.mono, fontSize: 6.5, letterSpacing: 0.07 * 6.5, zIndex: 1 }}>
              {copy.home.mayaLabel}
            </Text>
            <Text
              style={{
                marginTop: 4,
                minHeight: 26,
                fontFamily: font.display,
                fontSize: 12,
                lineHeight: 12 * 1.08,
                letterSpacing: -0.03 * 12,
                color: color.ink,
                zIndex: 1,
              }}
            >
              {copy.home.mayaTitle}
            </Text>
          </DoorCard>

          <DoorCard accessibilityLabel={copy.home.trinityTitle} onPress={() => void openWeb(LOGIN_TRINITY)}>
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                width: 58,
                height: 58,
                left: 16,
                bottom: -28,
                borderRadius: 29,
                borderWidth: 1,
                borderColor: "rgba(212,175,55,0.32)",
              }}
            />
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                width: 58,
                height: 58,
                left: 46,
                bottom: -28,
                borderRadius: 29,
                borderWidth: 1,
                borderColor: "rgba(212,175,55,0.24)",
              }}
            />
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                width: 58,
                height: 58,
                left: 31,
                bottom: -8,
                borderRadius: 29,
                borderWidth: 1,
                borderColor: "rgba(212,175,55,0.18)",
              }}
            />
            <Text style={{ color: color.amber, fontFamily: font.mono, fontSize: 6.5, letterSpacing: 0.07 * 6.5, zIndex: 1 }}>
              {copy.home.trinityLabel}
            </Text>
            <Text
              style={{
                marginTop: 4,
                minHeight: 26,
                fontFamily: font.display,
                fontSize: 12,
                lineHeight: 12 * 1.08,
                letterSpacing: -0.03 * 12,
                color: color.ink,
                zIndex: 1,
              }}
            >
              {copy.home.trinityTitle}
            </Text>
            <View style={{ flexDirection: "row", gap: 3, marginTop: 5, zIndex: 1 }}>
              {[copy.home.trinityFree, copy.home.trinityPremium, copy.home.trinityPro].map((tier) => (
                <Text
                  key={tier}
                  style={{
                    borderLeftWidth: 2,
                    borderLeftColor: color.gold,
                    paddingLeft: 4,
                    fontFamily: font.mono,
                    fontSize: 5.5,
                    letterSpacing: 0.05 * 5.5,
                    textTransform: "uppercase",
                    color: color.navy,
                  }}
                >
                  {tier}
                </Text>
              ))}
            </View>
          </DoorCard>
        </View>

        <View style={{ flexDirection: "row", gap: 7 }}>
          <DoorCard accessibilityLabel={copy.home.cvTitle} onPress={() => void openWeb(CV_URL)}>
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                width: 66,
                height: 88,
                right: -24,
                bottom: -30,
                borderRadius: 5,
                borderWidth: 1,
                borderColor: "rgba(92,104,115,0.26)",
                transform: [{ rotate: "-8deg" }],
              }}
            />
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                width: 66,
                height: 88,
                right: -11,
                bottom: -35,
                borderRadius: 5,
                borderWidth: 1,
                borderColor: "rgba(92,104,115,0.15)",
                transform: [{ rotate: "5deg" }],
              }}
            />
            <Text style={{ color: color.slate, fontFamily: font.mono, fontSize: 6.5, letterSpacing: 0.07 * 6.5, zIndex: 1 }}>
              {copy.home.cvLabel}
            </Text>
            <Text
              style={{
                marginTop: 4,
                minHeight: 26,
                fontFamily: font.display,
                fontSize: 12,
                lineHeight: 12 * 1.08,
                letterSpacing: -0.03 * 12,
                color: color.ink,
                zIndex: 1,
              }}
            >
              {copy.home.cvTitle}
            </Text>
          </DoorCard>

          <DoorCard accessibilityLabel={copy.home.referTitle} onPress={() => void openWeb(REFERRALS_URL)}>
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                width: 110,
                height: 110,
                left: 2,
                bottom: -52,
                borderRadius: 55,
                borderWidth: 1,
                borderColor: "rgba(161,98,7,0.16)",
              }}
            />
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                width: 16,
                height: 16,
                left: 16,
                bottom: 15,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: "rgba(161,98,7,0.5)",
                backgroundColor: "rgba(161,98,7,0.09)",
              }}
            />
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                width: 16,
                height: 16,
                right: -3,
                bottom: 42,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: "rgba(161,98,7,0.5)",
                backgroundColor: "rgba(161,98,7,0.09)",
              }}
            />
            <Text style={{ color: color.amber, fontFamily: font.mono, fontSize: 6.5, letterSpacing: 0.07 * 6.5, zIndex: 1 }}>
              {copy.home.referLabel}
            </Text>
            <Text
              style={{
                marginTop: 4,
                minHeight: 26,
                fontFamily: font.display,
                fontSize: 12,
                lineHeight: 12 * 1.08,
                letterSpacing: -0.03 * 12,
                color: color.ink,
                zIndex: 1,
              }}
            >
              {copy.home.referTitle}
            </Text>
          </DoorCard>
        </View>

        <Text
          style={{
            marginTop: 1,
            paddingTop: 7,
            borderTopWidth: 1,
            borderTopColor: color.line,
            color: color.slate,
            fontFamily: font.body,
            fontSize: 6.5,
            lineHeight: 6.5 * 1.7,
          }}
        >
          {copy.home.provenance}
        </Text>
      </View>
    </ScrollView>
  );
}
