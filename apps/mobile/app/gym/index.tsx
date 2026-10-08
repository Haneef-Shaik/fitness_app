/**
 * Gym workspace concept surface for the gym PRD.
 *
 * The API-backed owner and trainer routes are being built in the next slice;
 * this screen gives the product one shared shell now, so the member, trainer
 * and owner mental models can be tested together instead of as three unrelated
 * apps. Sample values are labelled as a preview and never mutate data.
 */
import { useState } from 'react';
import { router } from 'expo-router';
import { Alert, View } from 'react-native';
import { Button, Card, Pill, Stat, StatRow, Text } from '@/ui';
import { CoachPrompt, type CoachRole } from '@/features/coach/CoachPrompt';
import { NavGroup, NavRow } from '@/ui/NavRow';
import { ScreenScaffold } from '@/ui/ScreenScaffold';
import { space, useTheme } from '@/theme';

const ROLES: readonly { key: CoachRole; label: string }[] = [
  { key: 'member', label: 'Member' },
  { key: 'trainer', label: 'Trainer' },
  { key: 'owner', label: 'Owner' },
];

function preview(label: string) {
  Alert.alert('Preview surface', `${label} will connect to the gym API in the next implementation slice.`);
}

export default function GymWorkspace() {
  const [role, setRole] = useState<CoachRole>('member');

  return (
    <ScreenScaffold title="Gym workspace" root>
      <View style={{ gap: space.lg }}>
        <View>
          <Text variant="body" tone="ink2">One workspace, three perspectives.</Text>
          <Text variant="caption" tone="ink3" style={{ marginTop: 4 }}>Preview the role that fits the moment.</Text>
        </View>

        <View accessibilityRole="tablist" style={{ flexDirection: 'row', gap: space.sm }}>
          {ROLES.map((item) => (
            <Button
              key={item.key}
              title={item.label}
              size="sm"
              kind={role === item.key ? 'primary' : 'secondary'}
              accessibilityRole="tab"
              accessibilityState={{ selected: role === item.key }}
              testID={`gym-role-${item.key}`}
              style={{ flex: 1 }}
              onPress={() => setRole(item.key)}
            />
          ))}
        </View>

        {role === 'member' ? <MemberView /> : null}
        {role === 'trainer' ? <TrainerView /> : null}
        {role === 'owner' ? <OwnerView /> : null}
      </View>
    </ScreenScaffold>
  );
}

function WorkspaceCard({ role }: { role: CoachRole }) {
  const { c } = useTheme();
  const title = role === 'member' ? 'Iron Temple Gym' : 'Iron Temple · Koramangala';
  const sub = role === 'member' ? 'Strength plan · 24 days left' : role === 'trainer' ? 'Your floor today' : 'Tuesday, 02 October';
  return (
    <Card hero accent>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
        <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' }}>
          <Text variant="h2" style={{ color: c.accentInk }}>IT</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="h2" numberOfLines={1}>{title}</Text>
          <Text variant="caption" tone="ink2" style={{ marginTop: 3 }}>{sub}</Text>
        </View>
        <Pill kind="accent">Preview</Pill>
      </View>
    </Card>
  );
}

function MemberView() {
  return (
    <>
      <WorkspaceCard role="member" />
      <StatRow>
        <Stat value="24" label="days left" />
        <Stat value="3" label="visits this week" />
        <Stat value="₹0" label="dues" />
      </StatRow>
      <CoachPrompt
        title="Keep today's visit simple"
        body="Check in, open your trainer's plan and let the coach help you adapt the next move when the floor is busy."
        actionLabel="Open today's plan"
        detail="Attendance is captured; it never blocks your workout."
        onAction={() => router.push('/train')}
        testID="gym-member-coach"
      />
      <NavGroup>
        <NavRow icon="qr-code-outline" label="Check in" hint="Scan the gym poster when you arrive" detail="Now" onPress={() => preview('Check in')} />
        <NavRow icon="card-outline" label="Membership card" hint="Plan, end date, dues and receipts" onPress={() => preview('Membership card')} />
        <NavRow icon="trophy-outline" label="Gym challenge" hint="Your weekly visit streak" detail="2 / 3" onPress={() => preview('Gym challenge')} />
      </NavGroup>
    </>
  );
}

function TrainerView() {
  return (
    <>
      <WorkspaceCard role="trainer" />
      <StatRow>
        <Stat value="18" label="assigned members" />
        <Stat value="6" label="training today" />
        <Stat value="3" label="needs a check-in" />
      </StatRow>
      <CoachPrompt
        role="trainer"
        title="Plan the floor before it gets busy"
        body="The plan copilot can draft a week from a member's goal, history and equipment for you to approve."
        actionLabel="Open plan studio"
        detail="Owner Pro feature · trainer approval required."
        onAction={() => preview('Plan studio')}
        testID="gym-trainer-coach"
      />
      <NavGroup>
        <NavRow icon="people-outline" label="My members" hint="Attendance, plans and consent" detail="18" onPress={() => preview('My members')} />
        <NavRow icon="document-text-outline" label="Plan studio" hint="Templates and assignments" badge="Copilot" onPress={() => preview('Plan studio')} />
        <NavRow icon="body-outline" label="Measurements" hint="Record a check-in for a member" onPress={() => preview('Measurements')} />
      </NavGroup>
    </>
  );
}

function OwnerView() {
  return (
    <>
      <WorkspaceCard role="owner" />
      <StatRow>
        <Stat value="280" label="active members" />
        <Stat value="₹48k" label="due this week" />
        <Stat value="68%" label="visited this week" />
      </StatRow>
      <CoachPrompt
        role="owner"
        title="Start with the members who need you"
        body="The collections copilot ranks renewals and drafts a utility message in your gym's name for you to review."
        actionLabel="Open collections"
        detail="Nothing is sent automatically. Your WhatsApp stays the final step."
        onAction={() => preview('Collections')}
        testID="gym-owner-coach"
      />
      <NavGroup>
        <NavRow icon="alert-circle-outline" label="Today's calls" hint="Confident attendance alerts" detail="12" onPress={() => preview("Today's calls")} />
        <NavRow icon="people-outline" label="Member register" hint="Search, dues and renewals" detail="280" onPress={() => preview('Member register')} />
        <NavRow icon="cash-outline" label="Collections" hint="Payments, ageing and receipts" detail="₹48k" onPress={() => preview('Collections')} />
        <NavRow icon="analytics-outline" label="Reports" hint="Retention, visits and peak hours" onPress={() => preview('Reports')} />
      </NavGroup>
    </>
  );
}
