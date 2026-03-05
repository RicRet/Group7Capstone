import axios from 'axios';
import { apiBase } from './config';

// Axios instance configured for our API
export const http = axios.create({
  baseURL: apiBase,
  timeout: 10_000, // 10s timeout
});

let authToken: string | undefined;
export function setAuthToken(token?: string) {
  authToken = token || undefined;
}

// Attach Authorization header if we have a session token
http.interceptors.request.use((config) => {
  if (authToken) {
    config.headers = config.headers || {};
    config.headers["Authorization"] = `Bearer ${authToken}`;
  }
  return config;
});

//basic interceptor to normalize errors
http.interceptors.response.use(
  (resp) => resp,
  (error) => {
    // Create a concise error message
    const status = error?.response?.status;
    const message = error?.response?.data?.message || error.message || 'Request failed';
    return Promise.reject(new Error(`HTTP ${status ?? 'ERR'}: ${message}`));
  }
);
