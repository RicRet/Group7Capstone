module.exports = {
  preset: 'jest-expo',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: [
    '@testing-library/jest-native/extend-expect',
    '<rootDir>/frontend/jest.setup.cjs'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/../EagleGuide/$1',
    '\\.(png|jpg|jpeg|gif|svg)$': '<rootDir>/frontend/__mocks__/fileMock.js'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|expo|@expo|@react-navigation|@gorhom|react-native-reanimated|react-native-gesture-handler)/)'
  ],
  testMatch: ['**/frontend/**/*.test.[jt]s?(x)'],
};
