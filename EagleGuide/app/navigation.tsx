import Constants from "expo-constants";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView, Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Region } from "react-native-maps";
import Addroute from "./addroute";
import Editroute from "./editroute";
import { SavedRoute } from "./lib/api/addroutev2";
import { getRouteFromORS, snapToRoad, type Coordinates, type Profile, type RouteStep } from "./lib/api/directions";
import { searchBuildings, type Building } from './lib/api/navbuildings';
import { useTheme } from "./Theme";
import { useAccessibility } from './Fontsize';

type BuildingSearchResult = {
  id: string;
  label: string;
  coordinates: { latitude: number; longitude: number };
  type?: string | null;
  description?: string | null;
};

const formatDuration = (seconds: number) => {
  const min = Math.floor(seconds / 60);
  if (min < 60) return `${min} min`;
  const hrs = Math.floor(min / 60);
  const remainingMin = min % 60;
  return `${hrs}h ${remainingMin}m`;
};

const formatDistance = (meters: number) => {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${Math.round(meters)} m`;
};

export default function NavigationScreen() {
  const { scaleFont } = useAccessibility(); // <--- get scaleFont
  const [showAddRoute, setShowAddRoute] = useState(false);
  const [editingRoute, setEditingRoute] = useState<SavedRoute | null>(null);

  const router = useRouter();
  const { theme, isDark } = useTheme();
  const mapRef = useRef<MapView>(null);
  const params = useLocalSearchParams<{ destLat?: string; destLon?: string; destLabel?: string }>();

  const [origin, setOrigin] = useState<Coordinates | null>(null);
  const [destination, setDestination] = useState<Coordinates | null>(null);
  const [routeCoords, setRouteCoords] = useState<Coordinates[] | null>(null);
  const [steps, setSteps] = useState<RouteStep[]>([]);
  const [summary, setSummary] = useState<{ distance: number, duration: number } | null>(null);

  const [profile, setProfile] = useState<Profile>("foot-walking");
  const [loading, setLoading] = useState(false);
  const [orsKeyStatus, setOrsKeyStatus] = useState<string>("unknown");
  const [snappedPins, setSnappedPins] = useState<{ origin?: Coordinates; destination?: Coordinates }>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<BuildingSearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const initialRegion: Region = useMemo(
    () => ({
      latitude: 33.2106,
      longitude: -97.1470,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }),
    []
  );

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const loc = await Location.getCurrentPositionAsync({});
      const userCoord = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setOrigin(userCoord);
      mapRef.current?.animateCamera({ center: userCoord, zoom: 16 });

      // Auto-route when navigating here from a reminder
      const rawLat = Array.isArray(params.destLat) ? params.destLat[0] : params.destLat;
      const rawLon = Array.isArray(params.destLon) ? params.destLon[0] : params.destLon;
      if (rawLat && rawLon) {
        const destLat = parseFloat(rawLat);
        const destLon = parseFloat(rawLon);
        if (!isNaN(destLat) && !isNaN(destLon)) {
          const destCoord = { latitude: destLat, longitude: destLon };
          setDestination(destCoord);
          const rawLabel = Array.isArray(params.destLabel) ? params.destLabel[0] : params.destLabel;
          if (rawLabel) setSearchQuery(rawLabel);
          setLoading(true);
          try {
            const snappedOrigin = await snapToRoad(userCoord, "foot-walking");
            const snappedDest = await snapToRoad(destCoord, "foot-walking");
            setSnappedPins({ origin: snappedOrigin, destination: snappedDest });
            const routeData = await getRouteFromORS(snappedOrigin, snappedDest, "foot-walking");
            if (routeData && routeData.coordinates.length >= 2) {
              setRouteCoords(routeData.coordinates);
              setSteps(routeData.steps);
              setSummary(routeData.summary);
              mapRef.current?.fitToCoordinates(routeData.coordinates, {
                edgePadding: { top: 50, right: 50, bottom: 300, left: 50 },
                animated: true,
              });
            } else {
              setRouteCoords([userCoord, destCoord]);
              mapRef.current?.fitToCoordinates([userCoord, destCoord], {
                edgePadding: { top: 50, right: 50, bottom: 300, left: 50 },
                animated: true,
              });
            }
          } catch {
            setRouteCoords([userCoord, destCoord]);
          } finally {
            setLoading(false);
          }
        }
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const extra: any = Constants.expoConfig?.extra || {};
    const fromExtra = extra?.orsApiKey;
    const fromEnv = process.env.EXPO_PUBLIC_ORS_API_KEY;
    if (fromExtra) setOrsKeyStatus("found in app.json (extra.orsApiKey)");
    else if (fromEnv) setOrsKeyStatus("found in env (EXPO_PUBLIC_ORS_API_KEY)");
    else setOrsKeyStatus("missing");
  }, []);

  const handleLongPress = (e: any) => {
    const coord = e.nativeEvent.coordinate as Coordinates;
    if (!origin) setOrigin(coord);
    else setDestination(coord);
  };

  const swapPins = () => {
    setOrigin(destination);
    setDestination(origin);
    setRouteCoords(null);
    setSteps([]);
    setSummary(null);
  };

  const clearAll = () => {
    setOrigin(null);
    setDestination(null);
    setRouteCoords(null);
    setSteps([]);
    setSummary(null);
  };

  const drawStraightLine = () => {
    if (!origin || !destination) return;
    setRouteCoords([origin, destination]);
  };

  const fetchRoute = async () => {
    if (!origin || !destination) {
      return Alert.alert("Select both pins", "Long-press map to set origin and destination.");
    }
    setLoading(true);
    try {
      const snappedOrigin = await snapToRoad(origin, profile);
      const snappedDestination = await snapToRoad(destination, profile);
      setSnappedPins({ origin: snappedOrigin, destination: snappedDestination });

      const routeData = await getRouteFromORS(snappedOrigin, snappedDestination, profile);

      if (!routeData || routeData.coordinates.length < 2) {
        Alert.alert("No route returned", "Using straight line between pins.");
        drawStraightLine();
        setSteps([]);
        setSummary(null);
      } else {
        setRouteCoords(routeData.coordinates);
        setSteps(routeData.steps);
        setSummary(routeData.summary);
      }

      const toFit = (routeData && routeData.coordinates.length >= 2) ? routeData.coordinates : [snappedOrigin, snappedDestination];
      mapRef.current?.fitToCoordinates(toFit, {
        edgePadding: { top: 50, right: 50, bottom: 300, left: 50 },
        animated: true,
      });
    } catch (err: any) {
      Alert.alert("Routing unavailable", (err?.message || "Falling back to straight line.").slice(0, 500));
      drawStraightLine();
      setSteps([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const results: Building[] = await searchBuildings(searchQuery);
      setSearchResults(results.map((b) => ({
        id: b.name,
        label: b.name,
        coordinates: { latitude: b.lat, longitude: b.lon },
        type: (b as any).type ?? null,
        description: (b as any).description ?? null,
      })));
    } finally { setSearching(false); }
  };

  const selectSearchResult = (result: BuildingSearchResult) => {
    setDestination(result.coordinates);
    setRouteCoords(null);
    setSteps([]);
    setSummary(null);
    setSearchQuery("");
    setSearchResults([]);
    mapRef.current?.animateCamera({ center: result.coordinates, zoom: 16 });
  };

  const darkStyle = [
    { elementType: "geometry", stylers: [{ color: "#6b6b6b" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#dcdcdc" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#6b6b6b" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#999999" }] },
  ];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          customMapStyle={isDark ? darkStyle : []}
          style={StyleSheet.absoluteFillObject}
          initialRegion={initialRegion}
          showsUserLocation
          showsCompass
          onLongPress={handleLongPress}
        >
          {origin && <Marker coordinate={origin} title="Origin" pinColor={theme.background} />}
          {destination && <Marker coordinate={destination} title="Destination" pinColor={theme.red} />}
          {routeCoords && routeCoords.length > 1 && (
            <Polyline coordinates={routeCoords} strokeColor={theme.background} strokeWidth={4} />
          )}
          {!routeCoords && origin && destination && (
            <Polyline coordinates={[origin, destination]} strokeColor={theme.border} strokeWidth={2} />
          )}
          {searchResults.length > 0 && searchResults.map((b) => (
            <Marker key={b.id} coordinate={b.coordinates} title={b.label} />
          ))}
        </MapView>

        <View style={[styles.controls, { backgroundColor: theme.header, maxHeight: '60%' }]}>
          <TextInput
            style={[styles.searchInput, { backgroundColor: theme.button, color: theme.text, fontSize: scaleFont(14) }]}
            placeholder="Search for a place or address"
            placeholderTextColor={theme.lighttext}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searching && <ActivityIndicator style={{ marginTop: 6 }} />}

          {searchResults.length > 0 && (
            <View style={{ maxHeight: 200 }}>
              <FlatList
                data={searchResults}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.searchItem, { borderBottomColor: theme.border }]}
                    onPress={() => selectSearchResult(item)}
                  >
                    <View style={{ paddingVertical: 8 }}>
                      <Text style={{ fontSize: scaleFont(16), fontWeight: "600", color: theme.text }}>
                        {item.label}
                      </Text>
                      {item.type && <Text style={{ fontSize: scaleFont(13), color: "#2E86FF" }}>{item.type}</Text>}
                      {item.description && <Text style={{ fontSize: scaleFont(12), color: "#666", marginTop: 2 }}>{item.description}</Text>}
                    </View>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}

          <View style={styles.row}>
            <TouchableOpacity style={[styles.button, { backgroundColor: theme.button }]} onPress={swapPins}>
              <Text style={{ color: theme.text, fontSize: scaleFont(14) }}>Swap</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, { backgroundColor: theme.button }]} onPress={clearAll}>
              <Text style={{ color: theme.text, fontSize: scaleFont(14) }}>Clear</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.modeButton, { backgroundColor: theme.button }, profile === "foot-walking" && { borderWidth: 1, borderColor: theme.text }]}
              onPress={() => setProfile("foot-walking")}
            >
              <Text style={{ color: theme.text, fontSize: scaleFont(14) }}>Walk</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeButton, { backgroundColor: theme.button }, profile === "driving-car" && { borderWidth: 1, borderColor: theme.text }]}
              onPress={() => setProfile("driving-car")}
            >
              <Text style={{ color: theme.text, fontSize: scaleFont(14) }}>Drive</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.row}>
            <TouchableOpacity style={[styles.button, { backgroundColor: theme.button, flex: 1, marginRight: 5 }]} onPress={fetchRoute} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontSize: scaleFont(14) }}>Find Route</Text>}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.button }]}
              onPress={() => setShowAddRoute(true)}
            >
              <Text style={{ color: theme.text, fontSize: scaleFont(14) }}>View Route</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, { backgroundColor: theme.button }]} onPress={() => router.back()}>
              <Text style={{ color: theme.text, fontSize: scaleFont(14) }}>Back</Text>
            </TouchableOpacity>
          </View>

          {summary && (
            <View style={{ marginTop: 10, marginBottom: 10 }}>
              <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: scaleFont(14) }}>
                Total: {formatDistance(summary.distance)} • {formatDuration(summary.duration)}
              </Text>
            </View>
          )}

          {steps.length > 0 && (
            <FlatList
              data={steps}
              keyExtractor={(_, index) => index.toString()}
              style={[styles.stepsList, { backgroundColor: theme.box }]}
              renderItem={({ item, index }) => (
                <View style={[styles.stepItem, { borderBottomColor: theme.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.text, fontSize: scaleFont(14), fontWeight: '500', marginBottom: 4 }}>
                      {index + 1}. {item.instruction}
                    </Text>
                    <Text style={{ color: theme.lighttext, fontSize: scaleFont(12) }}>
                      {formatDistance(item.distance)}
                    </Text>
                  </View>
                </View>
              )}
            />
          )}

        </View>

        {showAddRoute && !editingRoute && (
          <View style={styles.overlay}>
            <Addroute
              onClose={() => setShowAddRoute(false)}
              onEdit={(route) => setEditingRoute(route)}
              onNavigate={(data) => {
                setOrigin({ latitude: data.originLat, longitude: data.originLon });
                setDestination({ latitude: data.destLat, longitude: data.destLon });
                setShowAddRoute(false);
              }}
            />
          </View>
        )}

        {editingRoute && (
          <View style={styles.overlay}>
            <Editroute route={editingRoute} onClose={() => setEditingRoute(null)} />
          </View>
        )}

      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  controls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 30,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  searchInput: {
    height: 40,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  searchResults: {
    maxHeight: 150,
    marginBottom: 10,
  },
  searchItem: {
    padding: 10,
    borderBottomWidth: 1,
  },
  searchText: { fontSize: 14 },
  row: {
    flexDirection: "row",
    marginBottom: 10,
    justifyContent: "space-between",
  },
  button: {
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    minWidth: 70,
  },
  modeButton: {
    flex: 1,
    padding: 10,
    marginHorizontal: 5,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: { fontWeight: "600" },
  hint: { fontSize: 12, marginTop: 4 },

  stepsList: {
    marginTop: 5,
    borderRadius: 8,
    flexGrow: 0,
  },
  stepItem: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    alignItems: 'flex-start' // Aligns text to top
  },
  stepText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4
  },
  stepSubText: {
    fontSize: 12,
  },
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "90%",
    backgroundColor: "#3f3f3f",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    overflow: "hidden",
    zIndex: 100,
  },

});