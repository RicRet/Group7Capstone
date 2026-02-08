import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { acceptFriend, FriendEdge, FriendRequestResponse, FriendSearchResult, FriendsResponse, getFriends, searchFriends, sendFriendRequest } from "./lib/api/friends";
import { useSession } from "./lib/session";

export default function FriendsScreen() {
  const router = useRouter();
  const { user, loading: sessionLoading } = useSession();

  const [friends, setFriends] = useState<FriendsResponse>({ accepted: [], incoming: [], outgoing: [] });
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [searching, setSearching] = useState<boolean>(false);
  const [results, setResults] = useState<FriendSearchResult[]>([]);
  const [actionId, setActionId] = useState<string | null>(null);

  const headerTitle = useMemo(() => "Friends", []);

  useEffect(() => {
    if (sessionLoading) return;
    if (!user) {
      router.replace("/Login");
      return;
    }
    loadFriends();
  }, [sessionLoading, user, router]);

  const loadFriends = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await getFriends();
      setFriends(data);
    } catch (err: any) {
      Alert.alert("Could not load friends", (err?.message || "Please try again").slice(0, 200));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  const runSearch = useCallback(async () => {
    if (!searchTerm.trim()) {
      setResults([]);
      return;
    }
    try {
      setSearching(true);
      const matches = await searchFriends(searchTerm.trim());
      setResults(matches);
    } catch (err: any) {
      Alert.alert("Search failed", (err?.message || "Please retry").slice(0, 200));
    } finally {
      setSearching(false);
    }
  }, [searchTerm]);

  const handleSend = useCallback(
    async (targetId: string) => {
      setActionId(targetId);
      try {
        const resp: FriendRequestResponse = await sendFriendRequest(targetId);
        const friendlyMessage = resp.state === "accepted"
          ? "You are now friends"
          : resp.state === "already-friends"
            ? "You are already friends"
            : "Request sent";
        Alert.alert("Friend", friendlyMessage);
        await loadFriends();
        await runSearch();
      } catch (err: any) {
        Alert.alert("Could not send request", (err?.message || "Please try again").slice(0, 200));
      } finally {
        setActionId(null);
      }
    },
    [loadFriends, runSearch]
  );

  const handleAccept = useCallback(
    async (targetId: string) => {
      setActionId(targetId);
      try {
        await acceptFriend(targetId);
        Alert.alert("Friend", "Request accepted");
        await loadFriends();
        await runSearch();
      } catch (err: any) {
        Alert.alert("Could not accept", (err?.message || "Please try again").slice(0, 200));
      } finally {
        setActionId(null);
      }
    },
    [loadFriends, runSearch]
  );

  const renderFriendRow = (edge: FriendEdge, actionLabel?: string, onAction?: () => void) => (
    <View key={edge.userId} style={styles.friendRow}>
      <View style={styles.friendMeta}>
        <Text style={styles.friendName}>{edge.username || edge.email || edge.userId}</Text>
        <Text style={styles.friendSub}>{edge.status === "pending" ? `${edge.direction === "incoming" ? "Incoming" : "Sent"} request` : "Friend"}</Text>
      </View>
      {actionLabel && onAction ? (
        <TouchableOpacity
          style={[styles.actionButton, actionId === edge.userId && styles.actionButtonDisabled]}
          onPress={onAction}
          disabled={actionId === edge.userId}
        >
          {actionId === edge.userId ? (
            <ActivityIndicator color="#0d0d0d" />
          ) : (
            <Text style={styles.actionButtonText}>{actionLabel}</Text>
          )}
        </TouchableOpacity>
      ) : null}
    </View>
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadFriends();
  }, [loadFriends]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{headerTitle}</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#65d159" />}>
        <View style={styles.searchCard}>
          <Text style={styles.sectionTitle}>Find Friends</Text>
          <View style={styles.searchRow}>
            <TextInput
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholder="Search by name or email"
              placeholderTextColor="#777"
              style={styles.input}
              autoCapitalize="none"
            />
            <TouchableOpacity style={styles.searchButton} onPress={runSearch} disabled={searching}>
              {searching ? <ActivityIndicator color="#0d0d0d" /> : <Text style={styles.searchButtonText}>Search</Text>}
            </TouchableOpacity>
          </View>
          {results.length === 0 && !!searchTerm.trim() ? (
            <Text style={styles.emptyText}>No matches yet.</Text>
          ) : (
            results.map((r) => {
              const isPendingOut = r.relationship === "pending_out";
              const isPendingIn = r.relationship === "pending_in";
              const isAccepted = r.relationship === "accepted";
              let buttonLabel: string | null = null;
              let onPress: (() => void) | undefined;
              if (isAccepted) {
                buttonLabel = "Friends";
              } else if (isPendingOut) {
                buttonLabel = "Pending";
              } else if (isPendingIn) {
                buttonLabel = "Accept";
                onPress = () => handleAccept(r.userId);
              } else {
                buttonLabel = "Add";
                onPress = () => handleSend(r.userId);
              }
              return (
                <View key={`search-${r.userId}`} style={styles.friendRow}>
                  <View style={styles.friendMeta}>
                    <Text style={styles.friendName}>{r.username || r.email || r.userId}</Text>
                    <Text style={styles.friendSub}>{r.email || r.relationship}</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.actionButton, (isAccepted || isPendingOut) && styles.actionButtonDisabled]}
                    disabled={actionId === r.userId || isAccepted || isPendingOut}
                    onPress={onPress}
                  >
                    {actionId === r.userId ? (
                      <ActivityIndicator color="#0d0d0d" />
                    ) : (
                      <Text style={styles.actionButtonText}>{buttonLabel}</Text>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Friends</Text>
          {loading ? <ActivityIndicator color="#65d159" /> : null}
          {!loading && friends.accepted.length === 0 ? (
            <Text style={styles.emptyText}>No friends yet.</Text>
          ) : (
            friends.accepted.map((f) => renderFriendRow(f))
          )}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Requests</Text>
          {!loading && friends.incoming.length === 0 ? (
            <Text style={styles.emptyText}>No incoming requests.</Text>
          ) : (
            friends.incoming.map((f) => renderFriendRow(f, "Accept", () => handleAccept(f.userId)))
          )}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Sent Requests</Text>
          {!loading && friends.outgoing.length === 0 ? (
            <Text style={styles.emptyText}>No pending requests.</Text>
          ) : (
            friends.outgoing.map((f) => renderFriendRow(f))
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
  content: { padding: 16, paddingBottom: 40 },
  searchCard: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  sectionCard: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  sectionTitle: { color: "#65d159", fontWeight: "700", marginBottom: 8, fontSize: 15 },
  searchRow: { flexDirection: "row", alignItems: "center" },
  input: {
    flex: 1,
    backgroundColor: "#3a3a3a",
    color: "#fff",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 8,
  },
  searchButton: {
    backgroundColor: "#65d159",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    minWidth: 90,
    alignItems: "center",
  },
  searchButtonText: { color: "#0d0d0d", fontWeight: "700" },
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
  actionButton: {
    backgroundColor: "#65d159",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginLeft: 8,
    minWidth: 90,
    alignItems: "center",
  },
  actionButtonDisabled: { opacity: 0.6 },
  actionButtonText: { color: "#0d0d0d", fontWeight: "700" },
  emptyText: { color: "#b5b5b5", fontStyle: "italic", marginTop: 4 },
});
