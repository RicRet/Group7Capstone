import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useRouter } from 'expo-router';
import type { Feature, Point } from "geojson";
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import MapView, { Marker, Polygon, Region } from 'react-native-maps';
import Addroute from './addroute';
import Homepage from './homepage';
import { BuildingFeature, fetchBuildings } from "./lib/api/buildings";
import { fetchEntrances } from "./lib/api/entrances";
import { fetchParkingLots, ParkingLotFeature } from './lib/api/parkingLots';
const entranceIcon = require("../assets/images/Entrance_Icon.png");
const accessibleEntranceIcon = require("../assets/images/Accessible_Entrance_Icon.png");

const MapScreen = () => {
    const [showMenu, setShowMenu] = useState(false);
    const [currentSheet, setCurrentSheet] = useState('home');
    const [parkingLots, setParkingLots] = useState<ParkingLotFeature[]>([]);
    const [entrances, setEntrances] = useState<Feature<Point>[]>([]);
    const [buildings, setBuildings] = useState<BuildingFeature[]>([]);
    const parkingReqSeq = useRef(0);
    const buildingsReqSeq = useRef(0);
    const entrancesReqSeq = useRef(0);

    const router = useRouter();

    const handleMenuPress = (path: string) => {
        setShowMenu(false);
        router.push(path);
    };

    const renderSheetContent = () => {
        switch (currentSheet) {
            case 'home':
                return <Homepage onNavigate={setCurrentSheet} />;
            case 'addroute':
                return <Addroute onNavigate={setCurrentSheet} />;
            default:
                return <Homepage onNavigate={setCurrentSheet} />;
        }
    };

    const sheetRef = useRef<BottomSheet>(null);
    const snapPoints = useMemo(() => ["25%", "50%", "90%"], []);

    const initialRegion: Region = {
        latitude: 33.2106,
        longitude: -97.1470,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
    };
    const [region, setRegion] = useState<Region>(initialRegion);

    const bbox = useMemo(() => {
        const halfLat = region.latitudeDelta / 2;
        const halfLon = region.longitudeDelta / 2;
        return {
            minLon: region.longitude - halfLon,
            minLat: region.latitude - halfLat,
            maxLon: region.longitude + halfLon,
            maxLat: region.latitude + halfLat,
        };
    }, [region]);

    useEffect(() => {
        const seq = ++parkingReqSeq.current; // prevent stale responses from overriding newer ones
        let cancelled = false;

        async function loadLots() {
            try {
                const data = await fetchParkingLots(bbox);
                if (!cancelled && seq === parkingReqSeq.current) {
                    setParkingLots(data.features || []);
                }
            } catch {
                // keep the last successful render if this request fails
            }
        }

        loadLots();
        return () => {
            cancelled = true;
        };
    }, [bbox]);
    useEffect(() => {
    const seq = ++buildingsReqSeq.current; // prevent stale responses
    let cancelled = false;

    async function loadBuildings() {
        try {
        const data = await fetchBuildings(bbox);
        if (!cancelled && seq === buildingsReqSeq.current) {
            setBuildings(data.features || []);
        }
        } catch {
        // keep last successful render
        }
    }

    loadBuildings();
    return () => {
        cancelled = true;
    };
    }, [bbox]);   
    useEffect(() => {
    const seq = ++entrancesReqSeq.current;
    let cancelled = false;

    async function loadEntrances() {
        try {
        const data = await fetchEntrances(bbox);
        if (!cancelled && seq === entrancesReqSeq.current) {
            setEntrances(data.features || []);
        }
        } catch (err) {
        console.log("Entrances load error:", err);
        }
    }

    loadEntrances();
    return () => { cancelled = true; };
    }, [bbox]);
    console.log("Entrances:", entrances.length);
        const toPolygon = (feature: ParkingLotFeature) => {
            const coords = feature.geometry?.coordinates?.[0] || [];
            return coords.map(([lon, lat]) => ({ latitude: lat, longitude: lon }));
        };
    const toBuildingPolygon = (feature: BuildingFeature) => {
    const coords = feature.geometry?.coordinates?.[0] || [];
    return coords.map(([lon, lat]) => ({ latitude: lat, longitude: lon }));
    };

const fillColor = (fill?: string | null) => {
  if (!fill) return "rgba(0, 122, 255, 0.25)";

  const s = fill.trim();

  // If it's already rgba(...) just return it (or normalize alpha if you want)
  const rgbaMatch = /^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([0-9.]+)\s*\)$/i.exec(s);
  if (rgbaMatch) return s;

  // rgb(r,g,b)
  const rgbMatch = /^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i.exec(s);
  if (rgbMatch) {
    const [r, g, b] = rgbMatch.slice(1).map(Number);
    return `rgba(${r}, ${g}, ${b}, 0.3)`;
  }

  // hex #RRGGBB or #RGB
  const hexMatch = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(s);
  if (hexMatch) {
    let hex = hexMatch[1];
    if (hex.length === 3) {
      hex = hex.split("").map(ch => ch + ch).join("");
    }
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, 0.3)`;
  }

  // If they stored "blue" or something weird, fall back
  return "rgba(0, 122, 255, 0.25)";
};

    // dark map style
    const darkStyle = [
  {
    "elementType": "geometry",
    "stylers": [{ "color": "#6b6b6b" }]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#dcdcdcff" }]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#6b6b6b" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [{ "color": "#999999" }]
  },
];

    return (
        <GestureHandlerRootView style={styles.container}>
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.container}>
                        {/* Map */}
                                <MapView
                                    customMapStyle={darkStyle}
                                    style={styles.map}
                                    initialRegion={initialRegion}
                                    region={region}
                                    onRegionChangeComplete={setRegion}
                                    showsUserLocation
                                    showsCompass
            >
                    <Marker
                        coordinate={{ latitude: 33.2106, longitude: -97.1470 }}
                        title="University Union"
                        description="University of North Texas"
                    />

                                        {parkingLots.map((lot) => {
                                            const coords = toPolygon(lot);
                                            if (!coords.length) return null;
                                            return (
                                                <Polygon
                                                    key={`lot-${lot.properties.lot_id}`}
                                                    coordinates={coords}
                                                    strokeColor="#333"
                                                    strokeWidth={1}
                                                    fillColor={fillColor(lot.properties.fill)}
                                                    tappable
                                                />
                                            );
                                        })}
                                        {buildings.map((b) => {
                                        const coords = toBuildingPolygon(b);
                                        if (!coords.length) return null;
                                        return (
                                        <Polygon
                                        key={`bldg-${b.properties.building_id}`}
                                        coordinates={coords}
                                        strokeColor="#222"
                                        strokeWidth={1}
                                        fillColor={fillColor(b.properties.fill)}
                                        tappable
                                        />
                                        );
                                        })}
                                        {entrances.map((e) => {
                                            const [lon, lat] = e.geometry.coordinates;
                                            const icon = e.properties.entrance_accessible
                                            ? accessibleEntranceIcon
                                            : entranceIcon;

                                        return (
                                        <Marker
                                        key={e.properties.entrance_id}
                                        coordinate={{ latitude: lat, longitude: lon }}
                                        title={e.properties.entrance_name}
                                        description={e.properties.entrance_accessible ? "Accessible entrance" : "Entrance"}
                                        tracksViewChanges={false}
                                        anchor={{ x: 0.5, y: 0.5 }}
                                        >
                                        <Image source={icon} style={{ width: 26, height: 26 }} />
                                        </Marker>
                                        );
                                        })}
                    </MapView>

                    {/* Floating menu button */}
                    <View style={styles.topRightContainer}>
                        <TouchableOpacity
                            style={styles.menuButton}
                            onPress={() => setShowMenu(!showMenu)}
                        >
                            <Text style={styles.menuIcon}>☰</Text>
                        </TouchableOpacity>

                        {showMenu && (
                            <View style={styles.menuContainer}>
                                {[
                                  { label: 'Home', path: '/homepage' },
                                  { label: 'Navigation', path: '/navigation' },
                                                                    { label: 'Shared Navigation', path: '/share-navigation' },
                                  { label: 'Add Route', path: '/addroute' },
                                  { label: 'Settings', path: '/Settings' },
                                  { label: 'Login / Signup', path: '/Login' },
                                ].map((item) => (
                                    <TouchableOpacity
                                        key={item.path}
                                        style={styles.menuItem}
                                        onPress={() => handleMenuPress(item.path)}
                                    >
                                        <Text style={styles.menuText}>{item.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>
                </View>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
        <BottomSheet
        ref={sheetRef}
        index={1}
        snapPoints={snapPoints}
        backgroundStyle={styles.bottomSheetBackground} 
      >
        <BottomSheetScrollView contentContainerStyle={styles.contentContainer}>
            {renderSheetContent()}
        </BottomSheetScrollView>
      </BottomSheet>
    </GestureHandlerRootView>
    );
};

export default MapScreen;

const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { ...StyleSheet.absoluteFillObject },

    /** Menu **/
    topRightContainer: {
        position: 'absolute',
        top: 50,
        left: 20,
        width: 45,
    },
    menuButton: {
        backgroundColor: '#3f3f3f',
        padding: 12,
        borderRadius: 10,
        elevation: 4,
    },
    menuIcon: { fontSize: 22, color: '#65d159', fontWeight: '700' },
    menuContainer: {
        backgroundColor: '#3f3f3f',
        borderRadius: 8,
        marginTop: 8,
        paddingVertical: 6,
        width: 120,
        elevation: 4,
    },
    menuItem: { paddingVertical: 8, paddingHorizontal: 10 },
    menuText: { fontSize: 16, color: '#006A31', fontWeight: '500' },
    contentContainer: {
    padding: 20,
  },
  bottomSheetBackground: {
    backgroundColor: '#3f3f3f',
  },
});