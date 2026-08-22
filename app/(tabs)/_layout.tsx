import { Tabs } from "expo-router";
import { Text } from "react-native";
import { copy } from "../../src/copy/en";
import { color } from "../../src/theme";

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
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: copy.nav.jobs,
          tabBarIcon: () => <Text style={{ color: color.teal, fontWeight: "800" }}>J</Text>,
        }}
      />
      <Tabs.Screen
        name="academy"
        options={{
          title: copy.nav.academy,
          tabBarIcon: () => <Text style={{ color: color.teal, fontWeight: "800" }}>A</Text>,
        }}
      />
    </Tabs>
  );
}
