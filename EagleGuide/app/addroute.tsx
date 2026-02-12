import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { addRoute, deleteRoute, getRoutes, SavedRoute } from './lib/api/addroutev2';
import { useTheme } from "./Theme";

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

useEffect(() => {
  loadSavedR();
}, []);

 //For dropdown 1
  const [open1, setOpen1] = useState(false);
  const [value1, setValue1] =useState<string | null>(null);
  const [items1, setItems1] = useState([
    { label: 'Student Union', value: 'Student Union' },
    { label: 'Willis', value: 'Willis' },
    { label: 'Parking Garage', value: 'Parking Garage' },
  ]);

  //For dropdown 2
  const [open2, setOpen2] = useState(false);
  const [value2, setValue2] = useState<string | null>(null);
  const [items2, setItems2] = useState([
    { label: 'Student Union', value: 'Student Union' },
    { label: 'Willis', value: 'Willis' },
    { label: 'Parking Garage', value: 'Parking Garage' },
  ]);
 //For dropdown 3
 const [open3, setOpen3] = useState(false);
const [value3, setValue3] = useState<string | null>(null);
const [items3, setItems3] = useState([
  { label: 'Pedestrian', value: 'Pedestrian' },
  { label: 'Bus', value: 'Bus' },
]);
//For dropdown 4
const [open4, setOpen4] = useState(false);
const [value4, setValue4] =useState<number | null>(null);
const [items4, setItems4] = useState([
  { label: 'Yes', value: 1 },
  { label: 'No', value: 0 },
]);
  

//to track input for route delete
 const [num, setNum] = useState('');

  //place holder Cordinates
const mockCoords = {
  StudentUnion: { lon: -97.150, lat: 33.214 },
  Willis: { lon: -97.152, lat: 33.215 },
  ParkingGarage: { lon: -97.148, lat: 33.216 },
} as const;

type MockCoordKey = keyof typeof mockCoords;

// add route function
const addr = async (prevb: string | null,newb: string | null,type: string | null,accessibility: number | null,userid: string) => {
  if (!prevb || !newb || !type || accessibility == null) {
    return Alert.alert("Enter all options");
  }

   if (prevb === newb) {
    return Alert.alert("Invalid Route", "Start and end buildings cannot be the same.");
  }

  try {
    //matches buildings to coordinates
    const startKey = prevb.replace(/\s/g, "") as MockCoordKey;
    const endKey = newb.replace(/\s/g, "") as MockCoordKey;

    const start = mockCoords[startKey];
    const end = mockCoords[endKey];

   const res = await addRoute({
  userid,
  prevb,
  newb,
  prevblon: start.lon,
  prevblat: start.lat,
  newblon: end.lon,
  newblat: end.lat,
  accessible: accessibility,
  length: null,
  duration: null,
});
    Alert.alert("Success", res.message);
    await loadSavedR();
  } catch (err) {
    console.error(err);
    Alert.alert("Error", "Could not reach the server");
  }
};

//Function to delete route
 const del = async () => {
    if (!num) return Alert.alert("Enter a route ID to delete");

    try {
      const res = await deleteRoute(num);
      Alert.alert("Deleted", res.message);
      loadSavedR();
    } catch {
      Alert.alert("Error", "Could not delete route");
    }
  };

  return (
    <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={[styles.container, { backgroundColor: theme.background }]}>
          <Text style={[styles.title, { color: theme.text }]}>
            Choose current building and then destination:
          </Text>

          <View style={styles.dropdownGrid}>
            <View style={[styles.dropdownRow, { zIndex: 4000 }]}>
              <View style={[styles.dropdownBox, { zIndex: 4000 }]}>
                <DropDownPicker
                  open={open1}
                  value={value1}
                  items={items1}
                  setOpen={setOpen1}
                  setValue={setValue1}
                  containerStyle={{ height: 50 }}
                  dropDownContainerStyle={{
                    backgroundColor: theme.box,
                    position: 'absolute',
                    zIndex: 10000,
                  }}
                  style={{ backgroundColor: theme.inputBackground }}
                  textStyle={{ color: theme.text }}
                />
              </View>

              <View style={[styles.dropdownBox, { zIndex: 3000 }]}>
                <DropDownPicker
                  open={open2}
                  value={value2}
                  items={items2}
                  setOpen={setOpen2}
                  setValue={setValue2}
                  containerStyle={{ height: 50 }}
                  dropDownContainerStyle={{
                    backgroundColor: theme.box,
                    position: 'absolute',
                    zIndex: 10000,
                  }}
                  style={{ backgroundColor: theme.inputBackground }}
                  textStyle={{ color: theme.text }}
                />
              </View>
            </View>

            <View style={[styles.dropdownRow, { zIndex: 2000 }]}>
              <View style={[styles.dropdownBox, { zIndex: 2000 }]}>
                <DropDownPicker
                  open={open3}
                  value={value3}
                  items={items3}
                  setOpen={setOpen3}
                  setValue={setValue3}
                  containerStyle={{ height: 50 }}
                  dropDownContainerStyle={{
                    backgroundColor: theme.box,
                    position: 'absolute',
                    zIndex: 10000,
                  }}
                  style={{ backgroundColor: theme.inputBackground }}
                  textStyle={{ color: theme.text }}
                />
              </View>

              <View style={[styles.dropdownBox, { zIndex: 1000 }]}>
                <DropDownPicker
                  open={open4}
                  value={value4}
                  items={items4}
                  setOpen={setOpen4}
                  setValue={setValue4}
                  containerStyle={{ height: 50 }}
                  dropDownContainerStyle={{
                    backgroundColor: theme.box,
                    position: 'absolute',
                    zIndex: 10000,
                  }}
                  style={{ backgroundColor: theme.inputBackground }}
                  textStyle={{ color: theme.text }}
                />
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: theme.green }]}
          >
            <Text style={styles.submitButtonText}>Submit Route</Text>
          </TouchableOpacity>

          <View style={[styles.Savedroutes, { backgroundColor: theme.box }]}>
            <Text style={[styles.SavedRoutesHeader, { color: theme.text }]}>
              Saved Routes
            </Text>

            <FlatList
              data={savedRoutes}
              keyExtractor={(route) => route.saved_route_id}
              scrollEnabled={false}
              renderItem={({ item: route }) => (
                <View style={[styles.routeCard, { backgroundColor: theme.background }]}>
                  <Text style={[styles.routeid, { color: theme.text }]}>
                    Route Name: {route.name}
                  </Text>
                  <Text style={[styles.routeinfo, { color: theme.lighttext }]}>
                    Accessibility: {route.is_accessible ? "Yes" : "No"}
                  </Text>

                  <View style={styles.buttonr}>
                    <TouchableOpacity
                      style={[styles.editButton, { backgroundColor: theme.button }]}
                    >
                      <Text style={styles.buttonText}>Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.deleteButton, { backgroundColor: theme.red }]}
                    >
                      <Text style={styles.buttonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          </View>

          <TouchableOpacity style={[styles.button, { backgroundColor: theme.button }]} onPress={() => router.back()}>
            <Text style={[styles.buttonText, { color: theme.text }]}>Back</Text>
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>
    </ScrollView>
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
  dropdownRow: { 
    flexDirection: 'row', 
    width: '90%', 
    marginBottom: 15 
  },
  dropdownBox: { 
    flex: 1, 
    marginHorizontal: 5 
  },
  dropdownGrid: { 
    width: '90%', 
    marginBottom: 20, 
    zIndex: 5000 
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
  submitButton: { 
    paddingVertical: 10, 
    paddingHorizontal: 20, 
    borderRadius: 6, 
    marginBottom: 20 
  },
  submitButtonText: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 16 
  },
});