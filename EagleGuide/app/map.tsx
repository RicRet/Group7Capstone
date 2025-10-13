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
    const [showBookmarks, setShowBookmarks] = useState(true);

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>UNT Eagle Guide</Text>
            </View>

            {/* Search Box */}
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search for buildings, parking, etc."
                    placeholderTextColor="#999"
                />
            </View>

            {/*Bookmarks Section */}
            <View style={styles.bookmarksContainer}>
                <TouchableOpacity
                    onPress={() => setShowBookmarks(!showBookmarks)}
                    style={styles.bookmarksHeader}
                >
                    <Text style={styles.bookmarksTitle}>My Bookmarks</Text>
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

            {/* Example Map Currently has UNT Map image */}
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
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        marginHorizontal: 20,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: '#ccc',
        marginBottom: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    bookmarksContainer: {
        marginHorizontal: 20,
        marginBottom: 10,
    },
    bookmarksHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    bookmarksTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#006A31',
    },
    toggleArrow: {
        fontSize: 16,
        color: '#006A31',
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
});
