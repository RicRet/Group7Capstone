import React, { useState } from 'react';
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const MapScreen = () => {
    const [showSearch, setShowSearch] = useState(true);
    const [showBookmarks, setShowBookmarks] = useState(true);
    const [routeText, setRouteText] = useState('');

    // Split "Start to End"
    const parts = routeText.split(/\s+to\s+/i);
    const startLocation = parts[0]?.trim() || '';
    const endLocation = parts[1]?.trim() || '';

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>UNT Eagle Guide</Text>
            </View>

            {/* Collapsible Search Section */}
            <View style={styles.sectionContainer}>
                <TouchableOpacity
                    onPress={() => setShowSearch(!showSearch)}
                    style={styles.sectionHeader}
                >
                    <Text style={styles.sectionTitle}>Search Directions</Text>
                    <Text style={styles.toggleArrow}>{showSearch ? '▲' : '▼'}</Text>
                </TouchableOpacity>

                {showSearch && (
                    <View style={styles.searchContainer}>
                        <TextInput
                            style={styles.searchInput}
                            placeholder='Type route, e.g. "Willis Library to Union"'
                            placeholderTextColor="#999"
                            value={routeText}
                            onChangeText={setRouteText}
                        />
                    </View>
                )}
            </View>

            {/* Collapsible Bookmarks Section */}
            <View style={styles.sectionContainer}>
                <TouchableOpacity
                    onPress={() => setShowBookmarks(!showBookmarks)}
                    style={styles.sectionHeader}
                >
                    <Text style={styles.sectionTitle}>My Bookmarks</Text>
                    <Text style={styles.toggleArrow}>{showBookmarks ? '▲' : '▼'}</Text>
                </TouchableOpacity>

                {showBookmarks && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {['Willis Library', 'Union', 'Lot 20', 'Language', 'Eagle Landing'].map(
                            (item, index) => (
                                <View key={index} style={styles.bookmarkItem}>
                                    <Text style={styles.bookmarkText}>{item}</Text>
                                </View>
                            )
                        )}
                    </ScrollView>
                )}
            </View>

            {/* Zoomable Map */}
            <View style={styles.mapContainer}>
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    maximumZoomScale={3}
                    minimumZoomScale={1}
                    showsHorizontalScrollIndicator={false}
                    showsVerticalScrollIndicator={false}
                >
                    <Image
                        source={{
                            uri: 'https://texashistory.unt.edu/ark:/67531/metadc673735/m1/1/high_res/',
                        }}
                        style={styles.mapImage}
                        resizeMode="contain"
                    />
                </ScrollView>
                <Text style={styles.placeholderText}>(Pinch or scroll to zoom)</Text>
            </View>

            {/* Start Navigation Button */}
            {startLocation ? (
                <TouchableOpacity style={styles.navButton}>
                    <Text style={styles.navButtonText}>Start Navigation</Text>
                </TouchableOpacity>
            ) : null}
        </View>
    );
};

export default MapScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#eaf5e9',
        paddingTop: 40,
    },
    header: {
        alignItems: 'center',
        marginBottom: 10,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#006A31',
    },
    sectionContainer: {
        marginHorizontal: 20,
        marginBottom: 10,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#006A31',
    },
    toggleArrow: {
        fontSize: 16,
        color: '#006A31',
    },
    searchContainer: {
        backgroundColor: '#fff',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: '#ccc',
        marginTop: 8,
    },
    searchInput: {
        fontSize: 16,
        color: '#333',
    },
    bookmarkItem: {
        backgroundColor: '#fff',
        borderRadius: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#ccc',
    },
    bookmarkText: {
        fontSize: 14,
        color: '#333',
    },
    mapContainer: {
        flex: 1,
        borderWidth: 2,
        borderColor: '#006A31',
        marginHorizontal: 20,
        backgroundColor: '#fff',
    },
    scrollView: {
        flex: 1,
        width: '100%',
    },
    scrollContent: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    mapImage: {
        width: 800,
        height: 600,
    },
    placeholderText: {
        fontSize: 14,
        color: '#555',
        textAlign: 'center',
        marginVertical: 6,
    },
    navButton: {
        backgroundColor: '#006A31',
        marginHorizontal: 20,
        marginVertical: 10,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    navButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
});
