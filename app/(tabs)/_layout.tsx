import { Tabs } from "expo-router";
import { Image, type ImageSourcePropType } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { copy } from "../../src/copy/en";
import { color } from "../../src/theme";

function TabMark({ icon, color: iconColor }: { icon: ImageSourcePropType; color: string }) {
  return <Image source={icon} style={{ width: 22, height: 22, tintColor: iconColor }} accessibilityElementsHidden />;
}

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
          tabBarIcon: ({ color: iconColor }) => <TabMark icon={require("../../assets/tabs/home.png")} color={iconColor} />,
        }}
      />
      <Tabs.Screen
        name="jobs"
        options={{
          title: copy.nav.jobs,
          tabBarAccessibilityLabel: copy.nav.jobs,
          tabBarIcon: ({ color: iconColor }) => <TabMark icon={require("../../assets/tabs/jobs.png")} color={iconColor} />,
        }}
      />
      <Tabs.Screen
        name="learn"
        options={{
          title: copy.nav.learn,
          tabBarAccessibilityLabel: copy.nav.learn,
          tabBarIcon: ({ color: iconColor }) => <TabMark icon={require("../../assets/tabs/learn.png")} color={iconColor} />,
        }}
      />
      <Tabs.Screen
        name="earn"
        options={{
          title: copy.nav.earn,
          tabBarAccessibilityLabel: copy.nav.earn,
          tabBarIcon: ({ color: iconColor }) => <TabMark icon={require("../../assets/tabs/earn.png")} color={iconColor} />,
        }}
      />
      <Tabs.Screen
        name="me"
        options={{
          title: copy.nav.me,
          headerShown: false,
          tabBarAccessibilityLabel: copy.nav.me,
          tabBarIcon: ({ color: iconColor }) => <TabMark icon={require("../../assets/tabs/me.png")} color={iconColor} />,
        }}
      />
    </Tabs>
  );
}
