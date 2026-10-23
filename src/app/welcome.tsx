// FILE: app/welcome.tsx
// First run: which language you speak, which one the place you live speaks, and how much you know.
// Shown once per install; Account changes it later.
import { getLocales } from 'expo-localization';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { LanguagePicker } from '@/components/language-picker';
import { LevelChoice } from '@/components/level-choice';
import { Mark } from '@/components/mark';
import { type Level, languageForLocale } from '@/lib/languages';
import { usePrefs } from '@/state/prefs';
import { space, useTheme } from '@/theme/theme';

const device = languageForLocale(getLocales()[0]?.languageTag) ?? 'en';

export default function Welcome() {
  const { c, t } = useTheme();
  const { save } = usePrefs();
  const [native, setNative] = useState(device);
  const [target, setTarget] = useState(device === 'pt-PT' ? 'en' : 'pt-PT');
  const [level, setLevel] = useState<Level>('beginner');

  const pickNative = (code: string) => {
    setNative(code);
    if (code === target) setTarget(code === 'en' ? 'pt-PT' : 'en');
  };

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: c.background }}
      contentContainerStyle={styles.content}
    >
      <View style={styles.top}>
        <Mark size={64} />
        <Text style={t.display}>Learn the language of where you live.</Text>
        <Text style={t.muted}>
          Photograph a sign, a menu or a letter. Claude reads it, explains it, and picks the words worth keeping.
        </Text>
      </View>
      <View>
        <LanguagePicker label="I speak" value={native} onChange={pickNative} />
        <LanguagePicker label="I'm learning" value={target} onChange={setTarget} exclude={native} />
      </View>
      <View style={styles.section}>
        <Text style={t.label}>HOW MUCH YOU KNOW</Text>
        <LevelChoice value={level} onChange={setLevel} />
      </View>
      <Button label="Continue" onPress={() => save({ native, target, level })} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.xl, paddingTop: space.xxl * 2, gap: space.xl },
  top: { gap: space.md },
  section: { gap: space.xs },
});
