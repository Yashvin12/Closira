/**
 * Root layout for the Closira app.
 *
 * Loads Inter fonts, wraps the app with ThemeProvider + AuthProvider,
 * and redirects to the appropriate initial route based on auth state.
 */

import React, { useEffect } from 'react';
import { View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

import { AppDataProvider } from '../context/AppDataContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { fontFamily, fontWeight, fontSize } from '../constants/theme';

/** Inner component so it can consume both ThemeContext and AuthContext. */
function RootLayoutNav(): React.JSX.Element {
  const { colors, isDark } = useTheme();
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      // No session — send to login
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      // Already logged in — send to dashboard
      router.replace('/(tabs)');
    }
  }, [user, isLoading, segments]);

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
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
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
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
    </>
  );
}

export default function RootLayout(): React.JSX.Element | null {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: '#0F172A' }} />;
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <AppDataProvider>
          <RootLayoutNav />
        </AppDataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
