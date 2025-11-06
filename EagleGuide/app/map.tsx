import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import React, { useMemo, useRef, useState } from 'react';
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
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Addroute from './addroute';
import Homepage from './homepage';

const MapScreen = () => {
    const [showMenu, setShowMenu] = useState(false);
    const [currentSheet, setCurrentSheet] = useState('home');

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
                        provider={PROVIDER_GOOGLE}
                        customMapStyle={darkStyle}
                        style={StyleSheet.absoluteFillObject}
                        initialRegion={{
                        latitude: 33.2106,
                        longitude: -97.1470,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01,
                    }}
                    showsUserLocation
                    showsCompass
>
                    <Marker
                        coordinate={{ latitude: 33.2106, longitude: -97.1470 }}
                        title="University Union"
                        description="University of North Texas"
                    />
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
                                {['Home', 'Settings', 'Profile', 'Help'].map((tab, index) => (
                                    <TouchableOpacity key={index} style={styles.menuItem}>
                                        <Text style={styles.menuText}>{tab}</Text>
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
