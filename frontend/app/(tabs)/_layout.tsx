/**
 * Tab layout — bottom tab navigator with 4 screens.
 *
 * Premium tab bar features:
 * - Active tab: indigo pill indicator (20×3px) above the icon
 * - Active icon slightly larger (22) vs inactive (20)
 * - Dark surface tab bar with Slate 700 top border
 * - Inter_600SemiBold labels for crisp legibility
 * - §9 nav-state-active: indicator + colour + size all communicate active state
 */

import React from 'react';
import { View, StyleSheet, ColorValue } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, fontFamily } from '../../constants/theme';

/** Tab icon with pill indicator above when focused. */
function TabIcon({
  name,
  color,
  focused,
}: {
  name: keyof typeof Ionicons.glyphMap;
  color: ColorValue;
  focused: boolean;
}): React.JSX.Element {
  return (
    <View style={tabStyles.iconWrapper}>
      {focused && <View style={tabStyles.pillIndicator} />}
      <Ionicons name={name} size={focused ? 22 : 20} color={color} />
    </View>
  );
}

const tabStyles = StyleSheet.create({
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 6,
    width: 48,
    height: 40,
  },
  pillIndicator: {
    position: 'absolute',
    top: 0,
    width: 20,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
});

/**
 * Tab navigator layout with Dashboard, Leads, Escalations, and Follow-ups.
 */
export default function TabLayout(): React.JSX.Element {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerShadowVisible: false,
        headerTitleStyle: {
          fontFamily: fontFamily.semibold,
          fontSize: fontSize.lg,
          color: colors.textPrimary,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 88,
          paddingBottom: 28,
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          fontSize: fontSize.xs,
          fontFamily: fontFamily.semibold,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'grid' : 'grid-outline'} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="leads"
        options={{
          title: 'Leads',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'people' : 'people-outline'} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="escalations"
        options={{
          title: 'Escalations',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'warning' : 'warning-outline'} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="followups"
        options={{
          title: 'Follow-ups',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'time' : 'time-outline'} color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
