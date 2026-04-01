import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Building, searchBuildings } from "./lib/api/navbuildings";
import {
  createReminder,
  DayOfWeek,
  deleteReminder,
  getReminders,
  Reminder,
} from "./lib/api/reminders";
import { useSession } from "./lib/session";
import { useTheme } from "../app/Theme";
import { useAccessibility } from "./Fontsize";

// ── Constants ────────────────────────────────────────────────────────────────

const ALL_DAYS: { key: DayOfWeek; label: string }[] = [
  { key: "sunday", label: "Su" },
  { key: "monday", label: "Mo" },
  { key: "tuesday", label: "Tu" },
  { key: "wednesday", label: "We" },
  { key: "thursday", label: "Th" },
  { key: "friday", label: "Fr" },
  { key: "saturday", label: "Sa" },
];

function formatTime(t: string): string {
  const parts = t.split(":");
  const h = parseInt(parts[0], 10);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${parts[1] ?? "00"} ${suffix}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function RemindersScreen() {
  const router = useRouter();
  const { user, loading: sessionLoading } = useSession();
  const { theme } = useTheme();
  const { scaleFont } = useAccessibility();

  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const hasLoadedOnce = useRef(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formLabel, setFormLabel] = useState("");
  const [formTime, setFormTime] = useState("");
  const [formDays, setFormDays] = useState<DayOfWeek[]>([]);
  const [formDestLabel, setFormDestLabel] = useState("");
  const [buildingQuery, setBuildingQuery] = useState("");
  const [buildingResults, setBuildingResults] = useState<Building[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [buildingSearching, setBuildingSearching] = useState(false);

  const loadReminders = useCallback(async () => {
    if (!user) return;
    const isFirstLoad = !hasLoadedOnce.current;
    if (isFirstLoad) setLoading(true); else setRefreshing(true);
    try {
      setReminders(await getReminders());
      hasLoadedOnce.current = true;
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    if (sessionLoading) return;
    if (!user) { router.replace("/Login"); return; }
    loadReminders();
  }, [sessionLoading, user, router, loadReminders]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadReminders();
  }, [loadReminders]);

  const handleDelete = useCallback(async (id: string) => {
    Alert.alert("Delete reminder?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setDeletingId(id);
          try {
            await deleteReminder(id);
            setReminders((prev) => prev.filter((r) => r.reminderId !== id));
          } finally {
            setDeletingId(null);
          }
        },
      },
    ]);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.header }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backText, { color: theme.green, fontSize: scaleFont(15) }]}>
            ← Back
          </Text>
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: theme.text, fontSize: scaleFont(18) }]}>
          Reminders
        </Text>

        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: theme.green }]}
          onPress={() => setModalVisible(true)}
        >
          <Text style={{ color: theme.background, fontSize: scaleFont(14), fontWeight: "700" }}>
            + New
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={theme.green} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.green} />
          }
        >
          {reminders.map((r) => (
            <View key={r.reminderId} style={[styles.card, { backgroundColor: theme.box }]}>
              <Text style={[styles.cardLabel, { color: theme.text, fontSize: scaleFont(16) }]}>
                {r.label}
              </Text>

              <Text style={{ color: theme.green, fontSize: scaleFont(14) }}>
                🕐 {formatTime(r.remindTime)}
              </Text>

              <TouchableOpacity onPress={() => handleDelete(r.reminderId)}>
                <Text style={{ color: theme.red, fontSize: scaleFont(14) }}>Delete</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
  },

  backText: { fontWeight: "700" },
  headerTitle: { fontWeight: "700" },

  addBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },

  listContent: { padding: 16, gap: 12 },

  card: {
    padding: 14,
    borderRadius: 14,
  },

  cardLabel: {
    fontWeight: "700",
  },
});