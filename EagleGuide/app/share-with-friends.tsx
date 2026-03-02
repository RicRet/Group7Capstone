import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { FriendEdge, FriendsResponse, getFriends } from "./lib/api/friends";
import { createShareLocation } from "./lib/api/shareLocation";
import { useSession } from "./lib/session";

export default function ShareWithFriendsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ lat?: string; lng?: string; label?: string }>();
  const { token, loading: sessionLoading } = useSession();

  const latitude = params.lat ? parseFloat(params.lat) : null;
  const longitude = params.lng ? parseFloat(params.lng) : null;
  const label = params.label || "Shared destination";

  const [friends, setFriends] = useState<FriendEdge[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sharingId, setSharingId] = useState<string | null>(null);

  const loadFriends = useCallback(async () => {
    try {
      const data: FriendsResponse = await getFriends();
      setFriends(data.accepted);
    } catch (err: any) {
      Alert.alert("Could not load friends", (err?.message || "Please try again").slice(0, 200));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (sessionLoading) return;
    if (!token) {
      router.replace("/Login");
      return;
    }
    if (latitude === null || longitude === null || isNaN(latitude) || isNaN(longitude)) {
      Alert.alert("Invalid location", "No destination was provided to share.");
      router.back();
      return;
    }
    loadFriends();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionLoading, token]);

  const handleShareWithFriend = useCallback(
    async (friend: FriendEdge) => {
      if (latitude === null || longitude === null) return;
      const friendName =
        [friend.firstName, friend.lastName].filter(Boolean).join(" ") ||
        friend.username ||
        friend.email ||
        "your friend";

      setSharingId(friend.userId);
      try {
        const res = await createShareLocation({
          latitude,
          longitude,
          label,
        });
        const url = Linking.createURL("/share-navigation", {
          queryParams: { shareId: res.shareId },
        });
        await Share.share({
          title: `Meet me here — for ${friendName}`,
          message: `Hey ${friendName}, meet me here: ${url}`,
        });
      } catch (err: any) {
        // User cancelled share or an error occurred
        if ((err as any)?.message !== "User did not share") {
          Alert.alert("Could not share", (err?.message || "Please try again").slice(0, 200));
        }
      } finally {
        setSharingId(null);
      }
    },
    [latitude, longitude, label]
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadFriends();
  }, [loadFriends]);

  const renderFriendRow = (friend: FriendEdge) => {
    const name =
      [friend.firstName, friend.lastName].filter(Boolean).join(" ") ||
      friend.username ||
      friend.email ||
      friend.userId;
    const sub = friend.username ? `@${friend.username}` : friend.email || friend.userId;
    const isSharing = sharingId === friend.userId;

    return (
      <View key={friend.userId} style={styles.friendRow}>
        <View style={styles.friendMeta}>
          <Text style={styles.friendName}>{name}</Text>
          <Text style={styles.friendSub}>{sub}</Text>
        </View>
        <TouchableOpacity
          style={[styles.shareButton, isSharing && styles.shareButtonDisabled]}
          onPress={() => handleShareWithFriend(friend)}
          disabled={isSharing || sharingId !== null}
        >
          {isSharing ? (
            <ActivityIndicator color="#0d0d0d" />
          ) : (
            <Text style={styles.shareButtonText}>Share</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Share with Friend</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Destination info banner */}
      <View style={styles.banner}>
        <Text style={styles.bannerLabel}>Destination</Text>
        <Text style={styles.bannerCoords}>
          {latitude !== null && longitude !== null
            ? `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
            : "—"}
        </Text>
        {params.label ? <Text style={styles.bannerSub}>{params.label}</Text> : null}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#65d159" />
        }
      >
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Your Friends</Text>
          <Text style={styles.sectionHint}>
            {'Tap \'Share\' next to a friend to send them a link to this location.'}
          </Text>

          {loading ? (
            <ActivityIndicator color="#65d159" style={{ marginTop: 16 }} />
          ) : friends.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>You have no friends yet.</Text>
              <TouchableOpacity
                style={styles.addFriendsButton}
                onPress={() => router.push("/friends")}
              >
                <Text style={styles.addFriendsButtonText}>Add Friends</Text>
              </TouchableOpacity>
            </View>
          ) : (
            friends.map(renderFriendRow)
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1f1f1f" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "#2a2a2a",
  },
  backText: { color: "#65d159", fontWeight: "700", fontSize: 16 },
  headerTitle: { color: "#ffffff", fontWeight: "800", fontSize: 20 },
  banner: {
    backgroundColor: "#2f2f2f",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#3a3a3a",
  },
  bannerLabel: { color: "#65d159", fontWeight: "700", fontSize: 12, textTransform: "uppercase" },
  bannerCoords: { color: "#ffffff", fontWeight: "600", fontSize: 14, marginTop: 2 },
  bannerSub: { color: "#b5b5b5", fontSize: 12, marginTop: 2 },
  content: { padding: 16, paddingBottom: 40 },
  sectionCard: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    padding: 12,
  },
  sectionTitle: { color: "#65d159", fontWeight: "700", fontSize: 15, marginBottom: 4 },
  sectionHint: { color: "#b5b5b5", fontSize: 12, marginBottom: 12 },
  friendRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#3a3a3a",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  friendMeta: { flex: 1 },
  friendName: { color: "#fff", fontWeight: "700", fontSize: 16 },
  friendSub: { color: "#b5b5b5", fontSize: 12, marginTop: 2 },
  shareButton: {
    backgroundColor: "#65d159",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 8,
    minWidth: 80,
    alignItems: "center",
  },
  shareButtonDisabled: { opacity: 0.6 },
  shareButtonText: { color: "#0d0d0d", fontWeight: "700" },
  emptyContainer: { alignItems: "center", paddingVertical: 20 },
  emptyText: { color: "#b5b5b5", fontStyle: "italic", marginBottom: 12 },
  addFriendsButton: {
    backgroundColor: "#65d159",
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  addFriendsButtonText: { color: "#0d0d0d", fontWeight: "700" },
});
