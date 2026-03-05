import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import { addRoute, Building, getBuildings } from "./lib/api/addroutev2";
import { useTheme } from "./Theme";
export default function AddRouteScreen() {
  const router = useRouter();
  const { theme } = useTheme();

  const userid = "2cf8f2eb-8adc-49de-a993-fe075ff4bdee";

  // buildings from API
  const [buildings, setBuildings] = useState<Building[]>([]);

  const [open1, setOpen1] = useState(false);
  const [value1, setValue1] = useState<string | null>(null);
  const [items1, setItems1] = useState<{ label: string; value: string }[]>([]);

  const [open2, setOpen2] = useState(false);
  const [value2, setValue2] = useState<string | null>(null);
  const [items2, setItems2] = useState<{ label: string; value: string }[]>([]);

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
useEffect(() => {
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
    } catch (err: any) {
  console.log("BUILDING ERROR:", err);
  console.log("RESPONSE:", err?.response);
  console.log("DATA:", err?.response?.data);
  Alert.alert("Error", "Could not load buildings");
}
  };

  loadBuildings();
}, []);

  const addr = async () => {
    if (!value1 || !value2 || !value3 || value4 === null) {
      return Alert.alert("Enter all options");
    }

    if (value1 === value2) {
      return Alert.alert(
        "Invalid Route,.Start and end buildings cannot be the same."
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

      Alert.alert("Success", "Route Added");
      router.back();
    } catch (err) {
      console.log(err);
      Alert.alert("Error", String(err));
    }
  };

  return (
    <>

      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.title, { color: theme.text }]}>
          Add New Route
        </Text>

      {/*destination buildings*/}
      <View style={styles.row}>
        <View style={{ width: "48%", zIndex: 4000 }}>
          <Text style={[styles.label, { color: theme.text }]}>
            Start Building
          </Text>
          <DropDownPicker
            open={open1}
            value={value1}
            items={items1}
            setOpen={setOpen1}
            setValue={setValue1}
            setItems={setItems1}
            style={{ backgroundColor: theme.inputBackground }}
            dropDownContainerStyle={{ backgroundColor: theme.box }}
            textStyle={{ color: theme.text }}
          />
        </View>

        <View style={{ width: "48%", zIndex: 3000 }}>
          <Text style={[styles.label, { color: theme.text }]}>
            End Building
          </Text>
          <DropDownPicker
            open={open2}
            value={value2}
            items={items2}
            setOpen={setOpen2}
            setValue={setValue2}
            setItems={setItems2}
            style={{ backgroundColor: theme.inputBackground }}
            dropDownContainerStyle={{ backgroundColor: theme.box }}
            textStyle={{ color: theme.text }}
          />
        </View>
      </View>
      <View style={{ marginTop: 25, zIndex: 2000 }}>
        <Text style={[styles.label, { color: theme.text }]}>
          Pedestrian or Bus?
        </Text>
        <DropDownPicker
          open={open3}
          value={value3}
          items={items3}
          setOpen={setOpen3}
          setValue={setValue3}
          setItems={setItems3}
          style={{ backgroundColor: theme.inputBackground }}
          dropDownContainerStyle={{ backgroundColor: theme.box }}
          textStyle={{ color: theme.text }}
        />
      </View>
      <View style={{ marginTop: 25, zIndex: 1000 }}>
        <Text style={[styles.label, { color: theme.text }]}>
          Accessibility Needed?
        </Text>
        <DropDownPicker
          open={open4}
          value={value4}
          items={items4}
          setOpen={setOpen4}
          setValue={setValue4}
          setItems={setItems4}
          style={{ backgroundColor: theme.inputBackground }}
          dropDownContainerStyle={{ backgroundColor: theme.box }}
          textStyle={{ color: theme.text }}
        />
      </View>

      <TouchableOpacity
        onPress={addr}
        style={[styles.addButton, { backgroundColor: theme.green }]}
      >
        <Text style={styles.buttonText}>Add Route</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.back()}
        style={{ marginTop: 15, alignItems: "center" }}
      >
        <Text style={{ color: theme.text }}>Close</Text>
      </TouchableOpacity>

    </View>
     </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 25,
    textAlign: "center",
  },
  label: {
    marginBottom: 6,
    fontWeight: "600",
  },
  addButton: {
    marginTop: 40,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});