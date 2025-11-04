import axios from 'axios';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

const Login = () => {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async () => {
            if (username && password) {
        try {
            const response = await axios.post('http://localhost:3000/api/auth/login', {identifier: username, password });
            if (response.data.user) {
                // successful login
                alert('Login successful!');
                router.replace('/homepage');
            }
        }
        catch (error) {
            // if user and pass do not successfully login
            alert('Invalid username or password');
        }
        } else {
            // if there is no user or pass
            alert('Please enter both username and password');
        }
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Login</Text>
            
            <TextInput
                style={styles.input}
                placeholder="Username"
                placeholderTextColor="#3c3c3cff"
                value={username}
                onChangeText={setUsername}
            />
            
            <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#3c3c3cff"
                secureTextEntry={true}
                value={password}
                onChangeText={setPassword}
            />

            
            <Text style={styles.link} onPress={() => router.replace('/Signup')}>
                Sign Up
            </Text>

            <TouchableOpacity style={styles.button} onPress={handleLogin}>
                <Text style={styles.buttonText}>Login</Text>
            </TouchableOpacity>
        </View>
    );
};

// will be ugly for now
const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 10,
        backgroundColor: '#ffffffff',
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
        color: '#333',
    },
    input: {
        borderWidth: 1,
        borderColor: '#050000ff',
        borderRadius: 10,
        paddingHorizontal: 10,
        marginBottom: 10,
        backgroundColor: 'white',
        fontSize: 10,
    },
    link: {
        color: '#050000ff',
        fontSize: 10,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    button: {
        backgroundColor: '#04492cff',
        padding: 10,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 10, // Add space above the message
    },
    buttonText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
});

export default Login;
