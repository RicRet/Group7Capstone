import { useRouter } from "expo-router";
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSession } from "./lib/session";


export default function Home({ onNavigate }: { onNavigate: (screen: string) => void }){
  const router = useRouter();
    const { user, loading, refreshMe, logout } = useSession();
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
      
            // Fetch current user once session is available
            useEffect(() => {
                if (!loading) {
                    refreshMe().catch(() => {});
                }
            }, [loading, refreshMe]);
  

  return (
  <View>
            {/* Session banner */}
            <View style={styles.sessionBar}>
                {loading ? (
                    <Text style={styles.sessionText}>Loading session…</Text>
                ) : user ? (
                    <View style={styles.sessionRow}>
                        <Text style={styles.sessionText}>Logged in as: {user.username ?? user.id}</Text>
                        <Text style={styles.sessionRoles}>Roles: {(user.roles || []).join(', ') || 'none'}</Text>
                        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
                            <Text style={styles.logoutText}>Logout</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <Text style={styles.sessionText}>Not logged in</Text>
                )}
            </View>
      <View style={styles.bottomContainer}>
                  {/* Search Bar */}
                  <View style={styles.searchBar}>
                      <TextInput
                          style={styles.searchInput}
                          placeholder='Search route (e.g. "Willis Library to Union")'
                          placeholderTextColor="#dcdcdcff"
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
    backgroundColor: "#45ca3e", 
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginTop: 20,
    alignItems: "center",
  },
  text: {
    marginTop: 50,        
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
  // bottom
  bottomContainer: {
        width: '100%',
        paddingHorizontal: 15,
    },
    searchBar: {
        backgroundColor: '#6b6b6b',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        elevation: 3,
        marginBottom: 8,
    },
    searchInput: { fontSize: 16, color: '#dcdcdcff' },

    /** Bookmarks **/
    bookmarksContainer: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    bookmarkItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#6b6b6b',
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 8,
        marginRight: 8,
        elevation: 3,
    },
    bookmarkText: { fontSize: 14, color: '#dcdcdcff', marginRight: 6 },
    deleteText: { color: 'red', fontSize: 16, fontWeight: '700' },

    /** Add Box **/
    addBox: {
        width: 40,
        height: 40,
        backgroundColor: '#45ca3e',
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 3,
    },
    addBoxText: {
        fontSize: 24,
        color: '#dcdcdcff',
        fontWeight: '700',
    },

    /** Navigation Button **/
    navButton: {
        backgroundColor: '#45ca3e',
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
        elevation: 4,
    },
    navButtonText: { color: '#dcdcdcff', fontSize: 18, fontWeight: '600' },
    contentContainer: {
    padding: 20,
    backgroundColor: '#3f3f3f',
  },
    sessionBar: {
        paddingHorizontal: 15,
        paddingVertical: 10,
        backgroundColor: '#3f3f3f',
    },
    sessionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flexWrap: 'wrap',
    },
    sessionText: { color: '#dcdcdcff', fontSize: 14 },
    sessionRoles: { color: '#9ad5ff', fontSize: 14 },
    logoutBtn: {
        marginLeft: 'auto',
        backgroundColor: '#6b6b6b',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    logoutText: { color: '#ffdada', fontWeight: '600' },
});