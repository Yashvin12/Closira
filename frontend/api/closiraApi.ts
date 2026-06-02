/**
 * closiraApi.ts — Typed fetch client for all Closira backend API calls.
 *
 * All functions:
 * - Use a configurable timeout (AbortController)
 * - Return typed data on success
 * - Throw a structured ApiError on failure
 * - Never swallow errors silently (the context layer decides on fallback)
 */

import { API_BASE_URL, API_TIMEOUT_MS } from '../constants/config';
import type {
  Enquiry,
  Escalation,
  FollowUp,
} from '../context/MockDataContext';

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

  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
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
    // Network failure, timeout, CORS, etc.
    throw new ApiError(null, err?.message ?? 'Network error');
  } finally {
    clearTimeout(timer);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /health — verify the backend is reachable.
 * Returns true if healthy, false otherwise (never throws).
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const res = await apiFetch<{ status: string; db: string }>('/health');
    return res.status === 'ok';
  } catch (_) {
    return false;
  }
}

/**
 * GET /enquiries — list all enquiries, newest first.
 * Optional status filter e.g. 'escalated'.
 */
export async function fetchEnquiries(statusFilter?: string): Promise<Enquiry[]> {
  const qs = statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : '';
  const res = await apiFetch<EnquiryListResponse>(`/enquiries${qs}`);
  // Normalise: backend doesn't persist messages/timeline at list level
  return res.data.map((e) => ({
    ...e,
    messages: (e as any).messages ?? [],
    timeline: (e as any).timeline ?? [],
  }));
}

/**
 * GET /escalations — list all active escalations.
 */
export async function fetchEscalations(): Promise<Escalation[]> {
  const res = await apiFetch<EscalationListResponse>('/escalations');
  return res.data;
}

/**
 * GET /followups — list all pending follow-ups.
 */
export async function fetchFollowups(): Promise<FollowUp[]> {
  const res = await apiFetch<FollowUpListResponse>('/followups');
  return res.data;
}

/**
 * POST /enquiry — submit a new customer enquiry.
 */
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

/**
 * POST /enquiry/{id}/escalate — escalate an enquiry.
 */
export async function escalateEnquiryApi(
  enquiryId: string,
  reason: string
): Promise<void> {
  await apiFetch(`/enquiry/${encodeURIComponent(enquiryId)}/escalate`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

/**
 * POST /enquiry/{id}/followup — schedule a follow-up.
 */
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

/**
 * GET /enquiry/{id}/history — fetch full enquiry detail + timeline.
 */
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
      messages: [],          // History endpoint doesn't expose messages
      timeline: res.timeline,
      ai_summary: null,
    } as Enquiry;
  } catch (_) {
    return null;
  }
}

/**
 * POST /enquiry/{id}/resolve — resolve an escalated enquiry.
 */
export async function resolveEscalationApi(
  enquiryId: string
): Promise<void> {
  await apiFetch(`/enquiry/${encodeURIComponent(enquiryId)}/resolve`, {
    method: 'POST',
  });
}

/**
 * POST /enquiry/{id}/complete-followup — complete a follow-up.
 */
export async function completeFollowupApi(
  enquiryId: string
): Promise<void> {
  await apiFetch(`/enquiry/${encodeURIComponent(enquiryId)}/complete-followup`, {
    method: 'POST',
  });
}
