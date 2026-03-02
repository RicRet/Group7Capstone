// Shared mocks for Expo/React Native tests
jest.mock('expo-router', () => {
  const push = jest.fn();
  const replace = jest.fn();
  return {
    useRouter: () => ({ push, replace }),
    useLocalSearchParams: () => ({ email: 'test@example.com' }),
  };
});

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getCurrentPositionAsync: jest.fn().mockResolvedValue({ coords: { latitude: 33.21, longitude: -97.15 } }),
}));

jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
// Silence the RN Animated warning
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

jest.mock('../../EagleGuide/app/lib/session', () => ({
  useSession: () => ({
    user: null,
    loading: false,
    refreshMe: jest.fn(),
    logout: jest.fn(),
    login: jest.fn(),
  }),
}));

jest.mock('../../EagleGuide/app/Theme', () => ({
  useTheme: () => ({
    theme: {
      background: '#0b0b0b',
      text: '#ffffff',
      lighttext: '#c5c5c5',
      box: '#1b1b1b',
      inputBackground: '#121212',
      border: '#2a2a2a',
      green: '#16A34A',
      red: '#e11d48',
      disabled: '#4b5563',
      checkbox: '#374151',
      button: '#4ade80',
    },
  }),
}));
