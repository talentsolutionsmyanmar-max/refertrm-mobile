import { Tabs } from "expo-router";
import { Text } from "react-native";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: "#001F3F" },
        headerTintColor: "#FFFFFF",
        headerTitleStyle: { fontWeight: "700" },
        tabBarActiveTintColor: "#001F3F",
        tabBarInactiveTintColor: "#64748B",
        tabBarStyle: { height: 56 },
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Jobs",
          tabBarIcon: () => <Text style={{ color: "#0D9488" }}>J</Text>,
        }}
      />
      <Tabs.Screen
        name="academy"
        options={{
          title: "Academy",
          tabBarIcon: () => <Text style={{ color: "#0D9488" }}>A</Text>,
        }}
      />
    </Tabs>
  );
}
