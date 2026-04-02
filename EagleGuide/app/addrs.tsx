import { Stack, useRouter } from "expo-router";
import * as Speech from "expo-speech";
import { useCallback, useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, Vibration, View } from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import { addRoute, Building } from "./lib/api/addroutev2";
import { searchBuildings } from "./lib/api/navbuildings";
import { useTTS } from "./speech";
import { useTheme } from "./Theme";


export default function AddRouteScreen() {
  const { ttsEnabled } = useTTS();

const [lastSpoken, setLastSpoken] = useState<string | null>(null);
const [highlighted, setHighlighted] = useState<string | null>(null);

  const handleAccessiblePress = (
  id: string,
  label: string,
  action: () => void
) => {
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
  const router = useRouter();
  const { theme } = useTheme();

  const userid = "2cf8f2eb-8adc-49de-a993-fe075ff4bdee";

  const [startQuery, setStartQuery] = useState("");
  const [startResults, setStartResults] = useState<Building[]>([]);
  const [startBuilding, setStartBuilding] = useState<Building | null>(null);

  const [endQuery, setEndQuery] = useState("");
  const [endResults, setEndResults] = useState<Building[]>([]);
  const [endBuilding, setEndBuilding] = useState<Building | null>(null);

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

  const onOpen3 = () => {
    setOpen3(true);
    setOpen4(false);
  };

  const onOpen4 = () => {
    setOpen3(false);
    setOpen4(true);
  };
//start building search
  const runStartSearch = useCallback(async (q: string) => {
    setStartQuery(q);
    setStartBuilding(null);
    if (!q.trim()) {
      setStartResults([]);
      return;
    }
    try {
      setStartResults(await searchBuildings(q));
    } catch {
      setStartResults([]);
    }
  }, []);
//end building search
  const runEndSearch = useCallback(async (q: string) => {
    setEndQuery(q);
    setEndBuilding(null);
    if (!q.trim()) {
      setEndResults([]);
      return;
    }
    try {
      setEndResults(await searchBuildings(q));
    } catch {
      setEndResults([]);
    }

  }, []);

  const addr = async () => {

    if (!startBuilding || !endBuilding || !value3 || value4 === null) {
      return Alert.alert("Enter all options");
    }

    if (startBuilding.name === endBuilding.name) {
      return Alert.alert("Invalid Route, Start and end buildings cannot be the same.");
    }

    try {

      await addRoute({
        userid,
        prevb: startBuilding.name,
        newb: endBuilding.name,
        prevblon: startBuilding.lon,
        prevblat: startBuilding.lat,
        newblon: endBuilding.lon,
        newblat: endBuilding.lat,
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

        <Text style={[styles.label, { color: theme.text }]}>
          Start Building
        </Text>

        <TextInput
          style={[styles.input, { backgroundColor: theme.inputBackground }]}
          placeholder="start building"
          placeholderTextColor={theme.lighttext}
          value={startQuery}
          onChangeText={runStartSearch}
        />
        {/* start building search */}
        {startResults.slice(0, 5).map((b) => (
          <TouchableOpacity
            key={b.name}
            style={styles.result}
            onPress={() =>
            handleAccessiblePress(
            `start-${b.name}`,
            `Start building ${b.name}`,
            () => {setStartBuilding(b);
            setStartQuery(b.name);
            setStartResults([]);
            }
              )
            }
          >
            <Text style={{ color: theme.text }}>{b.name}</Text>
          </TouchableOpacity>
        ))}

        <Text style={[styles.label, { color: theme.text, marginTop: 20 }]}>
          End Building
        </Text>

        <TextInput
          style={[styles.input, { backgroundColor: theme.inputBackground }]}
          placeholder="end building"
          placeholderTextColor={theme.lighttext}
          value={endQuery}
          onChangeText={runEndSearch}
        />
        {/* end building search */}
        {endResults.slice(0, 5).map((b) => (
          <TouchableOpacity
            key={b.name}
            style={styles.result}
            onPress={() =>
            handleAccessiblePress(
            `end-${b.name}`,
            `End building ${b.name}`,
            () => {setEndBuilding(b);
              setEndQuery(b.name);
              setEndResults([]);
             }
              )
            }
          >
            <Text style={{ color: theme.text }}>{b.name}</Text>
          </TouchableOpacity>
        ))}

        <View style={{ marginTop: 25, zIndex: 3000 }}>
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
            onOpen={onOpen3}
            zIndex={3000}
            zIndexInverse={1000}
          />
        </View>

        <View style={{ marginTop: 25, zIndex: 2000 }}>
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
            onOpen={onOpen4}
            zIndex={2000}
            zIndexInverse={2000}
          />
        </View>

        <TouchableOpacity
         onPress={() =>handleAccessiblePress("add", "Add route", addr)}
          style={[styles.addButton,{
          backgroundColor:highlighted === "add" ? "#27ae60" : theme.green,
          transform: [{ scale: highlighted === "add" ? 1.05 : 1 }],
          },
          ]}
        >
          <Text style={styles.buttonText}>Add Route</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={()=>handleAccessiblePress("close", "Close", () => router.back())}
          style={{
              marginTop: 15,
              alignItems: "center",
              transform: [{ scale: highlighted === "close" ? 1.05 : 1 }],
          }}
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

  input: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
  },

  result: {
    padding: 10,
    borderBottomWidth: 1,
    borderColor: "#444",
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
  }

});