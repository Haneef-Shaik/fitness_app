/**
 * K-10 · Open-source licences.
 *
 * Generated from package.json by `node scripts/licences.mjs` and checked in
 * (`licences.test.ts` fails when a dependency is added without it). One row
 * per package, one screen-reader stop per row: name, version, licence.
 *
 * Direct dependencies only. The full transitive list and licence texts belong
 * in the store build's notices — an owner task before submission.
 */
import { View } from 'react-native';
import { Card, Text } from '@/ui';
import { ScreenScaffold } from '@/ui/ScreenScaffold';
import licences from '@/features/about/licences.json';
import { space, useTheme } from '@/theme';

export default function Licences() {
  const { c } = useTheme();
  return (
    <ScreenScaffold title="Open-source licences">
      <Text variant="body" tone="ink2" style={{ marginBottom: space.base }}>
        FitLog is built with these open-source packages. Each is used under the licence shown;
        the full text of each licence is published with the package.
      </Text>
      <Card>
        {licences.map((entry, i) => (
          <View
            key={entry.name}
            accessible
            accessibilityLabel={`${entry.name}, version ${entry.version}, ${entry.license} licence`}
            style={{
              paddingVertical: space.sm,
              borderTopWidth: i === 0 ? 0 : 1, borderTopColor: c.line,
            }}
          >
            <Text variant="body">{entry.name}</Text>
            <Text variant="caption" tone="ink3">{entry.version} · {entry.license}</Text>
          </View>
        ))}
      </Card>
    </ScreenScaffold>
  );
}
