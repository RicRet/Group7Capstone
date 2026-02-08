import * as Linking from "expo-linking";
import * as Location from "expo-location";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Image, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { createShareLocation } from "./lib/api/shareLocation";
import { useSession } from "./lib/session";


export default function Home({ onNavigate }: { onNavigate?: (screen: string) => void }) {
    const router = useRouter();
    const { user, loading, refreshMe, logout } = useSession();
    const [locStatus, setLocStatus] = useState<"unknown" | "denied" | "granted" | "error">("unknown");
    const [coords, setCoords] = useState<Location.LocationObjectCoords | null>(null);
    const [checkingLoc, setCheckingLoc] = useState(false);
    const [shareLoading, setShareLoading] = useState(false);

    const navItems = [
        { label: "Navigation", to: "/navigation" },
        { label: "Shared Navigation", to: "/share-navigation" },
        { label: "Add Route", to: "/addroute" },
        { label: "Friends", to: "/friends" },
    ];

    const legendItems = useMemo(
        () => [
            { label: "Zone A", color: "#ff4040" },
            { label: "Zone V", color: "#cfae01" },
            { label: "Zone FS", color: "#63f922" },
            { label: "Zone SV", color: "#0de989" },
            { label: "Zone E", color: "#0d89e9" },
            { label: "Zone RR", color: "#6322f9" },
            { label: "Zone RM", color: "#cf01ae" },
            { label: "Zone AT", color: "#ff4040" },
        ],
        []
    );

    const campusCenter = useMemo(() => ({ latitude: 33.2106, longitude: -97.1470 }), []);
    const campusRadiusM = 1500; // 1.5 km radius around campus center

    useEffect(() => {
        if (!loading) {
            refreshMe().catch(() => {});
        }
    }, [loading, refreshMe]);

    useFocusEffect(
        useCallback(() => {
            let active = true;
            const loadLocation = async () => {
                setCheckingLoc(true);
                try {
                    const { status } = await Location.requestForegroundPermissionsAsync();
                    if (!active) return;
                    if (status !== "granted") {
                        setLocStatus("denied");
                        setCoords(null);
                        return;
                    }
                    setLocStatus("granted");
                    const current = await Location.getCurrentPositionAsync({});
                    if (!active) return;
                    setCoords(current.coords);
                } catch (err) {
                    if (!active) return;
                    console.warn("Location error", err);
                    setLocStatus("error");
                } finally {
                    if (active) setCheckingLoc(false);
                }
            };

            loadLocation();
            return () => {
                active = false;
            };
        }, [])
    );

    const distanceMeters = (a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) => {
        const toRad = (x: number) => (x * Math.PI) / 180;
        const R = 6371000; // meters
        const dLat = toRad(b.latitude - a.latitude);
        const dLon = toRad(b.longitude - a.longitude);
        const lat1 = toRad(a.latitude);
        const lat2 = toRad(b.latitude);
        const sinDlat = Math.sin(dLat / 2);
        const sinDlon = Math.sin(dLon / 2);
        const c = 2 * Math.atan2(
            Math.sqrt(sinDlat * sinDlat + Math.cos(lat1) * Math.cos(lat2) * sinDlon * sinDlon),
            Math.sqrt(1 - (sinDlat * sinDlat + Math.cos(lat1) * Math.cos(lat2) * sinDlon * sinDlon))
        );
        return R * c;
    };

    const onCampus = coords
        ? distanceMeters(campusCenter, { latitude: coords.latitude, longitude: coords.longitude }) <= campusRadiusM
        : null;

    const shareMyLocation = async () => {
        if (!coords) return Alert.alert("Locate first", "We need your location before sharing.");
        if (!user) return Alert.alert("Login required", "Please log in to share your location.");
        setShareLoading(true);
        try {
            const res = await createShareLocation({
                latitude: coords.latitude,
                longitude: coords.longitude,
                label: onCampus ? "On campus" : "My location",
            });
            const url = Linking.createURL("/navigation", { queryParams: { shareId: res.shareId } });
            await Share.share({
                title: "Meet me here",
                message: `Meet me here: ${url}`,
            });
        } catch (err: any) {
            Alert.alert("Could not share", (err?.message || "Please try again").slice(0, 200));
        } finally {
            setShareLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <View style={styles.brandRow}>
                        <Image
                            source={require("../assets/images/UNT_logo.png")}
                            resizeMode="contain"
                            style={styles.logo}
                        />
                        <Text style={styles.title}>Eagle Guide</Text>
                    </View>
                    <View style={styles.headerActions}>
                        {loading ? (
                            <ActivityIndicator color="#65d159" />
                        ) : user ? (
                            <View style={styles.userPill}>
                                <Text style={styles.userText}>Hi, {user.username ?? user.id}</Text>
                                <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
                                    <Text style={styles.logoutText}>Logout</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.authRow}>
                                <TouchableOpacity style={styles.authButton} onPress={() => router.push("/Login")}>
                                    <Text style={styles.authText}>Login</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.authButton, styles.authSecondary]}
                                    onPress={() => router.push("/Signup")}
                                >
                                    <Text style={styles.authTextLight}>Sign Up</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>

                <Image
                    source={require("../assets/images/CampusImage.jpg")}
                    resizeMode="cover"
                    style={styles.hero}
                />

                <View style={styles.locationCard}>
                    <View style={styles.locationHeader}>
                        <Text style={styles.sectionTitle}>My Location</Text>
                        {checkingLoc && <ActivityIndicator color="#65d159" size="small" />}
                    </View>
                    {locStatus === "denied" && (
                        <Text style={styles.locationText}>Location permission is needed to show your position.</Text>
                    )}
                    {locStatus === "error" && (
                        <Text style={styles.locationText}>Could not read location. Please try again.</Text>
                    )}
                    {locStatus === "granted" && coords && (
                        <>
                            <Text style={[styles.locationBadge, onCampus ? styles.onCampus : styles.offCampus]}>
                                {onCampus ? "On campus" : "Outside campus"}
                            </Text>
                            {!onCampus && <Text style={styles.locationText}>You appear to be outside the campus area.</Text>}
                            <MapView
                                style={styles.locationMap}
                                pointerEvents="none"
                                region={{
                                    latitude: coords.latitude,
                                    longitude: coords.longitude,
                                    latitudeDelta: 0.01,
                                    longitudeDelta: 0.01,
                                }}
                                showsUserLocation
                                customMapStyle={mapStyle as any}
                            >
                                <Marker
                                    coordinate={{ latitude: coords.latitude, longitude: coords.longitude }}
                                    title="You"
                                    pinColor="#65d159"
                                />
                            </MapView>
                            <TouchableOpacity
                                style={[styles.shareBtn, shareLoading && styles.shareBtnDisabled]}
                                onPress={shareMyLocation}
                                disabled={shareLoading}
                            >
                                {shareLoading ? (
                                    <ActivityIndicator color="#0d0d0d" />
                                ) : (
                                    <Text style={styles.shareBtnText}>Share My Location</Text>
                                )}
                            </TouchableOpacity>
                        </>
                    )}
                    {locStatus === "granted" && !coords && !checkingLoc && (
                        <Text style={styles.locationText}>Locating you…</Text>
                    )}
                </View>

                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actionsRow}>
                    {navItems.map((item) => (
                        <TouchableOpacity
                            key={item.to}
                            style={styles.actionCard}
                            onPress={() => {
                                router.push(item.to);
                                onNavigate?.(item.to);
                            }}
                        >
                            <Text style={styles.cardLabel}>{item.label}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <View style={styles.legendCard}>
                    <View style={styles.legendHeader}>
                        <Text style={[styles.sectionTitle, styles.legendTitle]}>Parking Legend</Text>
                        <Text style={styles.legendNote}>Colors match the lots shown on the map</Text>
                    </View>
                    <View style={styles.legendGrid}>
                        {legendItems.map((item) => (
                            <View key={item.label} style={styles.legendItem}>
                                <View style={[styles.legendSwatch, { backgroundColor: item.color }]} />
                                <Text style={styles.legendLabel}>{item.label}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1f1f1f',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: '#2a2a2a',
        gap: 12,
    },
    brandRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    logo: { width: 48, height: 48 },
    title: { color: '#dcdcdcff', fontSize: 22, fontWeight: '700' },
    headerActions: { flexDirection: 'row', alignItems: 'center' },
    authRow: { flexDirection: 'row', gap: 10 },
    authButton: {
        backgroundColor: '#65d159',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 10,
    },
    authSecondary: { backgroundColor: '#4a4a4a' },
    authText: { color: '#0d0d0d', fontWeight: '700' },
    authTextLight: { color: '#dcdcdcff', fontWeight: '700' },
    userPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#3f3f3f',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        gap: 10,
    },
    userText: { color: '#dcdcdcff', fontWeight: '600' },
    hero: {
      width: '100%',
      height: 200,
    },
    sectionTitle: {
        color: '#65d159',
        fontSize: 16,
        fontWeight: '700',
        marginHorizontal: 16,
        marginTop: 20,
        marginBottom: 8,
    },
    actionsRow: {
        paddingHorizontal: 12,
        gap: 12,
    },
    actionCard: {
        backgroundColor: '#2f2f2f',
        borderRadius: 14,
        paddingVertical: 18,
        paddingHorizontal: 20,
        minWidth: 140,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardLabel: { color: '#dcdcdcff', fontSize: 16, fontWeight: '600' },
    locationCard: {
        marginTop: 16,
        marginHorizontal: 16,
        backgroundColor: '#2f2f2f',
        borderRadius: 14,
        padding: 14,
        gap: 8,
    },
    locationHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    locationText: { color: '#dcdcdcff' },
    locationBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
        fontWeight: '700',
        color: '#0d0d0d',
    },
    onCampus: { backgroundColor: '#65d159' },
    offCampus: { backgroundColor: '#e24a4a' },
    locationMap: { width: '100%', height: 170, borderRadius: 12 },
    logoutBtn: {
        backgroundColor: '#6b6b6b',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    logoutText: { color: '#ffdada', fontWeight: '600' },
    legendCard: {
        marginTop: 20,
        marginHorizontal: 16,
        backgroundColor: '#2f2f2f',
        borderRadius: 14,
        padding: 14,
        gap: 12,
    },
    legendHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    legendGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#3a3a3a',
        borderRadius: 10,
        paddingVertical: 8,
        paddingHorizontal: 10,
    },
    legendSwatch: {
        width: 18,
        height: 18,
        borderRadius: 4,
    },
    legendLabel: { color: '#dcdcdcff', fontWeight: '600' },
    legendNote: { color: '#9e9e9e', fontSize: 12 },
    legendTitle: {
        marginHorizontal: 0,
        marginTop: 0,
        marginBottom: 0,
    },
    shareBtn: {
        marginTop: 12,
        backgroundColor: '#65d159',
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    shareBtnDisabled: {
        opacity: 0.7,
    },
    shareBtnText: {
        color: '#0d0d0d',
        fontWeight: '700',
    },
});

const mapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#6b6b6b' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#dcdcdcff' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#6b6b6b' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#999999' }] },
];