// FILE: components/tab-stack.tsx
// The native stack inside each tab: a large title that shrinks as you scroll, and the account
// button on the right.
import { router, Stack } from 'expo-router';
import { Pressable } from 'react-native';

import { useTheme } from '@/theme/theme';

import { Icon } from './icon';

function AccountButton() {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Account"
      hitSlop={12}
      onPress={() => router.push('/account')}
    >
      <Icon name="account" size={26} color={c.accent} />
    </Pressable>
  );
}

export function TabStack({ screen, title }: { screen: string; title: string }) {
  const { c } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerLargeTitleEnabled: true,
        headerShadowVisible: false,
        headerLargeTitleShadowVisible: false,
        headerStyle: { backgroundColor: c.background },
        headerLargeTitleStyle: { fontFamily: 'SchibstedGrotesk-ExtraBold' },
        headerTitleStyle: { fontFamily: 'SchibstedGrotesk-SemiBold' },
        headerRight: () => <AccountButton />,
      }}
    >
      <Stack.Screen name={screen} options={{ title }} />
    </Stack>
  );
}
