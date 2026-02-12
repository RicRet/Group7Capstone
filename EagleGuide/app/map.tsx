import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
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
import { fetchParkingLots, ParkingLotFeature } from './lib/api/parkingLots';
  
const MapScreen = () => {
    const [showMenu, setShowMenu] = useState(false);
    const [currentSheet, setCurrentSheet] = useState('home');
    const [parkingLots, setParkingLots] = useState<ParkingLotFeature[]>([]);
    const requestSeq = useRef(0);

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
        const seq = ++requestSeq.current; // prevent stale responses from overriding newer ones
        let cancelled = false;

        async function loadLots() {
            try {
                const data = await fetchParkingLots(bbox);
                if (!cancelled && seq === requestSeq.current) {
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

    const toPolygon = (feature: ParkingLotFeature) => {
        const coords = feature.geometry?.coordinates?.[0] || [];
        return coords.map(([lon, lat]) => ({ latitude: lat, longitude: lon }));
    };

    const fillColor = (fill?: string | null) => {
        if (!fill) return 'rgba(0, 122, 255, 0.25)';
        const match = /rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i.exec(fill);
        if (match) {
            const [r, g, b] = match.slice(1).map(Number);
            return `rgba(${r}, ${g}, ${b}, 0.3)`;
        }
        return 'rgba(0, 122, 255, 0.25)';
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