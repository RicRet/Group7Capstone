import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { login } from "./lib/api/login";

const Login = () => {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');

    const handleLogin = async () => {
            if (username && password) {
        try {
            setMessage('');
            const response = await login({ username, password });
                // routes to map and homescreen
                setMessage('Login Suscessful!, redirecting to homepage.');
                router.replace('/test1');
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
        <View style={styles.container}>
            <Text style={styles.title}>Login</Text>
            
            <TextInput
                style={styles.input}
                placeholder="Username"
                placeholderTextColor="#dcdcdcff"
                value={username}
                onChangeText={setUsername}
            />
            
            <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#dcdcdcff"
                secureTextEntry={true}
                value={password}
                onChangeText={setPassword}
            />

            {message ? (
                <Text style={styles.message}>
                    {message}
                </Text>
            ) : null}

            <TouchableOpacity style={styles.button} onPress={handleLogin}>
                <Text style={styles.buttonText}>Login</Text>
            </TouchableOpacity>

            <Text style={styles.link} onPress={() => router.replace('/Signup')}>
                No account? Sign Up
            </Text>
        </View>
    );
};

// will be ugly for now
const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 10,
        backgroundColor: '#3f3f3f'
    },
    title: {
        fontSize: 40,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 40,
        color: '#dcdcdcff',
    },
    input: {
        borderWidth: 1,
        borderColor: '#6b6b6b',
        borderRadius: 16,
        paddingHorizontal: 10,
        marginTop: 20,
        backgroundColor: '#6b6b6b',
        fontSize: 28,
    },
    link: {
        color: '#dcdcdcff',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    button: {
        backgroundColor: '#45ca3e',
        padding: 10,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 30,
        marginBottom: 10,
    },
    buttonText: {
        color: '#dcdcdcff',
        fontSize: 25,
        fontWeight: 'bold',
    },
    message: {
        textAlign: 'center',
        fontSize: 18,
        fontWeight: '500',
        padding: 10,
        borderRadius: 5,
    },
});

export default Login;
