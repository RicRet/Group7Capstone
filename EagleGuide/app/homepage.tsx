import { useRouter } from "expo-router";
import { Button, StyleSheet, Text, View } from "react-native";

export default function Home() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Welcome To UNT EagleGuide</Text>
      <Button
        title="Add Route (Placeholder)"
        onPress={() => router.push("/addroute")}
      />
       <View style={{ height: 20 }} /> {/* Spacer */}
       <Button
        title="View Routes (Placeholder)"
        onPress={() => router.push("/Viewroute")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,                  
    justifyContent: "flex-start", 
    alignItems: "center",    
    padding: 20,
    backgroundColor: "green",
  },
  text: {
    marginTop: 50,
    marginBottom: 20,         
    fontSize: 30,
    textAlign: "center",
    color: "white",
  },
});