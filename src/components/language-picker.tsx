// FILE: components/language-picker.tsx
// A row with a label and the platform's own menu picker for a language.
import { Host, Picker } from '@expo/ui';
import { StyleSheet, Text, View } from 'react-native';

import { LANGUAGES } from '@/lib/languages';
import { useTheme } from '@/theme/theme';

type Props = { label: string; value: string; onChange: (code: string) => void; exclude?: string };

export function LanguagePicker({ label, value, onChange, exclude }: Props) {
  const { c, t } = useTheme();
  return (
    <View style={[styles.row, { borderColor: c.line }]}>
      <Text style={[t.body, styles.label]}>{label}</Text>
      <Host matchContents>
        <Picker selectedValue={value} onValueChange={onChange} appearance="menu">
          {LANGUAGES.filter((l) => l.code !== exclude).map((l) => (
            <Picker.Item key={l.code} label={l.name} value={l.code} />
          ))}
        </Picker>
      </Host>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  label: { flexShrink: 1 },
});
