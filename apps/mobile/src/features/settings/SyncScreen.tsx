import { useMember } from '@/data/MemberProvider';
import { t } from '@/lib/i18n';
import { AppButton, AppText, Card, Header, Screen } from '@/ui';

export function SyncScreen() {
  const { operations, syncing, store, offline } = useMember(); const pending = operations.filter((o) => o.status !== 'synced');
  return <Screen><Header title={t('syncCentre')} back /><AppButton label={t('syncNow')} loading={syncing} onPress={() => { void store.sync(); }} />
    {offline && <AppText tone="muted">{t('offlineAvailable')}</AppText>}
    {pending.map((o) => <Card key={o.id}><AppText variant="label">{o.kind}</AppText><AppText tone={o.status === 'conflict' || o.status === 'rejected' ? 'error' : 'muted'}>{t(o.status === 'conflict' ? 'conflict' : o.status === 'rejected' ? 'needsAttention' : 'pendingSync')}</AppText>{o.error && <AppText>{o.error}</AppText>}<AppText variant="caption" tone="muted">{new Date(o.createdAt).toLocaleString()}</AppText></Card>)}
    {!pending.length && <Card><AppText variant="title">{t('emptySync')}</AppText></Card>}
  </Screen>;
}
