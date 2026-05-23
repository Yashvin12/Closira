/**
 * Shared formatting utilities.
 * 
 * Extracts commonly used formatting functions (timestamps, avatar generators)
 * to avoid code duplication across components.
 */

/** Format timestamp as a relative time string (e.g., "2h ago") */
export function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${diffDay}d ago`;
}

/** Generate 2-character initials from a full name (e.g., "Sarah Mitchell" -> "SM") */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

/** 
 * Deterministic avatar background colour from name hash.
 * Ensures the same user always gets the same avatar colour.
 */
export function getAvatarBg(name: string): string {
  const palette = [
    '#6366F1', // Indigo 500
    '#8B5CF6', // Violet 500
    '#EC4899', // Pink 500
    '#14B8A6', // Teal 500
    '#F59E0B', // Amber 500
    '#22C55E', // Green 500
    '#3B82F6', // Blue 500
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
  }
  return palette[Math.abs(hash) % palette.length];
}

/** Get formatted date like "FRI, 23 MAY". */
export function getFormattedDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).toUpperCase();
}

/** Get greeting based on time of day. */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}
