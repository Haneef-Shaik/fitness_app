/**
 * The bottom sheet (H2.1) — C-06's picker and C-07's prescription editor, and in
 * G3 the logger's add/swap.
 *
 * Dismissal is deliberate: the backdrop and the system back both route through
 * `onClose`, so a caller can intercept an unsaved edit rather than losing it
 * (docs/03 §4.3).
 */
import React from 'react';
import { Modal, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from './index';
import { radius, space, useTheme } from '../theme';

export interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  /** Pinned to the bottom, above the safe area — the commit action lives here. */
  footer?: React.ReactNode;
  children: React.ReactNode;
  testID?: string;
}

export function Sheet({ visible, onClose, title, footer, children, testID }: SheetProps) {
  const { c } = useTheme();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      testID={testID}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' }}>
        {/* Absolute, not flex:1. As a flex child the backdrop took the height the
            sheet needed, which on a phone left the sheet a sliver at the bottom
            with its commit button off-screen. The browser never showed it because
            there was far more vertical space to go round. */}
        <Pressable
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close"
        />
        <View
          style={{
            // A definite height, not just a cap: the content inside is a
            // virtualised list, which cannot size a flex parent on its own.
            height: '85%',
            backgroundColor: c.surface,
            borderTopLeftRadius: radius.lg,
            borderTopRightRadius: radius.lg,
            borderTopWidth: 1,
            borderColor: c.line,
          }}
        >
          <View style={{ alignItems: 'center', paddingTop: space.md }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: c.line2 }} />
          </View>
          <View style={{ paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.sm }}>
            <Text variant="title" accessibilityRole="header">{title}</Text>
          </View>
          <View style={{ flex: 1, minHeight: 120 }}>{children}</View>
          {footer ? (
            <SafeAreaView edges={['bottom']} style={{ borderTopWidth: 1, borderColor: c.line }}>
              <View style={{ padding: space.lg }}>{footer}</View>
            </SafeAreaView>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}
