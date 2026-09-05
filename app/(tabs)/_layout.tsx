import { Tabs } from "expo-router";
import { Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { copy } from "../../src/copy/en";
import { color } from "../../src/theme";

function TabLetter({ letter, color: iconColor }: { letter: string; color: string }) {
  return (
    <Text accessibilityElementsHidden style={{ color: iconColor, fontSize: 13, fontWeight: "700", lineHeight: 16 }}>
      {letter}
    </Text>
  );
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
        tabBarIcon: ({ color: iconColor }) => <TabLetter letter="" color={iconColor} />,
      }}
      initialRouteName="home"
    >
      <Tabs.Screen
        name="home"
        options={{
          title: copy.nav.home,
          headerShown: false,
          tabBarAccessibilityLabel: copy.nav.home,
          tabBarIcon: ({ color: iconColor }) => <TabLetter letter="H" color={iconColor} />,
        }}
      />
      <Tabs.Screen
        name="jobs"
        options={{
          title: copy.nav.jobs,
          tabBarAccessibilityLabel: copy.nav.jobs,
          tabBarIcon: ({ color: iconColor }) => <TabLetter letter="J" color={iconColor} />,
        }}
      />
      <Tabs.Screen
        name="learn"
        options={{
          title: copy.nav.learn,
          tabBarAccessibilityLabel: copy.nav.learn,
          tabBarIcon: ({ color: iconColor }) => <TabLetter letter="L" color={iconColor} />,
        }}
      />
      <Tabs.Screen
        name="earn"
        options={{
          title: copy.nav.earn,
          tabBarAccessibilityLabel: copy.nav.earn,
          tabBarIcon: ({ color: iconColor }) => <TabLetter letter="E" color={iconColor} />,
        }}
      />
      <Tabs.Screen
        name="me"
        options={{
          title: copy.nav.me,
          headerShown: false,
          tabBarAccessibilityLabel: copy.nav.me,
          tabBarIcon: ({ color: iconColor }) => <TabLetter letter="M" color={iconColor} />,
        }}
      />
    </Tabs>
  );
}
