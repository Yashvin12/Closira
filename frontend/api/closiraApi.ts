/**
 * closiraApi.ts — Typed fetch client for all Closira backend API calls.
 *
 * All functions:
 * - Use a configurable timeout (AbortController)
 * - Return typed data on success
 * - Throw a structured ApiError on failure
 * - Attach Authorization: Bearer <token> from AsyncStorage
 * - **Auto-refresh:** On 401, transparently refreshes the access token
 *   using the stored refresh token, retries the original request once,
 *   and logs out if the refresh itself fails.
 */

import { API_BASE_URL, API_TIMEOUT_MS } from '../constants/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  Enquiry,
  Escalation,
  FollowUp,
} from '../context/MockDataContext';

const ACCESS_KEY = '@closira_access_token';
const REFRESH_KEY = '@closira_refresh_token';

// ─────────────────────────────────────────────────────────────────────────────
// Error Type
// ─────────────────────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly status: number | null,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Response shapes from the backend list endpoints
// ─────────────────────────────────────────────────────────────────────────────

interface EnquiryListResponse {
  data: Enquiry[];
  total: number;
}

interface EscalationListResponse {
  data: Escalation[];
  total: number;
}

interface FollowUpListResponse {
  data: FollowUp[];
  total: number;
}

export interface EnquiryJobResponse {
  enquiry_id: string;
  status: string;
  sop_matched: string | null;
  suggested_response: string | null;
  message: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Logout callback — set from AuthContext to avoid circular imports
// ─────────────────────────────────────────────────────────────────────────────

/**
 * AuthContext calls `setLogoutHandler(logout)` on mount so the interceptor
 * can force a logout without importing AuthContext (which would be circular).
 */
let _logoutHandler: (() => Promise<void>) | null = null;

export function setLogoutHandler(handler: () => Promise<void>): void {
  _logoutHandler = handler;
}

// ─────────────────────────────────────────────────────────────────────────────
// Refresh token lock — prevents parallel refresh races
// ─────────────────────────────────────────────────────────────────────────────

let _refreshPromise: Promise<string | null> | null = null;

/**
 * Attempt to exchange the stored refresh token for a new access token.
 * Returns the new access token or null if the refresh itself failed.
 *
 * If a refresh is already in-flight, piggy-back on the existing promise
 * to avoid concurrent /auth/refresh calls (race condition).
 */
async function tryRefreshToken(): Promise<string | null> {
  // Coalesce concurrent callers onto a single in-flight refresh
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = (async () => {
    try {
      const refreshToken = await AsyncStorage.getItem(REFRESH_KEY);
      if (!refreshToken) return null;

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

      try {
        const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
          signal: controller.signal,
        });

        if (!res.ok) return null; // Refresh token expired or invalid

        const body = await res.json();
        const newAccess: string = body.access_token;
        const newRefresh: string = body.refresh_token;

        // Persist new token pair
        await AsyncStorage.multiSet([
          [ACCESS_KEY, newAccess],
          [REFRESH_KEY, newRefresh],
        ]);

        return newAccess;
      } finally {
        clearTimeout(timer);
      }
    } catch (_) {
      return null; // Network error during refresh
    } finally {
      _refreshPromise = null; // Release the lock
    }
  })();

  return _refreshPromise;
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal fetch helper with automatic 401 → refresh → retry
// ─────────────────────────────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  // Read current access token
  let authHeader: Record<string, string> = {};
  try {
    const token = await AsyncStorage.getItem(ACCESS_KEY);
    if (token) authHeader = { Authorization: `Bearer ${token}` };
  } catch (_) {}

  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...authHeader,
        ...(options?.headers ?? {}),
      },
    });

    // ── 401 Interceptor: try to refresh and retry once ──────────────────
    if (res.status === 401) {
      clearTimeout(timer); // Release the original timeout

      const newAccessToken = await tryRefreshToken();

      if (!newAccessToken) {
        // Refresh failed — force logout and throw
        if (_logoutHandler) await _logoutHandler();
        throw new ApiError(401, 'Session expired. Please log in again.');
      }

      // Retry the original request with the fresh token
      const retryController = new AbortController();
      const retryTimer = setTimeout(() => retryController.abort(), API_TIMEOUT_MS);

      try {
        const retryRes = await fetch(`${API_BASE_URL}${path}`, {
          ...options,
          signal: retryController.signal,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${newAccessToken}`,
            ...(options?.headers ?? {}),
          },
        });

        if (!retryRes.ok) {
          // If it STILL fails after refresh, check if it's another 401
          if (retryRes.status === 401) {
            if (_logoutHandler) await _logoutHandler();
            throw new ApiError(401, 'Session expired. Please log in again.');
          }
          let errMsg = `HTTP ${retryRes.status}`;
          try {
            const body = await retryRes.json();
            errMsg = body?.error ?? body?.detail ?? errMsg;
          } catch (_) {}
          throw new ApiError(retryRes.status, errMsg);
        }

        return (await retryRes.json()) as T;
      } finally {
        clearTimeout(retryTimer);
      }
    }

    // ── Non-401 errors ──────────────────────────────────────────────────
    if (!res.ok) {
      let errMsg = `HTTP ${res.status}`;
      try {
        const body = await res.json();
        errMsg = body?.error ?? body?.detail ?? errMsg;
      } catch (_) {}
      throw new ApiError(res.status, errMsg);
    }

    return (await res.json()) as T;
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(null, err?.message ?? 'Network error');
  } finally {
    clearTimeout(timer);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API functions
// ─────────────────────────────────────────────────────────────────────────────

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await apiFetch<{ status: string; db: string }>('/health');
    return res.status === 'ok';
  } catch (_) {
    return false;
  }
}

export async function fetchEnquiries(statusFilter?: string): Promise<Enquiry[]> {
  const qs = statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : '';
  const res = await apiFetch<EnquiryListResponse>(`/enquiries${qs}`);
  return res.data.map((e) => ({
    ...e,
    messages: (e as any).messages ?? [],
    timeline: (e as any).timeline ?? [],
  }));
}

export async function fetchEscalations(): Promise<Escalation[]> {
  const res = await apiFetch<EscalationListResponse>('/escalations');
  return res.data;
}

export async function fetchFollowups(): Promise<FollowUp[]> {
  const res = await apiFetch<FollowUpListResponse>('/followups');
  return res.data;
}

export async function submitEnquiry(
  channel: 'whatsapp' | 'email' | 'call',
  customerName: string,
  message: string
): Promise<EnquiryJobResponse> {
  return apiFetch<EnquiryJobResponse>('/enquiry', {
    method: 'POST',
    body: JSON.stringify({
      channel,
      customer_name: customerName,
      message,
    }),
  });
}

export async function escalateEnquiryApi(
  enquiryId: string,
  reason: string
): Promise<void> {
  await apiFetch(`/enquiry/${encodeURIComponent(enquiryId)}/escalate`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export async function scheduleFollowupApi(
  enquiryId: string,
  delayMinutes: number = 30,
  messageTemplate?: string
): Promise<void> {
  await apiFetch(`/enquiry/${encodeURIComponent(enquiryId)}/followup`, {
    method: 'POST',
    body: JSON.stringify({
      delay_minutes: delayMinutes,
      message_template: messageTemplate ?? null,
    }),
  });
}

export async function fetchEnquiryHistory(
  enquiryId: string
): Promise<Enquiry | null> {
  try {
    const res = await apiFetch<{
      enquiry: any;
      timeline: Array<{ event_type: string; detail: string | null; created_at: string }>;
    }>(`/enquiry/${encodeURIComponent(enquiryId)}/history`);

    return {
      ...res.enquiry,
      messages: [],
      timeline: res.timeline,
      ai_summary: null,
    } as Enquiry;
  } catch (_) {
    return null;
  }
}

export async function resolveEscalationApi(
  enquiryId: string
): Promise<void> {
  await apiFetch(`/enquiry/${encodeURIComponent(enquiryId)}/resolve`, {
    method: 'POST',
  });
}

export async function completeFollowupApi(
  enquiryId: string
): Promise<void> {
  await apiFetch(`/enquiry/${encodeURIComponent(enquiryId)}/complete-followup`, {
    method: 'POST',
  });
}
