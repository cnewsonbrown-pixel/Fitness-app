import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export function apiPost<T>(url: string, data?: unknown, token?: string) {
  return apiClient.post<T>(url, data, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  }).then((res) => res.data);
}

export function apiGet<T>(url: string, token?: string) {
  return apiClient.get<T>(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  }).then((res) => res.data);
}
