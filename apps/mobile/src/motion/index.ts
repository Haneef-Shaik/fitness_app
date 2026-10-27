/**
 * The motion system (DS-3): Momentum spring tokens, the shared Reduce Motion answer, the animated
 * primitives and the haptic moments. `@/motion/moments` can be imported on its own by code that
 * signals a moment but draws no motion, such as the set logger.
 */
export * from './tokens';
export { createReducedMotionStore, fixedReducedMotionStore, stackAnimation, systemReducedMotionSource } from './reduced-motion';
export type { ReducedMotionSource, ReducedMotionStore } from './reduced-motion';
export { ReducedMotionProvider, useReducedMotion } from './ReducedMotionProvider';
export { useSpringValue } from './useSpringValue';
export type { SpringValueOptions } from './useSpringValue';
export { Pop } from './Pop';
export { Rise } from './Rise';
export { usePressScale } from './usePressScale';
export { createExpoHapticDriver, playHaptic } from './haptics';
export type { HapticDriver, HapticFailureReporter, HapticKind } from './haptics';
export { createMomentFeedback, moments, signalMoment } from './moments';
export type { Moment, MomentFeedbackOptions, MomentSpec, MomentVisual, SignalMoment } from './moments';
