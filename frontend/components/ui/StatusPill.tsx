/**
 * StatusPill — displays the current lifecycle status of an enquiry.
 *
 * Solid-colour pill with white text, a coloured dot indicator, and
 * spaced-out uppercase label (small-caps treatment via letterSpacing).
 * The dot ensures colour is NOT the only indicator (§1 color-not-only).
 *
 * Design spec:
 *   New → #6366F1 | Qualified → #22C55E | Escalated → #EF4444
 *   Shape: rounded-full, text-xs font-semibold, uppercase, letterSpacing 0.8
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  statusConfig,
  fontSize,
  fontFamily,
  borderRadius,
  spacing,
  letterSpacing,
} from '../../constants/theme';

interface StatusPillProps {
  /** The enquiry lifecycle status */
  status: 'new' | 'qualified' | 'escalated' | 'followed_up' | 'resolved';
}

/**
 * Renders a color-coded solid status pill with dot indicator and uppercase label.
 */
export function StatusPill({ status }: StatusPillProps): React.JSX.Element {
  const config = statusConfig[status];

  return (
    <View style={[styles.container, { backgroundColor: config.bgColor }]}>
      <View style={[styles.dot, { backgroundColor: config.color === '#FFFFFF' ? 'rgba(255,255,255,0.6)' : config.color }]} />
      <Text style={[styles.label, { color: config.color }]}>
        {config.label.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
    gap: spacing.xs - 2,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    opacity: 0.85,
  },
  label: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.semibold,
    letterSpacing: letterSpacing.badge,
  },
});
