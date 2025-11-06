import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { signUp } from "./lib/api/signup";

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
            const response = await signUp({ username, email, password });
                setMessage('You are signed up! Login to continue.');
                console.log('Signup successful:', response);
        }
        catch (error) {
            // if for some reason sign up fails
            setMessage('Sign up failed. Please try again.');
        }
        } else {
            // if there is no user or pass or email or does not need password requirements
            setMessage('Sign up failed. Please try again. Else error');
        }
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Sign Up</Text>
            
            <TextInput
                style={styles.input}
                placeholder="Username"
                placeholderTextColor="#dcdcdcff"
                value={username}
                onChangeText={setUsername}
            />

            <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#dcdcdcff"
                value={email}
                onChangeText={setEmail}
            />
            
            <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#dcdcdcff"
                secureTextEntry={true}
                value={password}
                onChangeText={setPassword}
            />

            <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor="#dcdcdcff"
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
            
            <TouchableOpacity 
                style={[styles.button, !allRequirementsMet && styles.buttonDisabled]} 
                onPress={handleSignUp}
                disabled={!allRequirementsMet}
            >
                <Text style={styles.buttonText}>
                    Sign Up
                </Text>
            </TouchableOpacity>

            <Text style={styles.link} onPress={() => router.replace('/Login')}>
                Have an account? Login
            </Text>
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
        backgroundColor: '#3f3f3f',
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
    buttonDisabled: {
        backgroundColor: '#828282',
        opacity: 0.6,
    },
    message: {
        textAlign: 'center',
        fontSize: 18,
        fontWeight: '500',
        padding: 10,
        borderRadius: 5,
    },
    requirementsContainer: {
        marginTop: 20,
        padding: 10,
        backgroundColor: '#545454',
        borderRadius: 8,
    },
    requirementsTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#65d159',
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
        borderColor: '#dcdcdcff',
        borderRadius: 3,
        marginRight: 8,
        backgroundColor: 'white',
    },
    checkboxMet: {
        backgroundColor: '#7fd871',
        borderColor: '#7fd871',
    },
    requirementText: {
        fontSize: 12,
        color: '#dcdcdcff',
    },
    requirementMet: {
        color: '#7fd871',
        fontWeight: '500',
    },
});

export default Signup;