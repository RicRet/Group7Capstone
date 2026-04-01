import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Callout, Marker, Polyline, PROVIDER_GOOGLE, Region } from "react-native-maps";
import {
  getRouteFromORS,
  snapToRoad,
  type Coordinates,
  type Profile,
  type RouteStep,
} from "./lib/api/directions";
import {
  broadcastMyLocation,
  getFriendLocations,
  stopBroadcast,
  type FriendLocation,
} from "./lib/api/shareLocation";
import { useSession } from "./lib/session";
import { useTheme } from "./Theme";
import { useAccessibility } from "./Fontsize";

const formatDuration = (seconds: number) => {
  const min = Math.floor(seconds / 60);
  if (min < 60) return `${min} min`;
  const hrs = Math.floor(min / 60);
  return `${hrs}h ${min % 60}m`;
};

const formatDistance = (meters: number) =>
  meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;

const avatarInitials = (name: string) =>
  name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");

const BROADCAST_INTERVAL_MS = 30_000;
const REFRESH_INTERVAL_MS = 15_000;

export default function FindFriendsScreen() {
  const router = useRouter();
  const { token } = useSession();
  const { theme, isDark } = useTheme();
  const { scaleFont } = useAccessibility();
  const mapRef = useRef<MapView>(null);

  const [myLocation, setMyLocation] = useState<Coordinates | null>(null);
  const [selectedFriend, setSelectedFriend] = useState<FriendLocation | null>(null);
  const [friendLocations, setFriendLocations] = useState<FriendLocation[]>([]);
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastLoading, setBroadcastLoading] = useState(false);
  const [routeCoords, setRouteCoords] = useState<Coordinates[] | null>(null);
  const [steps, setSteps] = useState<RouteStep[]>([]);
  const [summary, setSummary] = useState<{ distance: number; duration: number } | null>(null);
  const [profile, setProfile] = useState<Profile>("foot-walking");
  const [routeLoading, setRouteLoading] = useState(false);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [friendsError, setFriendsError] = useState<string | null>(null);
  const broadcastingRef = useRef(false);

  const initialRegion: Region = useMemo(() => ({
    latitude: 33.2106, longitude: -97.1470,
    latitudeDelta: 0.02, longitudeDelta: 0.02,
  }), []);

  // Get GPS on mount
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Location required", "Please enable location to use Find Friends.");
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      const coord: Coordinates = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setMyLocation(coord);
      mapRef.current?.animateCamera({ center: coord, zoom: 15 });
    })();
  }, []);

  // Load friends' locations, poll every 15 s
  const refreshFriends = useCallback(async () => {
    if (!token) return;
    setLoadingFriends(true);
    try {
      const friends = await getFriendLocations();
      setFriendLocations(friends);
      setFriendsError(null);
    } catch (err: any) {
      const msg = err?.message || "Could not fetch friend locations.";
      setFriendsError(msg);
      console.error("[FindFriends] refreshFriends error:", msg);
    } finally { setLoadingFriends(false); }
  }, [token]);

  useEffect(() => {
    refreshFriends();
    const id = setInterval(refreshFriends, REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [refreshFriends]);

  // Broadcast helpers
  const startBroadcast = useCallback(async (location: Coordinates) => {
    if (!token) return;
    setBroadcastLoading(true);
    try {
      await broadcastMyLocation(location.latitude, location.longitude);
      broadcastingRef.current = true;
      setBroadcasting(true);
      // Immediately poll so we see friends who are already live
      refreshFriends();
    } catch (err: any) {
      Alert.alert("Broadcast failed", err?.message || "Could not share your location.");
    } finally { setBroadcastLoading(false); }
  }, [token, refreshFriends]);

  const endBroadcast = useCallback(async () => {
    setBroadcastLoading(true);
    try { await stopBroadcast(); } catch { /* ignore */ }
    broadcastingRef.current = false;
    setBroadcasting(false);
    setBroadcastLoading(false);
  }, []);

  // Re-broadcast every 30 s while active
  useEffect(() => {
    if (!broadcasting || !myLocation) return;
    const id = setInterval(async () => {
      const loc = await Location.getCurrentPositionAsync({}).catch(() => null);
      const coord = loc
        ? { latitude: loc.coords.latitude, longitude: loc.coords.longitude }
        : myLocation;
      setMyLocation(coord);
      broadcastMyLocation(coord.latitude, coord.longitude).catch(() => { });
    }, BROADCAST_INTERVAL_MS);
    return () => clearInterval(id);
  }, [broadcasting, myLocation]);

  // Stop broadcast on unmount — only if actually live
  useEffect(() => () => {
    if (broadcastingRef.current) stopBroadcast().catch(() => { });
  }, []);

  const selectFriend = (friend: FriendLocation) => {
    setSelectedFriend(friend);
    setRouteCoords(null);
    setSteps([]);
    setSummary(null);
    mapRef.current?.animateCamera({
      center: { latitude: friend.latitude, longitude: friend.longitude },
      zoom: 15,
    });
  };

  const clearSelection = () => {
    setSelectedFriend(null);
    setRouteCoords(null);
    setSteps([]);
    setSummary(null);
  };

  const fetchRoute = async () => {
    if (!myLocation || !selectedFriend) return;
    setRouteLoading(true);
    const dest: Coordinates = { latitude: selectedFriend.latitude, longitude: selectedFriend.longitude };
    try {
      const snappedOrigin = await snapToRoad(myLocation, profile);
      const snappedDest = await snapToRoad(dest, profile);
      const routeData = await getRouteFromORS(snappedOrigin, snappedDest, profile);
      if (!routeData || routeData.coordinates.length < 2) {
        setRouteCoords([myLocation, dest]);
        setSteps([]);
        setSummary(null);
      } else {
        setRouteCoords(routeData.coordinates);
        setSteps(routeData.steps);
        setSummary(routeData.summary);
      }
      const toFit = (routeData?.coordinates?.length ?? 0) >= 2 ? routeData!.coordinates : [myLocation, dest];
      mapRef.current?.fitToCoordinates(toFit, {
        edgePadding: { top: 80, right: 50, bottom: 340, left: 50 },
        animated: true,
      });
    } catch (err: any) {
      Alert.alert("Routing error", (err?.message || "Could not find route.").slice(0, 300));
      setRouteCoords([myLocation, dest]);
    } finally { setRouteLoading(false); }
  };

  const darkStyle = [
    { elementType: "geometry", stylers: [{ color: "#6b6b6b" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#dcdcdc" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#6b6b6b" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#999999" }] },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* MAP */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        customMapStyle={isDark ? darkStyle : []}
        style={StyleSheet.absoluteFillObject}
        initialRegion={initialRegion}
        showsUserLocation
        showsCompass
      >
        {friendLocations.map((f) => (
          <Marker
            key={f.userId}
            coordinate={{ latitude: f.latitude, longitude: f.longitude }}
            onPress={() => selectFriend(f)}
            pinColor={selectedFriend?.userId === f.userId ? "#FF9500" : "#007AFF"}
          >
            <Callout>
              <View style={styles.callout}>
                <Text style={[styles.calloutName, { fontSize: scaleFont(14) }]}>
                  {f.username}
                </Text>
                <Text style={[styles.calloutSub, { fontSize: scaleFont(12) }]}>
                  Tap to get directions
                </Text>
              </View>
            </Callout>
          </Marker>
        ))}

        {routeCoords && routeCoords.length > 1 && (
          <Polyline coordinates={routeCoords} strokeColor={theme.green} strokeWidth={4} />
        )}
      </MapView>

      {/* BOTTOM PANEL */}
      <View style={[styles.panel, { backgroundColor: theme.header }]}>

        {/* Header row */}
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: theme.text, fontSize: scaleFont(18) }]}>
            Find Friends
          </Text>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.broadcastBtn, { backgroundColor: broadcasting ? theme.green : theme.button }]}
              onPress={() => {
                if (!token) { Alert.alert("Login required"); return; }
                broadcasting
                  ? endBroadcast()
                  : myLocation
                    ? startBroadcast(myLocation)
                    : Alert.alert("Waiting for GPS…");
              }}
              disabled={broadcastLoading}
            >
              {broadcastLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={[styles.broadcastBtnText, { fontSize: scaleFont(13) }]}>
                  {broadcasting ? "📡 Live" : "📡 Go Live"}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: theme.button }]}
              onPress={refreshFriends}
              disabled={loadingFriends}
            >
              {loadingFriends ? (
                <ActivityIndicator color={theme.text} size="small" />
              ) : (
                <Text style={{ color: theme.text, fontSize: scaleFont(16) }}>↻</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: theme.button }]}
              onPress={() => router.back()}
            >
              <Text style={{ color: theme.text, fontSize: scaleFont(16) }}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Friends list */}
        {friendsError && (
          <Text style={[styles.noFriendsText, { color: theme.red, fontSize: scaleFont(13) }]}>
            ⚠️ {friendsError}
          </Text>
        )}

        {!friendsError && friendLocations.length === 0 ? (
          <Text style={[styles.noFriendsText, { color: theme.lighttext, fontSize: scaleFont(13) }]}>
            {loadingFriends
              ? "Looking for friends nearby…"
              : "No friends are sharing their location right now."}
          </Text>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.friendScroll}
            contentContainerStyle={styles.friendScrollContent}
          >
            {friendLocations.map((f) => {
              const isSelected = selectedFriend?.userId === f.userId;

              return (
                <TouchableOpacity
                  key={f.userId}
                  style={[
                    styles.friendChip,
                    { backgroundColor: isSelected ? theme.green : theme.box },
                    isSelected && { borderColor: theme.green, borderWidth: 2 },
                  ]}
                  onPress={() => isSelected ? clearSelection() : selectFriend(f)}
                >
                  <View style={[styles.avatar, { backgroundColor: isSelected ? "#fff" : theme.button }]}>
                    <Text
                      style={[
                        styles.avatarText,
                        {
                          color: isSelected ? theme.green : theme.text,
                          fontSize: scaleFont(12),
                        },
                      ]}
                    >
                      {avatarInitials(f.username)}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.friendChipName,
                      {
                        color: isSelected ? "#fff" : theme.text,
                        fontSize: scaleFont(13),
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {f.username}
                  </Text>

                  <View style={styles.onlineDot} />
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* Directions panel */}
        {selectedFriend && (
          <View style={[styles.directionsPanel, { borderTopColor: theme.border }]}>
            <Text style={[styles.selectedName, { color: theme.text, fontSize: scaleFont(16) }]}>
              📍 {selectedFriend.username}
            </Text>

            <View style={styles.modeRow}>
              {(["foot-walking", "driving-car"] as Profile[]).map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.modeBtn,
                    { backgroundColor: theme.button },
                    profile === p && { borderWidth: 2, borderColor: theme.green },
                  ]}
                  onPress={() => {
                    setProfile(p);
                    setRouteCoords(null);
                    setSteps([]);
                    setSummary(null);
                  }}
                >
                  <Text style={[styles.modeBtnText, { color: theme.text, fontSize: scaleFont(14) }]}>
                    {p === "foot-walking" ? "🚶 Walk" : "🚗 Drive"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.routeBtn, { backgroundColor: theme.green }]}
              onPress={fetchRoute}
              disabled={routeLoading}
            >
              {routeLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={[styles.routeBtnText, { fontSize: scaleFont(15) }]}>
                  Get Directions
                </Text>
              )}
            </TouchableOpacity>

            {summary && (
              <Text style={[styles.summaryText, { color: theme.text, fontSize: scaleFont(14) }]}>
                {formatDistance(summary.distance)} · {formatDuration(summary.duration)}
              </Text>
            )}

            {steps.length > 0 && (
              <FlatList
                data={steps}
                keyExtractor={(_, i) => i.toString()}
                style={[styles.stepsList, { backgroundColor: theme.box }]}
                renderItem={({ item, index }) => (
                  <View style={[styles.stepItem, { borderBottomColor: theme.border }]}>
                    <Text style={[styles.stepText, { color: theme.text, fontSize: scaleFont(13) }]}>
                      {index + 1}. {item.instruction}
                    </Text>
                    <Text style={[styles.stepSub, { color: theme.lighttext, fontSize: scaleFont(12) }]}>
                      {formatDistance(item.distance)}
                    </Text>
                  </View>
                )}
              />
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  panel: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    maxHeight: "58%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 32 : 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  title: { fontSize: 18, fontWeight: "700" },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  broadcastBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  broadcastBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  iconBtn: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: "center", justifyContent: "center",
  },
  noFriendsText: {
    fontSize: 13, textAlign: "center",
    marginVertical: 10, fontStyle: "italic",
  },
  friendScroll: { flexGrow: 0 },
  friendScrollContent: { paddingVertical: 4, gap: 10 },
  friendChip: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 24,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
    marginRight: 8,
    minWidth: 100,
  },
  avatar: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: "center", justifyContent: "center",
  },
  avatarText: { fontSize: 12, fontWeight: "700" },
  friendChipName: { fontSize: 13, fontWeight: "600", flex: 1 },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#34C759" },
  directionsPanel: {
    marginTop: 12, paddingTop: 12, borderTopWidth: 1,
  },
  selectedName: { fontSize: 16, fontWeight: "700", marginBottom: 10 },
  modeRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  modeBtn: {
    flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: "center",
  },
  modeBtnText: { fontWeight: "600", fontSize: 14 },
  routeBtn: {
    paddingVertical: 12, borderRadius: 12, alignItems: "center", marginBottom: 8,
  },
  routeBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  summaryText: {
    fontSize: 14, fontWeight: "600", textAlign: "center", marginBottom: 8,
  },
  stepsList: { borderRadius: 8, maxHeight: 160, flexGrow: 0 },
  stepItem: { padding: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  stepText: { fontSize: 13, fontWeight: "500", marginBottom: 2 },
  stepSub: { fontSize: 12 },
  callout: { padding: 6, minWidth: 120 },
  calloutName: { fontWeight: "700", fontSize: 14, marginBottom: 2 },
  calloutSub: { fontSize: 12, color: "#666" },
});