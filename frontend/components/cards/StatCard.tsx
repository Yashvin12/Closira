/**
 * StatCard — dashboard statistic card with icon, number, and label.
 *
 * Premium dark-mode treatment:
 * - 4dp left accent bar in iconColor (visual differentiation between cards)
 * - 48×48 icon container with rounded corners and subtle tinted bg
 * - Large tabular number with negative letter-spacing for polish
 * - Subtle card border + dark shadow
 * - §6 number-tabular: tabular figures for stat numbers
 * - §5 visual-hierarchy: size + spacing hierarchy across the 2×2 grid
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  colors,
  fontSize,
  fontFamily,
  letterSpacing,
  spacing,
  borderRadius,
  shadows,
  iconSize,
} from '../../constants/theme';

interface StatCardProps {
  /** Ionicons icon name */
  icon: keyof typeof Ionicons.glyphMap;
  /** Icon background color */
  iconBg: string;
  /** Icon tint color — also used for the left accent bar */
  iconColor: string;
  /** The stat number */
  value: number;
  /** Label below the number */
  label: string;
}

/**
 * Renders a stat card with coloured accent bar, tinted icon, numeric value, and label.
 */
export function StatCard({
  icon,
  iconBg,
  iconColor,
  value,
  label,
}: StatCardProps): React.JSX.Element {
  return (
    <View
      style={[
        styles.card,
        { borderLeftColor: iconColor },
        shadows.md,
        { shadowColor: iconColor },
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={iconSize.lg} color={iconColor} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    minWidth: '45%',
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  value: {
    fontSize: fontSize['3xl'],
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
    letterSpacing: letterSpacing.tight,
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontFamily: fontFamily.semibold,
    lineHeight: 18,
  },
});
