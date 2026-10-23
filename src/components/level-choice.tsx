// FILE: components/level-choice.tsx
// The three levels as a short list you tick one of.
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { LEVELS, type Level } from '@/lib/languages';
import { useTheme } from '@/theme/theme';

import { Icon } from './icon';

export function LevelChoice({ value, onChange }: { value: Level; onChange: (level: Level) => void }) {
  const { c, t } = useTheme();
  return (
    <View accessibilityRole="radiogroup">
      {LEVELS.map((level) => {
        const on = level.id === value;
        return (
          <Pressable
            key={level.id}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(level.id)}
            style={({ pressed }) => [styles.row, { borderColor: c.line, opacity: pressed ? 0.7 : 1 }]}
          >
            <View style={styles.text}>
              <Text style={t.heading}>{level.name}</Text>
              <Text style={t.small}>{level.hint}</Text>
            </View>
            <Icon name={on ? 'checked' : 'unchecked'} color={on ? c.accent : c.muted} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 64,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  text: { flex: 1, gap: 2 },
});
