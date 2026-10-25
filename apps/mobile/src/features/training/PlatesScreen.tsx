import { useState } from 'react';
import { platePairs } from '@fitlog/domain';
import { t } from '@/lib/i18n';
import { AppText, Card, Field, Header, Screen } from '@/ui';
export function PlatesScreen() {
  const [target, setTarget] = useState('100'); const [bar, setBar] = useState('20');
  let result: ReturnType<typeof platePairs> | undefined;
  try { result = platePairs(Number(target), Number(bar), [25, 20, 15, 10, 5, 2.5, 1.25]); } catch {}
  return <Screen><Header title={t('plateCalculator')} back /><Field label={`${t('targetWeight')} (kg)`} value={target} onChangeText={setTarget} inputMode="decimal" /><Field label={`${t('barWeight')} (kg)`} value={bar} onChangeText={setBar} inputMode="decimal" />
    {result && <Card><AppText variant="title">{t('perSide')}</AppText><AppText variant="headline">{result.perSide.join(' + ')} kg</AppText><AppText>{t('remainder')}: {result.remainderKg} kg</AppText></Card>}
  </Screen>;
}
