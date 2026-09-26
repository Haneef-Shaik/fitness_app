/**
 * K-01's "Verify your email · Resend" — one row, unobtrusive on purpose.
 *
 * A-06: an unverified account is a full account. Nothing is locked, so this
 * is a note with a way to act on it, not a gate, and it takes one row: the
 * words open A-06 (where a code can be pasted), the button resends. A card
 * here pushed Sign out below the fold on a small phone.
 */
import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Text } from '@/ui';
import { Pressable } from '@/ui/Pressable';
import { radius, space, target, useTheme } from '@/theme';
import { Notice } from './Notice';
import { ResendButton, useResendVerification } from './ResendVerification';

export function VerifyEmailBanner() {
  const { c } = useTheme();
  const resend = useResendVerification();
  return (
    <View testID="verify-email-banner" style={{ gap: space.sm }}>
      <View
        style={{
          flexDirection: 'row', alignItems: 'center', gap: space.sm,
          borderWidth: 1, borderColor: c.line, borderRadius: radius.card,
          paddingLeft: space.md, paddingRight: space.xs, backgroundColor: c.surface,
        }}
      >
        <Pressable
          onPress={() => router.push('/verify-email')}
          accessibilityRole="link" accessibilityLabel="Verify your email"
          accessibilityHint="Opens the screen to confirm your address or paste the code"
          style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: target.min }}
        >
          <Ionicons name="mail-unread-outline" size={18} color={c.ink2} />
          <Text variant="body" numberOfLines={1} style={{ flex: 1 }}>Verify your email</Text>
        </Pressable>
        <ResendButton state={resend} />
      </View>
      {resend.outcome ? (
        <Notice tone={resend.outcome.tone} testID="resend-outcome">{resend.outcome.text}</Notice>
      ) : null}
    </View>
  );
}
