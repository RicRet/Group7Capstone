import axios from 'axios';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

const Signup = () => {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');

    const handleLogin = async () => {
            if (username && email && password) {
        try {
            const response = await axios.post('http://needsIP/api/users/signup', { username, email, password });
            if (response.data.user) {
                // successful sign up
            }
        }
        catch (error) {
            // if for some reason sign up fails
            setMessage('Sign up failed. Please try again.');
        }
        } else {
            // if there is no user or pass or email
            setMessage('Sign up failed. Please try again.');
        }
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Sign Up</Text>
            
            <TextInput
                style={styles.input}
                placeholder="Username"
                placeholderTextColor="#3c3c3cff"
                value={username}
                onChangeText={setUsername}
            />

            <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#3c3c3cff"
                value={email}
                onChangeText={setEmail}
            />
            
            <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#3c3c3cff"
                secureTextEntry={true}
                value={password}
                onChangeText={setPassword}
            />

            {message ? (
                <Text style={styles.message}>
                    {message}
                </Text>
            ) : null}

            <Text style={styles.link} onPress={() => router.replace('/Login')}>
                Login
            </Text>
            
            <TouchableOpacity style={styles.button} onPress={handleLogin}>
                <Text style={styles.buttonText}>Sign Up</Text>
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
    message: {
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '500',
        padding: 10,
        borderRadius: 5,
    },
});

export default Signup;