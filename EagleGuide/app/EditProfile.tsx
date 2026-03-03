import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useTheme } from "../app/Theme";
import { useSession } from "./lib/session";

const EditProfile: React.FC = () => {
  const router = useRouter();
  const { theme } = useTheme();
  const { user, updateProfile } = useSession();

  const [username, setUsername] = useState(user?.username ?? "");
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Keep fields in sync if session loads after mount
  useEffect(() => {
    if (user) {
      setUsername(user.username ?? "");
      setFirstName(user.firstName ?? "");
      setLastName(user.lastName ?? "");
      setAvatarUrl(user.avatarUrl ?? "");
    }
  }, [user]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!username.trim()) errs.username = "Username is required";
    else if (username.trim().length < 3) errs.username = "Username must be at least 3 characters";
    else if (username.trim().length > 30) errs.username = "Username cannot exceed 30 characters";
    if (firstName.trim().length > 50) errs.firstName = "First name cannot exceed 50 characters";
    if (lastName.trim().length > 50) errs.lastName = "Last name cannot exceed 50 characters";
    if (avatarUrl.trim() && !/^https?:\/\/.+/.test(avatarUrl.trim())) {
      errs.avatarUrl = "Avatar URL must be a valid http/https URL";
    }
    return errs;
  };

  const handleSave = async () => {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    try {
      const fields: Record<string, string> = {};
      if (username.trim() !== (user?.username ?? "")) fields.username = username.trim();
      if (firstName.trim() !== (user?.firstName ?? "")) fields.firstName = firstName.trim();
      if (lastName.trim() !== (user?.lastName ?? "")) fields.lastName = lastName.trim();
      if (avatarUrl.trim() !== (user?.avatarUrl ?? "")) fields.avatarUrl = avatarUrl.trim();

      if (Object.keys(fields).length === 0) {
        Alert.alert("No Changes", "You haven't changed anything.");
        setSaving(false);
        return;
      }

      await updateProfile(fields);
      Alert.alert("Saved", "Your profile has been updated.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert("Error", err?.message ?? "Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = [
    styles.input,
    { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border },
  ];

  const renderField = (
    label: string,
    key: string,
    value: string,
    setter: (v: string) => void,
    placeholder: string,
    options?: { autoCapitalize?: "none" | "sentences" | "words"; keyboardType?: "default" | "url" }
  ) => (
    <View style={styles.fieldGroup} key={key}>
      <Text style={[styles.label, { color: theme.lighttext }]}>{label}</Text>
      <TextInput
        style={[inputStyle, errors[key] ? { borderColor: theme.red } : {}]}
        value={value}
        onChangeText={(v) => {
          setter(v);
          if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
        }}
        placeholder={placeholder}
        placeholderTextColor={theme.lighttext}
        autoCapitalize={options?.autoCapitalize ?? "words"}
        autoCorrect={false}
        keyboardType={options?.keyboardType ?? "default"}
      />
      {!!errors[key] && (
        <Text style={[styles.errorText, { color: theme.red }]}>{errors[key]}</Text>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.header }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backButton, { color: theme.green }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color={theme.green} />
          ) : (
            <Text style={[styles.saveButton, { color: theme.green }]}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="handled">
        {/* Read-only email banner */}
        {!!user?.email && (
          <View style={[styles.emailBanner, { backgroundColor: theme.box, borderColor: theme.border }]}>
            <Text style={[styles.emailLabel, { color: theme.lighttext }]}>Email</Text>
            <Text style={[styles.emailValue, { color: theme.text }]}>{user.email}</Text>
            <Text style={[styles.emailHint, { color: theme.lighttext }]}>
              Email cannot be changed here
            </Text>
          </View>
        )}

        <View style={[styles.card, { backgroundColor: theme.box }]}>
          {renderField("Username", "username", username, setUsername, "e.g. johndoe", {
            autoCapitalize: "none",
          })}
          {renderField("First Name", "firstName", firstName, setFirstName, "e.g. John")}
          {renderField("Last Name", "lastName", lastName, setLastName, "e.g. Doe")}
          {renderField("Avatar URL", "avatarUrl", avatarUrl, setAvatarUrl, "https://...", {
            autoCapitalize: "none",
            keyboardType: "url",
          })}
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: saving ? theme.disabled : theme.green }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default EditProfile;

const styles = StyleSheet.create({
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
  saveButton: { fontSize: 16, fontWeight: "600" },
  contentContainer: { padding: 16, paddingBottom: 40 },
  emailBanner: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  emailLabel: { fontSize: 12, fontWeight: "600", marginBottom: 2 },
  emailValue: { fontSize: 16, fontWeight: "600" },
  emailHint: { fontSize: 11, marginTop: 4 },
  card: { borderRadius: 10, padding: 16, marginBottom: 24 },
  fieldGroup: { marginBottom: 20 },
  label: { fontSize: 12, fontWeight: "700", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.4 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  errorText: { fontSize: 12, marginTop: 4 },
  saveBtn: {
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
