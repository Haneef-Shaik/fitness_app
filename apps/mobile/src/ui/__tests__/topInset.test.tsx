/**
 * Who owns the status-bar inset.
 *
 * Found on the phone in G10: with L-02's banner showing, every screen still
 * padded itself by the full status-bar height, leaving a blank strip under the
 * banner. The native SafeAreaView does NOT account for where it sits — it
 * always applies the window's inset — so the screens have to be told.
 */
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ScreenScaffold } from '../ScreenScaffold';
import { TopInsetHandled, useScreenEdges } from '../topInset';

jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() } }));

function Edges() {
  return <Text testID="edges">{useScreenEdges().join(',')}</Text>;
}

describe('the top inset has exactly one owner', () => {
  it('a screen insets its own top by default', () => {
    render(<Edges />);
    expect(screen.getByTestId('edges').props.children).toBe('top,left,right');
  });

  it('a screen under the banner leaves the top to the banner', () => {
    render(
      <TopInsetHandled.Provider value>
        <Edges />
      </TopInsetHandled.Provider>,
    );
    expect(screen.getByTestId('edges').props.children).toBe('left,right');
  });

  it('ScreenScaffold follows it', () => {
    render(
      <TopInsetHandled.Provider value>
        <ScreenScaffold title="Sync"><Text>body</Text></ScreenScaffold>
      </TopInsetHandled.Provider>,
    );
    const safe = screen.getByTestId('screen-safe-area');
    expect(safe.props.edges.top).toBe('off');
    expect(safe.props.edges.left).toBe('additive');
  });

  it('and still insets itself with no banner', () => {
    render(<ScreenScaffold title="Sync"><Text>body</Text></ScreenScaffold>);
    expect(screen.getByTestId('screen-safe-area').props.edges.top).toBe('additive');
  });
});

describe('ScreenSafeArea — the root of screens that do not use the scaffold', () => {
  const { ScreenSafeArea } = require('../ScreenSafeArea');

  it('keeps every edge by default', () => {
    render(<ScreenSafeArea testID="root" />);
    const e = screen.getByTestId('root').props.edges;
    expect([e.top, e.bottom, e.left, e.right]).toEqual(['additive', 'additive', 'additive', 'additive']);
  });

  it('drops only the top under the banner', () => {
    render(<TopInsetHandled.Provider value><ScreenSafeArea testID="root" /></TopInsetHandled.Provider>);
    const e = screen.getByTestId('root').props.edges;
    expect([e.top, e.bottom, e.left, e.right]).toEqual(['off', 'additive', 'additive', 'additive']);
  });
});

describe('the bottom inset belongs to the tab bar when there is one', () => {
  const { ScreenSafeArea } = require('../ScreenSafeArea');
  const { BottomInsetHandled } = require('../topInset');

  it('a screen above the tab bar leaves the bottom to the bar', () => {
    render(<BottomInsetHandled.Provider value><ScreenSafeArea testID="root" /></BottomInsetHandled.Provider>);
    expect(screen.getByTestId('root').props.edges.bottom).toBe('off');
  });
});
