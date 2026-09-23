/**
 * B-02 · Customise the dashboard (BRD §15).
 *
 * Which cards appear and in what order is a **device preference** — no round
 * trip, no column, no migration, and no second device silently rearranging the
 * first. `/dashboard` always returns every domain; this only decides what B-01
 * renders and where.
 */
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Button, Card, Text } from '@/ui';
import { ScreenScaffold } from '@/ui/ScreenScaffold';
import {
  DASHBOARD_SECTIONS, loadDashboardLayout, saveDashboardLayout,
  type DashboardLayout,
} from '@/features/dashboard/layout';
import { space } from '@/theme';

export default function Customize() {
  const [layout, setLayout] = useState<DashboardLayout>([]);

  useEffect(() => { void loadDashboardLayout().then(setLayout); }, []);

  const move = (index: number, delta: number) => {
    const next = index + delta;
    if (next < 0 || next >= layout.length) return;
    // Immutable swap — the array is replaced, never reordered in place.
    setLayout((rows) => rows.map((row, i) =>
      i === index ? rows[next]! : i === next ? rows[index]! : row));
  };

  const toggle = (key: string) =>
    setLayout((rows) => rows.map((row) =>
      row.key === key ? { ...row, visible: !row.visible } : row));

  return (
    <ScreenScaffold title="Customise">
      <View style={{ gap: space.md }}>
        <Card>
          <Text variant="caption" tone="ink3">
            Hiding a card hides it here only. Nothing stops being tracked, and the
            numbers are still there when you turn it back on.
          </Text>
        </Card>

        {layout.map((row, index) => (
          <Card key={row.key}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
              <Text variant="body" style={{ flex: 1 }}>
                {DASHBOARD_SECTIONS.find((s) => s.key === row.key)?.label ?? row.key}
              </Text>
              <Button
                title={row.visible ? 'Hide' : 'Show'}
                kind="ghost"
                size="sm"
                testID={`section-${row.key}-toggle`}
                onPress={() => toggle(row.key)}
              />
              <Button
                title="↑"
                kind="ghost"
                size="sm"
                disabled={index === 0}
                testID={`section-${row.key}-up`}
                onPress={() => move(index, -1)}
              />
              <Button
                title="↓"
                kind="ghost"
                size="sm"
                disabled={index === layout.length - 1}
                testID={`section-${row.key}-down`}
                onPress={() => move(index, 1)}
              />
            </View>
          </Card>
        ))}

        <Button
          title="Save"
          testID="layout-save"
          onPress={async () => {
            await saveDashboardLayout(layout);
            router.back();
          }}
        />
      </View>
    </ScreenScaffold>
  );
}
