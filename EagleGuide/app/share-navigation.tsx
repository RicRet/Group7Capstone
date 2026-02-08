import Constants from "expo-constants";
import * as Linking from "expo-linking";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Platform, Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Region } from "react-native-maps";
import { getRouteFromORS, snapToRoad, type Coordinates, type Profile } from "./lib/api/directions";
import { createShareLocation, fetchShareLocation } from "./lib/api/shareLocation";
import { useSession } from "./lib/session";

export default function ShareNavigationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ shareId?: string | string[] }>();
  const { token } = useSession();
  const mapRef = useRef<MapView>(null);
  const [origin, setOrigin] = useState<Coordinates | null>(null);
  const [destination, setDestination] = useState<Coordinates | null>(null);
  const [routeCoords, setRouteCoords] = useState<Coordinates[] | null>(null);
  const [profile, setProfile] = useState<Profile>("foot-walking");
  const [loading, setLoading] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [orsKeyStatus, setOrsKeyStatus] = useState<string>("unknown");
  const [routeSample, setRouteSample] = useState<string>("");
  const [snappedPins, setSnappedPins] = useState<{ origin?: Coordinates; destination?: Coordinates }>({});
  const [shareInfo, setShareInfo] = useState<{ id: string; label?: string | null; owner?: string | null } | null>(null);

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

  useEffect(() => {
    const raw = params.shareId;
    const id = Array.isArray(raw) ? raw[0] : raw;
    if (!id) return;
    setShareLoading(true);
    fetchShareLocation(id)
      .then((data) => {
        setDestination({ latitude: data.latitude, longitude: data.longitude });
        setShareInfo({ id, label: data.label, owner: data.ownerUsername ?? null });
        mapRef.current?.animateCamera({ center: { latitude: data.latitude, longitude: data.longitude }, zoom: 16 });
      })
      .catch((err: any) => {
        Alert.alert("Shared location unavailable", (err?.message || "Not found or expired").slice(0, 200));
      })
      .finally(() => setShareLoading(false));
  }, [params.shareId]);

  useEffect(() => {
    if (origin && destination && shareInfo && !routeCoords && !loading) {
      fetchRoute();
    }
  }, [origin, destination, shareInfo]);

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
    setShareInfo(null);
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
        const sample = coords
          .slice(0, 5)
          .map((c, i) => `${i}: (${c.latitude.toFixed(6)}, ${c.longitude.toFixed(6)})`)
          .join("\n");
        setRouteSample(sample);
        if (coords.length === 2) {
          Alert.alert("Minimal route returned", "Provider returned only 2 points; displaying line between them.");
        }
      }
      const toFit = coords && coords.length >= 2 ? coords : [snappedOrigin, snappedDestination];
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

  const shareCurrentDestination = async () => {
    if (!destination) return Alert.alert("Set a destination first");
    if (!token) return Alert.alert("Login required", "Please log in to share.");
    setShareLoading(true);
    try {
      const res = await createShareLocation({
        latitude: destination.latitude,
        longitude: destination.longitude,
        label: "Pinned destination",
      });
      const url = Linking.createURL("/share-navigation", { queryParams: { shareId: res.shareId } });
      await Share.share({ title: "Meet me here", message: `Meet me here: ${url}` });
    } catch (err: any) {
      Alert.alert("Could not create share", (err?.message || "Please try again").slice(0, 200));
    } finally {
      setShareLoading(false);
    }
  };

  const darkStyle = [
    { elementType: "geometry", stylers: [{ color: "#6b6b6b" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#dcdcdcff" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#6b6b6b" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#999999" }] },
  ];

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        customMapStyle={darkStyle as any}
        style={StyleSheet.absoluteFillObject}
        initialRegion={initialRegion}
        showsUserLocation
        showsCompass
        onLongPress={handleLongPress}
      >
        {origin && <Marker coordinate={origin} title="Origin" pinColor="#34C759" />}
        {destination && <Marker coordinate={destination} title="Destination" pinColor="#FF3B30" />}
        {routeCoords && routeCoords.length > 1 && (
          <Polyline coordinates={routeCoords} strokeColor="#65d159" strokeWidth={4} />
        )}
        {!routeCoords && origin && destination && (
          <Polyline coordinates={[origin, destination]} strokeColor="#999999" strokeWidth={2} />
        )}
        {snappedPins.origin && (
          <Marker coordinate={snappedPins.origin} title="Snapped Origin" pinColor="#0A84FF" />
        )}
        {snappedPins.destination && (
          <Marker coordinate={snappedPins.destination} title="Snapped Destination" pinColor="#0A84FF" />
        )}
      </MapView>

      <View style={styles.controls}>
        {shareInfo ? (
          <Text style={styles.hint}>{`Opened shared location${shareInfo.owner ? ` from ${shareInfo.owner}` : ''}`}</Text>
        ) : null}
        <View style={styles.row}>
          <TouchableOpacity style={styles.button} onPress={swapPins}>
            <Text style={styles.buttonText}>Swap</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={clearAll}>
            <Text style={styles.buttonText}>Clear</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.modeButton, profile === "foot-walking" && styles.modeActive]}
            onPress={() => setProfile("foot-walking")}
          >
            <Text style={styles.buttonText}>Walk</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, profile === "driving-car" && styles.modeActive]}
            onPress={() => setProfile("driving-car")}
          >
            <Text style={styles.buttonText}>Drive</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={[styles.button, styles.route]} onPress={fetchRoute} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Find Route</Text>}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.secondary]}
          onPress={shareCurrentDestination}
          disabled={shareLoading || !destination}
        >
          {shareLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Share Destination</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.secondary]} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.hint}>Long-press to set pins. Green: origin, Red: destination.</Text>
        <Text style={styles.hint}>{`ORS key: ${orsKeyStatus}`}</Text>
        <Text style={styles.hint}>{`Route points: ${routeCoords ? routeCoords.length : 0}`}</Text>
        {routeSample ? (
          <View style={styles.sampleBox}>
            <Text style={styles.sampleTitle}>Route sample (first 5):</Text>
            <Text style={styles.sampleText}>{routeSample}</Text>
            {routeCoords && routeCoords.length === 2 ? (
              <Text style={styles.hint}>Provider returned only 2 points (straight segment).</Text>
            ) : null}
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
    backgroundColor: "#3f3f3f",
    borderRadius: 12,
    padding: 12,
  },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  button: {
    backgroundColor: "#2f2f2f",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: { color: "#dcdcdcff", fontWeight: "700" },
  modeButton: {
    flex: 1,
    marginHorizontal: 6,
    backgroundColor: "#2f2f2f",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  modeActive: { backgroundColor: "#4a4a4a", borderWidth: 1, borderColor: "#65d159" },
  route: { marginTop: 6 },
  secondary: { marginTop: 6, backgroundColor: "#4a4a4a" },
  hint: { marginTop: 8, color: "#dcdcdcff", textAlign: "center" },
  sampleBox: {
    marginTop: 8,
    backgroundColor: "#2f2f2f",
    borderRadius: 8,
    padding: 8,
  },
  sampleTitle: { color: "#dcdcdcff", fontWeight: "700", marginBottom: 4 },
  sampleText: { color: "#dcdcdcff", fontFamily: Platform.select({ ios: "Menlo", android: "monospace" }) as any },
});