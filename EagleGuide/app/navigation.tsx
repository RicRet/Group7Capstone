import Constants from "expo-constants";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Region } from "react-native-maps";
import { getRouteFromORS, snapToRoad, type Coordinates, type Profile } from "./lib/api/directions";
import { searchLocation, type GeocodeResult } from "./lib/api/geocoding";
import { useTheme } from "./Theme";

export default function NavigationScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const mapRef = useRef<MapView>(null);

  const [origin, setOrigin] = useState<Coordinates | null>(null);
  const [destination, setDestination] = useState<Coordinates | null>(null);
  const [routeCoords, setRouteCoords] = useState<Coordinates[] | null>(null);
  const [profile, setProfile] = useState<Profile>("foot-walking");
  const [loading, setLoading] = useState(false);
  const [orsKeyStatus, setOrsKeyStatus] = useState<string>("unknown");
  const [routeSample, setRouteSample] = useState<string>("");
  const [snappedPins, setSnappedPins] = useState<{ origin?: Coordinates; destination?: Coordinates }>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GeocodeResult[]>([]);
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
    })();
  }, []);

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
    if (!origin) {
      setOrigin(coord);
      return;
    }
    if (!destination) {
      setDestination(coord);
      return;
    }
    setDestination(coord);
  };

  const swapPins = () => {
    setOrigin(destination);
    setDestination(origin);
    setRouteCoords(null);
  };

  const clearAll = () => {
    setOrigin(null);
    setDestination(null);
    setRouteCoords(null);
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
      const coords = await getRouteFromORS(snappedOrigin, snappedDestination, profile);
      if (!coords || coords.length < 2) {
        Alert.alert("No route returned", "Using straight line between pins.");
        drawStraightLine();
        setRouteSample("<empty>");
      } else {
        setRouteCoords(coords);
        const sample = coords.slice(0, 5).map((c, i) => `${i}: (${c.latitude.toFixed(6)}, ${c.longitude.toFixed(6)})`).join("\n");
        setRouteSample(sample);
      }
      const toFit = (coords && coords.length >= 2) ? coords : [snappedOrigin, snappedDestination];
      mapRef.current?.fitToCoordinates(toFit, {
        edgePadding: { top: 70, right: 40, bottom: 70, left: 40 },
        animated: true,
      });
    } catch (err: any) {
      Alert.alert("Routing unavailable", (err?.message || "Falling back to straight line.").slice(0, 500));
      drawStraightLine();
      setRouteSample("<error>");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const results = await searchLocation(searchQuery);
      setSearchResults(results);
    } catch {
      Alert.alert("Search failed", "Unable to find locations.");
    } finally {
      setSearching(false);
    }
  };

  const selectSearchResult = (result: GeocodeResult) => {
    setDestination(result.coordinates);
    setSearchResults([]);
    setSearchQuery(result.label);
    mapRef.current?.animateCamera({ center: result.coordinates, zoom: 16 });
  };

  const darkStyle = [
    { elementType: "geometry", stylers: [{ color: "#6b6b6b" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#dcdcdc" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#6b6b6b" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#999999" }] },
  ];

  return (
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
        {snappedPins.origin && (
          <Marker coordinate={snappedPins.origin} title="Snapped Origin" pinColor={theme.background} />
        )}
        {snappedPins.destination && (
          <Marker coordinate={snappedPins.destination} title="Snapped Destination" pinColor={theme.background} />
        )}
      </MapView>

      <View style={[styles.controls, { backgroundColor: theme.header }]}>
        <TextInput
          style={[styles.searchInput, { backgroundColor: theme.button, color: theme.text }]}
          placeholder="Search for a place or address"
          placeholderTextColor={theme.lighttext}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />

        {searching && <ActivityIndicator style={{ marginTop: 6 }} />}

        {searchResults.length > 0 && (
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id}
            style={styles.searchResults}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.searchItem, { borderBottomColor: theme.border }]}
                onPress={() => selectSearchResult(item)}
              >
                <Text style={[styles.searchText, { color: theme.text }]}>{item.label}</Text>
              </TouchableOpacity>
            )}
          />
        )}

        <View style={styles.row}>
          <TouchableOpacity style={[styles.button, { backgroundColor: theme.button }]} onPress={swapPins}>
            <Text style={[styles.buttonText, { color: theme.text }]}>Swap</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, { backgroundColor: theme.button }]} onPress={clearAll}>
            <Text style={[styles.buttonText, { color: theme.text }]}>Clear</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.row}>
          <TouchableOpacity
            style={[
              styles.modeButton,
              { backgroundColor: theme.button },
              profile === "foot-walking" && { borderWidth: 1, borderColor: theme.text }
            ]}
            onPress={() => setProfile("foot-walking")}
          >
            <Text style={[styles.buttonText, { color: theme.text }]}>Walk</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modeButton,
              { backgroundColor: theme.button },
              profile === "driving-car" && { borderWidth: 1, borderColor: theme.text }
            ]}
            onPress={() => setProfile("driving-car")}
          >
            <Text style={[styles.buttonText, { color: theme.text }]}>Drive</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.button, { backgroundColor: theme.button }]} onPress={fetchRoute} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={[styles.buttonText, { color: "#fff" }]}>Find Route</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, { backgroundColor: theme.button }]} onPress={() => router.back()}>
          <Text style={[styles.buttonText, { color: theme.text }]}>Back</Text>
        </TouchableOpacity>

        <Text style={[styles.hint, { color: theme.lighttext }]}>Long-press to set pins. Green: origin, Red: destination.</Text>
        <Text style={[styles.hint, { color: theme.lighttext }]}>{`ORS key: ${orsKeyStatus}`}</Text>
        <Text style={[styles.hint, { color: theme.lighttext }]}>{`Route points: ${routeCoords ? routeCoords.length : 0}`}</Text>

        {routeSample ? (
          <View style={[styles.sampleBox, { backgroundColor: theme.box }]}>
            <Text style={[styles.sampleTitle, { color: theme.text }]}>Route sample (first 5):</Text>
            <Text style={[styles.sampleText, { color: theme.lighttext }]}>{routeSample}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  controls: {
    position: "absolute",
    bottom: Platform.select({ ios: 40, android: 30 }),
    left: 20,
    right: 20,
    borderRadius: 12,
    padding: 12,
  },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: { fontWeight: "700" },
  modeButton: {
    flex: 1,
    marginHorizontal: 6,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  hint: { marginTop: 8, textAlign: "center" },
  sampleBox: { marginTop: 8, borderRadius: 8, padding: 8 },
  sampleTitle: { fontWeight: "700", marginBottom: 4 },
  sampleText: { fontFamily: Platform.select({ ios: "Menlo", android: "monospace" }) as any },
  searchInput: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, marginBottom: 6 },
  searchResults: { maxHeight: 160, marginBottom: 8 },
  searchItem: { paddingVertical: 8, paddingHorizontal: 10, borderBottomWidth: 1 },
  searchText: {},
});

