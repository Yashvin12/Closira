/**
 * AppDataContext — unified data store that bridges real API data with mock fallback.
 *
 * DESIGN PHILOSOPHY:
 * ──────────────────
 * 1. SAME INTERFACE as MockDataContext — all existing screens work unchanged.
 *    They still call useMockData() which now reads from this context.
 * 2. ON MOUNT: checks backend health, then fetches live data. If anything
 *    fails (network, timeout, server down), silently falls back to mock data.
 * 3. MUTATIONS: resolveEscalation / markFollowUpDone update local state
 *    immediately (optimistic), so the UI never lags.
 * 4. SUBMIT: submitNewEnquiry POSTs to the real backend and refreshes the
 *    enquiries list so the new lead appears instantly.
 * 5. isLive flag: consumers can show a "Live" vs "Demo" indicator.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import {
  checkHealth,
  fetchEnquiries,
  fetchEscalations,
  fetchFollowups,
  submitEnquiry,
  resolveEscalationApi,
  completeFollowupApi,
} from '../api/closiraApi';

// Import mock data as fallback seeds
import enquiriesData from '../mock/enquiries.json';
import escalationsData from '../mock/escalations.json';
import followupsData from '../mock/followups.json';

// Re-export all types from MockDataContext so downstream imports keep working
export type {
  Enquiry,
  Escalation,
  FollowUp,
  Message,
  TimelineEvent,
  MockDataContextValue,
} from './MockDataContext';

import type {
  Enquiry,
  Escalation,
  FollowUp,
  MockDataContextValue,
} from './MockDataContext';

// ─────────────────────────────────────────────────────────────────────────────
// Extended Context Value
// ─────────────────────────────────────────────────────────────────────────────

export interface AppDataContextValue extends MockDataContextValue {
  /** True when data is sourced from the live backend. */
  isLive: boolean;
  /** True while the initial data load is in progress. */
  isLoading: boolean;
  /** Submit a new customer enquiry to the backend. */
  submitNewEnquiry: (
    channel: 'whatsapp' | 'email' | 'call',
    customerName: string,
    message: string
  ) => Promise<{ success: boolean; error?: string }>;
  /** Manually refresh all data from the backend. */
  refresh: () => Promise<void>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────────────────

const AppDataContext = createContext<AppDataContextValue | null>(null);

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────

export function AppDataProvider({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const [enquiries, setEnquiries] = useState<Enquiry[]>(
    enquiriesData.data as Enquiry[]
  );
  const [escalations, setEscalations] = useState<Escalation[]>(
    escalationsData.data as Escalation[]
  );
  const [followups, setFollowups] = useState<FollowUp[]>(
    followupsData.data as FollowUp[]
  );
  const [isLive, setIsLive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // ── Data Loading ──────────────────────────────────────────────────────────

  const loadLiveData = useCallback(async () => {
    try {
      const healthy = await checkHealth();
      if (!healthy) {
        // Backend unreachable — keep mock data, mark as demo mode
        setIsLive(false);
        return;
      }

      // Parallel fetch all three collections
      const [liveEnquiries, liveEscalations, liveFollowups] = await Promise.all([
        fetchEnquiries(),
        fetchEscalations(),
        fetchFollowups(),
      ]);

      // Only override mock data if the backend returned records.
      // If the DB is freshly empty, keep showing mock data for visualization.
      if (liveEnquiries.length > 0) {
        setEnquiries(liveEnquiries);
      }
      if (liveEscalations.length > 0) {
        setEscalations(liveEscalations);
      }
      if (liveFollowups.length > 0) {
        setFollowups(liveFollowups);
      }

      setIsLive(true);
    } catch (_) {
      // Any fetch failure — silently stay in mock/demo mode
      setIsLive(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    await loadLiveData();
    setIsLoading(false);
  }, [loadLiveData]);

  // Load on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      await loadLiveData();
      if (mounted) setIsLoading(false);
    })();
    return () => { mounted = false; };
  }, [loadLiveData]);

  // ── Mutations ─────────────────────────────────────────────────────────────

  /** Resolve an escalation — optimistic update + backend call. */
  const resolveEscalation = useCallback(async (id: string) => {
    // Optimistic: remove from local state immediately
    setEscalations((prev) => prev.filter((esc) => esc.id !== id));
    try {
      await resolveEscalationApi(id);
      // Refresh enquiries to reflect updated status
      const updated = await fetchEnquiries();
      if (updated.length > 0) setEnquiries(updated);
    } catch (_) {
      // If backend fails, the optimistic removal still stands in this session.
      // Next refresh will reconcile.
    }
  }, []);

  /**
   * Mark a follow-up as done — optimistic update + backend call.
   * Removes from list after the card’s 400ms fade animation.
   */
  const markFollowUpDone = useCallback(async (id: string) => {
    setFollowups((prev) =>
      prev.map((fu) =>
        fu.id === id ? { ...fu, status: 'done' as const } : fu
      )
    );
    setTimeout(() => {
      setFollowups((prev) => prev.filter((fu) => fu.id !== id));
    }, 400);
    try {
      await completeFollowupApi(id);
    } catch (_) {
      // Optimistic removal stands; next refresh will reconcile.
    }
  }, []);

  const getEnquiryById = useCallback(
    (id: string) => enquiries.find((enq) => enq.id === id),
    [enquiries]
  );

  // ── Submit New Enquiry ────────────────────────────────────────────────────

  const submitNewEnquiry = useCallback(
    async (
      channel: 'whatsapp' | 'email' | 'call',
      customerName: string,
      message: string
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        await submitEnquiry(channel, customerName, message);
        // SOP matching is now synchronous, but add a short delay
        // to let the DB transaction fully commit before re-polling
        await new Promise((r) => setTimeout(r, 300));
        // Refresh all three lists so every tab reflects changes
        const [updatedEnq, updatedEsc, updatedFu] = await Promise.all([
          fetchEnquiries(),
          fetchEscalations(),
          fetchFollowups(),
        ]);
        if (updatedEnq.length > 0) setEnquiries(updatedEnq);
        if (updatedEsc.length > 0) setEscalations(updatedEsc);
        if (updatedFu.length > 0) setFollowups(updatedFu);
        setIsLive(true);
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err?.message ?? 'Failed to submit enquiry' };
      }
    },
    []
  );

  return (
    <AppDataContext.Provider
      value={{
        enquiries,
        escalations,
        followups,
        resolveEscalation,
        markFollowUpDone,
        getEnquiryById,
        isLive,
        isLoading,
        submitNewEnquiry,
        refresh,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Consumer Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Low-level hook that reads from AppDataContext.
 * Throws a clear error if used outside the Provider.
 */
export function useAppDataContext(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) {
    throw new Error(
      'useAppDataContext must be used inside <AppDataProvider>. ' +
        'Wrap your root layout with <AppDataProvider>.'
    );
  }
  return ctx;
}
