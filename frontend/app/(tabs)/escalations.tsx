/**
 * Escalations screen — FlatList of active escalations, sorted high urgency first.
 *
 * Premium UI features:
 * - useMemo sort: high urgency escalations always appear at the top
 * - Section header showing count with danger badge
 * - LayoutAnimation for smooth card removal on resolve
 * - §8 empty-states: helpful EmptyState with shield icon when all resolved
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  LayoutAnimation,
  StyleSheet,
  Platform,
  UIManager,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { EscalationCard } from '../../components/cards/EscalationCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { useMockData, type Escalation } from '../../hooks/useMockData';
import {
  fontSize,
  fontFamily,
  letterSpacing,
  spacing,
  borderRadius,
  iconSize,
} from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/**
 * Escalations screen — high urgency first, smooth removal on resolve.
 */
export default function EscalationsScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { escalations, resolveEscalation } = useMockData();
  const styles = makeStyles(colors);

  /** Sort high urgency first — no data mutation, pure derived state. */
  const sortedEscalations = useMemo(
    () =>
      [...escalations].sort((a, b) => {
        if (a.urgency === 'high' && b.urgency !== 'high') return -1;
        if (a.urgency !== 'high' && b.urgency === 'high') return 1;
        return 0;
      }),
    [escalations]
  );

  const highCount = escalations.filter((e) => e.urgency === 'high').length;
  const medCount = escalations.filter((e) => e.urgency === 'medium').length;

  const handleResolve = (id: string) => {
    LayoutAnimation.configureNext(
      LayoutAnimation.create(
        300,
        LayoutAnimation.Types.easeOut,
        LayoutAnimation.Properties.opacity
      )
    );
    resolveEscalation(id);
  };

  const renderItem = ({ item }: { item: Escalation }) => (
    <EscalationCard escalation={item} onResolve={handleResolve} />
  );

  return (
    <View style={styles.container}>
      {/* Section header with counts */}
      {escalations.length > 0 && (
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderLeft}>
            <Ionicons name="warning" size={iconSize.sm} color={colors.danger} />
            <Text style={styles.sectionHeaderTitle}>Active Escalations</Text>
          </View>
          <View style={styles.countRow}>
            {highCount > 0 && (
              <View style={[styles.urgencyChip, styles.urgencyChipHigh]}>
                <Text style={styles.urgencyChipText}>{highCount} HIGH</Text>
              </View>
            )}
            {medCount > 0 && (
              <View style={[styles.urgencyChip, styles.urgencyChipMed]}>
                <Text style={[styles.urgencyChipText, styles.urgencyChipTextMed]}>
                  {medCount} MED
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      <FlatList
        data={sortedEscalations}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + spacing.lg },
          sortedEscalations.length === 0 && styles.emptyContainer,
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="shield-checkmark-outline"
            title="All clear!"
            subtitle="No active escalations. All issues have been resolved."
          />
        }
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
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    sectionHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    sectionHeaderTitle: {
      fontSize: fontSize.sm,
      fontFamily: fontFamily.semibold,
      color: colors.textPrimary,
    },
    countRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    urgencyChip: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      borderRadius: borderRadius.full,
    },
    urgencyChipHigh: {
      backgroundColor: 'rgba(239,68,68,0.15)',
      borderWidth: 1,
      borderColor: 'rgba(239,68,68,0.3)',
    },
    urgencyChipMed: {
      backgroundColor: 'rgba(245,158,11,0.12)',
      borderWidth: 1,
      borderColor: 'rgba(245,158,11,0.25)',
    },
    urgencyChipText: {
      fontSize: 10,
      fontFamily: fontFamily.bold,
      color: colors.danger,
      letterSpacing: letterSpacing.badge,
    },
    urgencyChipTextMed: {
      color: colors.warning,
    },
    listContent: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
    },
    emptyContainer: {
      flex: 1,
    },
  });
