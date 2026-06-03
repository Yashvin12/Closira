/**
 * Tab layout — bottom tab navigator with 4 screens.
 *
 * Features:
 * - Active tab: indigo pill indicator above icon
 * - Sun/moon toggle in the header right for theme switching
 * - Colors driven by ThemeContext so light/dark both work
 */

import React from 'react';
import { View, StyleSheet, ColorValue, Pressable } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { fontSize, fontFamily } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';

function TabIcon({
  name,
  color,
  focused,
}: {
  name: keyof typeof Ionicons.glyphMap;
  color: ColorValue;
  focused: boolean;
}): React.JSX.Element {
  const { colors } = useTheme();
  return (
    <View style={tabStyles.iconWrapper}>
      {focused && <View style={[tabStyles.pillIndicator, { backgroundColor: colors.primary }]} />}
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
  },
});

export default function TabLayout(): React.JSX.Element {
  const { colors, toggleTheme, isDark } = useTheme();

  /** Header right — sun/moon toggle */
  const ThemeToggle = () => (
    <Pressable onPress={toggleTheme} style={{ marginRight: 16, padding: 4 }}>
      <Ionicons
        name={isDark ? 'sunny-outline' : 'moon-outline'}
        size={22}
        color={colors.textPrimary}
      />
    </Pressable>
  );

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
        headerRight: () => <ThemeToggle />,
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
