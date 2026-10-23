// FILE: components/icon.tsx
// Every icon in the app: an SF Symbol on iOS and the matching Material Symbol on Android, from
// one list, so a name never exists on one platform only.
import { SymbolView } from 'expo-symbols';
import type { ColorValue } from 'react-native';

const ICONS = {
  camera: { ios: 'camera.fill', android: 'photo_camera' },
  photo: { ios: 'photo.on.rectangle', android: 'image' },
  words: { ios: 'rectangle.stack.fill', android: 'style' },
  practise: { ios: 'checkmark.circle.fill', android: 'check_circle' },
  talk: { ios: 'bubble.left.and.bubble.right.fill', android: 'chat' },
  week: { ios: 'book.fill', android: 'menu_book' },
  account: { ios: 'person.crop.circle', android: 'person' },
  speak: { ios: 'speaker.wave.2.fill', android: 'volume_up' },
  send: { ios: 'arrow.up.circle.fill', android: 'send' },
  checked: { ios: 'checkmark.circle.fill', android: 'check_circle' },
  unchecked: { ios: 'circle', android: 'radio_button_unchecked' },
  chevron: { ios: 'chevron.right', android: 'chevron_right' },
  translate: { ios: 'character.bubble', android: 'translate' },
} as const;

export type IconName = keyof typeof ICONS;

export function Icon({ name, size = 22, color }: { name: IconName; size?: number; color: ColorValue }) {
  return <SymbolView name={ICONS[name]} size={size} tintColor={color} resizeMode="scaleAspectFit" />;
}

export const tabIcon = (name: IconName) => ({ sf: ICONS[name].ios, md: ICONS[name].android });
