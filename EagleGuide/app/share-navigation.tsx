import Constants from "expo-constants";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Region } from "react-native-maps";
import { getRouteFromORS, snapToRoad, type Coordinates, type Profile } from "./lib/api/directions";
import { fetchShareLocation } from "./lib/api/shareLocation";
import { useSession } from "./lib/session";
import { useAccessibility } from "./Fontsize";
import { useTheme } from "../app/Theme";

export default function ShareNavigationScreen() {
  const { scaleFont } = useAccessibility();
  const { theme, isDark } = useTheme();

  const router = useRouter();
  const params = useLocalSearchParams<{ shareId?: string | string[] }>();
  const { token } = useSession();
  const mapRef = useRef<MapView>(null);

  const [origin, setOrigin] = useState<Coordinates | null>(null);
  const [destination, setDestination] = useState<Coordinates | null>(null);
  const [routeCoords, setRouteCoords] = useState<Coordinates[] | null>(null);
  const [profile, setProfile] = useState<Profile>("foot-walking");
  const [loading, setLoading] = useState(false);
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
    fetchShareLocation(id)
      .then((data) => {
        setDestination({ latitude: data.latitude, longitude: data.longitude });
        setShareInfo({ id, label: data.label, owner: data.ownerUsername ?? null });
        mapRef.current?.animateCamera({ center: { latitude: data.latitude, longitude: data.longitude }, zoom: 16 });
      })
      .catch((err: any) => {
        Alert.alert("Shared location unavailable", (err?.message || "Not found or expired").slice(0, 200));
      });
  }, [params.shareId]);

  useEffect(() => {
    if (origin && destination && shareInfo && !routeCoords && !loading) {
      fetchRoute();
    }
  }, [origin, destination, shareInfo]);

  const handleLongPress = (e: any) => {
    const coord = e.nativeEvent.coordinate as Coordinates;
    if (!origin) return setOrigin(coord);
    if (!destination) return setDestination(coord);
    setDestination(coord);
  };

  const swapPins = () => {
    setOrigin(destination);
    setDestination(origin);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={initialRegion}
        onLongPress={handleLongPress}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        customMapStyle={isDark ? mapStyle : []}
      >
        {origin && <Marker coordinate={origin} title="Origin" />}
        {destination && <Marker coordinate={destination} title="Destination" />}
        {routeCoords && <Polyline coordinates={routeCoords} strokeWidth={4} />}
      </MapView>

      <View style={[styles.overlay, { backgroundColor: theme.box }]}>
        <Text style={[styles.title, { color: theme.text, fontSize: scaleFont(18) }]}>
          Shared Navigation
        </Text>

        <Text style={[styles.status, { color: theme.lighttext, fontSize: scaleFont(12) }]}>
          ORS: {orsKeyStatus}
        </Text>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.green }]}
          onPress={swapPins}
        >
          <Text style={{ color: "#000", fontSize: scaleFont(14) }}>Swap</Text>
        </TouchableOpacity>

        {loading && <ActivityIndicator color={theme.green} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  overlay: {
    position: "absolute",
    top: 50,
    left: 20,
    right: 20,
    padding: 12,
    borderRadius: 12,
  },

  title: {
    fontWeight: "bold",
    marginBottom: 6,
  },

  status: {
    marginBottom: 8,
  },

  button: {
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
});