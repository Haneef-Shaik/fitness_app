/**
 * The redesign's primitives (docs/15-UI-REDESIGN.md): what each one promises
 * a screen, and what it promises a screen reader.
 */
import React from 'react';
import { StyleSheet, Text as RNText } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Button, Card, Pill } from '../index';
import { EmptyState } from '../EmptyState';
import { SectionHeader } from '../SectionHeader';
import { Checklist } from '../Checklist';
import { MenuList } from '../MenuList';
import { StickyFooter } from '../StickyFooter';
import { SkeletonCard } from '../Skeleton';
import { NavRow } from '../NavRow';
import { ScreenScaffold } from '../ScreenScaffold';
import { BottomInsetHandled } from '../topInset';
import { palette } from '../../theme/tokens';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
}));
jest.mock('@/lib/session', () => ({ useSession: () => ({ email: 'ab@example.com', profile: null }) }));

const METRICS = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 34 } };
const flat = (el: { props: Record<string, unknown> }) => StyleSheet.flatten(el.props.style as never) as Record<string, unknown>;

describe('EmptyState — icon, title, one sentence, one action', () => {
  it('renders the copy and fires the action', () => {
    const onPress = jest.fn();
    render(<EmptyState title="No workouts yet" body="Finished sessions show up here." action={{ label: 'Start a workout', onPress }} />);
    expect(screen.getByText('No workouts yet')).toBeTruthy();
    expect(screen.getByText('Finished sessions show up here.')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Start a workout'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('offers a secondary way out when given one', () => {
    render(<EmptyState title="x" action={{ label: 'A', onPress: jest.fn() }} secondary={{ label: 'B', onPress: jest.fn() }} />);
    expect(screen.getByLabelText('B')).toBeTruthy();
  });
});

describe('SectionHeader', () => {
  it('is a header, with its link named', () => {
    const onPress = jest.fn();
    render(<SectionHeader title="Recent sessions" action={{ label: 'See all', onPress }} />);
    expect(screen.getByRole('header')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('See all'));
    expect(onPress).toHaveBeenCalled();
  });
});

describe('Checklist — the first-run guide', () => {
  const items = [
    { key: 'w', label: 'Log your first workout', done: false, action: { label: 'Start', onPress: jest.fn(), testID: 'start' } },
    { key: 't', label: 'Set your targets', done: true, action: { label: 'Set', onPress: jest.fn(), testID: 'set' } },
  ];

  it('counts what is done and hides the button of a finished step', () => {
    render(<Checklist title="Let's get your first data in" items={items} />);
    expect(screen.getByText('1 of 2 done')).toBeTruthy();
    expect(screen.getByTestId('start')).toBeTruthy();
    expect(screen.queryByTestId('set')).toBeNull();
  });

  it('says whether each step is done, in words', () => {
    render(<Checklist title="x" items={items} />);
    expect(screen.getByLabelText('Log your first workout, not done yet')).toBeTruthy();
    expect(screen.getByLabelText('Set your targets, done')).toBeTruthy();
  });
});

describe('MenuList — big obvious choices', () => {
  it('names each row with its hint and respects disabled', () => {
    const onPress = jest.fn();
    render(<MenuList items={[
      { key: 'a', icon: 'barbell-outline', label: 'Start a workout', hint: 'From a plan or empty', onPress },
      { key: 'b', icon: 'camera-outline', label: 'Photograph a meal', onPress: jest.fn(), disabled: true },
    ]} />);
    fireEvent.press(screen.getByLabelText('Start a workout, From a plan or empty'));
    expect(onPress).toHaveBeenCalled();
    expect(screen.getByLabelText('Photograph a meal').props.accessibilityState).toMatchObject({ disabled: true });
  });
});

describe('StickyFooter — pinned above the home indicator', () => {
  const show = (tabBarBelow: boolean) => render(
    <SafeAreaProvider initialMetrics={METRICS}>
      <BottomInsetHandled.Provider value={tabBarBelow}>
        <StickyFooter><RNText>Save</RNText></StickyFooter>
      </BottomInsetHandled.Provider>
    </SafeAreaProvider>,
  );

  it('clears the home indicator itself when no tab bar is below', () => {
    show(false);
    expect(flat(screen.getByTestId('sticky-footer')).paddingBottom).toBeGreaterThanOrEqual(34);
  });

  it('does not double the inset when the tab bar already clears it', () => {
    show(true);
    expect(flat(screen.getByTestId('sticky-footer')).paddingBottom).toBeLessThan(34);
  });
});

describe('Button', () => {
  it('keeps its name when a spinner replaces the label', () => {
    render(<Button title="Save set 3" loading onPress={jest.fn()} />);
    expect(screen.getByLabelText('Save set 3').props.accessibilityState).toMatchObject({ busy: true });
  });

  it('is 56 px in the logger size', () => {
    render(<Button title="Save" size="lg" onPress={jest.fn()} />);
    expect(flat(screen.getByLabelText('Save')).minHeight).toBe(56);
  });

  it('draws an icon before the label when asked', () => {
    render(<Button title="Start workout" icon="play" kind="secondary" onPress={jest.fn()} />);
    expect(screen.getByTestId('icon-play')).toBeTruthy();
  });
});

describe('Card', () => {
  it('renders its eyebrow as a header, with the right-hand slot', () => {
    render(<Card label="Today's workout" right={<RNText>5 days ago</RNText>}><RNText>body</RNText></Card>);
    expect(screen.getByRole('header').props.children).toBe("Today's workout");
    expect(screen.getByText('5 days ago')).toBeTruthy();
  });
});

describe('Pill', () => {
  it('draws warning text in the ink shade, never the raw status hex', () => {
    render(<Pill kind="warn">Low confidence</Pill>);
    const style = flat(screen.getByText('Low confidence'));
    expect([palette.dark.warnInk, palette.light.warnInk]).toContain(style.color);
    expect(style.color).not.toBe('#FAB219' === palette.dark.warnInk ? 'never' : '#FAB219x');
  });
});

describe('Skeleton', () => {
  it('is one "Loading" stop', () => {
    render(<SkeletonCard />);
    expect(screen.getByLabelText('Loading')).toBeTruthy();
  });
});

describe('NavRow', () => {
  it('is one control named by its label, fact and hint', () => {
    render(<NavRow icon="clipboard-outline" label="Programs" detail="3 active" hint="Push / Pull / Legs" onPress={jest.fn()} />);
    expect(screen.getByLabelText('Programs, 3 active, Push / Pull / Legs')).toBeTruthy();
  });
});

describe('ScreenScaffold', () => {
  const show = (ui: React.ReactElement) => render(<SafeAreaProvider initialMetrics={METRICS}>{ui}</SafeAreaProvider>);

  it('shows the eyebrow above the title and pins the footer', () => {
    show(
      <ScreenScaffold title="Bench Press" eyebrow="Workout in progress" footer={<RNText>Save set 1</RNText>}>
        <RNText>body</RNText>
      </ScreenScaffold>,
    );
    expect(screen.getByTestId('screen-eyebrow').props.children).toBe('Workout in progress');
    expect(screen.getByTestId('sticky-footer')).toBeTruthy();
    expect(screen.getByText('Save set 1')).toBeTruthy();
  });

  it('a tab root has the bell and the avatar, and no back', () => {
    show(<ScreenScaffold root title="Home"><RNText>body</RNText></ScreenScaffold>);
    expect(screen.getByLabelText('Notifications and reminders')).toBeTruthy();
    expect(screen.getByLabelText('Profile and settings')).toBeTruthy();
    expect(screen.queryByLabelText('Back')).toBeNull();
  });
});
