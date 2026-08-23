import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { Link } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HomeAction, HomeModule } from "../../src/components/home/HomeModule";
import { color, tap } from "../../src/theme";

const GAME_URL = "https://www.refertrm.com/eq/game";
const MAYA_URL = "https://www.refertrm.com/eq/maya";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: color.paper }}
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: Math.max(insets.top, 16), paddingBottom: 32, gap: 12 }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", minHeight: tap }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: color.muted, fontSize: 13 }}>Your ReferTRM journey</Text>
          <Text style={{ color: color.navy, fontSize: 24, lineHeight: 31, fontWeight: "700" }}>Build your next move</Text>
        </View>
        <View
          accessible
          accessibilityLabel="Guest profile"
          style={{ width: tap, height: tap, borderRadius: 24, borderWidth: 1, borderColor: color.line, alignItems: "center", justifyContent: "center" }}
        >
          <Text style={{ color: color.muted, fontSize: 11, fontWeight: "700" }}>Guest</Text>
        </View>
      </View>

      <HomeModule
        eyebrow="Your journey"
        title="Career Game and Maya are ready on ReferTRM.com"
        detail="Sign in in your browser to continue. This app will not claim progress until it refreshes."
      >
        <View style={{ flexDirection: "row", gap: 8, marginTop: 14 }}>
          <HomeAction label="Continue Career Game" icon="game-controller-outline" tone="navy" onPress={() => void Linking.openURL(GAME_URL)} />
          <HomeAction label="Ask Maya" icon="sparkles-outline" tone="gold" onPress={() => void Linking.openURL(MAYA_URL)} />
        </View>
      </HomeModule>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <HomeModule eyebrow="Earn" title="— MMK" detail="Shown after verification" accent="gold" />
        </View>
        <View style={{ flex: 1 }}>
          <HomeModule eyebrow="Trinity" title="Career DNA" detail="Sign in to view your verified readiness" accent="teal" />
        </View>
      </View>

      <Link href="/jobs" asChild>
        <Pressable accessibilityRole="link" accessibilityLabel="Featured jobs">
          <HomeModule eyebrow="Featured jobs" title="Explore public roles" detail="Browse current roles without sign-in." accent="gold" />
        </Pressable>
      </Link>
      <Link href="/learn" asChild>
        <Pressable accessibilityRole="link" accessibilityLabel="Explore Learn">
          <HomeModule eyebrow="Explore Learn" title="Build practical career judgment" detail="Open published lessons and local practice questions." accent="teal" />
        </Pressable>
      </Link>

      <HomeModule
        eyebrow="Journey progress"
        title="Trinity · Learn · Career Game · CV · Jobs · Earn"
        detail="Verified progress appears after sign-in. No progress is estimated on this device."
      />

      <View style={{ gap: 8 }}>
        <HomeModule eyebrow="CV & Profile" title="Build and manage on ReferTRM.com" detail="Sign-in required · opens in your browser" />
        <HomeModule eyebrow="Saved" title="Saved on this device" detail="Account sync is not available in this version." />
        <HomeModule eyebrow="Notifications" title="Sign in to view updates" detail="Unread status is not available to this app yet." />
        <HomeModule eyebrow="Settings" title="Language, theme and data saver" detail="Device settings are available from Me." />
      </View>
    </ScrollView>
  );
}
