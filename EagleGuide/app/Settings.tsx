import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import { useTheme } from "../app/Theme";
import { ColorBlindMode, useColorBlindMode } from "./ColorBlindMode";
import { useAccessibility } from "./Fontsize";
import { useSession } from "./lib/session";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const Settings: React.FC = () => {
  const router = useRouter();
  const { theme, isDark, toggleTheme } = useTheme();
    const { colorBlindMode, setColorBlindMode } = useColorBlindMode();

  const [colorBlindOpen, setColorBlindOpen] = useState(false);
  const [colorBlindItems, setColorBlindItems] = useState([
    { label: "Default", value: "default" as ColorBlindMode },
    { label: "Tritanopia", value: "tritanopia" as ColorBlindMode },
    { label: "Protanopia", value: "protanopia" as ColorBlindMode },
    { label: "Deuteranopia", value: "deuteranopia" as ColorBlindMode },
  ]);
  const { user } = useSession();
  const { largeTextEnabled, toggleLargeText, scaleFont } = useAccessibility();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);

  useEffect(() => {
    Notifications.requestPermissionsAsync();
  }, []);

  const handleBackPress = () => router.replace("/map");

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

  const sendNotification = async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Notification",
        body: "This is a notification.",
        sound: true,
      },
      trigger: null,
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.header }]}>
        <TouchableOpacity onPress={handleBackPress}>
          <Text style={[styles.backButton, { color: theme.green, fontSize: scaleFont(16) }]}>
            ← Back
          </Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text, fontSize: scaleFont(20) }]}>
          Settings
        </Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.contentContainer}>
        {/* Profile */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.green, fontSize: scaleFont(14) }]}>
            Profile
          </Text>
          <TouchableOpacity
            style={[styles.profileCard, { backgroundColor: theme.box, borderColor: theme.border }]}
            onPress={() => router.push("/EditProfile" as any)}
          >
            <View style={styles.profileInfo}>
              <View style={[styles.avatarCircle, { backgroundColor: theme.green }]}>
                <Text style={[styles.avatarInitial, { fontSize: scaleFont(20) }]}>
                  {(user?.firstName?.[0] ?? user?.username?.[0] ?? "?").toUpperCase()}
                </Text>
              </View>
              <View style={styles.profileText}>
                <Text style={[styles.profileName, { color: theme.text, fontSize: scaleFont(16) }]}>
                  {user?.firstName && user?.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user?.firstName ?? user?.username ?? "Unknown"}
                </Text>
                {!!user?.username && (
                  <Text style={[styles.profileUsername, { color: theme.lighttext, fontSize: scaleFont(13) }]}>
                    @{user.username}
                  </Text>
                )}
                {!!user?.email && (
                  <Text style={[styles.profileEmail, { color: theme.lighttext, fontSize: scaleFont(12) }]}>
                    {user.email}
                  </Text>
                )}
              </View>
            </View>
            <Text style={[styles.arrow, { color: theme.green, fontSize: scaleFont(24) }]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.green, fontSize: scaleFont(14) }]}>
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
                <Text style={[styles.settingLabel, { color: theme.text, fontSize: scaleFont(16) }]}>
                  {item.label}
                </Text>
                <Text style={[styles.settingDescription, { color: theme.lighttext, fontSize: scaleFont(12) }]}>
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

          {/* Test Notification */}
          <TouchableOpacity
            style={[styles.buttonItem, { backgroundColor: theme.box }]}
            onPress={sendNotification}
          >
            <View>
              <Text style={[styles.settingLabel, { color: theme.text, fontSize: scaleFont(16) }]}>
                Send Test Notification
              </Text>
              <Text style={[styles.settingDescription, { color: theme.lighttext, fontSize: scaleFont(12) }]}>
                Send a sample notification
              </Text>
            </View>
            <Text style={[styles.arrow, { color: theme.green, fontSize: scaleFont(24) }]}>›</Text>
          </TouchableOpacity>

          {/* Dark Mode */}
          <View style={[styles.settingItem, { backgroundColor: theme.box }]}>
            <View>
              <Text style={[styles.settingLabel, { color: theme.text, fontSize: scaleFont(16) }]}>
                Dark Mode
              </Text>
              <Text style={[styles.settingDescription, { color: theme.lighttext, fontSize: scaleFont(12) }]}>
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

          {/* Large Text / Accessibility */}
          <View style={[styles.settingItem, { backgroundColor: theme.box }]}>
            <View>
              <Text style={[styles.settingLabel, { color: theme.text, fontSize: scaleFont(16) }]}>
                Large Text
              </Text>
              <Text style={[styles.settingDescription, { color: theme.lighttext, fontSize: scaleFont(12) }]}>
                Increase font size for accessibility
              </Text>
                        <View style={[styles.dropdownSection, { zIndex: 3000 }]}>
            <Text
              style={[
                styles.settingLabel,
                { color: theme.text, fontSize: scaleFont(16), marginBottom: 4 },
              ]}
            >
              Map Color Mode
            </Text>
            <Text
              style={[
                styles.settingDescription,
                { color: theme.lighttext, fontSize: scaleFont(12), marginBottom: 10 },
              ]}
            >
              Change colors for color-blind accessibility
            </Text>

            <DropDownPicker
              open={colorBlindOpen}
              value={colorBlindMode}
              items={colorBlindItems}
              setOpen={setColorBlindOpen}
              setItems={setColorBlindItems}
              setValue={(callback) => {
                const nextValue = callback(colorBlindMode) as ColorBlindMode;
                setColorBlindMode(nextValue);
              }}
              listMode="SCROLLVIEW"
              style={[
                styles.dropdown,
                { backgroundColor: theme.box, borderColor: theme.border },
              ]}
              dropDownContainerStyle={[
                styles.dropdownContainer,
                { backgroundColor: theme.box, borderColor: theme.border },
              ]}
              textStyle={{ color: theme.text, fontSize: scaleFont(14) }}
              labelStyle={{ color: theme.text }}
              listItemLabelStyle={{ color: theme.text }}
            />
          </View>
            </View>
            <Switch
              value={largeTextEnabled}
              onValueChange={toggleLargeText}
              trackColor={{ false: "#ccc", true: theme.green }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* App */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.green, fontSize: scaleFont(14) }]}>App</Text>

          <TouchableOpacity
            style={[styles.buttonItem, { backgroundColor: theme.box }]}
            onPress={handleClearCache}
          >
            <View>
              <Text style={[styles.settingLabel, { color: theme.text, fontSize: scaleFont(16) }]}>
                Clear Cache
              </Text>
              <Text style={[styles.settingDescription, { color: theme.lighttext, fontSize: scaleFont(12) }]}>
                Free up storage space
              </Text>
            </View>
            <Text style={[styles.arrow, { color: theme.green, fontSize: scaleFont(24) }]}>›</Text>
          </TouchableOpacity>

          <View style={[styles.buttonItem, { backgroundColor: theme.box }]}>
            <View>
              <Text style={[styles.settingLabel, { color: theme.text, fontSize: scaleFont(16) }]}>
                App Version
              </Text>
              <Text style={[styles.settingDescription, { color: theme.lighttext, fontSize: scaleFont(12) }]}>
                1.0.0
              </Text>
            </View>
          </View>
        </View>

        {/* Account */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.green, fontSize: scaleFont(14) }]}>
            Account
          </Text>

          <TouchableOpacity
            style={[
              styles.logoutButton,
              { borderColor: theme.red, backgroundColor: theme.box },
            ]}
            onPress={handleLogout}
          >
            <Text style={[styles.logoutText, { color: theme.red, fontSize: scaleFont(16) }]}>
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
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  profileInfo: { flexDirection: "row", alignItems: "center", flex: 1 },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  avatarInitial: { color: "#fff", fontSize: 20, fontWeight: "700" },
  profileText: { flex: 1 },
  profileName: { fontSize: 16, fontWeight: "700" },
  profileUsername: { fontSize: 13, marginTop: 2 },
  profileEmail: { fontSize: 12, marginTop: 2 },
  dropdownSection: {
    marginTop: 8,
    marginBottom: 8,
  },
  dropdown: {
    borderRadius: 8,
    minHeight: 48,
  },
  dropdownContainer: {
    borderRadius: 8,
  },
});
