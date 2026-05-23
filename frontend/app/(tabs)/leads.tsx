/**
 * Leads screen — FlatList of all enquiries with filter pills.
 *
 * Premium UI features:
 * - Filter pills show live item counts: All (8), New (1), Escalated (2)
 * - Active pill: indigo bg + white text + scale indicator
 * - Filter bar has a bottom border for visual separation
 * - §9 tab-badge: counts communicate actionable pending items
 * - §8 empty-states: helpful EmptyState with icon when list is empty
 */

import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LeadCard } from '../../components/cards/LeadCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { useMockData, type Enquiry } from '../../hooks/useMockData';
import {
  colors,
  fontSize,
  fontFamily,
  letterSpacing,
  spacing,
  borderRadius,
} from '../../constants/theme';

type FilterType = 'all' | 'new' | 'escalated';

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'new', label: 'New' },
  { key: 'escalated', label: 'Escalated' },
];

/**
 * Leads screen with count-bearing filter pills and styled list.
 */
export default function LeadsScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const { enquiries } = useMockData();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const counts = useMemo(
    () => ({
      all: enquiries.length,
      new: enquiries.filter((e) => e.status === 'new').length,
      escalated: enquiries.filter((e) => e.status === 'escalated').length,
    }),
    [enquiries]
  );

  const filteredEnquiries = useMemo(() => {
    if (activeFilter === 'all') return enquiries;
    return enquiries.filter((e) => e.status === activeFilter);
  }, [enquiries, activeFilter]);

  const renderItem = ({ item }: { item: Enquiry }) => <LeadCard enquiry={item} />;

  return (
    <View style={styles.container}>
      {/* Filter Bar */}
      <View style={styles.filterBar}>
        {FILTERS.map((filter) => {
          const isActive = activeFilter === filter.key;
          const count = counts[filter.key];
          return (
            <Pressable
              key={filter.key}
              onPress={() => setActiveFilter(filter.key)}
              style={[styles.filterPill, isActive && styles.filterPillActive]}
              accessibilityRole="button"
              accessibilityLabel={`Filter by ${filter.label}, ${count} items`}
              accessibilityState={{ selected: isActive }}
            >
              <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                {filter.label}
              </Text>
              <View style={[styles.countBadge, isActive && styles.countBadgeActive]}>
                <Text style={[styles.countText, isActive && styles.countTextActive]}>
                  {count}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Results count */}
      <View style={styles.resultsRow}>
        <Text style={styles.resultsText}>
          {filteredEnquiries.length} {filteredEnquiries.length === 1 ? 'enquiry' : 'enquiries'}
        </Text>
      </View>

      {/* Lead List */}
      <FlatList
        data={filteredEnquiries}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + spacing.lg },
          filteredEnquiries.length === 0 && styles.emptyContainer,
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title="No leads found"
            subtitle={`No ${activeFilter === 'all' ? '' : activeFilter + ' '}leads to display right now.`}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 36,
  },
  filterPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterPillText: {
    fontSize: fontSize.sm,
    fontFamily: fontFamily.semibold,
    color: colors.textSecondary,
  },
  filterPillTextActive: {
    color: colors.white,
  },
  countBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: borderRadius.full,
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 20,
    alignItems: 'center',
  },
  countBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  countText: {
    fontSize: 10,
    fontFamily: fontFamily.bold,
    color: colors.textSecondary,
    letterSpacing: letterSpacing.tight,
  },
  countTextActive: {
    color: colors.white,
  },
  resultsRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  resultsText: {
    fontSize: fontSize.xs,
    fontFamily: fontFamily.semibold,
    color: colors.textTertiary,
    letterSpacing: letterSpacing.label,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  emptyContainer: {
    flex: 1,
  },
});
