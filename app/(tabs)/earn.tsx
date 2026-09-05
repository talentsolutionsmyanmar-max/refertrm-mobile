import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HomeModule } from "../../src/components/home/HomeModule";
import { ModuleState } from "../../src/components/states/ModuleState";
import { REFERRALS_URL, openWeb } from "../../src/linking/start";
import { color } from "../../src/theme";

export default function EarnScreen() {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: color.paper }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 + insets.bottom, gap: 12 }}
    >
      <View style={{ borderRadius: 12, backgroundColor: color.navy, padding: 18 }}>
        <Text style={{ color: color.white, fontSize: 10, fontWeight: "700", letterSpacing: 1.5, textTransform: "uppercase" }}>
          Your referral earnings
        </Text>
        <Text style={{ color: color.white, fontSize: 27, fontWeight: "800", marginTop: 12 }}>— MMK</Text>
        <Text style={{ color: color.white, fontSize: 13, marginTop: 5 }}>Shown after verification</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
          {['Earned —', 'Pending —', 'Paid —'].map((label) => (
            <View key={label} style={{ borderRadius: 999, backgroundColor: "rgba(255,255,255,0.1)", paddingHorizontal: 10, paddingVertical: 7 }}>
              <Text style={{ color: color.white, fontSize: 11, fontWeight: "700" }}>{label}</Text>
            </View>
          ))}
        </View>
      </View>

      <HomeModule
        eyebrow="How it works"
        title="Recommend roles you genuinely trust"
        detail="If an eligible referral is hired and passes probation, verified reward status appears on ReferTRM.com. The candidate never pays."
        accent="gold"
      />

      <ModuleState
        kind="auth-required"
        title="Referral activity requires sign-in"
        detail="Open ReferTRM.com to view eligibility, earned, pending and paid statuses. This app does not estimate a balance."
        actionLabel="View referrals on ReferTRM.com"
        onAction={() => void openWeb(REFERRALS_URL)}
      />
    </ScrollView>
  );
}
