import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { checkEmailAvailability } from './lib/api/signup';
import { useTheme } from './Theme';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignupEmail() {
  const router = useRouter();
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'checking' | 'error' | 'ok'>('idle');

  const emailValid = useMemo(() => emailRegex.test(email.trim()), [email]);

  const handleContinue = async () => {
    const normalized = email.trim().toLowerCase();
    if (!emailValid) {
      setStatus('error');
      setMessage('Enter a valid email address.');
      return;
    }
    setStatus('checking');
    setMessage('');
    try {
      const res = await checkEmailAvailability(normalized);
      if (!res.available) {
        setStatus('error');
        setMessage('That email is already registered. Try logging in.');
        return;
      }
      setStatus('ok');
      router.push({ pathname: '/Signup', params: { email: normalized } });
    } catch (err) {
      setStatus('error');
      setMessage('Could not verify email right now. Please try again.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}> 
      <Text style={[styles.title, { color: theme.text }]}>Sign Up</Text>
      <Text style={[styles.subtitle, { color: theme.lighttext }]}>Step 1 of 2 — verify email</Text>

      <TextInput
        style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }]}
        placeholder="Email"
        placeholderTextColor={theme.lighttext}
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      {message ? (
        <Text style={[styles.message, { color: status === 'error' ? theme.red || theme.lighttext : theme.lighttext }]}>
          {message}
        </Text>
      ) : null}

      <TouchableOpacity
        style={[styles.button, { backgroundColor: emailValid ? theme.green : theme.disabled }]}
        onPress={handleContinue}
        disabled={!emailValid || status === 'checking'}
      >
        {status === 'checking' ? (
          <ActivityIndicator color={theme.text} />
        ) : (
          <Text style={[styles.buttonText, { color: theme.text }]}>Continue</Text>
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
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 20,
    fontWeight: '500'
  },
  input: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 22
  },
  message: {
    textAlign: 'center',
    fontSize: 15,
    marginTop: 12
  },
  button: {
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 24
  },
  buttonText: {
    fontSize: 22,
    fontWeight: 'bold'
  },
  link: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 16
  }
});
