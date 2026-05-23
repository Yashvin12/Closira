/**
 * Root layout for the Closira app.
 *
 * Loads the Inter font family (400/600/700) via @expo-google-fonts/inter
 * before rendering the navigator, preventing FOUT.
 * Wraps everything with a SafeAreaProvider-compatible Stack.
 */

import React from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { colors, fontFamily, fontWeight, fontSize } from '../constants/theme';
import { MockDataProvider } from '../context/MockDataContext';

/**
 * Root layout component — loads fonts, provides nav stack and status bar.
 */
export default function RootLayout(): React.JSX.Element | null {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // Block render until fonts are ready to avoid FOUT
  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  return (
    <MockDataProvider>
      {/* Light icons on dark background */}
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.textPrimary,
          headerTitleStyle: {
            fontFamily: fontFamily.semibold,
            fontWeight: fontWeight.semibold,
            fontSize: fontSize.lg,
            color: colors.textPrimary,
          },
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="conversation/[id]"
          options={{
            headerTitle: 'Conversation',
            headerBackTitle: 'Back',
            presentation: 'card',
          }}
        />
      </Stack>
    </MockDataProvider>
  );
}
