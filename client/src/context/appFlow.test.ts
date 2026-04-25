import { describe, expect, it } from 'vitest';

import { appFlowReducer, getActiveRoute, initialAppFlowState } from '@/context/appFlow';

describe('appFlowReducer', () => {
  it('starts on auth choice while onboarding remains incomplete', () => {
    expect(getActiveRoute(initialAppFlowState)).toEqual({
      kind: 'authChoice',
    });
    expect(initialAppFlowState.onboardingCompleted).toBe(false);
  });

  it('completes onboarding and moves authenticated users to tabs', () => {
    const guestChosen = appFlowReducer(initialAppFlowState, { type: 'chooseGuestMode' });
    const done = appFlowReducer(guestChosen, { type: 'completeOnboarding' });

    expect(done.onboardingCompleted).toBe(true);
    expect(getActiveRoute(done)).toEqual({ kind: 'tabs' });
  });

  it('keeps signed-out users in onboarding flow until onboarding is completed', () => {
    const signedIn = appFlowReducer(
      appFlowReducer(initialAppFlowState, { type: 'completeOnboarding' }),
      { type: 'signIn' },
    );
    const signedOut = appFlowReducer(signedIn, { type: 'signOut' });

    expect(getActiveRoute(signedIn)).toEqual({ kind: 'tabs' });
    expect(getActiveRoute(signedOut)).toEqual({ kind: 'tabs' });
  });

  it('shows and hides auth screens on demand', () => {
    const signUp = appFlowReducer(initialAppFlowState, { type: 'showSignUp' });
    const login = appFlowReducer(signUp, { type: 'showLogin' });
    const closed = appFlowReducer(login, { type: 'closeAuth' });

    expect(getActiveRoute(signUp)).toEqual({ kind: 'auth', screen: 'signUp' });
    expect(getActiveRoute(login)).toEqual({ kind: 'auth', screen: 'login' });
    expect(getActiveRoute(closed)).toEqual({ kind: 'authChoice' });
  });
});
