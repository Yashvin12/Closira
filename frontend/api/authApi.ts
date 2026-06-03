/**
 * authApi.ts — typed fetch helpers for the auth endpoints.
 */

import { API_BASE_URL, API_TIMEOUT_MS } from '../constants/config';

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

async function authFetch<T>(path: string, body: object): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      let msg = `HTTP ${res.status}`;
      try {
        const data = await res.json();
        msg = data?.detail ?? data?.error ?? msg;
      } catch (_) {}
      throw new Error(msg);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export async function apiSignup(
  email: string,
  password: string,
  fullName?: string
): Promise<TokenPair> {
  return authFetch<TokenPair>('/auth/signup', { email, password, full_name: fullName });
}

export async function apiLogin(email: string, password: string): Promise<TokenPair> {
  return authFetch<TokenPair>('/auth/login', { email, password });
}

export async function apiRefresh(refreshToken: string): Promise<TokenPair> {
  return authFetch<TokenPair>('/auth/refresh', { refresh_token: refreshToken });
}
