import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { signUp } from "./lib/api/signup";
import { useTheme } from "./Theme";

const Signup = () => {
    const router = useRouter();
    const { theme } = useTheme();
  const params = useLocalSearchParams<{ email?: string }>();
    // user inputs
    const [username, setUsername] = useState('');
  const emailFromParams = useMemo(() => typeof params.email === 'string' ? params.email : '', [params.email]);
  const [email, setEmail] = useState(emailFromParams);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    // will set error message just in case
    const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
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

    useEffect(() => {
      // if user lands here without email from step 1, send them back
      if (!emailFromParams) router.replace('/SignupEmail');
      else setEmail(emailFromParams);
    }, [emailFromParams, router]);

    // when all password requirements met
    const allRequirementsMet = Object.values(requirements).every(req => req);
    const formComplete = username.trim().length > 0 && email.trim().length > 0 && allRequirementsMet;

    const handleSignUp = async () => {
      setMessage('');
      if (!formComplete) {
        setMessage('Please fill out all required fields.');
        return;
      }
      setLoading(true);
      try {
        const trimmedFirst = firstName.trim();
        const trimmedLast = lastName.trim();
        const response = await signUp({
          username: username.trim(),
          email: email.trim().toLowerCase(),
          password,
          firstName: trimmedFirst || undefined,
          lastName: trimmedLast || undefined
        });
        setMessage(response.message || 'You are signed up! Login to continue.');
      }
      catch (error: any) {
        const apiError = error?.message;
        setMessage(apiError || 'Sign up failed. Please try again.');
      } finally {
        setLoading(false);
      }
    };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Sign Up</Text>
      <Text style={[styles.subtitle, { color: theme.lighttext }]}>Step 2 of 2 — account details</Text>

      <View style={styles.rowHeader}>
        <Text style={[styles.emailLabel, { color: theme.lighttext }]}>Email</Text>
        <Text style={[styles.changeEmail, { color: theme.green }]} onPress={() => router.replace('/SignupEmail')}>Change</Text>
      </View>
      <TextInput
        style={[
          styles.input,
          { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text, opacity: 0.6 }
        ]}
        value={email}
        editable={false}
      />

      <TextInput
        style={[
          styles.input,
          { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }
        ]}
        placeholder="Username"
        placeholderTextColor={theme.lighttext}
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />

      <TextInput
        style={[
          styles.input,
          { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }
        ]}
        placeholder="First name (optional)"
        placeholderTextColor={theme.lighttext}
        value={firstName}
        onChangeText={setFirstName}
        autoCapitalize="words"
      />

      <TextInput
        style={[
          styles.input,
          { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }
        ]}
        placeholder="Last name (optional)"
        placeholderTextColor={theme.lighttext}
        value={lastName}
        onChangeText={setLastName}
        autoCapitalize="words"
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
          { backgroundColor: formComplete ? theme.green : theme.disabled }
        ]}
        onPress={handleSignUp}
        disabled={!formComplete || loading}
      >
        {loading ? <ActivityIndicator color={theme.text} /> : (
          <Text style={[styles.buttonText, { color: theme.text }]}>Create Account</Text>
        )}
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
  subtitle: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: -20,
    marginBottom: 10,
    fontWeight: '500'
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
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10
  },
  emailLabel: {
    fontSize: 14,
    fontWeight: '600'
  },
  changeEmail: {
    fontSize: 14,
    fontWeight: '600'
  }
});

export default Signup;