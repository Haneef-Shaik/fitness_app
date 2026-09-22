import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { appendSet, startDraft } from '../../store/reducers';
import { DiscardDialog } from '../DiscardDialog';
import { RecoveryPrompt } from '../RecoveryPrompt';
import { FinishSummary } from '../FinishSummary';
import { summarise } from '../../summary';

const TRACKS = { load: true, reps: true, duration: false, distance: false };

function draftWith(setCount: number, startedAt = '2026-09-22T10:00:00Z') {
  let d = startDraft({
    sessionId: 's1', startedAt,
    exercises: [
      { clientId: 'x1', exerciseId: 'e1', exerciseName: 'Bench', tracks: TRACKS },
      { clientId: 'x2', exerciseId: 'e2', exerciseName: 'Row', tracks: TRACKS },
    ],
  });
  for (let i = 0; i < setCount; i++) {
    d = appendSet(d, 'x1', { clientId: `c${i}`, reps: 8, loadKg: 80 });
  }
  return d;
}

describe('E-09 · discard names what will be lost', () => {
  it('states the exact counts, not "this workout"', () => {
    // "Discard this workout?" is a question the user cannot answer.
    render(
      <DiscardDialog visible draft={draftWith(11)} onCancel={jest.fn()} onConfirm={jest.fn()} />,
    );
    expect(screen.getByText(/2 exercises and 11 sets/)).toBeTruthy();
  });

  it('singularises one set', () => {
    render(
      <DiscardDialog visible draft={draftWith(1)} onCancel={jest.fn()} onConfirm={jest.fn()} />,
    );
    expect(screen.getByText(/1 set will be lost/)).toBeTruthy();
  });

  it('says plainly when nothing would be lost', () => {
    render(
      <DiscardDialog visible draft={draftWith(0)} onCancel={jest.fn()} onConfirm={jest.fn()} />,
    );
    expect(screen.getByText(/Nothing has been logged yet/)).toBeTruthy();
  });

  it('offers keeping going first', () => {
    const onCancel = jest.fn();
    render(
      <DiscardDialog visible draft={draftWith(3)} onCancel={onCancel} onConfirm={jest.fn()} />,
    );
    fireEvent.press(screen.getByLabelText('Keep going'));
    expect(onCancel).toHaveBeenCalled();
  });
});

describe('E-10 · recovery offers three honest choices', () => {
  const now = new Date('2026-09-22T10:30:00Z');

  it('summarises what was left open', () => {
    render(
      <RecoveryPrompt
        visible draft={draftWith(4)} now={now}
        onResume={jest.fn()} onFinish={jest.fn()} onDiscard={jest.fn()}
      />,
    );
    expect(screen.getByText(/4 sets/)).toBeTruthy();
  });

  it('warns before resuming something older than a day', () => {
    // Resuming silently would file today's work under yesterday.
    render(
      <RecoveryPrompt
        visible draft={draftWith(2, '2026-09-20T10:00:00Z')} now={now}
        onResume={jest.fn()} onFinish={jest.fn()} onDiscard={jest.fn()}
      />,
    );
    expect(screen.getByTestId('recovery-stale')).toBeTruthy();
  });

  it('does not warn about a draft from an hour ago', () => {
    render(
      <RecoveryPrompt
        visible draft={draftWith(2)} now={now}
        onResume={jest.fn()} onFinish={jest.fn()} onDiscard={jest.fn()}
      />,
    );
    expect(screen.queryByTestId('recovery-stale')).toBeNull();
  });

  it('says the other session is not deleted when two disagree', () => {
    render(
      <RecoveryPrompt
        visible draft={draftWith(4)} conflicting={draftWith(2)} now={now}
        onResume={jest.fn()} onFinish={jest.fn()} onDiscard={jest.fn()}
      />,
    );
    expect(screen.getByText(/neither is deleted/)).toBeTruthy();
  });

  it('offers resume, finish and discard', () => {
    const onResume = jest.fn();
    render(
      <RecoveryPrompt
        visible draft={draftWith(4)} now={now}
        onResume={onResume} onFinish={jest.fn()} onDiscard={jest.fn()}
      />,
    );
    expect(screen.getByLabelText('Finish it now')).toBeTruthy();
    expect(screen.getByLabelText('Discard')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Resume'));
    expect(onResume).toHaveBeenCalled();
  });
});

describe('E-08 · summary, and E-11 · records after it', () => {
  const summary = summarise(draftWith(3), new Date('2026-09-22T11:00:00Z'));

  it('shows duration, sets and volume', () => {
    render(<FinishSummary summary={summary} onDone={jest.fn()} />);
    expect(screen.getByTestId('finish-summary')).toBeTruthy();
    expect(screen.getByText('60:00')).toBeTruthy();   // one hour of session
    expect(screen.getByText('3')).toBeTruthy();       // three sets
  });

  it('shows no celebration when nothing was beaten', () => {
    render(<FinishSummary summary={summary} onDone={jest.fn()} />);
    expect(screen.queryByTestId('pr-celebration')).toBeNull();
  });

  it('celebrates records HERE, after the summary, never mid-set', () => {
    render(
      <FinishSummary
        summary={summary}
        records={[{
          exercise_id: 'e1', exercise_name: 'Bench', record_type: 'max_load',
          value: 102.5, unit: 'kg',
        } as never]}
        onDone={jest.fn()}
      />,
    );
    expect(screen.getByTestId('pr-celebration')).toBeTruthy();
    expect(screen.getByText('New personal record')).toBeTruthy();
  });

  it('says plainly when writes are still syncing', () => {
    render(<FinishSummary summary={summary} pending={3} onDone={jest.fn()} />);
    expect(screen.getByText(/saved on this device/)).toBeTruthy();
  });
});
