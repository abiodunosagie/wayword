// The first screen: the mark, the name and what Wayword is for, in light or dark mode by the
// phone's setting. The capture, card and practice screens replace it as they are built.
import { StatusBar } from 'expo-status-bar';
import { Image, StyleSheet, Text, useColorScheme, View } from 'react-native';

import { dark, light } from './src/theme/colors';

export default function App() {
  const colors = useColorScheme() === 'dark' ? dark : light;
  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Image
        source={
          colors === dark
            ? require('./assets/splash-icon-dark.png')
            : require('./assets/splash-icon.png')
        }
        style={styles.mark}
        accessibilityLabel="Wayword"
      />
      <Text style={[styles.name, { color: colors.ink }]}>wayword</Text>
      <Text style={[styles.line, { color: colors.muted }]}>
        Learn the language of the place you live, from the signs, menus and letters around you.
      </Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingBottom: 72,
  },
  mark: { width: 72, height: 72, marginLeft: -6, marginBottom: 20 },
  name: { fontSize: 44, fontWeight: '800', letterSpacing: -1.2 },
  line: { fontSize: 17, lineHeight: 25, marginTop: 10, maxWidth: 340 },
});
