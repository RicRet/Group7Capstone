import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../app/Theme";

const Settings: React.FC = () => {
  const router = useRouter();
  const { theme, isDark, toggleTheme } = useTheme();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);

  const handleBackPress = () => {
    router.replace("/homepage");
  };

  const handleClearCache = () => {
    Alert.alert("Clear Cache", "Are you sure you want to clear app cache?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        onPress: () => Alert.alert("Success", "Cache cleared successfully"),
        style: "destructive",
      },
    ]);
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        onPress: () => router.replace("/Login"),
        style: "destructive",
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.header }]}>
        <TouchableOpacity onPress={handleBackPress}>
          <Text style={[styles.backButton, { color: theme.green }]}>
            ← Back
          </Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Settings
        </Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.contentContainer}>
        {/* Notifications */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.green }]}>
            Notifications
          </Text>

          {[
            {
              label: "Push Notifications",
              desc: "Receive navigation alerts",
              value: notificationsEnabled,
              setValue: setNotificationsEnabled,
            },
            {
              label: "Sound",
              desc: "Play navigation sounds",
              value: soundEnabled,
              setValue: setSoundEnabled,
            },
            {
              label: "Vibration",
              desc: "Haptic feedback on alerts",
              value: vibrationEnabled,
              setValue: setVibrationEnabled,
            },
          ].map((item, i) => (
            <View
              key={i}
              style={[styles.settingItem, { backgroundColor: theme.box }]}
            >
              <View>
                <Text style={[styles.settingLabel, { color: theme.text }]}>
                  {item.label}
                </Text>
                <Text style={[styles.settingDescription, { color: theme.lighttext }]}>
                  {item.desc}
                </Text>
              </View>
              <Switch
                value={item.value}
                onValueChange={item.setValue}
                trackColor={{ false: "#aaa", true: theme.green }}
                thumbColor="#fff"
              />
            </View>
          ))}

          {/* 🌗 Dark Mode Toggle */}
          <View style={[styles.settingItem, { backgroundColor: theme.box }]}>
            <View>
              <Text style={[styles.settingLabel, { color: theme.text }]}>
                Dark Mode
              </Text>
              <Text style={[styles.settingDescription, { color: theme.lighttext }]}>
                Switch between light and dark theme
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: "#ccc", true: theme.green }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* App */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.green }]}>App</Text>

          <TouchableOpacity
            style={[styles.buttonItem, { backgroundColor: theme.box }]}
            onPress={handleClearCache}
          >
            <View>
              <Text style={[styles.settingLabel, { color: theme.text }]}>
                Clear Cache
              </Text>
              <Text style={[styles.settingDescription, { color: theme.lighttext }]}>
                Free up storage space
              </Text>
            </View>
            <Text style={[styles.arrow, { color: theme.green }]}>›</Text>
          </TouchableOpacity>

          <View style={[styles.buttonItem, { backgroundColor: theme.box }]}>
            <View>
              <Text style={[styles.settingLabel, { color: theme.text }]}>
                App Version
              </Text>
              <Text style={[styles.settingDescription, { color: theme.lighttext }]}>
                1.0.0
              </Text>
            </View>
          </View>
        </View>

        {/* Account */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.green }]}>
            Account
          </Text>

          <TouchableOpacity
            style={[
              styles.logoutButton,
              { borderColor: theme.red, backgroundColor: theme.box },
            ]}
            onPress={handleLogout}
          >
            <Text style={[styles.logoutText, { color: theme.red }]}>
              Logout
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default Settings;

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  backButton: { fontSize: 16, fontWeight: "600" },
  headerTitle: { fontSize: 20, fontWeight: "700" },
  contentContainer: { padding: 16, paddingBottom: 32 },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 12,
    marginLeft: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  buttonItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  settingLabel: { fontSize: 16, fontWeight: "600", marginBottom: 4 },
  settingDescription: { fontSize: 12 },
  arrow: { fontSize: 24, fontWeight: "300" },
  logoutButton: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  logoutText: { fontSize: 16, fontWeight: "600" },
});
