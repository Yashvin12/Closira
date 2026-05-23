/**
 * EscalationCard — displays an active escalation with urgency indicator.
 *
 * Premium UI features:
 * - Pulsing urgency dot (UrgencyDot handles the animation)
 * - Red left accent bar — unmissable urgency signal at a glance
 * - Animated resolve button: spring scale flash → checkmark → callback
 * - §2 press-feedback: resolve button springs from 1→1.25→1 on tap
 * - §8 success-feedback: confirm completed action with animation before removal
 */

import React, { useRef, useState, useCallback } from 'react';
import { View, Text, Pressable, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChannelBadge } from '../ui/ChannelBadge';
import { UrgencyDot } from '../ui/UrgencyDot';
import {
  colors,
  fontSize,
  fontFamily,
  spacing,
  borderRadius,
  shadows,
  iconSize,
} from '../../constants/theme';
import type { Escalation } from '../../hooks/useMockData';
import { formatRelativeTime } from '../../utils/formatters';

interface EscalationCardProps {
  escalation: Escalation;
  onResolve: (id: string) => void;
}



export function EscalationCard({
  escalation,
  onResolve,
}: EscalationCardProps): React.JSX.Element {
  const [isResolving, setIsResolving] = useState(false);
  const checkScale = useRef(new Animated.Value(1)).current;

  const handleResolve = useCallback(() => {
    if (isResolving) return;
    setIsResolving(true);
    Animated.sequence([
      Animated.spring(checkScale, {
        toValue: 1.3,
        useNativeDriver: true,
        tension: 400,
        friction: 8,
      }),
      Animated.spring(checkScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 400,
        friction: 12,
      }),
    ]).start(() => {
      setTimeout(() => onResolve(escalation.id), 200);
    });
  }, [isResolving, checkScale, onResolve, escalation.id]);

  return (
    <View style={[styles.card, shadows.sm]}>
      {/* Urgency badge row */}
      <View style={styles.topRow}>
        <View style={styles.urgencyRow}>
          <UrgencyDot urgency={escalation.urgency} size={10} />
          <Text style={styles.customerName}>{escalation.customer_name}</Text>
        </View>
        <View style={styles.topRowRight}>
          <Text style={styles.urgencyLabel}>
            {escalation.urgency === 'high' ? 'HIGH' : 'MED'}
          </Text>
          <ChannelBadge channel={escalation.channel} showLabel={false} />
        </View>
      </View>

      {/* Reason */}
      <Text style={styles.reason} numberOfLines={2}>
        {escalation.reason}
      </Text>

      {/* Message preview */}
      <View style={styles.previewBox}>
        <Text style={styles.previewText} numberOfLines={1}>
          {escalation.message_preview}
        </Text>
      </View>

      {/* Footer: time + resolve */}
      <View style={styles.bottomRow}>
        <View style={styles.timeRow}>
          <Ionicons name="time-outline" size={iconSize.sm} color={colors.textTertiary} />
          <Text style={styles.time}>{formatRelativeTime(escalation.created_at)}</Text>
        </View>

        <Pressable
          onPress={handleResolve}
          disabled={isResolving}
          accessibilityRole="button"
          accessibilityLabel={`Resolve escalation for ${escalation.customer_name}`}
        >
          <Animated.View
            style={[
              styles.resolveButton,
              isResolving && styles.resolveButtonDone,
              { transform: [{ scale: checkScale }] },
            ]}
          >
            <Ionicons
              name={isResolving ? 'checkmark-circle' : 'checkmark-circle-outline'}
              size={iconSize.md}
              color={isResolving ? colors.success : colors.success}
            />
            <Text style={[styles.resolveText, isResolving && styles.resolveTextDone]}>
              {isResolving ? 'Query Solved!' : 'Resolve'}
            </Text>
          </Animated.View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.danger,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.15)',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  urgencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  topRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  urgencyLabel: {
    fontSize: 10,
    fontFamily: fontFamily.bold,
    color: colors.danger,
    letterSpacing: 0.8,
  },
  customerName: {
    fontSize: fontSize.base,
    fontFamily: fontFamily.semibold,
    color: colors.textPrimary,
  },
  reason: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  previewBox: {
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderLeftWidth: 2,
    borderLeftColor: colors.danger,
    marginBottom: spacing.md,
  },
  previewText: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  time: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    fontFamily: fontFamily.semibold,
  },
  resolveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(34,197,94,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.2)',
    minHeight: 44,
    minWidth: 44,
  },
  resolveButtonDone: {
    backgroundColor: 'rgba(34,197,94,0.2)',
    borderColor: 'rgba(34,197,94,0.4)',
  },
  resolveText: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.semibold,
    color: colors.success,
  },
  resolveTextDone: {
    opacity: 0.7,
  },
});
