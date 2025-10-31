import axios from 'axios';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

const Signup = () => {
    const router = useRouter();
    // user inputs
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    // will set error message just in case
    const [message, setMessage] = useState('');
    // whether password meets requirements
    const [requirements, setRequirements] = useState({
        minLength: false,
        hasNumber: false,
        hasSpecialChar: false,
        hasUppercase: false,
        passwordsMatch: false
    });

    // checks password requirements dynamically
    useEffect(() => {
        setRequirements({
            minLength: password.length >= 8,
            hasNumber: /\d/.test(password),
            hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
            hasUppercase: /[A-Z]/.test(password),
            passwordsMatch: password === confirmPassword && password.length > 0
        });
    }, [password, confirmPassword]);

    // when all password requirements met
    const allRequirementsMet = Object.values(requirements).every(req => req);

    const handleSignUp = async () => {
            if (username && email && password && allRequirementsMet) {
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
            // if there is no user or pass or email or does not need password requirements
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

            <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor="#3c3c3cff"
                secureTextEntry={true}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
            />

            <View style={styles.requirementsContainer}>
                <Text style={styles.requirementsTitle}>Password Requirements:</Text>
                <RequirementItem met={requirements.minLength} text="At least 8 characters" />
                <RequirementItem met={requirements.hasNumber} text="Contains a number" />
                <RequirementItem met={requirements.hasSpecialChar} text="Contains a special character" />
                <RequirementItem met={requirements.hasUppercase} text="Contains uppercase letter" />
                <RequirementItem met={requirements.passwordsMatch} text="Passwords match" />
            </View>

            {message ? (
                <Text style={styles.message}>
                    {message}
                </Text>
            ) : null}

            <Text style={styles.link} onPress={() => router.replace('/Login')}>
                Login
            </Text>
            
            <TouchableOpacity 
                style={[styles.button, !allRequirementsMet && styles.buttonDisabled]} 
                onPress={handleSignUp}
                disabled={!allRequirementsMet}
            >
                <Text style={styles.buttonText}>
                    Sign Up
                </Text>
            </TouchableOpacity>
        </View>
    );
};

// will turn requirement text green when password requirements met
const RequirementItem = ({ met, text }: { met: boolean; text: string }) => (
    <View style={styles.requirementItem}>
        <View style={[styles.checkbox, met && styles.checkboxMet]} />
        <Text style={[styles.requirementText, met && styles.requirementMet]}>
            {text}
        </Text>
    </View>
);

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
        borderRadius: 5,
        paddingHorizontal: 10,
        marginBottom: 10,
        backgroundColor: 'white',
        fontSize: 14,
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
        marginBottom: 10,
    },
    buttonText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    buttonDisabled: {
        backgroundColor: '#cccccc',
        opacity: 0.6,
    },
    message: {
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '500',
        padding: 10,
        borderRadius: 5,
    },
    requirementsContainer: {
        marginBottom: 15,
        padding: 10,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
    },
    requirementsTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#333',
    },
    requirementItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    checkbox: {
        width: 16,
        height: 16,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 3,
        marginRight: 8,
        backgroundColor: 'white',
    },
    checkboxMet: {
        backgroundColor: '#04492cff',
        borderColor: '#04492cff',
    },
    requirementText: {
        fontSize: 12,
        color: '#666',
    },
    requirementMet: {
        color: '#04492cff',
        fontWeight: '500',
    },
});

export default Signup;