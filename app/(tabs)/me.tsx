import { useState } from "react";
import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ModuleState } from "../../src/components/states/ModuleState";
import { getDeviceSettings, setDeviceSetting, type DeviceSettings } from "../../src/storage/settings";
import { color, tap } from "../../src/theme";

const SETTINGS_URL = "https://www.refertrm.com/eq/settings";

function ToolRow({ title, detail }: { title: string; detail: string }) {
  return (
    <View style={{ minHeight: 64, flexDirection: "row", gap: 12, alignItems: "center", paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: color.line }}>
      <View style={{ flex: 1 }}>
        <Text style={{ color: color.navy, fontSize: 15, fontWeight: "700" }}>{title}</Text>
        <Text style={{ color: color.muted, fontSize: 12, lineHeight: 18, marginTop: 2 }}>{detail}</Text>
      </View>
    </View>
  );
}

function SettingRow({ label, value, onPress }: { label: string; value: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
      onPress={onPress}
      style={({ pressed }) => ({ minHeight: tap, flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 14, paddingVertical: 10, opacity: pressed ? 0.72 : 1 })}
    >
      <Text style={{ color: color.navy, fontSize: 15, fontWeight: "600" }}>{label}</Text>
      <Text style={{ color: color.tealDark, fontSize: 14, fontWeight: "700" }}>{value}</Text>
    </Pressable>
  );
}

export default function MeScreen() {
  const insets = useSafeAreaInsets();
  const [settings, setSettings] = useState<DeviceSettings>(() => getDeviceSettings());
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: color.paper }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 + insets.bottom, gap: 12 }}
    >
      <Text style={{ color: color.navy, fontSize: 24, lineHeight: 31, fontWeight: "700" }}>Me</Text>
      <ModuleState
        kind="auth-required"
        title="Account & sign in"
        detail="Sign in on ReferTRM.com to view verified identity and private records."
        actionLabel="Open account settings"
        onAction={() => void Linking.openURL(SETTINGS_URL)}
      />

      <View style={{ borderWidth: 1, borderColor: color.line, borderRadius: 12, backgroundColor: color.cream, overflow: "hidden" }}>
        <ToolRow title="Trinity" detail="Career DNA requires sign-in" />
        <ToolRow title="CV & Profile" detail="Open and edit on ReferTRM.com" />
        <ToolRow title="Saved on this device" detail="Not account-synced" />
        <ToolRow title="Notifications" detail="Private updates require sign-in" />
      </View>

      <View style={{ borderWidth: 1, borderColor: color.line, borderRadius: 12, backgroundColor: color.cream, overflow: "hidden" }}>
        <Text style={{ color: color.muted, fontSize: 10, fontWeight: "700", letterSpacing: 1.5, textTransform: "uppercase", padding: 14, paddingBottom: 4 }}>
          Device settings
        </Text>
        <SettingRow
          label="Language"
          value={settings.language}
          onPress={() => setSettings(setDeviceSetting("language", settings.language === "English" ? "Myanmar" : "English"))}
        />
        <SettingRow
          label="Theme"
          value={settings.theme}
          onPress={() => setSettings(setDeviceSetting("theme", settings.theme === "Light" ? "System" : "Light"))}
        />
        <SettingRow
          label="Data saver"
          value={settings.dataSaver ? "On" : "Off"}
          onPress={() => setSettings(setDeviceSetting("dataSaver", !settings.dataSaver))}
        />
        <Text style={{ color: color.muted, fontSize: 12, lineHeight: 18, paddingHorizontal: 14, paddingBottom: 14 }}>
          Preferences are stored only on this device and apply where supported by this shell.
        </Text>
      </View>
    </ScrollView>
  );
}
