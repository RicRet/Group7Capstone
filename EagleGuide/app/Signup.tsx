import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { signUp } from "./lib/api/signup";
import { useTheme } from "./Theme";

const Signup = () => {
    const router = useRouter();
    const { theme } = useTheme();
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
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Sign Up</Text>

      <TextInput
        style={[
          styles.input,
          { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }
        ]}
        placeholder="Username"
        placeholderTextColor={theme.lighttext}
        value={username}
        onChangeText={setUsername}
      />

      <TextInput
        style={[
          styles.input,
          { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }
        ]}
        placeholder="Email"
        placeholderTextColor={theme.lighttext}
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={[
          styles.input,
          { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }
        ]}
        placeholder="Password"
        placeholderTextColor={theme.lighttext}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TextInput
        style={[
          styles.input,
          { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }
        ]}
        placeholder="Confirm Password"
        placeholderTextColor={theme.lighttext}
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      <View style={[styles.requirementsContainer, { backgroundColor: theme.box }]}>
        <Text style={[styles.requirementsTitle, { color: theme.green }]}>
          Password Requirements:
        </Text>

        {Object.entries(requirements).map(([key, met], i) => (
          <RequirementItem
            key={i}
            met={met}
            text={[
              "At least 8 characters",
              "Contains a number",
              "Contains a special character",
              "Contains uppercase letter",
              "Passwords match",
            ][i]}
            theme={theme}
          />
        ))}
      </View>

      {message ? (
        <Text style={[styles.message, { color: theme.lighttext }]}>{message}</Text>
      ) : null}

      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: allRequirementsMet ? theme.green : theme.disabled }
        ]}
        onPress={handleSignUp}
        disabled={!allRequirementsMet}
      >
        <Text style={[styles.buttonText, { color: theme.text }]}>Sign Up</Text>
      </TouchableOpacity>

      <Text
        style={[styles.link, { color: theme.text }]}
        onPress={() => router.replace('/Login')}
      >
        Have an account? Login
      </Text>
    </View>
  );
};

const RequirementItem = ({ met, text, theme }: any) => (
  <View style={styles.requirementItem}>
    <View
      style={[
        styles.checkbox,
        {
          backgroundColor: met ? theme.green : theme.checkbox,
          borderColor: met ? theme.green : theme.border
        }
      ]}
    />
    <Text style={{ color: met ? theme.green : theme.lighttext, fontSize: 12 }}>
      {text}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    padding: 10 
  },
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
    textAlign: 'center' },
    button: { 
    padding: 10, 
    borderRadius: 10, 
    alignItems: 'center', 
    marginTop: 30 },
    buttonText: { 
    fontSize: 25, 
    fontWeight: 'bold' 
  },
  message: { 
    textAlign: 'center', 
    fontSize: 18, 
    marginTop: 10 
  },
  requirementsContainer: { 
    marginTop: 20, 
    padding: 10, 
    borderRadius: 8 
  },
  requirementsTitle: { 
    fontSize: 14, 
    fontWeight: 'bold', 
    marginBottom: 8 
  },
  requirementItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 5 
  },
  checkbox: { 
    width: 16, 
    height: 16, 
    borderWidth: 1, 
    borderRadius: 3, 
    marginRight: 8 
  },
});

export default Signup;