import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { copy } from "../../src/copy/en";
import { color } from "../../src/theme";

function TabIcon({ name, color: iconColor, size }: { name: React.ComponentProps<typeof Ionicons>["name"]; color: string; size: number }) {
  return <Ionicons name={name} color={iconColor} size={size} accessibilityElementsHidden />;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: color.navy },
        headerTintColor: color.white,
        headerTitleStyle: { fontWeight: "700" },
        tabBarActiveTintColor: color.navy,
        tabBarInactiveTintColor: color.muted,
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
        tabBarStyle: { minHeight: 64, paddingTop: 6, paddingBottom: 6 },
      }}
      initialRouteName="home"
    >
      <Tabs.Screen
        name="home"
        options={{
          title: copy.nav.home,
          headerShown: false,
          tabBarAccessibilityLabel: copy.nav.home,
          tabBarIcon: ({ color: iconColor, size }) => <TabIcon name="home-outline" color={iconColor} size={size} />,
        }}
      />
      <Tabs.Screen
        name="jobs"
        options={{
          title: copy.nav.jobs,
          tabBarAccessibilityLabel: copy.nav.jobs,
          tabBarIcon: ({ color: iconColor, size }) => <TabIcon name="briefcase-outline" color={iconColor} size={size} />,
        }}
      />
      <Tabs.Screen
        name="learn"
        options={{
          title: copy.nav.learn,
          tabBarAccessibilityLabel: copy.nav.learn,
          tabBarIcon: ({ color: iconColor, size }) => <TabIcon name="book-outline" color={iconColor} size={size} />,
        }}
      />
      <Tabs.Screen
        name="earn"
        options={{
          title: copy.nav.earn,
          tabBarAccessibilityLabel: copy.nav.earn,
          tabBarIcon: ({ color: iconColor, size }) => <TabIcon name="cash-outline" color={iconColor} size={size} />,
        }}
      />
      <Tabs.Screen
        name="me"
        options={{
          title: copy.nav.me,
          headerShown: false,
          tabBarAccessibilityLabel: copy.nav.me,
          tabBarIcon: ({ color: iconColor, size }) => <TabIcon name="person-outline" color={iconColor} size={size} />,
        }}
      />
    </Tabs>
  );
}
