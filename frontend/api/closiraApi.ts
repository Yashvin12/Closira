/**
 * closiraApi.ts — Typed fetch client for all Closira backend API calls.
 *
 * All functions:
 * - Use a configurable timeout (AbortController)
 * - Return typed data on success
 * - Throw a structured ApiError on failure
 * - Attach Authorization: Bearer <token> from AsyncStorage
 */

import { API_BASE_URL, API_TIMEOUT_MS } from '../constants/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  Enquiry,
  Escalation,
  FollowUp,
} from '../context/MockDataContext';

const ACCESS_KEY = '@closira_access_token';

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
// Internal fetch helper
// ─────────────────────────────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  // Read token from storage
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
