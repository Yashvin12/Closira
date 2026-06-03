/**
 * Auth group layout — stack navigator with no headers.
 */

import React from 'react';
import { Stack } from 'expo-router';

export default function AuthLayout(): React.JSX.Element {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}
