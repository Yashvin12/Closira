/**
 * Dashboard screen — main overview with stats and recent activity.
 *
 * Premium UI features:
 * - Header: date-aware greeting, branded avatar initial, subtle surface elevation
 * - Stats: 2×2 grid with colour-coded StatCards (left accent bar)
 * - Quick actions: full-card design with icon ring, label, count, chevron
 * - Recent activity: initials avatar, channel badge, status pill per item
 * - §5 visual-hierarchy: size + spacing hierarchy throughout
 * - §9 persistent-nav: header contextualises which app section the user is in
 */

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatCard } from '../../components/cards/StatCard';
import { ChannelBadge } from '../../components/ui/ChannelBadge';
import { StatusPill } from '../../components/ui/StatusPill';
import { NewEnquiryModal } from '../../components/ui/NewEnquiryModal';
import { useMockData, type Enquiry } from '../../hooks/useMockData';
import {
  colors,
  fontSize,
  fontFamily,
  spacing,
  borderRadius,
  shadows,
  iconSize,
  letterSpacing,
} from '../../constants/theme';
import { getInitials, getAvatarBg, formatRelativeTime, getFormattedDate, getGreeting } from '../../utils/formatters';




/**
 * Dashboard screen component.
 */
export default function DashboardScreen(): React.JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const data = useMockData();
  const { enquiries, escalations, followups } = data;
  const isLive = (data as any).isLive ?? false;
  const [modalVisible, setModalVisible] = useState(false);

  const recentEnquiries = useMemo(() => enquiries.slice(0, 5), [enquiries]);
  const todayLeads = enquiries.length;
  const missedEnquiries = enquiries.filter((e) => e.status === 'new').length;
  const openEscalations = escalations.length;
  const followUpsDue = followups.length;

  const renderRecentItem = ({ item }: { item: Enquiry }) => {
    const avatarBg = getAvatarBg(item.customer_name);
    const initials = getInitials(item.customer_name);
    return (
      <Pressable
        onPress={() => router.push(`/conversation/${item.id}`)}
        style={({ pressed }) => [styles.recentItem, pressed && styles.recentItemPressed]}
        accessibilityRole="button"
        accessibilityLabel={`View enquiry from ${item.customer_name}`}
      >
        {/* Avatar */}
        <View style={[styles.recentAvatar, { backgroundColor: avatarBg }]}>
          <Text style={styles.recentAvatarText}>{initials}</Text>
        </View>

        {/* Content */}
        <View style={styles.recentItemContent}>
          <Text style={styles.recentItemName} numberOfLines={1}>
            {item.customer_name}
          </Text>
          <Text style={styles.recentItemMessage} numberOfLines={1}>
            {item.message}
          </Text>
        </View>

        {/* Right */}
        <View style={styles.recentItemRight}>
          <View style={styles.recentTimeRow}>
            <Ionicons name="time-outline" size={10} color={colors.textTertiary} />
            <Text style={styles.recentItemTime}>{formatRelativeTime(item.created_at)}</Text>
          </View>
          <StatusPill status={item.status} />
        </View>
      </Pressable>
    );
  };

  return (
  <>
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.lg }]}
      showsVerticalScrollIndicator={false}
    >
      {/* ─── Header ──────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerDate}>{getFormattedDate()}</Text>
          <Text style={styles.headerGreeting}>{getGreeting()}</Text>
          <Text style={styles.headerTitle}>Home</Text>
        </View>
        {/* Avatar initial */}
        <View style={styles.headerAvatar}>
          <Text style={styles.headerAvatarText}>C</Text>
        </View>
      </View>

      {/* ─── Stats Grid ──────────────────────────────────────────── */}
      <View style={styles.sectionLabel}>
        <Text style={styles.sectionLabelText}>TODAY'S OVERVIEW</Text>
        <View style={styles.sectionLine} />
      </View>
      <View style={styles.statsGrid}>
        <View style={styles.statsRow}>
          <StatCard
            icon="people"
            iconBg={colors.primaryLight}
            iconColor={colors.primary}
            value={todayLeads}
            label="Total Leads"
          />
          <StatCard
            icon="alert-circle"
            iconBg={colors.dangerLight}
            iconColor={colors.danger}
            value={missedEnquiries}
            label="Unhandled"
          />
        </View>
        <View style={styles.statsRow}>
          <StatCard
            icon="warning"
            iconBg={colors.warningLight}
            iconColor={colors.warning}
            value={openEscalations}
            label="Escalations"
          />
          <StatCard
            icon="time"
            iconBg={colors.secondaryLight}
            iconColor={colors.secondary}
            value={followUpsDue}
            label="Follow-ups Due"
          />
        </View>
      </View>

      {/* ─── Quick Actions ───────────────────────────────────────── */}
      <View style={styles.sectionLabel}>
        <Text style={styles.sectionLabelText}>QUICK ACTIONS</Text>
        <View style={styles.sectionLine} />
      </View>
      <View style={styles.quickActions}>
        {/* Escalations card */}
        <Pressable
          onPress={() => router.push('/(tabs)/escalations')}
          style={({ pressed }) => [styles.quickCard, pressed && styles.quickCardPressed]}
          accessibilityRole="button"
          accessibilityLabel="View escalations"
        >
          <View style={[styles.quickIconRing, { backgroundColor: colors.dangerLight }]}>
            <Ionicons name="warning" size={iconSize.md} color={colors.danger} />
          </View>
          <View style={styles.quickContent}>
            <Text style={styles.quickTitle}>Escalations</Text>
            <Text style={[styles.quickCount, { color: colors.danger }]}>
              {openEscalations} active
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
        </Pressable>

        {/* Follow-ups card */}
        <Pressable
          onPress={() => router.push('/(tabs)/followups')}
          style={({ pressed }) => [styles.quickCard, pressed && styles.quickCardPressed]}
          accessibilityRole="button"
          accessibilityLabel="View follow-ups"
        >
          <View style={[styles.quickIconRing, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="time" size={iconSize.md} color={colors.primary} />
          </View>
          <View style={styles.quickContent}>
            <Text style={styles.quickTitle}>Follow-ups</Text>
            <Text style={[styles.quickCount, { color: colors.primary }]}>
              {followUpsDue} pending
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
        </Pressable>
      </View>

      {/* ─── Recent Activity ─────────────────────────────────────── */}
      <View style={styles.sectionLabel}>
        <Text style={styles.sectionLabelText}>RECENT ACTIVITY</Text>
        <View style={styles.sectionLine} />
      </View>
      <View style={styles.recentCard}>
        <FlatList
          data={recentEnquiries}
          renderItem={renderRecentItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      </View>
    </ScrollView>

    {/* ─── FAB ─────────────────────────────────────────────────── */}
    <Pressable
      onPress={() => setModalVisible(true)}
      style={[styles.fab, { bottom: insets.bottom + spacing.lg + 64 }]}
      accessibilityRole="button"
      accessibilityLabel="Add new enquiry"
    >
      <Ionicons name="add" size={iconSize.lg} color={colors.white} />
    </Pressable>

    {/* ─── Live / Demo Badge ─────────────────────────────────── */}
    <View style={[styles.liveBadge, { bottom: insets.bottom + spacing.lg + 64 + 64 }]}>
      <View style={[styles.liveDot, { backgroundColor: isLive ? colors.success : colors.textTertiary }]} />
      <Text style={styles.liveBadgeText}>{isLive ? 'LIVE' : 'DEMO'}</Text>
    </View>

    <NewEnquiryModal
      visible={modalVisible}
      onClose={() => setModalVisible(false)}
    />
  </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },

  // ─── Header ───────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing['2xl'],
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    gap: spacing.xs,
  },
  headerDate: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.semibold,
    color: colors.primary,
    letterSpacing: letterSpacing.label,
  },
  headerGreeting: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
  },
  headerTitle: {
    fontSize: fontSize['2xl'],
    fontFamily: fontFamily.bold,
    color: colors.textPrimary,
    letterSpacing: letterSpacing.tight,
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(99,102,241,0.3)',
  },
  headerAvatarText: {
    fontSize: fontSize.base,
    fontFamily: fontFamily.bold,
    color: colors.white,
    letterSpacing: 0.5,
  },

  // ─── Section Labels ───────────────────────────────────────────
  sectionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  sectionLabelText: {
    fontSize: 10,
    fontFamily: fontFamily.bold,
    color: colors.textTertiary,
    letterSpacing: letterSpacing.badge,
    flexShrink: 0,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },

  // ─── Stats Grid ───────────────────────────────────────────────
  statsGrid: {
    gap: spacing.md,
    marginBottom: spacing['2xl'],
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },

  // ─── Quick Actions ────────────────────────────────────────────
  quickActions: {
    gap: spacing.md,
    marginBottom: spacing['2xl'],
  },
  quickCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    minHeight: 64,
    ...shadows.sm,
  },
  quickCardPressed: {
    opacity: 0.75,
  },
  quickIconRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickContent: {
    flex: 1,
    gap: 2,
  },
  quickTitle: {
    fontSize: fontSize.base,
    fontFamily: fontFamily.semibold,
    color: colors.textPrimary,
  },
  quickCount: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.regular,
  },

  // ─── Recent Activity ──────────────────────────────────────────
  recentCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    ...shadows.sm,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  recentItemPressed: {
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  recentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  recentAvatarText: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.bold,
    color: colors.white,
    letterSpacing: 0.5,
  },
  recentItemContent: {
    flex: 1,
    gap: 2,
  },
  recentItemName: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.semibold,
    color: colors.textPrimary,
  },
  recentItemMessage: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
  },
  recentItemRight: {
    alignItems: 'flex-end',
    gap: spacing.xs,
    flexShrink: 0,
  },
  recentTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  recentItemTime: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    fontFamily: fontFamily.semibold,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },

  // ─── FAB ──────────────────────────────────────────────────────
  fab: {
    position: 'absolute',
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
    borderWidth: 2,
    borderColor: 'rgba(99,102,241,0.4)',
  },

  // ─── Live Badge ───────────────────────────────────────────────
  liveBadge: {
    position: 'absolute',
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveBadgeText: {
    fontSize: 9,
    fontFamily: fontFamily.bold,
    color: colors.textTertiary,
    letterSpacing: 0.8,
  },
});
