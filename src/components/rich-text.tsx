// FILE: components/rich-text.tsx
// Draws an answer from lib/rich.ts: paragraphs, list items with a marigold dot, bold and italics.
import { StyleSheet, Text, View } from 'react-native';

import { blocks } from '@/lib/rich';
import { useTheme } from '@/theme/theme';

export function RichText({ text }: { text: string }) {
  const { c, t } = useTheme();
  return (
    <View style={styles.wrap}>
      {blocks(text).map((block, i) => (
        <View key={i} style={block.kind === 'item' ? styles.item : undefined}>
          {block.kind === 'item' ? <View style={[styles.dot, { backgroundColor: c.marigold }]} /> : null}
          <Text style={[t.body, styles.flex]}>
            {block.spans.map((s, j) => (
              <Text key={j} style={{ fontWeight: s.bold ? '700' : undefined, fontStyle: s.italic ? 'italic' : undefined }}>
                {s.text}
              </Text>
            ))}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  item: { flexDirection: 'row', gap: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, marginTop: 9 },
  flex: { flex: 1 },
});
