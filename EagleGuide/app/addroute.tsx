import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { deleteRoute, getRoutes, SavedRoute } from './lib/api/addroutev2';
import { useTheme } from "./Theme";

//props for functions
type AddrouteProps = {
  onClose?: () => void;
  onEdit?: (route: SavedRoute) => void;
  onNavigate?: (data: {
    originLat: number;
    originLon: number;
    destLat: number;
    destLon: number;
    accessible: string;
  }) => void;
};


export default function Addroute({ onClose, onEdit, onNavigate }: AddrouteProps) {
  const router = useRouter();
  const { theme } = useTheme();
const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([]);
//Test Id
const userid: string = "2cf8f2eb-8adc-49de-a993-fe075ff4bdee";

const loadSavedR = async () => {
  try {
    const res = await getRoutes(userid);
    setSavedRoutes(res);
  } catch {
    Alert.alert("Error", "Could not load saved routes");
  }
};

useFocusEffect(
  useCallback(() => {
    loadSavedR();
  }, [])
);

 return (
  <View style={{ flex: 1, backgroundColor: theme.background }}>
  <TouchableOpacity
  style={[styles.addButton, { backgroundColor: theme.button }]}
  onPress={() => router.push("/addrs")}
>
  <Text style={styles.buttonText}>Add New Route</Text>
</TouchableOpacity>
    <FlatList
      data={savedRoutes}
      keyExtractor={(route) => route.saved_route_id}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingBottom: 40 }}
      ListHeaderComponent={() => (
        <View style={styles.container}>
          <Text style={[styles.title, { color: theme.text }]}>
            Choose current building and then destination:
          </Text>

          <Text style={[styles.SavedRoutesHeader, { color: theme.text }]}>
            Saved Routes
          </Text>
        </View>
      )}
      renderItem={({ item }) => (
        <View style={[styles.routeCard, { backgroundColor: theme.box }]}>
          <Text style={[styles.routeid, { color: theme.text }]}>
            Route Name: {item.name}
          </Text>

          <Text style={[styles.routeinfo, { color: theme.lighttext }]}>
            Accessibility: {item.is_accessible ? "Yes" : "No"}
          </Text>

          <View style={styles.buttonr}>
            <TouchableOpacity
              style={[styles.editButton, { backgroundColor: theme.button }]}
              onPress={() => onEdit?.(item)}
            >
              <Text style={styles.buttonText}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.editButton, { backgroundColor: theme.green }]}
              onPress={() =>
                onNavigate?.({
                  originLat: item.start_lat,
                  originLon: item.start_lon,
                  destLat: item.end_lat,
                  destLon: item.end_lon,
                  accessible: item.is_accessible ? "Yes" : "No",
                })
              }
            >
              <Text style={styles.buttonText}>Find Route</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.deleteButton, { backgroundColor: theme.red }]}
              onPress={async () => {
                await deleteRoute(item.saved_route_id);
                loadSavedR();
              }}
            >
              <Text style={styles.buttonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      ListFooterComponent={() => (
        <TouchableOpacity onPress={onClose} style={{ marginVertical: 20 }}>
          <Text style={[styles.link, { color: theme.text }]}>Close</Text>
        </TouchableOpacity>
      )}
    />
  </View>
);
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20 
  },
  title: { 
    marginBottom: 20, 
    fontSize: 16, 
    fontWeight: 'bold', 
    textAlign: 'center' 
  },
  link: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    textAlign: 'center' 
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  Savedroutes: { 
    width: '90%', 
    borderRadius: 10, 
    padding: 10, 
    marginBottom: 20 
  },
  SavedRoutesHeader: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginBottom: 10, 
    textAlign: 'center' 
  },
  routeCard: { 
    padding: 10, 
    borderRadius: 8, 
    marginBottom: 10 
  },
  routeid: { 
    fontWeight: 'bold', 
    marginBottom: 5 
  },
  routeinfo: {},
  buttonr: { 
    flexDirection: 'row', 
    justifyContent: 'flex-end', 
    marginTop: 10 
  },
  deleteButton: { 
    paddingVertical: 6, 
    paddingHorizontal: 12, 
    borderRadius: 6 
  },
  editButton: { 
    paddingVertical: 6, 
    paddingHorizontal: 12, 
    borderRadius: 6, 
    marginRight: 10 
  },
  buttonText: { 
    color: '#fff', 
    fontWeight: 'bold' 
  },
  addButton: {
  marginHorizontal: 20,
  marginTop: 20,
  marginBottom: 10,
  paddingVertical: 12,
  borderRadius: 10,
  alignItems: "center",
},
});