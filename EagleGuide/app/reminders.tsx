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

// ── Constants ────────────────────────────────────────────────────────────────

const ALL_DAYS: { key: DayOfWeek; label: string }[] = [
  { key: "sunday",    label: "Su" },
  { key: "monday",    label: "Mo" },
  { key: "tuesday",   label: "Tu" },
  { key: "wednesday", label: "We" },
  { key: "thursday",  label: "Th" },
  { key: "friday",    label: "Fr" },
  { key: "saturday",  label: "Sa" },
];

/** Format "HH:MM:SS" or "HH:MM" → "9:30 AM" */
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

  const [reminders, setReminders]   = useState<Reminder[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const hasLoadedOnce = useRef(false);

  // ── Modal state ───────────────────────────────────────────────────────────
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving]             = useState(false);

  const [formLabel, setFormLabel]             = useState("");
  const [formTime, setFormTime]               = useState("");           // "HH:MM"
  const [formDays, setFormDays]               = useState<DayOfWeek[]>([]);
  const [formDestLabel, setFormDestLabel]     = useState("");
  const [buildingQuery, setBuildingQuery]     = useState("");
  const [buildingResults, setBuildingResults] = useState<Building[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [buildingSearching, setBuildingSearching] = useState(false);

  // ── Data ──────────────────────────────────────────────────────────────────
  const loadReminders = useCallback(async () => {
    if (!user) return;
    // Only show the full-screen spinner on the very first load;
    // subsequent reloads (e.g. triggered by session re-render) use the
    // pull-to-refresh indicator so the list never disappears after a save.
    const isFirstLoad = !hasLoadedOnce.current;
    if (isFirstLoad) setLoading(true); else setRefreshing(true);
    try {
      setReminders(await getReminders());
      hasLoadedOnce.current = true;
    } catch (err: any) {
      Alert.alert("Could not load reminders", (err?.message ?? "Please try again").slice(0, 200));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  // ── Auth guard (after loadReminders so the dep ref is valid) ──────────────
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
          } catch (err: any) {
            Alert.alert("Error", (err?.message ?? "Could not delete").slice(0, 200));
          } finally {
            setDeletingId(null);
          }
        },
      },
    ]);
  }, []);

  // ── Building search ───────────────────────────────────────────────────────
  const runBuildingSearch = useCallback(async (q: string) => {
    setBuildingQuery(q);
    setSelectedBuilding(null);
    if (!q.trim()) { setBuildingResults([]); return; }
    setBuildingSearching(true);
    try {
      setBuildingResults(await searchBuildings(q));
    } catch {
      setBuildingResults([]);
    } finally {
      setBuildingSearching(false);
    }
  }, []);

  // ── Form helpers ──────────────────────────────────────────────────────────
  const toggleDay = (day: DayOfWeek) => {
    setFormDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const resetForm = () => {
    setFormLabel("");
    setFormTime("");
    setFormDays([]);
    setFormDestLabel("");
    setBuildingQuery("");
    setBuildingResults([]);
    setSelectedBuilding(null);
  };

  const openModal = () => { resetForm(); setModalVisible(true); };
  const closeModal = () => { setModalVisible(false); resetForm(); };

  const handleSave = async () => {
    if (!formLabel.trim())      return Alert.alert("Validation", "Please enter a label.");
    if (!selectedBuilding)      return Alert.alert("Validation", "Please select a destination building.");
    if (!/^\d{2}:\d{2}$/.test(formTime))
      return Alert.alert("Validation", "Time must be in HH:MM format (e.g. 09:30).");
    if (formDays.length === 0)  return Alert.alert("Validation", "Please select at least one day.");

    setSaving(true);
    try {
      const reminder = await createReminder({
        label:            formLabel.trim(),
        destination_geom: { lat: selectedBuilding.lat, lon: selectedBuilding.lon },
        destination_label: formDestLabel.trim() || selectedBuilding.name,
        remind_time:      formTime,
        days_of_week:     formDays,
      });
      setReminders((prev) => [...prev, reminder]);
      closeModal();
    } catch (err: any) {
      Alert.alert("Error", (err?.message ?? "Could not save reminder").slice(0, 200));
    } finally {
      setSaving(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reminders</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openModal}>
          <Text style={styles.addBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      {loading ? (
        <ActivityIndicator color="#65d159" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#65d159" />}
        >
          {reminders.length === 0 && (
            <Text style={styles.emptyText}>{'No reminders yet. Tap "+ New" to add one.'}</Text>
          )}
          {reminders.map((r) => (
            <View key={r.reminderId} style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.cardLabel}>{r.label}</Text>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  disabled={deletingId === r.reminderId}
                  onPress={() => handleDelete(r.reminderId)}
                >
                  {deletingId === r.reminderId
                    ? <ActivityIndicator size="small" color="#e24a4a" />
                    : <Text style={styles.deleteBtnText}>✕</Text>
                  }
                </TouchableOpacity>
              </View>

              {r.destinationLabel && (
                <Text style={styles.cardDest}>📍 {r.destinationLabel}</Text>
              )}

              <Text style={styles.cardTime}>🕐 {formatTime(r.remindTime)}</Text>

              {r.destinationGeom && (
                <TouchableOpacity
                  style={styles.navigateBtn}
                  onPress={() => {
                    // GeoJSON coordinates are [longitude, latitude]
                    const [lon, lat] = r.destinationGeom!.coordinates;
                    router.push({
                      pathname: "/navigation",
                      params: {
                        destLat: lat.toString(),
                        destLon: lon.toString(),
                        destLabel: r.destinationLabel ?? "",
                      },
                    });
                  }}
                >
                  <Text style={styles.navigateBtnText}>🗺️ Navigate</Text>
                </TouchableOpacity>
              )}

              <View style={styles.daysRow}>
                {ALL_DAYS.map(({ key, label }) => (
                  <View
                    key={key}
                    style={[
                      styles.dayPill,
                      r.daysOfWeek.includes(key) && styles.dayPillActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayPillText,
                        r.daysOfWeek.includes(key) && styles.dayPillTextActive,
                      ]}
                    >
                      {label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Create Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.modalScroll}>
              <Text style={styles.modalTitle}>New Reminder</Text>

              {/* Label */}
              <Text style={styles.inputLabel}>Label *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. CS 101"
                placeholderTextColor="#777"
                value={formLabel}
                onChangeText={setFormLabel}
              />

              {/* Building search */}
              <Text style={styles.inputLabel}>Search Destination *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Chandler Hall"
                placeholderTextColor="#777"
                value={buildingQuery}
                onChangeText={runBuildingSearch}
              />
              {buildingSearching && <ActivityIndicator color="#65d159" style={{ marginBottom: 6 }} />}
              {buildingResults.length > 0 && !selectedBuilding && (
                <View style={styles.buildingList}>
                  {buildingResults.slice(0, 6).map((b) => (
                    <TouchableOpacity
                      key={b.name}
                      style={styles.buildingRow}
                      onPress={() => {
                        setSelectedBuilding(b);
                        setBuildingQuery(b.name);
                        setBuildingResults([]);
                        setFormDestLabel(b.name);
                      }}
                    >
                      <Text style={styles.buildingRowText}>{b.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              {selectedBuilding && (
                <Text style={styles.selectedBuildingText}>✓ {selectedBuilding.name}</Text>
              )}

              {/* Room / detail label */}
              <Text style={styles.inputLabel}>Room / Detail (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Room 201"
                placeholderTextColor="#777"
                value={formDestLabel}
                onChangeText={setFormDestLabel}
              />

              {/* Time */}
              <Text style={styles.inputLabel}>Time * (HH:MM, 24-hour)</Text>
              <TextInput
                style={styles.input}
                placeholder="09:30"
                placeholderTextColor="#777"
                value={formTime}
                onChangeText={setFormTime}
                keyboardType="numbers-and-punctuation"
                maxLength={5}
              />

              {/* Days */}
              <Text style={styles.inputLabel}>Days *</Text>
              <View style={styles.daysToggle}>
                {ALL_DAYS.map(({ key, label }) => (
                  <TouchableOpacity
                    key={key}
                    style={[styles.dayToggleBtn, formDays.includes(key) && styles.dayToggleBtnActive]}
                    onPress={() => toggleDay(key)}
                  >
                    <Text style={[styles.dayToggleText, formDays.includes(key) && styles.dayToggleTextActive]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Actions */}
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={closeModal} disabled={saving}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                  {saving
                    ? <ActivityIndicator color="#0d0d0d" />
                    : <Text style={styles.saveBtnText}>Save</Text>
                  }
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1f1f1f" },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#2a2a2a",
  },
  backBtn: { paddingVertical: 6, paddingRight: 12 },
  backText: { color: "#65d159", fontWeight: "700", fontSize: 15 },
  headerTitle: { color: "#dcdcdc", fontSize: 18, fontWeight: "700" },
  addBtn: {
    backgroundColor: "#65d159",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addBtnText: { color: "#0d0d0d", fontWeight: "700" },

  // List
  listContent: { padding: 16, gap: 12 },
  emptyText: { color: "#9e9e9e", textAlign: "center", marginTop: 40, fontSize: 15 },

  // Reminder card
  card: {
    backgroundColor: "#2f2f2f",
    borderRadius: 14,
    padding: 14,
    gap: 6,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardLabel: { color: "#dcdcdc", fontSize: 16, fontWeight: "700", flex: 1 },
  cardDest: { color: "#9e9e9e", fontSize: 13 },
  cardTime: { color: "#65d159", fontSize: 14, fontWeight: "600" },
  daysRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 },
  dayPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#3a3a3a",
  },
  dayPillActive: { backgroundColor: "#65d159" },
  dayPillText: { color: "#9e9e9e", fontSize: 12, fontWeight: "600" },
  dayPillTextActive: { color: "#0d0d0d" },
  deleteBtn: { padding: 6 },
  deleteBtnText: { color: "#e24a4a", fontSize: 16, fontWeight: "700" },
  navigateBtn: {
    marginTop: 6,
    alignSelf: "flex-start",
    backgroundColor: "#2a3a2a",
    borderWidth: 1,
    borderColor: "#65d159",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  navigateBtnText: { color: "#65d159", fontWeight: "700", fontSize: 13 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#2a2a2a",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
  },
  modalScroll: { padding: 20, gap: 4 },
  modalTitle: {
    color: "#dcdcdc",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  inputLabel: { color: "#9e9e9e", fontSize: 13, marginTop: 8, marginBottom: 4 },
  input: {
    backgroundColor: "#3a3a3a",
    color: "#dcdcdc",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  buildingList: {
    backgroundColor: "#333",
    borderRadius: 10,
    overflow: "hidden",
    marginTop: 4,
  },
  buildingRow: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#444",
  },
  buildingRowText: { color: "#dcdcdc", fontSize: 14 },
  selectedBuildingText: { color: "#65d159", fontSize: 13, marginTop: 4 },
  daysToggle: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 4 },
  dayToggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#3a3a3a",
  },
  dayToggleBtnActive: { backgroundColor: "#65d159" },
  dayToggleText: { color: "#9e9e9e", fontWeight: "700", fontSize: 13 },
  dayToggleTextActive: { color: "#0d0d0d" },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
    marginBottom: 8,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: "#3a3a3a",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelBtnText: { color: "#dcdcdc", fontWeight: "700" },
  saveBtn: {
    flex: 2,
    backgroundColor: "#65d159",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  saveBtnText: { color: "#0d0d0d", fontWeight: "700", fontSize: 15 },
});
