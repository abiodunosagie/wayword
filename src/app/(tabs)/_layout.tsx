// FILE: app/(tabs)/_layout.tsx
// The five tabs, drawn by the platform itself: liquid glass on iOS 26, Material on Android.
import { NativeTabs } from 'expo-router/native-tabs';

import { tabIcon } from '@/components/icon';
import { useTheme } from '@/theme/theme';

const TABS = [
  { name: '(snap)', label: 'Snap', icon: tabIcon('camera') },
  { name: '(words)', label: 'Words', icon: tabIcon('words') },
  { name: '(practise)', label: 'Practise', icon: tabIcon('practise') },
  { name: '(talk)', label: 'Talk', icon: tabIcon('talk') },
  { name: '(week)', label: 'This week', icon: tabIcon('week') },
] as const;

export default function TabsLayout() {
  const { c } = useTheme();
  return (
    <NativeTabs tintColor={c.accent}>
      {TABS.map((tab) => (
        <NativeTabs.Trigger key={tab.name} name={tab.name}>
          <NativeTabs.Trigger.Icon sf={tab.icon.sf} md={tab.icon.md} />
          <NativeTabs.Trigger.Label>{tab.label}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      ))}
    </NativeTabs>
  );
}
