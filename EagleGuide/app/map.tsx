import React, { useState } from 'react';
import {
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

const MapScreen = () => {
    const [showMenu, setShowMenu] = useState(false);
    const [routeText, setRouteText] = useState('');
    const [bookmarks, setBookmarks] = useState([
        'Willis Library',
        'Union',
        'Lot 20',
        'Language',
        'Eagle Landing',
    ]);

    // Add bookmark via prompt
    const addBookmark = () => {
        Alert.prompt(
            'Add Bookmark',
            'Enter the name of your new bookmark:',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Add',
                    onPress: (bookmarkName?: string) => {
                        if (bookmarkName && bookmarkName.trim() && !bookmarks.includes(bookmarkName.trim())) {
                            setBookmarks([...bookmarks, bookmarkName.trim()]);
                        }
                    },
                },
            ],
            'plain-text'
        );
    };

    // Delete bookmark
    const deleteBookmark = (item: string) => {
        setBookmarks(bookmarks.filter((b) => b !== item));
    };

    return (
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

                    {/* Bottom Section */}
                    <View style={styles.bottomContainer}>
                        {/* Search Bar */}
                        <View style={styles.searchBar}>
                            <TextInput
                                style={styles.searchInput}
                                placeholder='Search route (e.g. "Willis Library to Union")'
                                placeholderTextColor="#999"
                                value={routeText}
                                onChangeText={setRouteText}
                                onFocus={() => setShowMenu(false)}
                                returnKeyType="done"
                            />
                        </View>

                        {/* Bookmarks */}
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.bookmarksContainer}
                        >
                            {bookmarks.map((item, index) => (
                                <View key={index} style={styles.bookmarkItem}>
                                    <Text style={styles.bookmarkText}>{item}</Text>
                                    <TouchableOpacity onPress={() => deleteBookmark(item)}>
                                        <Text style={styles.deleteText}>✕</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}

                            {/* Add Bookmark "+" Box */}
                            <TouchableOpacity style={styles.addBox} onPress={addBookmark}>
                                <Text style={styles.addBoxText}>＋</Text>
                            </TouchableOpacity>
                        </ScrollView>

                        <TouchableOpacity style={styles.navButton}>
                            <Text style={styles.navButtonText}>Start Navigation</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
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
        right: 20,
        alignItems: 'flex-end',
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
        position: 'absolute',
        bottom: 20,
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
});
