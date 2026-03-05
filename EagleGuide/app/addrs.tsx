import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import { addRoute, Building } from "./lib/api/addroutev2";

export default function AddRouteScreen() {
  const router = useRouter();
  const userid = "2cf8f2eb-8adc-49de-a993-fe075ff4bdee";

  const [buildings] = useState<Building[]>([
    { name: "Student Union", lon: -97.1526, lat: 33.2108 },
    { name: "Willis", lon: -97.1521, lat: 33.2099 },
    { name: "Parking Garage", lon: -97.1532, lat: 33.2115 },
    { name: "Discovery Park", lon: -97.1515, lat: 33.2150 },
  ]);

  const buildingItems = buildings.map((b) => ({
    label: b.name,
    value: b.name,
  }));

  const [open1, setOpen1] = useState(false);
  const [value1, setValue1] = useState<string | null>(null);
  const [items1, setItems1] = useState(buildingItems);

  const [open2, setOpen2] = useState(false);
  const [value2, setValue2] = useState<string | null>(null);
  const [items2, setItems2] = useState(buildingItems);

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

  const addr = async () => {
    if (!value1 || !value2 || !value3 || value4 === null) {
      return Alert.alert("Enter all options");
    }

    if (value1 === value2) {
      return Alert.alert(
        "Invalid Route,Start and end buildings cannot be the same."
      );
    }

    const start = buildings.find((b) => b.name === value1);
    const end = buildings.find((b) => b.name === value2);

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

      Alert.alert("success");
      router.back();
    } catch (err) {
      console.log(err);
      Alert.alert("Error", String(err));
    }
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      {/*destination buildings */}
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <View style={{ width: "48%", zIndex: 4000 }}>
          <Text>Start Building</Text>
          <DropDownPicker
            open={open1}
            value={value1}
            items={items1}
            setOpen={setOpen1}
            setValue={setValue1}
            setItems={setItems1}
          />
        </View>
        <View style={{ width: "48%", zIndex: 3000 }}>
          <Text>End Building</Text>
          <DropDownPicker
            open={open2}
            value={value2}
            items={items2}
            setOpen={setOpen2}
            setValue={setValue2}
            setItems={setItems2}
          />
        </View>
      </View>
      <View style={{ marginTop: 25, zIndex: 2000 }}>
        <Text>Pedestrian or Bus?</Text>
        <DropDownPicker
          open={open3}
          value={value3}
          items={items3}
          setOpen={setOpen3}
          setValue={setValue3}
          setItems={setItems3}
        />
      </View>
      <View style={{ marginTop: 25, zIndex: 1000 }}>
        <Text>Accessible Needed?</Text>
        <DropDownPicker
          open={open4}
          value={value4}
          items={items4}
          setOpen={setOpen4}
          setValue={setValue4}
          setItems={setItems4}
        />
      </View>
      <TouchableOpacity
        onPress={addr}
        style={{
          marginTop: 40,
          backgroundColor: "#2f7df6",
          padding: 12,
          borderRadius: 8,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "white", fontWeight: "bold" }}>Add Route</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => router.back()}
        style={{ marginTop: 15, alignItems: "center" }}
      >
        <Text>Close</Text>
      </TouchableOpacity>

    </View>
  );
}