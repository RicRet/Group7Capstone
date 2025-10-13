import axios from 'axios';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native"; // need to download

const Login = () => { // needs to figure out stack 
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async () => {
            if (username && password) {
        try {
            const response = await axios.post('http://needsIP/api/users/login', { username, password });
            if (response.data.user) {
                // successful login
            }
        }
        catch (error) {
            // if user and pass do not successfully login
        }
        } else {
            // if there is no user or pass
        }
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Login</Text>
            
            <TextInput
                style={styles.input}
                placeholder="Username"
                value={username}
                onChangeText={setUsername}
            />
            
            <TextInput
                style={styles.input}
                placeholder="Password"
                secureTextEntry={true}
                value={password}
                onChangeText={setPassword}
            />
            
            <TouchableOpacity style={styles.button} onPress={handleLogin}>
                <Text style={styles.buttonText}>Login</Text>
            </TouchableOpacity>
        </View>
    );
};

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