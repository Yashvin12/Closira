/**
 * MockDataContext — single shared state store for all mock data.
 *
 * WHY THIS EXISTS:
 * React hooks that call useState() create an isolated local state per
 * component tree. If useMockData() is called on both the Dashboard tab
 * and the Escalations tab, each tab gets its own separate copy of the
 * data. Resolving an escalation on one tab would NOT update the count
 * on the Dashboard — a silent, hard-to-debug data consistency bug.
 *
 * SOLUTION:
 * Move all state into a single React Context Provider that wraps the
 * root layout. Every call to useMockData() now reads from the SAME
 * shared store, so mutations on any screen are immediately reflected
 * everywhere in the app.
 *
 * All TypeScript interfaces live here so components can import them
 * from a single authoritative source.
 */

import React, { createContext, useContext, useState, useCallback } from 'react';

import enquiriesData from '../mock/enquiries.json';
import escalationsData from '../mock/escalations.json';
import followupsData from '../mock/followups.json';

// ─────────────────────────────────────────────────────────────────────────────
// Type Definitions
// ─────────────────────────────────────────────────────────────────────────────

/** Message in a conversation thread */
export interface Message {
  id: string;
  sender: 'customer' | 'ai';
  text: string;
  timestamp: string;
}

/** Timeline event for an enquiry */
export interface TimelineEvent {
  event_type: string;
  detail: string;
  created_at: string;
}

/** Full enquiry record — mirrors the FastAPI response schema */
export interface Enquiry {
  id: string;
  channel: 'whatsapp' | 'email' | 'call';
  customer_name: string;
  message: string;
  status: 'new' | 'qualified' | 'escalated' | 'followed_up' | 'resolved';
  sop_matched: string | null;
  suggested_response: string | null;
  ai_summary: string | null;
  escalation_reason: string | null;
  created_at: string;
  updated_at: string;
  messages: Message[];
  timeline: TimelineEvent[];
}

/** Escalation record */
export interface Escalation {
  id: string;
  enquiry_id: string;
  channel: 'whatsapp' | 'email' | 'call';
  customer_name: string;
  reason: string;
  urgency: 'high' | 'medium';
  message_preview: string;
  created_at: string;
}

/** Follow-up task record */
export interface FollowUp {
  id: string;
  enquiry_id: string;
  customer_name: string;
  channel: 'whatsapp' | 'email' | 'call';
  message_preview: string;
  due_at: string;
  status: 'pending' | 'done';
}

/** Shape of the shared context value */
export interface MockDataContextValue {
  enquiries: Enquiry[];
  escalations: Escalation[];
  followups: FollowUp[];
  resolveEscalation: (id: string) => void;
  markFollowUpDone: (id: string) => void;
  getEnquiryById: (id: string) => Enquiry | undefined;
}

// ─────────────────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────────────────

const MockDataContext = createContext<MockDataContextValue | null>(null);

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Wrap the root layout with this provider to give every screen access
 * to a single, globally-consistent data store.
 */
export function MockDataProvider({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  // enquiries are read-only in the current UI — no mutations exposed
  const [enquiries] = useState<Enquiry[]>(enquiriesData.data as Enquiry[]);

  const [escalations, setEscalations] = useState<Escalation[]>(
    escalationsData.data as Escalation[]
  );

  const [followups, setFollowups] = useState<FollowUp[]>(
    followupsData.data as FollowUp[]
  );

  /** Remove a resolved escalation from the shared list. */
  const resolveEscalation = useCallback((id: string) => {
    setEscalations((prev) => prev.filter((esc) => esc.id !== id));
  }, []);

  /**
   * Mark a follow-up as done, then remove it after the card's fade
   * animation completes (400 ms).
   */
  const markFollowUpDone = useCallback((id: string) => {
    setFollowups((prev) =>
      prev.map((fu) =>
        fu.id === id ? { ...fu, status: 'done' as const } : fu
      )
    );
    setTimeout(() => {
      setFollowups((prev) => prev.filter((fu) => fu.id !== id));
    }, 400);
  }, []);

  const getEnquiryById = useCallback(
    (id: string) => enquiries.find((enq) => enq.id === id),
    [enquiries]
  );

  return (
    <MockDataContext.Provider
      value={{
        enquiries,
        escalations,
        followups,
        resolveEscalation,
        markFollowUpDone,
        getEnquiryById,
      }}
    >
      {children}
    </MockDataContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Consumer Hook (internal — prefer useMockData() in components)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Low-level hook that reads from MockDataContext.
 * Throws a clear error if used outside the Provider.
 */
export function useMockDataContext(): MockDataContextValue {
  const ctx = useContext(MockDataContext);
  if (!ctx) {
    throw new Error(
      'useMockDataContext must be used inside <MockDataProvider>. ' +
        'Wrap your root layout with <MockDataProvider>.'
    );
  }
  return ctx;
}
