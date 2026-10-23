// FILE: components/button.tsx
// The one button: full width, solid for the main action, outlined for the second, plain text for
// small ones. Shows a spinner instead of its label while busy and ignores taps meanwhile.
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { buttonHeight, minTap, rounded, space, useTheme } from '@/theme/theme';

type Props = {
  label: string;
  onPress: () => void;
  kind?: 'primary' | 'secondary' | 'quiet' | 'danger';
  busy?: boolean;
  disabled?: boolean;
};

export function Button({ label, onPress, kind = 'primary', busy = false, disabled = false }: Props) {
  const { c, t } = useTheme();
  const off = disabled || busy;
  const solid = kind === 'primary' || kind === 'danger';
  const fill = kind === 'primary' ? c.accent : kind === 'danger' ? c.danger : 'transparent';
  const ink = solid ? (kind === 'danger' ? c.background : c.onAccent) : kind === 'quiet' ? c.accent : c.ink;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: off, busy }}
      onPress={off ? undefined : onPress}
      style={({ pressed }) => [
        kind === 'quiet' ? styles.quiet : styles.button,
        { backgroundColor: fill, borderColor: kind === 'secondary' ? c.line : fill },
        { opacity: disabled ? 0.45 : pressed ? 0.8 : 1 },
      ]}
    >
      {busy ? <ActivityIndicator color={ink} accessibilityLabel={label} /> : <Text style={[t.button, { color: ink }]}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: buttonHeight,
    ...rounded,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    paddingHorizontal: space.lg,
  },
  quiet: { minHeight: minTap, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.sm },
});
