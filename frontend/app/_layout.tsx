/**
 * Root layout for the Closira app.
 *
 * Loads Inter fonts, wraps the app with ThemeProvider + AuthProvider,
 * and redirects to the appropriate initial route based on auth state.
 */

import React, { useEffect } from 'react';
import { View, useColorScheme } from 'react-native';
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

    const firstSegment = segments[0];
    const inAuthGroup = firstSegment === '(auth)';
    const onLandingPage = !firstSegment || firstSegment === 'index';
    const inProtectedRoute = !inAuthGroup && !onLandingPage;

    if (!user && inProtectedRoute) {
      // Not logged in + trying to access dashboard/conversation → send to landing
      router.replace('/');
    } else if (user && (inAuthGroup || onLandingPage)) {
      // Logged in + on landing page or auth screens → send to dashboard
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
        <Stack.Screen name="index" options={{ headerShown: false }} />
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
  const systemScheme = useColorScheme();
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded) {
    // Theme provider isn't mounted yet — use system scheme for splash bg
    const splashBg = systemScheme === 'light' ? '#FAFAFC' : '#0F172A';
    return <View style={{ flex: 1, backgroundColor: splashBg }} />;
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
