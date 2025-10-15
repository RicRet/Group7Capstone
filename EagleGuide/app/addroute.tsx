import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';

export default function addroute() {
  const router = useRouter();

 {/*For dropdown 1*/}
  const [open1, setOpen1] = useState(false);
  const [value1, setValue1] = useState(null);
  const [items1, setItems1] = useState([
    { label: 'Student Union', value: 'option1' },
    { label: 'Willis', value: 'option2' },
    { label: 'Parking Garage', value: 'option3' },
  ]);

  {/*For dropdown 2*/}
  const [open2, setOpen2] = useState(false);
  const [value2, setValue2] = useState(null);
  const [items2, setItems2] = useState([
    { label: 'Student Union', value: 'option1' },
    { label: 'Willis', value: 'option2' },
    { label: 'Parking Garage', value: 'option3' },
  ]);

  return (
    <View style={styles.container}>
       {/*For Text*/}
      <Text style={styles.title}>
        Choose current building and then destination:
      </Text>

     
      <View style={styles.dropdownRow}>
         {/*settings for drop down1*/}
        <View style={styles.dropdownBox}>
          <DropDownPicker
            open={open1}
            value={value1}
            items={items1}
            setOpen={setOpen1}
            setValue={setValue1}
            containerStyle={{ height: 50 }}
            dropDownContainerStyle={{ backgroundColor: 'white' }}
          />
        </View>
        
         {/*settings for drop down2*/}
        <View style={styles.dropdownBox}>
          <DropDownPicker
            open={open2}
            value={value2}
            items={items2}
            setOpen={setOpen2}
            setValue={setValue2}
            containerStyle={{ height: 50 }}
            dropDownContainerStyle={{ backgroundColor: 'white' }}
          />
        </View>
      </View>

     
        {/*Button for homepage*/}
      <Button title="Go to Home" onPress={() => router.push('/homepage')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'green',
    padding: 20,
  },
  title: {
    marginBottom: 20,
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
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
  
});