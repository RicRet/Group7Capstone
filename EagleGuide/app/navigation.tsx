import Constants from "expo-constants";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Region } from "react-native-maps";
import { addRoute, getRoutes, SavedRoute } from "./lib/api/addroutev2";
import { getRouteFromORS, snapToRoad, type Coordinates, type Profile } from "./lib/api/directions";

export default function NavigationScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const [origin, setOrigin] = useState<Coordinates | null>(null);
  const [destination, setDestination] = useState<Coordinates | null>(null);
  const [routeCoords, setRouteCoords] = useState<Coordinates[] | null>(null);
  const [profile, setProfile] = useState<Profile>("foot-walking");
  const [loading, setLoading] = useState(false);
  const [orsKeyStatus, setOrsKeyStatus] = useState<string>("unknown");
  const [routeSample, setRouteSample] = useState<string>("");
  const [snappedPins, setSnappedPins] = useState<{ origin?: Coordinates; destination?: Coordinates }>({});

  const [showViewRoutes, setShowViewRoutes] = useState(false);
const [showAddRoute, setShowAddRoute] = useState(false);

const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([]);
const userId = "2cf8f2eb-8adc-49de-a993-fe075ff4bdee";


const [open1, setOpen1] = useState(false);
const [value1, setValue1] = useState<string | null>(null);
const [items1, setItems1] = useState([
  { label: "Student Union", value: "Student Union" },
  { label: "Willis", value: "Willis" },
  { label: "Parking Garage", value: "Parking Garage" },
]);

const [open2, setOpen2] = useState(false);
const [value2, setValue2] = useState<string | null>(null);
const [items2, setItems2] = useState(items1);

const [open3, setOpen3] = useState(false);
const [value3, setValue3] = useState<string | null>(null);
const [items3, setItems3] = useState([
  { label: "Pedestrian", value: "Pedestrian" },
  { label: "Bus", value: "Bus" },
]);

const [open4, setOpen4] = useState(false);
const [value4, setValue4] = useState<number | null>(null);
const [items4, setItems4] = useState([
  { label: "Yes", value: 1 },
  { label: "No", value: 0 },
]);

const loadSavedRoutes = async () => {
  try {
    const res = await getRoutes(userId);
    setSavedRoutes(res);
  } catch {
    Alert.alert("Error", "Could not load saved routes");
  }
};

useEffect(() => {
  if (showAddRoute) loadSavedRoutes();
}, [showAddRoute]);

const addNewRoute = async () => {
  if (!value1 || !value2 || !value3 || value4 === null) {
    return Alert.alert("Error", "Please fill all fields");
  }

  if (value1 === value2) {
    return Alert.alert("Invalid Route", "Start and end cannot match");
  }

  try {
    await addRoute({
      userid: userId,
      prevb: value1,
      newb: value2,
      prevblon: -97.15,
      prevblat: 33.21,
      newblon: -97.152,
      newblat: 33.215,
      accessible: value4,
      length: null,
      duration: null,
    });

    Alert.alert("Success", "Route added");
    loadSavedRoutes();
  } catch {
    Alert.alert("Error", "Could not save route");
  }
};

const closeAllPickers = () => {
  setOpen1(false);
  setOpen2(false);
  setOpen3(false);
  setOpen4(false);
};


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
    // If both set, replace destination
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
      // Snap pins to nearest routable points to reduce ORS failures
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
        // Log first few points
        const sample = coords.slice(0, 5).map((c, i) => `${i}: (${c.latitude.toFixed(6)}, ${c.longitude.toFixed(6)})`).join("\n");
        setRouteSample(sample);
        console.log("ORS route points count:", coords.length);
        console.log("Sample points:\n" + sample);
        if (coords.length === 2) {
          Alert.alert("Minimal route returned", "Provider returned only 2 points; displaying line between them.");
        }
      }
      // Fit map to route
      const toFit = (coords && coords.length >= 2) ? coords : [snappedOrigin, snappedDestination];
      mapRef.current?.fitToCoordinates(toFit, {
        edgePadding: { top: 70, right: 40, bottom: 70, left: 40 },
        animated: true,
      });
    } catch (err: any) {
      Alert.alert(
        "Routing unavailable",
        (err?.message || "Falling back to straight line.").slice(0, 500)
      );
      drawStraightLine();
      setRouteSample("<error>");
    } finally {
      setLoading(false);
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
        {/* Visual cue when no route yet */}
        {!routeCoords && origin && destination && (
          <Polyline coordinates={[origin, destination]} strokeColor="#999999" strokeWidth={2} />
        )}
        {/* Show snapped pins (blue) for debugging */}
        {snappedPins.origin && (
          <Marker coordinate={snappedPins.origin} title="Snapped Origin" pinColor="#0A84FF" />
        )}
        {snappedPins.destination && (
          <Marker coordinate={snappedPins.destination} title="Snapped Destination" pinColor="#0A84FF" />
        )}
      </MapView>

      <View style={styles.controls}>
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
       {/* 🔹 NEW: overlay trigger buttons */}
<View style={[styles.row, { marginTop: 12 }]}>
  <TouchableOpacity
    style={styles.modeButton}
    onPress={() => setShowViewRoutes(true)} // ✅ OPEN overlay
  >
    <Text style={styles.buttonText}>View Routes</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={styles.modeButton}
    onPress={() => setShowAddRoute(true)} // ✅ OPEN overlay
  >
    <Text style={styles.buttonText}>Add Route</Text>
  </TouchableOpacity>
</View>
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
      {/* ===== VIEW ROUTES OVERLAY ===== */}
{showViewRoutes && (
  <View style={styles.overlay}>
    <View style={styles.overlayCard}>
      <Text style={styles.overlayTitle}>Saved Routes</Text>

      <Text style={styles.overlayText}>
        This is the View Routes overlay.
      </Text>

      <TouchableOpacity
        style={[styles.button, styles.secondary]}
        onPress={() => setShowViewRoutes(false)}
      >
        <Text style={styles.buttonText}>Close</Text>
      </TouchableOpacity>
    </View>
  </View>
)}

{showAddRoute && (
  <View style={styles.overlay}>
    {/* ===== HEADER ===== */}
    <View style={styles.overlayHeader}>
      <Text style={styles.overlayTitle}>Add Route</Text>
    </View>

    {/* ===== BODY (FlatList lives HERE) ===== */}
    <FlatList
      data={savedRoutes}
      keyExtractor={(item) => item.saved_route_id}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingBottom: 30 }}

      ListHeaderComponent={
        <>
          {/* FORM CONTROLS */}
        <View style={{ zIndex: 4000, elevation: 4, marginBottom: 16 }}>
  <DropDownPicker
    open={open1}
    value={value1}
    items={items1}
    setOpen={(o) => {
      closeAllPickers();
      setOpen1(o);
    }}
    setValue={setValue1}
    listMode="SCROLLVIEW"
    dropDownContainerStyle={{ maxHeight: 180 }}
  />
</View>

{/* Destination */}
<View style={{ zIndex: 3000, elevation: 3, marginBottom: 16 }}>
  <DropDownPicker
    open={open2}
    value={value2}
    items={items2}
    setOpen={(o) => {
      closeAllPickers();
      setOpen2(o);
    }}
    setValue={setValue2}
    listMode="SCROLLVIEW"
    dropDownContainerStyle={{ maxHeight: 180 }}
  />
</View>

{/* Route Type */}
<View style={{ zIndex: 2000, elevation: 2, marginBottom: 16 }}>
  <DropDownPicker
    open={open3}
    value={value3}
    items={items3}
    setOpen={(o) => {
      closeAllPickers();
      setOpen3(o);
    }}
    setValue={setValue3}
    listMode="SCROLLVIEW"
    dropDownContainerStyle={{ maxHeight: 160 }}
  />
</View>

{/* Accessibility */}
<View style={{ zIndex: 1000, elevation: 1, marginBottom: 16 }}>
  <DropDownPicker
    open={open4}
    value={value4}
    items={items4}
    setOpen={(o) => {
      closeAllPickers();
      setOpen4(o);
    }}
    setValue={setValue4}
    listMode="SCROLLVIEW"
    dropDownContainerStyle={{ maxHeight: 160 }}
  />
</View>

          <TouchableOpacity
            style={styles.submitButton}
            onPress={addNewRoute}
          >
            <Text style={styles.submitButtonText}>Submit Route</Text>
          </TouchableOpacity>

          <Text style={styles.overlaySectionTitle}>Saved Routes</Text>
        </>
      }

      renderItem={({ item }) => (
        <View style={styles.routeCard}>
          <Text style={styles.routeinfo}>{item.name}</Text>
          <Text style={styles.routeinfo}>
            Accessible: {item.is_accessible ? "Yes" : "No"}
          </Text>
        </View>
      )}
    />

    {/* ===== FOOTER ===== */}
    <View style={styles.overlayFooter}>
      <TouchableOpacity
        style={[styles.button, styles.secondary]}
        onPress={() => setShowAddRoute(false)}
      >
        <Text style={styles.buttonText}>Close</Text>
      </TouchableOpacity>
    </View>
  </View>
)}


      
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
  bigButton: {
  flex: 1,
  marginHorizontal: 6,
  paddingVertical: 14,
},

overlayCard: {
  width: "85%",
  backgroundColor: "#3f3f3f",
  borderRadius: 14,
  padding: 16,
},



overlayText: {
  color: "#dcdcdcff",
  marginBottom: 16,
  textAlign: "center",
},


overlay: {
  position: "absolute",
  left: 0,
  right: 0,
  bottom: 0,
  height: "85%",
  backgroundColor: "#3f3f3f",
  borderTopLeftRadius: 18,
  borderTopRightRadius: 18,
},

overlayHeader: {
  padding: 16,
  borderBottomWidth: 1,
  borderBottomColor: "#4a4a4a",
},

overlayTitle: {
  color: "#dcdcdcff",
  fontSize: 18,
  fontWeight: "700",
  textAlign: "center",
},

overlayBody: {
  flex: 1,
  padding: 16,
},

overlayFooter: {
  padding: 16,
  borderTopWidth: 1,
  borderTopColor: "#4a4a4a",
},

routeCard: {
  backgroundColor: "#4a4a4a",
  padding: 10,
  borderRadius: 8,
  marginBottom: 10,
},

routeinfo: {
  color: "#dcdcdc",
},

submitButton: {
  backgroundColor: "#4caf50",
  paddingVertical: 12,
  borderRadius: 8,
  alignItems: "center",
  marginBottom: 20,
},

submitButtonText: {
  color: "#fff",
  fontWeight: "700",
  fontSize: 16,
},

overlaySectionTitle: {
  color: "#dcdcdcff",
  fontSize: 16,
  fontWeight: "700",
  marginBottom: 10,
  textAlign: "center",
},




});
