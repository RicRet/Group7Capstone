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
        width: 40,
    },
    menuButton: {
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 10,
        elevation: 4,
    },
    menuIcon: { fontSize: 22, color: '#006A31', fontWeight: '700' },
    menuContainer: {
        backgroundColor: '#fff',
        borderRadius: 8,
        marginTop: 8,
        paddingVertical: 6,
        width: 120,
        elevation: 4,
    },
    menuItem: { paddingVertical: 8, paddingHorizontal: 10 },
    menuText: { fontSize: 16, color: '#006A31', fontWeight: '500' },

    /** Bottom section **/
    bottomContainer: {
        width: '100%',
        paddingHorizontal: 15,
    },
    searchBar: {
        backgroundColor: '#fff',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        elevation: 3,
        marginBottom: 8,
    },
    searchInput: { fontSize: 16, color: '#333' },

    /** Bookmarks **/
    bookmarksContainer: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    bookmarkItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 8,
        marginRight: 8,
        elevation: 3,
    },
    bookmarkText: { fontSize: 14, color: '#333', marginRight: 6 },
    deleteText: { color: 'red', fontSize: 16, fontWeight: '700' },

    /** Add Box **/
    addBox: {
        width: 40,
        height: 40,
        backgroundColor: '#fff',
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 3,
    },
    addBoxText: {
        fontSize: 24,
        color: '#006A31',
        fontWeight: '700',
    },

    /** Navigation Button **/
    navButton: {
        backgroundColor: '#006A31',
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
        elevation: 4,
    },
    navButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
    contentContainer: {
    padding: 20,
    backgroundColor: '#c4c4c4ff',
  },
  bottomSheetBackground: {
    backgroundColor: '#c4c4c4ff',
  },
});
