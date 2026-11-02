import { useState } from 'react';
import { platePairs } from '@fitlog/domain';
import { formatMeasure, formatNumber, labelWithUnit, t, withUnit } from '@/lib/i18n';
import { AppText, Card, Field, Header, Screen } from '@/ui';
export function PlatesScreen() {
  const [target, setTarget] = useState('100'); const [bar, setBar] = useState('20');
  let result: ReturnType<typeof platePairs> | undefined;
  try { result = platePairs(Number(target), Number(bar), [25, 20, 15, 10, 5, 2.5, 1.25]); } catch {}
  return <Screen><Header title={t('plateCalculator')} back /><Field label={labelWithUnit(t('targetWeight'), 'kg')} value={target} onChangeText={setTarget} inputMode="decimal" /><Field label={labelWithUnit(t('barWeight'), 'kg')} value={bar} onChangeText={setBar} inputMode="decimal" />
    {result && <Card><AppText variant="title">{t('perSide')}</AppText><AppText variant="headline">{withUnit(result.perSide.map((plate) => formatNumber(plate)).join(' + '), 'kg')}</AppText><AppText>{t('remainder')}: {formatMeasure(result.remainderKg, 'kg')}</AppText></Card>}
  </Screen>;
}
