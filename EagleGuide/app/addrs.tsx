import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import { addRoute, Building, getBuildings } from "./lib/api/addroutev2";





export default function AddRouteScreen() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const userid = "2cf8f2eb-8adc-49de-a993-fe075ff4bdee";

  const [open1, setOpen1] = useState(false);
  const [value1, setValue1] = useState<string | null>(null);
  const [items1, setItems1] = useState([
    { label: 'Student Union', value: 'Student Union' },
    { label: 'Willis', value: 'Willis' },
    { label: 'Parking Garage', value: 'Parking Garage' },
    { label: 'Discovery Park', value: 'Discovery Park' },

  ]);

  const [open2, setOpen2] = useState(false);
  const [value2, setValue2] = useState<string | null>(null);
  const [items2, setItems2] = useState([
    { label: 'Student Union', value: 'Student Union' },
    { label: 'Willis', value: 'Willis' },
    { label: 'Parking Garage', value: 'Parking Garage' },
    { label: 'Discovery Park', value: 'Discovery Park' },

  ]);

  const [open3, setOpen3] = useState(false);
  const [value3, setValue3] = useState<string | null>(null);
  const [items3, setItems3] = useState([
    { label: "Pedestrian", value: "Pedestrian" },
    { label: "Bus", value: "Bus" },
  ]);

  const [open4, setOpen4] = useState(false);
  const [value4, setValue4] = useState<number | null>(null);
  const [items4, setItems4] = useState([
    { label: "Yes", value: 1 },
    { label: "No", value: 0 },
  ]);

  const loadBuildings = async () => {
    try {
      const data = await getBuildings();
      setBuildings(data);

      const formatted = data.map((b) => ({
        label: b.name,
        value: b.name,
      }));

      setItems1(formatted);
      setItems2(formatted);
    } catch {
      Alert.alert("Error", "Could not load buildings");
    }
  };

  loadBuildings();

const router = useRouter();

  const addr = async () => {
    if (!value1 || !value2 || !value3 || value4 === null) {
      return Alert.alert("Enter all options");
    }

    if (value1 === value2) {
      return Alert.alert("Invalid Route", "Start and end buildings cannot be the same.");
    }

    const start = buildings.find(b => b.name === value1);
    const end = buildings.find(b => b.name === value2);

    if (!start || !end) {
      return Alert.alert("Error", "Building coordinates not found");
    }

    try {
  await addRoute({
    userid,
    prevb: value1,
    newb: value2,
    prevblon: start.lon,
    prevblat: start.lat,
    newblon: end.lon,
    newblat: end.lat,
    accessible: value4,
    length: null,
    duration: null,
  });
} catch (err) {
  console.log(err);
  Alert.alert("Error", String(err));
}

  return (
    <View style={{ padding: 20 }}>

      <Text>Starting Building</Text>
      <DropDownPicker
        open={open1}
        value={value1}
        items={items1}
        setOpen={setOpen1}
        setValue={setValue1}
      />

      <Text>End Building</Text>
      <DropDownPicker
        open={open2}
        value={value2}
        items={items2}
        setOpen={setOpen2}
        setValue={setValue2}
      />

      <Text>Pedestrian or Bus?</Text>
      <DropDownPicker
        open={open3}
        value={value3}
        items={items3}
        setOpen={setOpen3}
        setValue={setValue3}
      />

      <Text>Accessible Needed?</Text>
      <DropDownPicker
        open={open4}
        value={value4}
        items={items4}
        setOpen={setOpen4}
        setValue={setValue4}
      />

      <TouchableOpacity onPress={addr}>
        <Text>Add Route</Text>
      </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()}>
  <Text>Close</Text>
</TouchableOpacity>
    </View>
  );
}}