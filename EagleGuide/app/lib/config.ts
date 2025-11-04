import Constants from 'expo-constants';

/**
 * Centralized runtime configuration.
 * Reads from Expo extra and public env vars.
 */
export const config = {
  /** Base URL for the backend API, no trailing slash. */
  apiBaseUrl:
    (Constants.expoConfig?.extra as any)?.apiBaseUrl?.replace(/\/$/, '') ||
    process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ||
    'http://18.117.146.190:8080',

  /** API version prefix. */
  apiVersion: '/v1',
} as const;

export const apiBase = `${config.apiBaseUrl}${config.apiVersion}`;
