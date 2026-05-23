/**
 * Custom hook for loading and managing mock data.
 *
 * Provides typed access to enquiries, escalations, and follow-ups
 * from the local JSON mock files. In production, these would be
 * replaced with API calls to the FastAPI backend.
 */

import { useState, useCallback } from 'react';

import enquiriesData from '../mock/enquiries.json';
import escalationsData from '../mock/escalations.json';
import followupsData from '../mock/followups.json';

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

/** Full enquiry record from the API */
export interface Enquiry {
  id: string;
  channel: 'whatsapp' | 'email' | 'call';
  customer_name: string;
  message: string;
  status: 'new' | 'qualified' | 'escalated' | 'followed_up' | 'resolved';
  sop_matched: string | null;
  suggested_response: string | null;
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

/** Return type for the useMockData hook */
interface MockDataReturn {
  enquiries: Enquiry[];
  escalations: Escalation[];
  followups: FollowUp[];
  resolveEscalation: (id: string) => void;
  markFollowUpDone: (id: string) => void;
  getEnquiryById: (id: string) => Enquiry | undefined;
}

/**
 * Hook that provides typed mock data and mutation helpers.
 *
 * @returns Object with data arrays and mutation functions.
 */
export function useMockData(): MockDataReturn {
  const [enquiries] = useState<Enquiry[]>(
    enquiriesData.data as Enquiry[]
  );

  const [escalations, setEscalations] = useState<Escalation[]>(
    escalationsData.data as Escalation[]
  );

  const [followups, setFollowups] = useState<FollowUp[]>(
    followupsData.data as FollowUp[]
  );

  const resolveEscalation = useCallback((id: string) => {
    setEscalations((prev) => prev.filter((esc) => esc.id !== id));
  }, []);

  const markFollowUpDone = useCallback((id: string) => {
    setFollowups((prev) =>
      prev.map((fu) =>
        fu.id === id ? { ...fu, status: 'done' as const } : fu
      )
    );
    // Remove after animation delay
    setTimeout(() => {
      setFollowups((prev) => prev.filter((fu) => fu.id !== id));
    }, 400);
  }, []);

  const getEnquiryById = useCallback(
    (id: string) => enquiries.find((enq) => enq.id === id),
    [enquiries]
  );

  return {
    enquiries,
    escalations,
    followups,
    resolveEscalation,
    markFollowUpDone,
    getEnquiryById,
  };
}
