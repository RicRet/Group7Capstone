import { StyleSheet, Text, View } from 'react-native';

export default function EditRoute() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>This is the Edit Route screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#3f3f3f',
  },
  text: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#dcdcdc',
  },
});
