/**
 * Follow-ups screen — grouped by overdue vs upcoming.
 *
 * Premium UI features:
 * - Overdue follow-ups separated from upcoming with amber section header
 * - Upcoming section header in green
 * - Smooth card removal via FollowUpCard's own fade animation
 * - §8 empty-states: celebration empty state when all done
 * - §5 content-priority: overdue items shown first (urgency ordering)
 */

import React, { useMemo } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FollowUpCard } from '../../components/cards/FollowUpCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { useMockData, type FollowUp } from '../../hooks/useMockData';
import {
  fontSize,
  fontFamily,
  letterSpacing,
  spacing,
  borderRadius,
  iconSize,
} from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

type SectionItem =
  | { type: 'header'; id: string; label: string; count: number; color: string; icon: string }
  | { type: 'item'; id: string; data: FollowUp };

/**
 * Follow-ups screen grouped into overdue and upcoming sections.
 */
export default function FollowUpsScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { followups, markFollowUpDone } = useMockData();
  const styles = makeStyles(colors);

  const { overdue, upcoming } = useMemo(() => {
    const now = new Date();
    return {
      overdue: followups.filter((f) => new Date(f.due_at) < now),
      upcoming: followups.filter((f) => new Date(f.due_at) >= now),
    };
  }, [followups]);

  /** Build a flat list with section headers interleaved. */
  const listData = useMemo<SectionItem[]>(() => {
    const items: SectionItem[] = [];
    if (overdue.length > 0) {
      items.push({
        type: 'header',
        id: 'header-overdue',
        label: 'OVERDUE',
        count: overdue.length,
        color: colors.warning,
        icon: 'alarm',
      });
      overdue.forEach((f) => items.push({ type: 'item', id: f.id, data: f }));
    }
    if (upcoming.length > 0) {
      items.push({
        type: 'header',
        id: 'header-upcoming',
        label: 'UPCOMING',
        count: upcoming.length,
        color: colors.success,
        icon: 'checkmark-circle-outline',
      });
      upcoming.forEach((f) => items.push({ type: 'item', id: f.id, data: f }));
    }
    return items;
  }, [overdue, upcoming, colors]);

  const renderItem = ({ item }: { item: SectionItem }) => {
    if (item.type === 'header') {
      return (
        <View style={styles.sectionHeader}>
          <Ionicons
            name={item.icon as keyof typeof Ionicons.glyphMap}
            size={iconSize.sm}
            color={item.color}
          />
          <Text style={[styles.sectionHeaderText, { color: item.color }]}>
            {item.label}
          </Text>
          <View style={[styles.sectionCount, { backgroundColor: item.color + '20' }]}>
            <Text style={[styles.sectionCountText, { color: item.color }]}>{item.count}</Text>
          </View>
          <View style={styles.sectionLine} />
        </View>
      );
    }
    return <FollowUpCard followup={item.data} onMarkDone={markFollowUpDone} />;
  };

  if (followups.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="checkmark-done-circle-outline"
          title="All caught up!"
          subtitle="No pending follow-ups. Great work — check back later."
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={listData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + spacing.lg },
        ]}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const makeStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    listContent: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.md,
      marginTop: spacing.sm,
    },
    sectionHeaderText: {
      fontSize: 10,
      fontFamily: fontFamily.bold,
      letterSpacing: letterSpacing.badge,
    },
    sectionCount: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: borderRadius.full,
      minWidth: 20,
      alignItems: 'center',
    },
    sectionCountText: {
      fontSize: 10,
      fontFamily: fontFamily.bold,
      letterSpacing: letterSpacing.tight,
    },
    sectionLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.border,
    },
  });
