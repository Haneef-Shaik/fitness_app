/**
 * K-09 · the phone's health store — Health Connect on Android, Apple Health on
 * iOS — behind one small interface.
 *
 * Two things only, the two a lifter asks for: **weight in** (a smart scale
 * writes to the health store; FitLog reads it, so nobody types a weigh-in the
 * scale already took) and **workouts out** (a finished FitLog workout appears
 * in the health store, where the rest of someone's activity already is).
 *
 * The native modules are required lazily, like every other native module here:
 * a static import would put them in the graph of every test that renders a
 * screen mentioning health.
 */
import { Platform } from 'react-native';

export interface HealthWeight {
  /** The health store's own uuid for the reading — stable across syncs. */
  id: string;
  kg: number;
  measuredAt: string;
}

export interface HealthWorkout {
  /** FitLog's session id, so the store can recognise a repeat. */
  id: string;
  title: string;
  start: string;
  end: string;
}

export interface Access {
  weight: boolean;
  workouts: boolean;
}

export interface HealthBridge {
  /** "Health Connect" or "Apple Health" — named in the UI as the store is. */
  name: string;
  isAvailable(): Promise<boolean>;
  /** Shows the store's own permission screen. */
  requestAccess(): Promise<Access>;
  readWeights(since: Date): Promise<HealthWeight[]>;
  saveWorkout(workout: HealthWorkout): Promise<void>;
}

export function healthBridge(): HealthBridge | null {
  try {
    if (Platform.OS === 'android') {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      return (require('./healthConnect') as typeof import('./healthConnect')).healthConnect;
    }
    if (Platform.OS === 'ios') {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      return (require('./healthKit') as typeof import('./healthKit')).healthKit;
    }
  } catch {
    // A build without the native module (Expo Go, a test) has no store to talk to.
  }
  return null;
}
