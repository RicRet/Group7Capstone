import * as Speech from "expo-speech";
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Vibration,
  View
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { useAccessibility } from "./Fontsize";
import { Building, SavedRoute, updateRoute } from './lib/api/addroutev2';
import { searchBuildings } from './lib/api/navbuildings';
import { useTTS } from "./speech";
import { useTheme } from "./Theme";




type EditrouteProps = {
  route: SavedRoute;
  onClose: () => void;
};

export default function Editroute({ route, onClose }: EditrouteProps) {
  const { theme } = useTheme();
  const { scaleFont } = useAccessibility();

  const routeId = route.saved_route_id;

  const [startQuery, setStartQuery] = useState("");
  const [startResults, setStartResults] = useState<Building[]>([]);
  const [startBuilding, setStartBuilding] = useState<Building | null>(null);

  const [endQuery, setEndQuery] = useState("");
  const [endResults, setEndResults] = useState<Building[]>([]);
  const [endBuilding, setEndBuilding] = useState<Building | null>(null);

  const [open4, setOpen4] = useState(false);
  const [value4, setValue4] = useState<number | null>(route.is_accessible ?? 1);
  const [items4, setItems4] = useState([
    { label: 'Yes', value: 1 },
    { label: 'No', value: 0 },
  ]);

const { ttsEnabled } = useTTS();

const [lastSpoken, setLastSpoken] = useState<string | null>(null);
const [highlighted, setHighlighted] = useState<string | null>(null);

useEffect(() => {
  if (!ttsEnabled || value4 === null) return;

  const label = value4 === 1 ? "Accessibility yes" : "Accessibility no";

  Speech.stop();
  Speech.speak(label);

  Vibration.vibrate(50);
}, [value4]);

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



  const [name, setName] = useState(route.name);

  // start building search
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

  // end building search
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

  useEffect(() => {
    if (startBuilding && endBuilding) {
      setName(`Route from ${startBuilding.name} to ${endBuilding.name}`);
    }
  }, [startBuilding, endBuilding]);

  const saveRoute = async () => {
    if (!startBuilding || !endBuilding || value4 == null) {
      return Alert.alert('Error', 'Please select start, end, and accessibility');
    }

    if (startBuilding.name === endBuilding.name) {
      return Alert.alert("Invalid Route", "Start and end buildings cannot be the same.");
    }

    try {
      await updateRoute({
        id: routeId,
        name,
        start_lon: startBuilding.lon,
        start_lat: startBuilding.lat,
        end_lon: endBuilding.lon,
        end_lat: endBuilding.lat,
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

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={{ flex: 1, backgroundColor: theme.background }}>

        {/* Title */}
        <Text style={[styles.title, { color: theme.text, fontSize: scaleFont(20) }]}>
          Edit Route
        </Text>

        {/* Route Name */}
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.inputBackground,
              color: theme.text,
              fontSize: scaleFont(14),
            },
          ]}
          placeholder="Route Name"
          placeholderTextColor={theme.lighttext}
          value={name}
          onChangeText={setName}
        />

        {/* Start Building */}
        <Text style={[styles.label, { color: theme.text, fontSize: scaleFont(14) }]}>
          Start Building
        </Text>

        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.inputBackground,
              color: theme.text,
              fontSize: scaleFont(14),
            },
          ]}
          placeholder="Search building..."
          placeholderTextColor={theme.lighttext}
          value={startQuery}
          onChangeText={runStartSearch}
        />

        {startResults.slice(0, 5).map((b) => (
          <TouchableOpacity
            key={b.name}
            style={styles.result}
            onPress={() =>
            handleAccessiblePress(
            `start-${b.name}`,
            `Start building ${b.name}`,
            () => {
            setStartBuilding(b);
            setStartQuery(b.name);
            setStartResults([]);
             }
            )
            }
          >
            <Text style={{ color: theme.text, fontSize: scaleFont(14) }}>
              {b.name}
            </Text>
          </TouchableOpacity>
        ))}

        {/* End Building */}
        <Text style={[styles.label, { color: theme.text, fontSize: scaleFont(14) }]}>
          End Building
        </Text>

        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.inputBackground,
              color: theme.text,
              fontSize: scaleFont(14),
            },
          ]}
          placeholder="Search building..."
          placeholderTextColor={theme.lighttext}
          value={endQuery}
          onChangeText={runEndSearch}
        />

        {endResults.slice(0, 5).map((b) => (
          <TouchableOpacity
            key={b.name}
            style={styles.result}
            onPress={() =>
            handleAccessiblePress(
            `end-${b.name}`,
            `End building ${b.name}`,
             () => {
             setEndBuilding(b);
              setEndQuery(b.name);
             setEndResults([]);
             }
              )
              }
          >
            <Text style={{ color: theme.text, fontSize: scaleFont(14) }}>
              {b.name}
            </Text>
          </TouchableOpacity>
        ))}

        {/* Accessibility */}
        <Text style={[styles.label, { color: theme.text, fontSize: scaleFont(14) }]}>
          Accessibility Needed?
        </Text>

        <DropDownPicker
        onOpen={() => {
        if (ttsEnabled) {
        Speech.speak("Select accessibility option");
        Vibration.vibrate(50);
        }
        }}
          open={open4}
          value={value4}
          items={items4}
          setOpen={setOpen4}
          setValue={setValue4}
          setItems={setItems4}
          zIndex={1000}
          containerStyle={{ marginBottom: 25 }}
          dropDownContainerStyle={{ backgroundColor: theme.box }}
          style={{ backgroundColor: theme.inputBackground }}
          textStyle={{ color: theme.text, fontSize: scaleFont(14) }}
        />

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton,{
         backgroundColor:highlighted === "save" ? "#27ae60" : theme.green,
         transform: [{ scale: highlighted === "save" ? 1.05 : 1 }],
          },
        ]}
          onPress={()=>handleAccessiblePress("save", "Save route", saveRoute)
          }>
          <Text style={[styles.buttonText, { fontSize: scaleFont(16) }]}>
            Save
          </Text>
        </TouchableOpacity>

        {/* Back Button */}
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: theme.button }]}
          onPress={()=>handleAccessiblePress("back", "Go back", onClose)}
        >
          <Text style={[styles.buttonText, { color: theme.text, fontSize: scaleFont(16) }]}>
            Back
          </Text>
        </TouchableOpacity>

      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  title: {
    fontWeight: 'bold',
    marginBottom: 20,
  },
  label: {
    marginBottom: 5,
    fontWeight: '600',
  },
  input: {
    width: '100%',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  result: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#444",
  },
  saveButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  backButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});