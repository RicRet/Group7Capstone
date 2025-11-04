import axios from 'axios';
import { apiBase } from './config';

// Axios instance configured for our API
export const http = axios.create({
  baseURL: apiBase,
  timeout: 10_000, // 10s timeout
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
