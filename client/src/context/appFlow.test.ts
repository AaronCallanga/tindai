import { describe, expect, it } from 'vitest';

import { appFlowReducer, getActiveRoute, initialAppFlowState } from '@/context/appFlow';

describe('appFlowReducer', () => {
  it('starts on onboarding step 1', () => {
    expect(getActiveRoute(initialAppFlowState)).toEqual({
      kind: 'onboarding',
      step: 1,
    });
  });

  it('advances through onboarding and lands on login after the final step', () => {
    const step2 = appFlowReducer(initialAppFlowState, { type: 'advanceOnboarding' });
    const step3 = appFlowReducer(step2, { type: 'advanceOnboarding' });
    const auth = appFlowReducer(step3, { type: 'advanceOnboarding' });

    expect(getActiveRoute(step2)).toEqual({
      kind: 'onboarding',
      step: 2,
    });
    expect(getActiveRoute(step3)).toEqual({
      kind: 'onboarding',
      step: 3,
    });
    expect(getActiveRoute(auth)).toEqual({
      kind: 'auth',
      screen: 'login',
    });
  });

  it('skips onboarding directly to login', () => {
    const skipped = appFlowReducer(initialAppFlowState, { type: 'skipOnboarding' });

    expect(getActiveRoute(skipped)).toEqual({
      kind: 'auth',
      screen: 'login',
    });
  });

  it('returns signed-out users to login instead of onboarding', () => {
    const readyForAuth = appFlowReducer(initialAppFlowState, { type: 'skipOnboarding' });
    const signedIn = appFlowReducer(readyForAuth, { type: 'signIn' });
    const signedOut = appFlowReducer(signedIn, { type: 'signOut' });

    expect(getActiveRoute(signedIn)).toEqual({
      kind: 'tabs',
    });
    expect(getActiveRoute(signedOut)).toEqual({
      kind: 'auth',
      screen: 'login',
    });
  });

  it('switches between login and sign up screens without changing the stage', () => {
    const readyForAuth = appFlowReducer(initialAppFlowState, { type: 'skipOnboarding' });
    const signUp = appFlowReducer(readyForAuth, { type: 'showSignUp' });
    const login = appFlowReducer(signUp, { type: 'showLogin' });

    expect(getActiveRoute(signUp)).toEqual({
      kind: 'auth',
      screen: 'signUp',
    });
    expect(getActiveRoute(login)).toEqual({
      kind: 'auth',
      screen: 'login',
    });
  });
});
