/**
 * useMockData — drop-in hook that now reads from AppDataContext.
 *
 * All existing screen imports (useMockData, type Enquiry, etc.) continue
 * to work without any changes. This file is the only change needed to
 * wire the new live-data context into all existing screens.
 *
 * The hook now returns:
 * - All existing fields: enquiries, escalations, followups, resolveEscalation,
 *   markFollowUpDone, getEnquiryById
 * - New fields: isLive, isLoading, submitNewEnquiry, refresh
 */

import { useAppDataContext } from '../context/AppDataContext';

// Re-export all types so existing component imports remain valid
export type {
  Message,
  TimelineEvent,
  Enquiry,
  Escalation,
  FollowUp,
  MockDataContextValue as MockDataReturn,
} from '../context/MockDataContext';

/**
 * Hook that provides typed app data and mutation helpers from the shared context.
 * Now backed by the live backend (with automatic mock fallback).
 *
 * @returns Object with data arrays, mutation functions, and live-status flags.
 */
export function useMockData() {
  return useAppDataContext();
}
