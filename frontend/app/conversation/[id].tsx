/**
 * Conversation Detail screen — opened from Leads or Escalations.
 *
 * Premium UI features:
 * - AI bubble: indigo (#6366F1) with white text — visually distinct from customer
 * - Customer bubble: Slate 700 (#334155) — readable on dark background
 * - Header: customer initial avatar + name + channel badge in a compact row
 * - SOP info box: indigo-tinted surface with accent border-left
 * - Escalation box: danger-tinted surface with red border-left
 * - Timeline: coloured icon dots on a Slate border vertical line
 * - Message timestamps paired with clock icons
 *
 * §6 text-contrast-dark: AI bubble white text on indigo ≥4.5:1
 * §4 state-clarity: AI vs customer bubbles clearly differentiated by colour + alignment
 */

import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChannelBadge } from '../../components/ui/ChannelBadge';
import { StatusPill } from '../../components/ui/StatusPill';
import { useMockData, type Message, type TimelineEvent } from '../../hooks/useMockData';
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

function formatMessageTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatTimelineTime(timestamp: string): string {
  return new Date(timestamp).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function getEventDisplay(
  eventType: string
): { label: string; icon: keyof typeof Ionicons.glyphMap; color: string } {
  const map: Record<string, { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = {
    created: { label: 'Created', icon: 'add-circle', color: colors.primary },
    sop_matched: { label: 'SOP Matched', icon: 'checkmark-circle', color: colors.success },
    qualified: { label: 'Qualified', icon: 'star', color: colors.success },
    escalated: { label: 'Escalated', icon: 'warning', color: colors.danger },
    followup_scheduled: { label: 'Follow-up Scheduled', icon: 'time', color: colors.warning },
    followup_sent: { label: 'Follow-up Sent', icon: 'send', color: colors.secondary },
    resolved: { label: 'Resolved', icon: 'checkmark-done-circle', color: colors.textSecondary },
  };
  return map[eventType] || { label: eventType, icon: 'ellipse', color: colors.textTertiary };
}

function getInitials(name: string): string {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

function getAvatarBg(name: string): string {
  const palette = ['#6366F1', '#8B5CF6', '#EC4899', '#14B8A6', '#F59E0B', '#22C55E', '#3B82F6'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
  }
  return palette[Math.abs(hash) % palette.length];
}

/**
 * Conversation detail screen component.
 */
export default function ConversationDetailScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { getEnquiryById } = useMockData();

  const enquiry = getEnquiryById(id || '');

  if (!enquiry) {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorIconRing}>
          <Ionicons name="alert-circle" size={iconSize['2xl']} color={colors.danger} />
        </View>
        <Text style={styles.errorTitle}>Enquiry not found</Text>
        <Text style={styles.errorSubtitle}>The record may have been removed.</Text>
      </View>
    );
  }

  const avatarBg = getAvatarBg(enquiry.customer_name);
  const initials = getInitials(enquiry.customer_name);

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: () => (
            <View style={styles.headerTitle}>
              <View style={[styles.headerAvatar, { backgroundColor: avatarBg }]}>
                <Text style={styles.headerAvatarText}>{initials}</Text>
              </View>
              <View style={styles.headerTitleContent}>
                <Text style={styles.headerName} numberOfLines={1}>
                  {enquiry.customer_name}
                </Text>
                <ChannelBadge channel={enquiry.channel} size="sm" />
              </View>
            </View>
          ),
        }}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing['2xl'] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Status pill */}
        <View style={styles.statusRow}>
          <StatusPill status={enquiry.status} />
          <Text style={styles.enquiryId}>{enquiry.id}</Text>
        </View>

        {/* ─── Conversation Thread ─────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionLabelRow}>
            <Text style={styles.sectionLabel}>CONVERSATION</Text>
            <View style={styles.sectionDivider} />
          </View>
          <View style={styles.messageThread}>
            {enquiry.messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
          </View>
        </View>

        {/* ─── SOP + AI Summary ────────────────────────────────── */}
        {enquiry.sop_matched && (
          <View style={styles.section}>
            <View style={styles.sectionLabelRow}>
              <Text style={styles.sectionLabel}>AI INSIGHTS</Text>
              <View style={styles.sectionDivider} />
            </View>
            <View style={styles.infoBox}>
              <View style={styles.infoBoxHeader}>
                <View style={[styles.infoIconRing, { backgroundColor: colors.primaryLight }]}>
                  <Ionicons name="document-text" size={14} color={colors.primary} />
                </View>
                <Text style={styles.infoBoxLabel}>SOP Matched</Text>
              </View>
              <Text style={styles.infoBoxValue}>{enquiry.sop_matched}</Text>
            </View>

            {enquiry.suggested_response && (
              <View style={[styles.infoBox, styles.infoBoxAI]}>
                <View style={styles.infoBoxHeader}>
                  <View style={[styles.infoIconRing, { backgroundColor: colors.secondaryLight }]}>
                    <Ionicons name="sparkles" size={14} color={colors.secondary} />
                  </View>
                  <Text style={styles.infoBoxLabel}>AI Suggested Response</Text>
                </View>
                <Text style={styles.infoBoxValue}>{enquiry.suggested_response}</Text>
              </View>
            )}
          </View>
        )}

        {/* ─── Escalation Reason ───────────────────────────────── */}
        {enquiry.escalation_reason && (
          <View style={styles.section}>
            <View style={styles.infoBox}>
              <View style={[styles.infoBoxBorder, { borderLeftColor: colors.danger }]}>
                <View style={styles.infoBoxHeader}>
                  <View style={[styles.infoIconRing, { backgroundColor: colors.dangerLight }]}>
                    <Ionicons name="warning" size={14} color={colors.danger} />
                  </View>
                  <Text style={[styles.infoBoxLabel, { color: colors.danger }]}>
                    Escalation Reason
                  </Text>
                </View>
                <Text style={styles.infoBoxValue}>{enquiry.escalation_reason}</Text>
              </View>
            </View>
          </View>
        )}

        {/* ─── Status Timeline ─────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionLabelRow}>
            <Text style={styles.sectionLabel}>STATUS TIMELINE</Text>
            <View style={styles.sectionDivider} />
          </View>
          <View style={styles.timeline}>
            {enquiry.timeline.map((event, index) => (
              <TimelineItem
                key={`${event.event_type}-${index}`}
                event={event}
                isLast={index === enquiry.timeline.length - 1}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </>
  );
}

/** Message bubble component. */
function MessageBubble({ message }: { message: Message }): React.JSX.Element {
  const isCustomer = message.sender === 'customer';

  return (
    <View style={[styles.bubbleWrapper, isCustomer ? styles.bubbleLeft : styles.bubbleRight]}>
      <View style={[styles.bubble, isCustomer ? styles.bubbleCustomer : styles.bubbleAI]}>
        <Text style={[styles.bubbleText, isCustomer ? styles.bubbleTextCustomer : styles.bubbleTextAI]}>
          {message.text}
        </Text>
      </View>
      <View style={[styles.bubbleTimeRow, isCustomer ? styles.timeRowLeft : styles.timeRowRight]}>
        <Text style={styles.senderLabel}>{isCustomer ? 'Customer' : 'AI'}</Text>
        <Ionicons name="time-outline" size={10} color={colors.textTertiary} />
        <Text style={styles.bubbleTime}>{formatMessageTime(message.timestamp)}</Text>
      </View>
    </View>
  );
}

/** Timeline item component. */
function TimelineItem({
  event,
  isLast,
}: {
  event: TimelineEvent;
  isLast: boolean;
}): React.JSX.Element {
  const display = getEventDisplay(event.event_type);

  return (
    <View style={styles.timelineItem}>
      <View style={styles.timelineDotColumn}>
        <View style={[styles.timelineDot, { backgroundColor: display.color }]}>
          <Ionicons name={display.icon} size={12} color={colors.white} />
        </View>
        {!isLast && <View style={styles.timelineLine} />}
      </View>
      <View style={styles.timelineContent}>
        <Text style={styles.timelineLabel}>{display.label}</Text>
        <Text style={styles.timelineDetail}>{event.detail}</Text>
        <View style={styles.timelineTimeRow}>
          <Ionicons name="time-outline" size={10} color={colors.textTertiary} />
          <Text style={styles.timelineTime}>{formatTimelineTime(event.created_at)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },

  // ─── Error ────────────────────────────────────────────────────
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    gap: spacing.md,
    padding: spacing['3xl'],
  },
  errorIconRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.dangerLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  errorTitle: {
    fontSize: fontSize.lg,
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
  },
  errorSubtitle: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
  },

  // ─── Header ───────────────────────────────────────────────────
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatarText: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.bold,
    color: colors.white,
    letterSpacing: 0.5,
  },
  headerTitleContent: {
    gap: 3,
  },
  headerName: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.semibold,
    color: colors.textPrimary,
    maxWidth: 180,
  },

  // ─── Status Row ───────────────────────────────────────────────
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing['2xl'],
  },
  enquiryId: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.semibold,
    color: colors.textTertiary,
    letterSpacing: letterSpacing.label,
  },

  // ─── Section ──────────────────────────────────────────────────
  section: {
    marginBottom: spacing['2xl'],
  },
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  sectionLabel: {
    fontSize: 10,
    fontFamily: fontFamily.bold,
    color: colors.textTertiary,
    letterSpacing: letterSpacing.badge,
    flexShrink: 0,
  },
  sectionDivider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },

  // ─── Messages ─────────────────────────────────────────────────
  messageThread: {
    gap: spacing.md,
  },
  bubbleWrapper: {
    maxWidth: '82%',
    gap: 4,
  },
  bubbleLeft: {
    alignSelf: 'flex-start',
  },
  bubbleRight: {
    alignSelf: 'flex-end',
  },
  bubble: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  bubbleCustomer: {
    backgroundColor: '#334155',
    borderBottomLeftRadius: 4,
  },
  bubbleAI: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleText: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    lineHeight: 20,
  },
  bubbleTextCustomer: {
    color: colors.textPrimary,
  },
  bubbleTextAI: {
    color: colors.white,
  },
  bubbleTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  timeRowLeft: {
    justifyContent: 'flex-start',
  },
  timeRowRight: {
    justifyContent: 'flex-end',
  },
  senderLabel: {
    fontSize: fontSize.xs - 1,
    fontFamily: fontFamily.semibold,
    color: colors.textTertiary,
    marginRight: 2,
  },
  bubbleTime: {
    fontSize: fontSize.xs - 1,
    color: colors.textTertiary,
    fontFamily: fontFamily.semibold,
  },

  // ─── Info Boxes ───────────────────────────────────────────────
  infoBox: {
    backgroundColor: colors.surfaceL2,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  infoBoxAI: {
    borderColor: 'rgba(139,92,246,0.2)',
  },
  infoBoxBorder: {
    borderLeftWidth: 3,
    borderRadius: borderRadius.md,
  },
  infoBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  infoIconRing: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoBoxLabel: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.semibold,
    color: colors.textPrimary,
  },
  infoBoxValue: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  // ─── Timeline ─────────────────────────────────────────────────
  timeline: {
    paddingLeft: spacing.xs,
  },
  timelineItem: {
    flexDirection: 'row',
    minHeight: 56,
  },
  timelineDotColumn: {
    alignItems: 'center',
    width: 32,
    marginRight: spacing.md,
  },
  timelineDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.border,
    marginVertical: 3,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: spacing.lg,
  },
  timelineLabel: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.semibold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  timelineDetail: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.xs,
  },
  timelineTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  timelineTime: {
    fontSize: fontSize.xs - 1,
    color: colors.textTertiary,
    fontFamily: fontFamily.semibold,
  },
});
