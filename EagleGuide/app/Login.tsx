import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, ImageBackground, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { login } from "./lib/api/login";
import { useSession } from "./lib/session";
import { useTheme } from "./Theme";

const eagleLogo = require("../assets/images/Unt_eagle.png");
const campusBackground = require("../assets/images/untAerial.jpeg");

const Login = () => {
    const router = useRouter();
    const { theme } = useTheme();
    const { login: loginWithSession } = useSession();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');

    const handleLogin = async () => {
            if (username && password) {
        try {
            setMessage('');
            const response = await login({ username, password });
            await loginWithSession(username, password);
            // routes to homepage after successful login
            setMessage('Login Successful!, redirecting to homepage.');
            router.replace('/map');
            console.log('Login successful:', response);
        }
        catch (error) {
            // if user and pass do not successfully login
            setMessage('Login failed. Please try again.');
        }
        } else {
            // if there is no user or pass
            setMessage('Please enter username and password. Please try again.');
        }
    }

  return (
    <ImageBackground
      source={campusBackground}
      style={styles.bg}
      resizeMode="cover"
    >
      {/* Dark overlay */}
      <View style={styles.overlay} />

      <View style={styles.screen}>
        <View style={styles.formWrap}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.brandRow}>
              <Image source={eagleLogo} style={styles.logo} resizeMode="contain" />
              <Text style={styles.title}>EagleGuide</Text>
            </View>

            <View style={styles.whiteLine} />
            <Text style={styles.unt}>UNT</Text>
          </View>

          {/* Username */}
          <TextInput
            style={styles.input}
            placeholder="Username"
            placeholderTextColor="#FFFFFF"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />

          {/* Password */}
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#FFFFFF"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {/* Message */}
          {message ? (
            <Text style={[styles.message, { color: theme.red }]}>{message}</Text>
          ) : null}

          {/* Login Button */}
          <TouchableOpacity
            style={styles.button}
            onPress={handleLogin}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>

          {/* Sign up */}
          <Text style={styles.linkStrong} onPress={() => router.replace("/SignupEmail")}>
            No account? <Text style={styles.linkStrong}>Sign Up</Text>
          </Text>
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: "center", 
    padding: 10,
  },

  title: { 
    fontSize: 40, 
    fontWeight: "bold", 
    textAlign: "center", 
    marginBottom: 8 ,
    color: "#FFFFFF",
  },

  input: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 10,
    marginTop: 20,
    fontSize: 28,
    borderColor: "#16A34A",
    color: "#FFFFFF", 
  },

  link: { 
    fontSize: 18, 
    fontWeight: "bold", 
    textAlign: "center",
    color: "#FFFFFF",
  },

  button: { 
    padding: 10, 
    borderRadius: 10, 
    alignItems: "center", 
    marginTop: 30,
    backgroundColor: "#16A34A",
  },

  buttonText: { 
    fontSize: 25, 
    fontWeight: "bold",
    color: "#FFFFFF",
  },

  message: { 
    textAlign: "center", 
    fontSize: 18, 
    marginBottom: 10,
  },

  bg: {
    flex: 1,
    backgroundColor: "#000",
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.60)",
  },

  screen: {
    flex: 1,
    justifyContent: "center",
  },

  formWrap: {
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
    paddingHorizontal: 24,
  },

  header: {
    alignItems: "center",
    marginBottom: 32,
  },

  brandRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 6,
    justifyContent: "center",
  },

  logo: {
    width: 56,
    height: 56,
    marginRight: 10,
  },

  whiteLine: {
    width: "100%",
    height: 3,
    backgroundColor: "#FFFFFF",
    marginBottom: 8,
  },

  unt: {
    color: "#FFFFFF",
    fontSize: 36,
    fontWeight: "900",
    fontFamily: "serif",
  },

  linkStrong: {
    fontWeight: "700",
    textDecorationLine: "underline",
    color: "#FFFFFF",
  },
});

export default Login;