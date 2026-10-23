// FILE: app/_layout.tsx
// The root: fonts, the phone's database, the language pair and the session, then one native stack
// whose screens are guarded. First run shows the welcome screen, then sign-in, then the app, and
// each step moves on by itself when the state behind it changes.
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { ThemeProvider } from 'expo-router/react-navigation';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { DATABASE_NAME, migrate } from '@/db/schema';
import { PrefsProvider, usePrefs } from '@/state/prefs';
import { SessionProvider, useSession } from '@/state/session';
import { navigationTheme } from '@/theme/navigation';
import { useTheme } from '@/theme/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  // Builds embed these through the expo-font plugin; Expo Go needs them loaded at runtime.
  const [fontsLoaded, fontError] = useFonts({
    'SchibstedGrotesk-ExtraBold': require('../../assets/fonts/SchibstedGrotesk-ExtraBold.ttf'),
    'SchibstedGrotesk-SemiBold': require('../../assets/fonts/SchibstedGrotesk-SemiBold.ttf'),
  });
  if (!fontsLoaded && !fontError) return null;
  return (
    <SQLiteProvider databaseName={DATABASE_NAME} onInit={migrate}>
      <PrefsProvider>
        <SessionProvider>
          <Navigator />
        </SessionProvider>
      </PrefsProvider>
    </SQLiteProvider>
  );
}

function Navigator() {
  const { c, dark } = useTheme();
  const { prefs } = usePrefs();
  const { loading, account } = useSession();

  useEffect(() => {
    if (!loading) SplashScreen.hideAsync().catch(() => {});
  }, [loading]);
  if (loading) return null;

  const ready = prefs !== null;
  const signedIn = account !== null;
  return (
    <ThemeProvider value={navigationTheme(c, dark)}>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal', headerShadowVisible: false }}>
        <Stack.Protected guard={!ready}>
          <Stack.Screen name="welcome" options={{ headerShown: false }} />
        </Stack.Protected>
        <Stack.Protected guard={ready && !signedIn}>
          <Stack.Screen name="sign-in" options={{ headerShown: false }} />
        </Stack.Protected>
        <Stack.Protected guard={ready && signedIn}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="snap/[id]" options={{ title: '' }} />
          <Stack.Screen name="word/[id]" options={{ title: '' }} />
          <Stack.Screen name="talk/[id]" options={{ title: '' }} />
          <Stack.Screen name="story/[id]" options={{ title: '' }} />
          <Stack.Screen
            name="account"
            options={{ presentation: 'formSheet', title: 'Account', sheetGrabberVisible: true, sheetAllowedDetents: [0.75, 1] }}
          />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
  );
}
