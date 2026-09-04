import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { copy } from "../../src/copy/en";
import { color } from "../../src/theme";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const tabBarPaddingBottom = Math.max(insets.bottom, 10);

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: color.navy },
        headerTintColor: color.white,
        headerTitleStyle: { fontWeight: "700" },
        tabBarActiveTintColor: color.navy,
        tabBarInactiveTintColor: color.muted,
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600", lineHeight: 16 },
        tabBarItemStyle: { paddingTop: 4, paddingBottom: 2 },
        tabBarStyle: {
          minHeight: 62 + tabBarPaddingBottom,
          paddingTop: 6,
          paddingBottom: tabBarPaddingBottom,
        },
      }}
      initialRouteName="home"
    >
      <Tabs.Screen
        name="home"
        options={{
          title: copy.nav.home,
          headerShown: false,
          tabBarAccessibilityLabel: copy.nav.home,
        }}
      />
      <Tabs.Screen
        name="jobs"
        options={{
          title: copy.nav.jobs,
          tabBarAccessibilityLabel: copy.nav.jobs,
        }}
      />
      <Tabs.Screen
        name="learn"
        options={{
          title: copy.nav.learn,
          tabBarAccessibilityLabel: copy.nav.learn,
        }}
      />
      <Tabs.Screen
        name="earn"
        options={{
          title: copy.nav.earn,
          tabBarAccessibilityLabel: copy.nav.earn,
        }}
      />
      <Tabs.Screen
        name="me"
        options={{
          title: copy.nav.me,
          headerShown: false,
          tabBarAccessibilityLabel: copy.nav.me,
        }}
      />
    </Tabs>
  );
}
