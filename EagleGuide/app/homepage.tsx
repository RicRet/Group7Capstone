import { useRouter } from "expo-router";
import React, { useEffect } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSession } from "./lib/session";


export default function Home({ onNavigate }: { onNavigate: (screen: string) => void }){
  const router = useRouter();
    const { user, loading, refreshMe, logout } = useSession();
    // Simple nav buttons list
    const navItems = [
        { label: 'Map', to: '/map' },
        { label: 'Add Route', to: '/addroute' },
        { label: 'Login', to: '/Login' },
        { label: 'Signup', to: '/Signup' },
    ];

      
            // Fetch current user once session is available
            useEffect(() => {
                if (!loading) {
                    refreshMe().catch(() => {});
                }
            }, [loading, refreshMe]);
  

  return (
    <View style={styles.container}>
            {/* Header with branding */}
            <View style={styles.header}>
                <Image
                    source={require('../assets/images/UNT_logo.png')}
                    resizeMode="contain"
                    style={styles.logo}
                />
                <Text style={styles.title}>Eagle Guide</Text>
            </View>

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
            {/* Hero image */}
            <Image
                source={require('../assets/images/CampusImage.jpg')}
                resizeMode="cover"
                style={styles.hero}
            />

            {/* Navigation grid */}
            <View style={styles.grid}>
                {navItems.map((item) => (
                    <TouchableOpacity key={item.to} style={styles.card} onPress={() => router.push(item.to)}>
                        <Text style={styles.cardLabel}>{item.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>
    </View>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1f1f1f',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: '#2a2a2a',
    },
    logo: { width: 48, height: 48, marginRight: 12 },
    title: { color: '#dcdcdcff', fontSize: 22, fontWeight: '700' },
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
    hero: {
      width: '100%',
      height: 200,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      padding: 16,
      gap: 12,
    },
    card: {
      flexBasis: '48%',
      backgroundColor: '#2f2f2f',
      borderRadius: 12,
      paddingVertical: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardLabel: { color: '#dcdcdcff', fontSize: 16, fontWeight: '600' },
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