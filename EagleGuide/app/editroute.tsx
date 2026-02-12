
import { useEffect, useState } from 'react';
import { Alert, Keyboard, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { SavedRoute, updateRoute } from './lib/api/addroutev2';
import { useTheme } from "./Theme";


type EditrouteProps = {
  route: SavedRoute;
  onClose: () => void;
};



export default function Editroute({ route, onClose }: EditrouteProps) {
const { theme } = useTheme();
  const routeId = route.saved_route_id;

 
  const [open1, setOpen1] = useState(false);
 const [value1, setValue1] = useState<string | null>('Student Union');
  const [items1, setItems1] = useState([
    { label: 'Student Union', value: 'Student Union' },
    { label: 'Willis', value: 'Willis' },
    { label: 'Parking Garage', value: 'Parking Garage' },
     { label: 'Discovery Park', value: 'Discovery Park' },
  ]);

 
  const [open2, setOpen2] = useState(false);
  const [value2, setValue2] = useState<string | null>('Willis');
  const [items2, setItems2] = useState([
    { label: 'Student Union', value: 'Student Union' },
    { label: 'Willis', value: 'Willis' },
    { label: 'Parking Garage', value: 'Parking Garage' },
     { label: 'Discovery Park', value: 'Discovery Park' },
  ]);

  const [open4, setOpen4] = useState(false);
 const [value4, setValue4] = useState<number | null>(route.is_accessible ?? 1);
  const [items4, setItems4] = useState([
    { label: 'Yes', value: 1 },
    { label: 'No', value: 0 },
  ]);

  //Name of current Route
  const [name, setName] = useState(route.name);
 

  // sets up name to be currently selected values
useEffect(() => {
  if (value1 && value2) {
    setName(`Route from ${value1} to ${value2}`);
  }
}, [value1, value2]);


  //place holder coordinates
  const mockCoords = {
    StudentUnion: { lon: -97.1477, lat: 33.2109 },
    Willis: { lon:-97.152, lat: 33.2101 },
   ParkingGarage: { lon: -97.14476651696336, lat: 33.210964362912854 },
   DiscoveryPark: { lon: -97.1510, lat: 33.2540 },
  } as const;

  const saveRoute = async () => {
    if (!value1 || !value2 || value4 == null) {
      return Alert.alert('Error', 'Please select start, end, and accessibility');
    }

    if (value1 === value2) {
    return Alert.alert("Invalid Route", "Start and end buildings cannot be the same.");
  }

    try {
    //matches buildings to coordinates
      const startKey = value1.replace(/\s/g, '') as keyof typeof mockCoords;
      const endKey = value2.replace(/\s/g, '') as keyof typeof mockCoords;
      const start = mockCoords[startKey];
      const end = mockCoords[endKey];

      await updateRoute({
        id: routeId,
        name,
        start_lon: start.lon,
        start_lat: start.lat,
        end_lon: end.lon,
        end_lat: end.lat,
        accessible: value4,
        length: null,
        duration: null,
      });
      Alert.alert('Success', 'Route updated!');
     
      onClose();
       } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Could not update route');
    }
  }; 

      
  //Stops multiple dropdowns being open at one
  const onOpen1 = () => { setOpen1(true); setOpen2(false); setOpen4(false); };
  const onOpen2 = () => { setOpen1(false); setOpen2(true); setOpen4(false); };
  const onOpen4 = () => { setOpen1(false); setOpen2(false); setOpen4(true); };

  return (
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
  <View style={{ flex: 1, backgroundColor: theme.background }}>

          <Text style={[styles.title, { color: theme.text }]}>Edit Route</Text>

          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text }]}
            placeholder="Route Name"
            placeholderTextColor={theme.lighttext}
            value={name}
            onChangeText={setName}
          />

          <Text style={[styles.label, { color: theme.text }]}>Start Building</Text>
          <DropDownPicker
            open={open1}
            value={value1}
            items={items1}
            setOpen={setOpen1}
            setValue={setValue1}
            setItems={setItems1}
            onOpen={onOpen1}
            zIndex={4000}
            containerStyle={{ marginBottom: 15 }}
            dropDownContainerStyle={{ backgroundColor: theme.box }}
            style={{ backgroundColor: theme.inputBackground }}
            textStyle={{ color: theme.text }}
          />

          <Text style={[styles.label, { color: theme.text }]}>End Building</Text>
          <DropDownPicker
            open={open2}
            value={value2}
            items={items2}
            setOpen={setOpen2}
            setValue={setValue2}
            setItems={setItems2}
            onOpen={onOpen2}
            zIndex={3000}
            containerStyle={{ marginBottom: 15 }}
            dropDownContainerStyle={{ backgroundColor: theme.box }}
            style={{ backgroundColor: theme.inputBackground }}
            textStyle={{ color: theme.text }}
          />

          <Text style={[styles.label, { color: theme.text }]}>Accessibility Needed?</Text>
          <DropDownPicker
            open={open4}
            value={value4}
            items={items4}
            setOpen={setOpen4}
            setValue={setValue4}
            setItems={setItems4}
            onOpen={onOpen4}
            zIndex={1000}
            containerStyle={{ marginBottom: 25 }}
            dropDownContainerStyle={{ backgroundColor: theme.box }}
            style={{ backgroundColor: theme.inputBackground }}
            textStyle={{ color: theme.text }}
          />

          <TouchableOpacity style={[styles.saveButton, { backgroundColor: theme.green }]} onPress={saveRoute}>
            <Text style={styles.buttonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  title: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    marginBottom: 20 
  },
  label: { 
    marginBottom: 5, 
    fontWeight: '600' 
  },
  input: { 
    width: '100%', 
    borderRadius: 8, 
    padding: 10, 
    marginBottom: 15 
  },
  saveButton: { 
    paddingVertical: 12, 
    borderRadius: 8, 
    alignItems: 'center' 
  },
  buttonText: { 
    color: '#fff', 
    fontWeight: 'bold' 
  },
});
