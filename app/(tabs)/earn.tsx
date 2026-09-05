import { ScrollView } from "react-native";
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
