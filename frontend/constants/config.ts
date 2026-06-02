/**
 * config.ts — Central configuration for the Closira frontend.
 *
 * Base URL is derived dynamically from the Expo dev server host when
 * running in Expo Go. This means zero manual IP configuration — it
 * Just Works when you scan the QR code on the same WiFi network.
 *
 * For production builds, replace API_BASE_URL with your deployed server URL.
 */

import Constants from 'expo-constants';

/**
 * Derive the backend host from the Expo dev server URL.
 *
 * In Expo Go, `Constants.expoConfig.hostUri` looks like "192.168.x.x:8081".
 * We strip the port and replace it with the backend port (8000).
 *
 * Falls back to localhost for web/emulator environments where hostUri
 * may not be set.
 */
function getApiBaseUrl(): string {
  try {
    // hostUri is set by Expo when running in Expo Go on a real device
    const hostUri =
      (Constants.expoConfig as any)?.hostUri ??
      (Constants as any)?.manifest?.debuggerHost ??
      (Constants as any)?.manifest2?.extra?.expoGo?.debuggerHost;

    if (hostUri) {
      // hostUri = "192.168.x.x:8081" — strip port, use backend port 8000
      const host = hostUri.split(':')[0];
      return `http://${host}:8000`;
    }
  } catch (_) {
    // Silently fall through to default
  }
  // Web browser or Android emulator fallback
  return 'http://localhost:8000';
}

export const API_BASE_URL = getApiBaseUrl();

/** Timeout in milliseconds for API requests. */
export const API_TIMEOUT_MS = 8000;
