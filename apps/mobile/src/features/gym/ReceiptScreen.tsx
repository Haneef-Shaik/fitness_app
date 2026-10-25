import { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { z } from 'zod';
import { t } from '@/lib/i18n';
import { useTheme } from '@/theme';
import { AppButton, AppText, Card, Header, Screen } from '@/ui';
import { useGymAccount, inr } from './hooks';
import { useGym } from './GymProvider';

const snapshotSchema = z.object({ amountPaise: z.number().int(), method: z.string().optional(), reference: z.string().nullish(), receivedAt: z.string().optional(), reason: z.string().optional(),
  gym: z.object({ name: z.string(), address: z.string(), contact: z.string() }).optional(), member: z.object({ name: z.string(), number: z.number() }).optional(),
  balance: z.object({ due: z.number(), credit: z.number() }), allocations: z.array(z.object({ chargeId: z.string(), amountPaise: z.number() })).optional() });
const escape = (value: string | number) => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
export function ReceiptScreen() {
  const { memberId, receiptId } = useLocalSearchParams<{ memberId: string; receiptId: string }>(); const { account, error, setError } = useGymAccount(memberId); const { theme } = useTheme(); const [busy, setBusy] = useState(false);
  const { gym } = useGym();
  const receipt = account?.receipts.find((r) => r.id === receiptId); const parsed = receipt ? snapshotSchema.safeParse(receipt.snapshot) : null; const snapshot = parsed?.success ? parsed.data : null;
  const issued = receipt ? new Intl.DateTimeFormat('en-IN', { timeZone: gym.timezone, dateStyle: 'medium', timeStyle: 'short' }).format(new Date(receipt.issued_at)) : '';
  const method = snapshot?.method && ['cash', 'upi', 'bank', 'card_external', 'other'].includes(snapshot.method) ? t(snapshot.method as 'cash' | 'upi' | 'bank' | 'card_external' | 'other') : snapshot?.method;
  async function print() {
    if (!receipt || !snapshot) return; setBusy(true); setError('');
    try {
      const rows = [[t('receipt'), receipt.number], [t('gym'), snapshot.gym?.name ?? ''], [t('address'), snapshot.gym?.address ?? ''], [t('contact'), snapshot.gym?.contact ?? ''], [t('displayName'), snapshot.member?.name ?? ''], [t('memberNumber'), snapshot.member?.number ?? ''], [t('amount'), inr(snapshot.amountPaise)], [t('dateLabel'), `${issued} · ${gym.timezone}`], [t('reference'), snapshot.reference ?? ''], [t('dues'), inr(snapshot.balance.due)], [t('credit'), inr(snapshot.balance.credit)]];
      const html = `<!doctype html><html lang="en"><meta charset="UTF-8"><title>${escape(receipt.number)}</title><body style="font-family:sans-serif;padding:${theme.spacing.xxl}px;font-size:${theme.typography.body.fontSize}px"><h1>${escape(t('receipt'))}</h1><table>${rows.map(([key, value]) => `<tr><th style="text-align:left;padding:${theme.spacing.sm}px">${escape(key!)}</th><td>${escape(value!)}</td></tr>`).join('')}</table>${snapshot.reason ? `<p>${escape(snapshot.reason)}</p>` : ''}</body></html>`;
      if (Platform.OS === 'web') await Print.printAsync({ html });
      else { const file = await Print.printToFileAsync({ html }); if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(file.uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' }); else await Print.printAsync({ uri: file.uri }); }
    } catch (e) { setError(e instanceof Error ? e.message : t('loadFailed')); } finally { setBusy(false); }
  }
  return <Screen><Header title={t('receipt')} back />{receipt && snapshot && <Card><AppText variant="title">{receipt.number}</AppText>{snapshot.gym && <><AppText>{snapshot.gym.name}</AppText><AppText tone="muted">{[snapshot.gym.address, snapshot.gym.contact].filter(Boolean).join(' · ')}</AppText></>}{snapshot.member && <AppText>{snapshot.member.name} · #{snapshot.member.number}</AppText>}<AppText variant="number">{inr(snapshot.amountPaise)}</AppText><AppText>{[method, snapshot.reference].filter(Boolean).join(' · ')}</AppText><AppText variant="caption" tone="muted">{issued} · {gym.timezone}</AppText><AppText>{t('dues')}: {inr(snapshot.balance.due)}</AppText><AppText>{t('credit')}: {inr(snapshot.balance.credit)}</AppText></Card>}
    {!snapshot && <AppText>{error || t('loadingData')}</AppText>}{!!error && <AppText tone="error">{error}</AppText>}<AppButton label={t('printReceipt')} loading={busy} disabled={!snapshot} onPress={() => { void print(); }} />
  </Screen>;
}
