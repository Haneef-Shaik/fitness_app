/**
 * E-07 · Session Notes — and, with a different title, an exercise's notes.
 *
 * The note is edited here and handed back on Done; the caller writes it into
 * the draft, which queues it for the server. Quick tags append, never replace,
 * so a tag cannot wipe out a sentence typed a set ago.
 */
import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Text } from '@/ui';
import { Pressable } from '@/ui/Pressable';
import { Sheet } from '@/ui/Sheet';
import { TextInput } from '@/ui/TextInput';
import { radius, space, useTheme } from '@/theme';
import { QUICK_TAGS, SESSION_NOTE_MAX, appendTag, cleanNote } from '../advanced';

export interface NotesSheetProps {
  visible: boolean;
  title: string;
  initial: string | null;
  onDone: (note: string | null) => void;
  /** Quick tags describe a workout; an exercise note is free text only. */
  showTags?: boolean;
}

export function NotesSheet({ visible, title, initial, onDone, showTags = true }: NotesSheetProps) {
  const { c } = useTheme();
  const [text, setText] = useState(initial ?? '');

  // Each opening starts from what is saved, not from an abandoned edit.
  useEffect(() => { if (visible) setText(initial ?? ''); }, [visible, initial]);

  // Session and exercise notes allow 2000 characters; a set's note, 500.
  const done = () => onDone(cleanNote(text, SESSION_NOTE_MAX));

  return (
    <Sheet
      visible={visible}
      onClose={done}
      title={title}
      testID="notes-sheet"
      footer={<Button title="Done" onPress={done} testID="notes-done" />}
    >
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.md }} keyboardShouldPersistTaps="handled">
        {showTags ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
            {QUICK_TAGS.map((tag) => (
              <Pressable
                key={tag}
                onPress={() => setText((t) => appendTag(t, tag).slice(0, SESSION_NOTE_MAX))}
                accessibilityRole="button"
                accessibilityLabel={`Add “${tag}”`}
                testID={`notes-tag-${tag.replace(/\s+/g, '-')}`}
                style={{
                  paddingHorizontal: space.md, minHeight: 38, justifyContent: 'center',
                  borderRadius: radius.pill, borderWidth: 1, borderColor: c.line2,
                }}
              >
                <Text variant="caption" tone="ink2">{tag}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
        <TextInput
          testID="notes-input"
          accessibilityLabel={title}
          value={text}
          onChangeText={setText}
          placeholder="How did it go?"
          placeholderTextColor={c.ink3}
          maxLength={SESSION_NOTE_MAX}
          multiline
          style={{
            minHeight: 140, padding: space.md, textAlignVertical: 'top',
            borderRadius: radius.btn, borderWidth: 1, borderColor: c.line2,
            color: c.ink, backgroundColor: c.sunken,
          }}
        />
        <Text variant="caption" tone="ink3">{text.length} / {SESSION_NOTE_MAX}</Text>
      </ScrollView>
    </Sheet>
  );
}
