/**
 * Custom hook for loading and managing mock data.
 *
 * This hook now acts as a thin wrapper around MockDataContext.
 * By using context, we ensure that mutations (like resolving an
 * escalation) update the single source of truth and instantly
 * reflect across all tabs (e.g. Dashboard counts).
 */

import { useMockDataContext } from '../context/MockDataContext';

// Re-export all types so existing imports in components don't break
export type {
  Message,
  TimelineEvent,
  Enquiry,
  Escalation,
  FollowUp,
  MockDataContextValue as MockDataReturn,
} from '../context/MockDataContext';

/**
 * Hook that provides typed mock data and mutation helpers from the shared context.
 *
 * @returns Object with data arrays and mutation functions.
 */
export function useMockData() {
  return useMockDataContext();
}
