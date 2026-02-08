import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { login } from "./lib/api/login";
import { useSession } from "./lib/session";
import { useTheme } from "./Theme";

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
            router.replace('/homepage');
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
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Login</Text>

      <TextInput
        style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }]}
        placeholder="Username"
        placeholderTextColor={theme.lighttext}
        value={username}
        onChangeText={setUsername}
      />

      <TextInput
        style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }]}
        placeholder="Password"
        placeholderTextColor={theme.lighttext}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {message ? <Text style={[styles.message, { color: theme.red }]}>{message}</Text> : null}

      <TouchableOpacity style={[styles.button, { backgroundColor: theme.green }]} onPress={handleLogin}>
        <Text style={[styles.buttonText, { color: theme.text }]}>Login</Text>
      </TouchableOpacity>

      <Text style={[styles.link, { color: theme.text }]} onPress={() => router.replace('/Signup')}>
        No account? Sign Up
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    padding: 10 },
  title: { 
    fontSize: 40, 
    fontWeight: 'bold', 
    textAlign: 'center', 
    marginBottom: 40 
    },
  input: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 10,
    marginTop: 20,
    fontSize: 28,
    },
  link: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    textAlign: 'center' 
    },
  button: { 
    padding: 10, 
    borderRadius: 10, 
    alignItems: 'center', 
    marginTop: 30 
    },
  buttonText: { 
    fontSize: 25, 
    fontWeight: 'bold' 
    },
  message: { 
    textAlign: 'center', 
    fontSize: 18, 
    marginBottom: 10 
    },
});

export default Login;