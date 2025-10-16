import { useRouter } from "expo-router";
import { ImageBackground, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Home() {
  const router = useRouter();

  return (
    //Backround Image
    <ImageBackground
      source={{ uri: "https://yt3.ggpht.com/a/AATXAJyYVAIXU0UI7vwSZYeMnZYu1HQyeNSWeEwIPw=s900-c-k-c0xffffffff-no-rj-mo" }}
      style={styles.background}
      resizeMode="contain"
    >
    <View style={styles.overlay}>
      {/* Intro Text */}
      <Text style={styles.text}>Welcome To UNT EagleGuide</Text>
       {/* Spacer */}
       <View style={{ height: 450 }} /> 
        {/*First Button */}
     <TouchableOpacity
  style={styles.button}
  onPress={() => router.push("/addroute")}
>
  <Text style={styles.buttonText}>Add Route (Placeholder)</Text>
</TouchableOpacity>

        {/* Second Button */}
       <View style={{ height: 20 }} /> 
       <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/Viewroute")}
      >
        <Text style={styles.buttonText}>View Routes (Placeholder)</Text>
      </TouchableOpacity>
    </View>
      </ImageBackground>
  );
}

const styles = StyleSheet.create({
   background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  
  button: {
    backgroundColor: "green", 
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignItems: "center",
    width: "80%",
  },
  text: {
    marginTop: 50,
    marginBottom: 20,         
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "center",
    color: "green",
  },
   buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
   overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center", 
    padding: 20,
    backgroundColor: "rgba(255,255,255,0.4)", 
  },
});