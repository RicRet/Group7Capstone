/**
 * Daily Planner Screen
 *
 * Reuses the existing reminder system (user_reminder table, reminders API,
 * building search) and renders them in a day-view timeline sorted by time.
 * Supports day navigation and a live "current time" indicator when viewing today.
 */

import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StatusBar,
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

// ── Helpers ───────────────────────────────────────────────────────────────────

const DAYS: DayOfWeek[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

const ALL_DAYS: { key: DayOfWeek; label: string }[] = [
  { key: "sunday",    label: "Su" },
  { key: "monday",    label: "Mo" },
  { key: "tuesday",   label: "Tu" },
  { key: "wednesday", label: "We" },
  { key: "thursday",  label: "Th" },
  { key: "friday",    label: "Fr" },
  { key: "saturday",  label: "Sa" },
];

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** "HH:MM:SS" or "HH:MM" → "9:30 AM" */
function formatTime(t: string): string {
  const parts = t.split(":");
  const h = parseInt(parts[0], 10);
  const m = parts[1] ?? "00";
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m} ${suffix}`;
}

/** "HH:MM:SS" → minutes since midnight */
function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

/** minutes since midnight → "HH:MM:SS"-ish string */
function minutesToTimeString(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
}

/** Returns "Today", "Tomorrow", "Yesterday", or "Mon, Mar 6" */
function formatDateLabel(date: Date): string {
  const today = new Date();
  const diff = diffDays(date, today);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  return `${DAY_NAMES[date.getDay()]}, ${MONTH_NAMES[date.getMonth()]} ${date.getDate()}`;
}

/** Signed integer: how many calendar days `a` is ahead of `b` */
function diffDays(a: Date, b: Date): number {
  const startOfA = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const startOfB = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((startOfA.getTime() - startOfB.getTime()) / 86_400_000);
}

/** Relative label: "in 15 min", "30 min ago", "now", etc. */
function relativeTime(remindTime: string, viewDate: Date): string | null {
  const today = new Date();
  if (diffDays(viewDate, today) !== 0) return null; // only show for today

  const nowMins = today.getHours() * 60 + today.getMinutes();
  const eventMins = timeToMinutes(remindTime);
  const diff = eventMins - nowMins;

  if (diff > 120) return null;
  if (diff > 60) return `in ${Math.round(diff / 60)}h`;
  if (diff > 1)  return `in ${diff} min`;
  if (diff >= -1) return "now";
  if (diff >= -60) return `${-diff} min ago`;
  if (diff >= -120) return `${Math.round(-diff / 60)}h ago`;
  return null;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function PlannerScreen() {
  const router = useRouter();
  const { user, loading: sessionLoading } = useSession();

  // Selected view date (offset from today in days)
  const [dayOffset, setDayOffset]         = useState(0);
  const [allReminders, setAllReminders]   = useState<Reminder[]>([]);
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);
  const [deletingId, setDeletingId]       = useState<string | null>(null);
  const [nowMinutes, setNowMinutes]       = useState(
    () => new Date().getHours() * 60 + new Date().getMinutes()
  );
  const hasLoadedOnce = useRef(false);

  // ── New-event modal (full form reuse from reminders.tsx) ──────────────────
  const [modalVisible, setModalVisible]   = useState(false);
  const [saving, setSaving]               = useState(false);
  const [formLabel, setFormLabel]         = useState("");
  const [formTime, setFormTime]           = useState("");
  const [formDays, setFormDays]           = useState<DayOfWeek[]>([]);
  const [formDestLabel, setFormDestLabel] = useState("");
  const [buildingQuery, setBuildingQuery] = useState("");
  const [buildingResults, setBuildingResults] = useState<Building[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [buildingSearching, setBuildingSearching] = useState(false);

  // ── Derived values ────────────────────────────────────────────────────────

  const viewDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + dayOffset);
    return d;
  })();

  const viewDow: DayOfWeek = DAYS[viewDate.getDay()];

  /** Reminders active on the viewed day, sorted by time */
  const todaysEvents: Reminder[] = allReminders
    .filter((r) => r.daysOfWeek.includes(viewDow))
    .sort((a, b) => timeToMinutes(a.remindTime) - timeToMinutes(b.remindTime));

  /** Next upcoming event today (only when viewing today) */
  const nextEvent = dayOffset === 0
    ? todaysEvents.find((r) => timeToMinutes(r.remindTime) >= nowMinutes)
    : null;

  // ── Side effects ──────────────────────────────────────────────────────────

  /** Refresh "now" every minute so the timeline indicator stays current */
  useEffect(() => {
    const id = setInterval(() => {
      const n = new Date();
      setNowMinutes(n.getHours() * 60 + n.getMinutes());
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  const loadReminders = useCallback(async () => {
    if (!user) return;
    const isFirst = !hasLoadedOnce.current;
    if (isFirst) setLoading(true); else setRefreshing(true);
    try {
      setAllReminders(await getReminders());
      hasLoadedOnce.current = true;
    } catch (err: any) {
      Alert.alert("Could not load schedule", (err?.message ?? "Please try again").slice(0, 200));
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

  // Re-load whenever the screen regains focus (e.g. after adding a reminder)
  useFocusEffect(
    useCallback(() => {
      if (user && hasLoadedOnce.current) {
        loadReminders();
      }
    }, [user, loadReminders])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadReminders();
  }, [loadReminders]);

  // ── Event actions ─────────────────────────────────────────────────────────

  const handleDelete = useCallback((id: string, label: string) => {
    Alert.alert(
      `Remove "${label}"?`,
      "This removes it from all days, not just today.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            setDeletingId(id);
            try {
              await deleteReminder(id);
              setAllReminders((prev) => prev.filter((r) => r.reminderId !== id));
            } catch (err: any) {
              Alert.alert("Error", (err?.message ?? "Could not delete").slice(0, 200));
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  }, []);

  const handleNavigate = (r: Reminder) => {
    if (!r.destinationGeom) return;
    const [lon, lat] = r.destinationGeom.coordinates;
    router.push({
      pathname: "/navigation",
      params: {
        destLat: lat.toString(),
        destLon: lon.toString(),
        destLabel: r.destinationLabel ?? r.label,
      },
    });
  };

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
    setFormDays([viewDow]); // pre-select currently viewed day
    setFormDestLabel("");
    setBuildingQuery("");
    setBuildingResults([]);
    setSelectedBuilding(null);
  };

  const openModal = () => { resetForm(); setModalVisible(true); };
  const closeModal = () => { setModalVisible(false); resetForm(); };

  const handleSave = async () => {
    if (!formLabel.trim())    return Alert.alert("Validation", "Please enter a label.");
    if (!selectedBuilding)    return Alert.alert("Validation", "Please select a destination building.");
    if (!/^\d{2}:\d{2}$/.test(formTime))
      return Alert.alert("Validation", "Time must be in HH:MM format (e.g. 09:30).");
    if (formDays.length === 0) return Alert.alert("Validation", "Please select at least one day.");

    setSaving(true);
    try {
      const reminder = await createReminder({
        label:             formLabel.trim(),
        destination_geom:  { lat: selectedBuilding.lat, lon: selectedBuilding.lon },
        destination_label: formDestLabel.trim() || selectedBuilding.name,
        remind_time:       formTime,
        days_of_week:      formDays,
      });
      setAllReminders((prev) => [...prev, reminder]);
      closeModal();
    } catch (err: any) {
      Alert.alert("Error", (err?.message ?? "Could not save").slice(0, 200));
    } finally {
      setSaving(false);
    }
  };

  // ── Timeline layout helpers ───────────────────────────────────────────────

  /** Determine if the "now" line should appear between two sorted events */
  const nowLineAfterIndex = (() => {
    if (dayOffset !== 0 || todaysEvents.length === 0) return -1;
    // Find last event that's already passed
    for (let i = todaysEvents.length - 1; i >= 0; i--) {
      if (timeToMinutes(todaysEvents[i].remindTime) <= nowMinutes) return i;
    }
    return -2; // before all events
  })();

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Daily Planner</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openModal}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* ── Day navigation bar ── */}
      <View style={styles.dayNav}>
        <TouchableOpacity onPress={() => setDayOffset((d) => d - 1)} style={styles.dayNavArrow}>
          <Text style={styles.dayNavArrowText}>‹</Text>
        </TouchableOpacity>

        <View style={styles.dayNavCenter}>
          <Text style={styles.dayNavLabel}>{formatDateLabel(viewDate)}</Text>
          <Text style={styles.dayNavSub}>
            {DAY_NAMES[viewDate.getDay()]},{" "}
            {MONTH_NAMES[viewDate.getMonth()]} {viewDate.getDate()},{" "}
            {viewDate.getFullYear()}
          </Text>
        </View>

        <TouchableOpacity onPress={() => setDayOffset((d) => d + 1)} style={styles.dayNavArrow}>
          <Text style={styles.dayNavArrowText}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Jump to today */}
      {dayOffset !== 0 && (
        <TouchableOpacity style={styles.todayBtn} onPress={() => setDayOffset(0)}>
          <Text style={styles.todayBtnText}>Jump to Today</Text>
        </TouchableOpacity>
      )}

      {/* ── Summary bar ── */}
      {!loading && (
        <View style={styles.summaryBar}>
          <Text style={styles.summaryText}>
            {todaysEvents.length === 0
              ? "No events scheduled"
              : `${todaysEvents.length} event${todaysEvents.length !== 1 ? "s" : ""} scheduled`}
          </Text>
          {nextEvent && (
            <Text style={styles.nextEventText}>
              Next: {nextEvent.label} at {formatTime(nextEvent.remindTime)}
            </Text>
          )}
        </View>
      )}

      {/* ── Timeline ── */}
      {loading ? (
        <ActivityIndicator color="#65d159" style={{ marginTop: 48 }} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.timelineContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#65d159" />
          }
        >
          {todaysEvents.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📅</Text>
              <Text style={styles.emptyTitle}>Nothing scheduled</Text>
              <Text style={styles.emptySubtitle}>
                Tap "+ Add" to schedule an event for{" "}
                {dayOffset === 0 ? "today" : DAY_NAMES[viewDate.getDay()]}.
              </Text>
              <TouchableOpacity
                style={styles.emptyActionBtn}
                onPress={() => router.push("/reminders")}
              >
                <Text style={styles.emptyActionBtnText}>Manage All Reminders →</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* "Now" line before all events */}
              {nowLineAfterIndex === -2 && (
                <View style={styles.nowLineContainer}>
                  <View style={styles.nowDot} />
                  <View style={styles.nowLine} />
                  <Text style={styles.nowLabel}>Now</Text>
                </View>
              )}

              {todaysEvents.map((r, idx) => {
                const eventMins  = timeToMinutes(r.remindTime);
                const isPast     = dayOffset === 0 && eventMins < nowMinutes;
                const isCurrent  = dayOffset === 0 && Math.abs(eventMins - nowMinutes) <= 5;
                const relLabel   = relativeTime(r.remindTime, viewDate);

                return (
                  <React.Fragment key={r.reminderId}>
                    {/* ── Event card ── */}
                    <View style={[styles.eventRow, isPast && !isCurrent && styles.eventRowPast]}>
                      {/* Time column */}
                      <View style={styles.timeCol}>
                        <Text style={[styles.eventTime, isCurrent && styles.eventTimeCurrent]}>
                          {formatTime(r.remindTime)}
                        </Text>
                        {relLabel && (
                          <Text style={[styles.relTime, isCurrent && styles.relTimeCurrent]}>
                            {relLabel}
                          </Text>
                        )}
                      </View>

                      {/* Connector */}
                      <View style={styles.connectorCol}>
                        <View style={[styles.dot, isCurrent && styles.dotCurrent]} />
                        <View style={styles.connectorLine} />
                      </View>

                      {/* Card */}
                      <View style={[styles.eventCard, isCurrent && styles.eventCardCurrent]}>
                        {/* Card top row: label + delete */}
                        <View style={styles.cardTopRow}>
                          <Text style={[styles.eventLabel, isPast && !isCurrent && styles.eventLabelPast]}>
                            {r.label}
                          </Text>
                          <TouchableOpacity
                            disabled={deletingId === r.reminderId}
                            onPress={() => handleDelete(r.reminderId, r.label)}
                            style={styles.deleteBtn}
                          >
                            {deletingId === r.reminderId ? (
                              <ActivityIndicator size="small" color="#e24a4a" />
                            ) : (
                              <Text style={styles.deleteBtnText}>✕</Text>
                            )}
                          </TouchableOpacity>
                        </View>

                        {r.destinationLabel ? (
                          <Text style={styles.eventDest}>📍 {r.destinationLabel}</Text>
                        ) : null}

                        {/* Days it recurs */}
                        <View style={styles.daysRow}>
                          {ALL_DAYS.map(({ key, label }) => (
                            <View
                              key={key}
                              style={[styles.dayPill, r.daysOfWeek.includes(key) && styles.dayPillActive]}
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

                        {/* Navigate button */}
                        {r.destinationGeom && (
                          <TouchableOpacity
                            style={[styles.navBtn, isCurrent && styles.navBtnCurrent]}
                            onPress={() => handleNavigate(r)}
                          >
                            <Text style={styles.navBtnText}>🗺️ Navigate</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>

                    {/* "Now" line after this event if applicable */}
                    {nowLineAfterIndex === idx && (
                      <View style={styles.nowLineContainer}>
                        <View style={styles.nowDot} />
                        <View style={styles.nowLine} />
                        <Text style={styles.nowLabel}>Now</Text>
                      </View>
                    )}
                  </React.Fragment>
                );
              })}

              {/* Footer link */}
              <TouchableOpacity
                style={styles.manageLink}
                onPress={() => router.push("/reminders")}
              >
                <Text style={styles.manageLinkText}>Manage All Reminders →</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      )}

      {/* ── Add Event Modal ── */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.modalScroll}>
              <Text style={styles.modalTitle}>New Event</Text>

              <Text style={styles.inputLabel}>Label *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. CS 101"
                placeholderTextColor="#777"
                value={formLabel}
                onChangeText={setFormLabel}
              />

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

              <Text style={styles.inputLabel}>Room / Detail (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Room 201"
                placeholderTextColor="#777"
                value={formDestLabel}
                onChangeText={setFormDestLabel}
              />

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

              <Text style={styles.inputLabel}>Repeats on *</Text>
              <View style={styles.daysToggle}>
                {ALL_DAYS.map(({ key, label }) => (
                  <TouchableOpacity
                    key={key}
                    style={[styles.dayToggleBtn, formDays.includes(key) && styles.dayToggleBtnActive]}
                    onPress={() => toggleDay(key)}
                  >
                    <Text
                      style={[styles.dayToggleText, formDays.includes(key) && styles.dayToggleTextActive]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={closeModal} disabled={saving}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                  {saving ? (
                    <ActivityIndicator color="#0d0d0d" />
                  ) : (
                    <Text style={styles.saveBtnText}>Save</Text>
                  )}
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
  container: { flex: 1, backgroundColor: "#1a1a1a" },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: "#222",
  },
  backBtn:      { paddingRight: 12, paddingVertical: 6 },
  backText:     { color: "#65d159", fontWeight: "700", fontSize: 15 },
  headerTitle:  { color: "#dcdcdc", fontSize: 18, fontWeight: "700" },
  addBtn: {
    backgroundColor: "#65d159",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addBtnText: { color: "#0d0d0d", fontWeight: "700" },

  // Day navigation
  dayNav: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#222",
    paddingHorizontal: 8,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  dayNavArrow: { padding: 12 },
  dayNavArrowText: { color: "#65d159", fontSize: 28, fontWeight: "300", lineHeight: 32 },
  dayNavCenter: { flex: 1, alignItems: "center" },
  dayNavLabel: { color: "#dcdcdc", fontSize: 17, fontWeight: "700" },
  dayNavSub:   { color: "#9e9e9e", fontSize: 12, marginTop: 2 },

  // Jump to today
  todayBtn: {
    alignSelf: "center",
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#65d159",
  },
  todayBtnText: { color: "#65d159", fontSize: 13, fontWeight: "600" },

  // Summary bar
  summaryBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#1f2e1f",
    borderBottomWidth: 1,
    borderBottomColor: "#2a3a2a",
  },
  summaryText:    { color: "#9dbf9d", fontSize: 13 },
  nextEventText:  { color: "#65d159", fontSize: 13, fontWeight: "600", marginTop: 2 },

  // Timeline
  timelineContent: { paddingHorizontal: 12, paddingVertical: 16, paddingBottom: 40 },

  // Empty state
  emptyState: { alignItems: "center", paddingTop: 60, gap: 8 },
  emptyIcon:  { fontSize: 48 },
  emptyTitle: { color: "#dcdcdc", fontSize: 18, fontWeight: "700" },
  emptySubtitle: { color: "#9e9e9e", fontSize: 14, textAlign: "center", paddingHorizontal: 32 },
  emptyActionBtn: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#65d159",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  emptyActionBtnText: { color: "#65d159", fontWeight: "700" },

  // "Now" indicator
  nowLineContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 6,
    paddingLeft: 80, // align with connector column
  },
  nowDot:  { width: 10, height: 10, borderRadius: 5, backgroundColor: "#ff6b6b" },
  nowLine: { flex: 1, height: 2, backgroundColor: "#ff6b6b", marginHorizontal: 6 },
  nowLabel:{ color: "#ff6b6b", fontSize: 11, fontWeight: "700" },

  // Event row (time col + connector + card)
  eventRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 8 },
  eventRowPast: { opacity: 0.55 },

  // Time column
  timeCol:  { width: 72, alignItems: "flex-end", paddingRight: 8, paddingTop: 10 },
  eventTime: { color: "#9e9e9e", fontSize: 13, fontWeight: "600" },
  eventTimeCurrent: { color: "#65d159" },
  relTime:   { color: "#777", fontSize: 10, marginTop: 2 },
  relTimeCurrent: { color: "#65d159", fontWeight: "700" },

  // Connector column
  connectorCol: { width: 20, alignItems: "center" },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#3a3a3a",
    borderWidth: 2,
    borderColor: "#65d159",
    marginTop: 11,
    zIndex: 1,
  },
  dotCurrent: { backgroundColor: "#65d159" },
  connectorLine: {
    flex: 1,
    width: 2,
    backgroundColor: "#333",
    marginTop: 2,
  },

  // Event card
  eventCard: {
    flex: 1,
    backgroundColor: "#2a2a2a",
    borderRadius: 14,
    padding: 12,
    marginLeft: 8,
    gap: 5,
    borderWidth: 1,
    borderColor: "#333",
  },
  eventCardCurrent: {
    borderColor: "#65d159",
    backgroundColor: "#212e21",
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  eventLabel: { color: "#dcdcdc", fontSize: 15, fontWeight: "700", flex: 1 },
  eventLabelPast: { color: "#777" },
  eventDest: { color: "#9e9e9e", fontSize: 13 },
  deleteBtn:     { padding: 4 },
  deleteBtnText: { color: "#e24a4a", fontSize: 15, fontWeight: "700" },

  // Days pills
  daysRow:      { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 2 },
  dayPill: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "#3a3a3a",
  },
  dayPillActive:     { backgroundColor: "#1f3a1f" },
  dayPillText:       { color: "#777",     fontSize: 10, fontWeight: "600" },
  dayPillTextActive: { color: "#65d159",  fontSize: 10, fontWeight: "700" },

  // Navigate button
  navBtn: {
    alignSelf: "flex-start",
    marginTop: 4,
    backgroundColor: "#1a2a1a",
    borderWidth: 1,
    borderColor: "#65d159",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  navBtnCurrent: { backgroundColor: "#223322" },
  navBtnText: { color: "#65d159", fontWeight: "700", fontSize: 13 },

  // "Manage all" footer link
  manageLink: { alignSelf: "center", marginTop: 24, paddingVertical: 8 },
  manageLinkText: { color: "#65d159", fontSize: 13, fontWeight: "600" },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#2a2a2a",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "92%",
  },
  modalScroll:  { padding: 20, gap: 4 },
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
  buildingRowText:       { color: "#dcdcdc", fontSize: 14 },
  selectedBuildingText:  { color: "#65d159", fontSize: 13, marginTop: 4 },
  daysToggle:            { flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 4 },
  dayToggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#3a3a3a",
  },
  dayToggleBtnActive: { backgroundColor: "#65d159" },
  dayToggleText:      { color: "#9e9e9e", fontWeight: "700", fontSize: 13 },
  dayToggleTextActive:{ color: "#0d0d0d" },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
    marginBottom: 10,
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
