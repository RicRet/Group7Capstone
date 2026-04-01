import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import * as Speech from "expo-speech";
import { useCallback, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, Vibration, View } from 'react-native';
import { useAccessibility } from './Fontsize';
import { deleteRoute, getRoutes, SavedRoute } from './lib/api/addroutev2';
import { useTTS } from "./speech";
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
  const { scaleFont } = useAccessibility();
const { ttsEnabled } = useTTS();

const [lastSpoken, setLastSpoken] = useState<string | null>(null);
const [highlighted, setHighlighted] = useState<string | null>(null);
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([]);
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

  const handleAccessiblePress = (id: string, label: string, action: () => void) => {
  if (!ttsEnabled) {
    action();
    return;
  }

  if (lastSpoken !== id) {
    Speech.stop();
    Speech.speak(label);

    setLastSpoken(id);
    setHighlighted(id);

    Vibration.vibrate(50);

    setTimeout(() => {
      setHighlighted(null);
      setLastSpoken(null);
    }, 2000);

    return;
  }

  setHighlighted(null);
  setLastSpoken(null);
  action();
};

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <TouchableOpacity
       style={[styles.addButton,{backgroundColor:highlighted === "add-route" ? theme.green : theme.button,
    transform: [{ scale: highlighted === "add-route" ? 1.05 : 1 }],
  },
]}
  onPress={() =>handleAccessiblePress(
    "add-route",
    "Add new route",
    () => router.push("/addrs")
  )
}
      >
        <Text style={[styles.buttonText, { fontSize: scaleFont(14) }]}>
          Add New Route
        </Text>
      </TouchableOpacity>

      <FlatList
        data={savedRoutes}
        keyExtractor={(route) => route.saved_route_id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 40 }}
        ListHeaderComponent={() => (
          <View style={styles.container}>
            <Text style={[styles.SavedRoutesHeader, { color: theme.text, fontSize: scaleFont(18) }]}>
              Saved Routes
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <View style={[styles.routeCard, { backgroundColor: theme.box }]}>
            <Text style={[styles.routeid, { color: theme.text, fontSize: scaleFont(16) }]}>
              Route Name: {item.name}
            </Text>

            <Text style={[styles.routeinfo, { color: theme.lighttext, fontSize: scaleFont(14) }]}>
              Accessibility: {item.is_accessible ? "Yes" : "No"}
            </Text>

            <View style={styles.buttonr}>
              <TouchableOpacity
                style={[styles.editButton,{backgroundColor:highlighted === `edit-${item.saved_route_id}`
                ? theme.green: theme.button,
          transform: [{scale:highlighted === `edit-${item.saved_route_id}` ? 1.05 : 1,},
                  ],
                 },
                ]}
                onPress={() =>
                handleAccessiblePress(
                `edit-${item.saved_route_id}`,
                 `Edit ${item.name}`,
                () => onEdit?.(item)
                )
                }
              >
                <Text style={[styles.buttonText, { fontSize: scaleFont(14) }]}>
                  Edit
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.editButton,{
                backgroundColor:
                highlighted === `nav-${item.saved_route_id}`
               ? "#00cc66":theme.green,
              transform: [
              {scale:highlighted === `nav-${item.saved_route_id}` ? 1.05 : 1,},
                ],
                },
              ]}
                onPress={() =>
                  handleAccessiblePress(
                  `nav-${item.saved_route_id}`,
                   `Navigate ${item.name}`,
                    ()=>onNavigate?.({
                    originLat: item.start_lat,
                     originLon: item.start_lon,
                     destLat: item.end_lat,
                     destLon: item.end_lon,
                     accessible: item.is_accessible ? "Yes" : "No",
                      })
                      )}
              >
                <Text style={[styles.buttonText, { fontSize: scaleFont(14) }]}>
                  Find Route
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
               style={[
              styles.deleteButton,
               {
                backgroundColor:
                 highlighted === `delete-${item.saved_route_id}`
                 ? "#ff4444"
              : theme.red,
              transform: [
              {
             scale:
          highlighted === `delete-${item.saved_route_id}` ? 1.05 : 1,
             },
            ],
             },
                ]}
               onPress={() =>
                    handleAccessiblePress(
                   `delete-${item.saved_route_id}`,
                     `Delete ${item.name}`,
                    async () => {
                  await deleteRoute(item.saved_route_id);
                  loadSavedR();
                   }
                     )   
                    }
              >
                <Text style={[styles.buttonText, { fontSize: scaleFont(14) }]}>
                  Delete
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListFooterComponent={() => (
          <TouchableOpacity onPress={() =>
          handleAccessiblePress("close", "Close", () => onClose?.())
        } 
          style={{marginVertical: 20,
             transform: [{ scale: highlighted === "close" ? 1.05 : 1 }],
            }}>
            <Text style={[styles.link, { color: theme.text, fontSize: scaleFont(14) }]}>
              Close
            </Text>
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
    fontWeight: 'bold',
    textAlign: 'center'
  },
  link: {
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