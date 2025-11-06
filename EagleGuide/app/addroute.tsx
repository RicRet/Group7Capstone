import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Keyboard, StyleSheet, Text, TextInput, TouchableWithoutFeedback, View } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { addRoute, deleteRoute } from './lib/api/addroute';



export default function Addroute({ onNavigate }: { onNavigate: (screen: string) => void }) {
  const router = useRouter();

 //For dropdown 1
  const [open1, setOpen1] = useState(false);
  const [value1, setValue1] = useState(null);
  const [items1, setItems1] = useState([
    { label: 'Student Union', value: 'Student Union' },
    { label: 'Willis', value: 'Willis' },
    { label: 'Parking Garage', value: 'Parking Garage' },
  ]);

  //For dropdown 2
  const [open2, setOpen2] = useState(false);
  const [value2, setValue2] = useState(null);
  const [items2, setItems2] = useState([
    { label: 'Student Union', value: 'Student Union' },
    { label: 'Willis', value: 'Willis' },
    { label: 'Parking Garage', value: 'Parking Garage' },
  ]);
 //For dropdown 3
 const [open3, setOpen3] = useState(false);
const [value3, setValue3] = useState(null);
const [items3, setItems3] = useState([
  { label: 'Pedestrian', value: 'Pedestrian' },
  { label: 'Bus', value: 'Bus' },
]);
//For dropdown 4
const [open4, setOpen4] = useState(false);
const [value4, setValue4] = useState(null);
const [items4, setItems4] = useState([
  { label: '1', value: 1 },
  { label: '2', value: 2 },
]);


  
//to track input for route delete
 const [num, setNum] = useState('');

  //Function To take front end data to backend
  const addr = async ( prevb: string | null,newb: string | null,type: string | null,accessibility: number | null) => {
  if (!prevb || !newb || !type || accessibility == null) {return Alert.alert('Enter all options');
  }
  try {
    const res = await addRoute(prevb!, newb!, type!, accessibility!);
    Alert.alert('Success', res.message);
  } catch {
    Alert.alert('Error', 'Could not reach the server');
  }
};

//Function to delete route
 const del = async () => {
    if (!num) return Alert.alert('Enter a route ID to delete');
    try {
      const id = Number(num);
      const res = await deleteRoute(id);
      Alert.alert('Deleted', res.message);
      Keyboard.dismiss();
    } catch {
      Alert.alert('Error', 'Could not delete route');
    }
  };

  return (
  <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
    <View style={styles.container}>
      {/*For Text*/}
      <Text style={styles.title}>
        Choose current building and then destination:
      </Text>

      {/* All dropdowns */}
      <View style={styles.dropdownRow}>
        {/* DropDown 1 */}
        <View style={[styles.dropdownBox, { zIndex: 4000 }]}>
  <DropDownPicker
    open={open1}
    value={value1}
    items={items1}
    setOpen={setOpen1}
    setValue={setValue1}
    containerStyle={{ height: 50 }}
    dropDownContainerStyle={{ backgroundColor: '#6b6b6b' }}
    style={{ backgroundColor: '#6b6b6b' }}
  />
</View>

        {/* DropDown 2 */}
       <View style={[styles.dropdownBox, { zIndex: 3000 }]}>
  <DropDownPicker
    open={open2}
    value={value2}
    items={items2}
    setOpen={setOpen2}
    setValue={setValue2}
    containerStyle={{ height: 50 }}
    dropDownContainerStyle={{ backgroundColor: '#6b6b6b' }}
    style={{ backgroundColor: '#6b6b6b' }}
  />
</View>

        {/* DropDown 3 */}
        <View style={[styles.dropdownBox, { zIndex: 2000 }]}>
  <DropDownPicker
    open={open3}
    value={value3}
    items={items3}
    setOpen={setOpen3}
    setValue={setValue3}
    containerStyle={{ height: 50 }}
    dropDownContainerStyle={{ backgroundColor: '#6b6b6b' }}
    style={{ backgroundColor: '#6b6b6b' }}
  />
</View>

        {/* 4 */}
       <View style={[styles.dropdownBox, { zIndex: 1000 }]}>
  <DropDownPicker
    open={open4}
    value={value4}
    items={items4}
    setOpen={setOpen4}
    setValue={setValue4}
    containerStyle={{ height: 50 }}
    dropDownContainerStyle={{ backgroundColor: '#6b6b6b' }}
    style={{ backgroundColor: '#6b6b6b' }}
  />
</View>
      </View> 

      <TextInput
        style={styles.input}
        placeholder="Enter Route ID for deletion"
        keyboardType="numeric"
        value={num}
        onChangeText={setNum}
        returnKeyType="done"
        onSubmitEditing={Keyboard.dismiss}
      />

      {/* Buttons */}
      <Text style={styles.link} onPress={() => del()}>
        Delete Route
      </Text>

      <Text style={styles.link} onPress={() => addr(value1, value2, value3, value4)}>
        Submit Route
      </Text>

      <Text style={styles.link} onPress={() => onNavigate('home')}>
        Go back
      </Text>
    </View>
  </TouchableWithoutFeedback>
);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#3f3f3f',
    padding: 20,
  },
  title: {
    marginBottom: 20,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#dcdcdcff',
    textAlign: 'center',
  },
  link: {
      color: '#dcdcdcff',
      fontSize: 16,
      fontWeight: 'bold',
      textAlign: 'center',
  },
  dropdownRow: {
    flexDirection: 'row',
    width: '90%',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  dropdownBox: {
    flex: 1,
    marginHorizontal: 5,
  },
  input: {
  backgroundColor: '#6b6b6b',
  color: '#dcdcdcff',
  borderRadius: 8,
  padding: 10,
  marginVertical: 10,
  width: '60%',
  textAlign: 'center',
},
  
});