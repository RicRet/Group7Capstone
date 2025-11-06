import { useRouter } from "expo-router";
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";


export default function Home({ onNavigate }: { onNavigate: (screen: string) => void }){
  const router = useRouter();
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
    //Backround Image
    
    <View style={styles.overlay}>

      <View style={styles.bottomContainer}>
                  {/* Search Bar */}
                  <View style={styles.searchBar}>
                      <TextInput
                          style={styles.searchInput}
                          placeholder='Search route (e.g. "Willis Library to Union")'
                          placeholderTextColor="#999"
                          value={routeText}
                          onChangeText={setRouteText}
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
        {/*First Button */}
     <TouchableOpacity
  style={styles.button}
  onPress={() => onNavigate('addroute')}
>
  <Text style={styles.buttonText}>Add Route (Placeholder)</Text>
</TouchableOpacity>

        {/* Second Button */}
       <View style={{ height: 20 }} /> 
       <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/map")}
      >
        <Text style={styles.buttonText}>View Routes (Placeholder)</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
   background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  
  button: {
    backgroundColor: "green", 
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignItems: "center",
    width: "80%",
  },
  text: {
    marginTop: 50,
    marginBottom: 20,         
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "center",
    color: "green",
  },
   buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
   overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center", 
    padding: 20,
    backgroundColor: "rgba(255,255,255,0.4)", 
  },

  // bottom
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
});