/**
 * FollowUpCard — displays a follow-up task with due time and completion.
 *
 * Premium UI features:
 * - Overdue detection: amber "OVERDUE" badge + red due-time when past deadline
 * - Spring animation on Mark Done: bounces icon (1→1.25→1) before fading
 * - Customer initials avatar (same hash function as LeadCard)
 * - §2 press-feedback: spring scale on Mark Done confirms action
 * - §8 success-feedback: strikethrough name + fade out confirm completion
 */

import React, { useState, useRef, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChannelBadge } from '../ui/ChannelBadge';
import {
  fontSize,
  fontFamily,
  spacing,
  borderRadius,
  iconSize,
  letterSpacing,
} from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import type { FollowUp } from '../../hooks/useMockData';
import { getInitials, getAvatarBg } from '../../utils/formatters';

interface FollowUpCardProps {
  followup: FollowUp;
  onMarkDone: (id: string) => void;
}



function formatDueTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = date.toDateString() === tomorrow.toDateString();
  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  if (isToday) return `Today, ${timeStr}`;
  if (isTomorrow) return `Tomorrow, ${timeStr}`;
  return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${timeStr}`;
}

export function FollowUpCard({
  followup,
  onMarkDone,
}: FollowUpCardProps): React.JSX.Element {
  const { colors, shadows } = useTheme();
  const [isDone, setIsDone] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const checkScale = useRef(new Animated.Value(1)).current;
  const styles = makeStyles(colors);

  const isOverdue = new Date(followup.due_at) < new Date() && !isDone;

  const handleMarkDone = useCallback(() => {
    if (isDone) return;
    setIsDone(true);
    // Spring bounce the checkmark icon first
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
    ]).start();
    // Then fade the whole card out
    Animated.timing(fadeAnim, {
      toValue: 0.3,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onMarkDone(followup.id);
    });
  }, [isDone, checkScale, fadeAnim, onMarkDone, followup.id]);

  const avatarBg = getAvatarBg(followup.customer_name);
  const initials = getInitials(followup.customer_name);

  return (
    <Animated.View style={[styles.card, shadows.sm, { opacity: fadeAnim }]}>
      {/* Header row: avatar + name + overdue badge */}
      <View style={styles.topRow}>
        <View style={[styles.avatar, { backgroundColor: avatarBg }]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.nameBlock}>
          <View style={styles.nameRow}>
            <Text
              style={[styles.customerName, isDone && styles.customerNameDone]}
              numberOfLines={1}
            >
              {followup.customer_name}
            </Text>
            {isOverdue && (
              <View style={styles.overdueBadge}>
                <Text style={styles.overdueBadgeText}>OVERDUE</Text>
              </View>
            )}
          </View>
          <ChannelBadge channel={followup.channel} showLabel={false} />
        </View>
      </View>

      {/* Due time */}
      <View style={styles.dueRow}>
        <Ionicons
          name="alarm-outline"
          size={iconSize.sm}
          color={isOverdue ? colors.warning : colors.textTertiary}
        />
        <Text style={[styles.dueTime, isOverdue && styles.dueTimeOverdue]}>
          {formatDueTime(followup.due_at)}
        </Text>
      </View>

      {/* Message preview */}
      <Text style={styles.messagePreview} numberOfLines={2}>
        {followup.message_preview}
      </Text>

      {/* Mark Done */}
      <View style={styles.bottomRow}>
        <Pressable
          onPress={handleMarkDone}
          disabled={isDone}
          accessibilityRole="button"
          accessibilityLabel={`Mark follow-up for ${followup.customer_name} as done`}
        >
          <Animated.View
            style={[
              styles.doneButton,
              isDone && styles.doneButtonDisabled,
              { transform: [{ scale: checkScale }] },
            ]}
          >
            <Ionicons
              name={isDone ? 'checkmark-circle' : 'checkmark-circle-outline'}
              size={iconSize.md}
              color={isDone ? colors.textTertiary : colors.primary}
            />
            <Text style={[styles.doneText, isDone && styles.doneTextDisabled]}>
              {isDone ? 'Done' : 'Mark Done'}
            </Text>
          </Animated.View>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const makeStyles = (colors: any) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginBottom: spacing.md,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      flexShrink: 0,
    },
    avatarText: {
      fontSize: fontSize.sm,
      fontFamily: fontFamily.bold,
      color: colors.white,
      letterSpacing: 0.5,
    },
    nameBlock: {
      flex: 1,
      gap: spacing.xs,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    customerName: {
      fontSize: fontSize.base,
      fontFamily: fontFamily.semibold,
      color: colors.textPrimary,
      flex: 1,
    },
    customerNameDone: {
      textDecorationLine: 'line-through',
      color: colors.textTertiary,
    },
    overdueBadge: {
      backgroundColor: 'rgba(245,158,11,0.15)',
      borderRadius: borderRadius.full,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderWidth: 1,
      borderColor: 'rgba(245,158,11,0.3)',
    },
    overdueBadgeText: {
      fontSize: 9,
      fontFamily: fontFamily.bold,
      color: colors.warning,
      letterSpacing: letterSpacing.badge,
    },
    dueRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginBottom: spacing.sm,
    },
    dueTime: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      fontFamily: fontFamily.semibold,
    },
    dueTimeOverdue: {
      color: colors.warning,
    },
    messagePreview: {
      fontSize: fontSize.sm,
      fontFamily: fontFamily.regular,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: spacing.md,
    },
    bottomRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
    },
    doneButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.md,
      backgroundColor: colors.primaryLight,
      borderWidth: 1,
      borderColor: 'rgba(99,102,241,0.2)',
      minHeight: 44,
      minWidth: 44,
    },
    doneButtonDisabled: {
      backgroundColor: colors.surfacePressed,
      borderColor: colors.borderSubtle,
    },
    doneText: {
      fontSize: fontSize.sm,
      fontFamily: fontFamily.semibold,
      color: colors.primary,
    },
    doneTextDisabled: {
      color: colors.textTertiary,
    },
  });
