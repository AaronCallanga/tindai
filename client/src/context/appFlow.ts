export type AuthScreen = 'login' | 'signUp';
export type OnboardingStep = 1 | 2 | 3;

export type AppFlowState = {
  hasCompletedOnboarding: boolean;
  onboardingStep: OnboardingStep;
  authScreen: AuthScreen;
  isAuthenticated: boolean;
};

export type AppFlowAction =
  | { type: 'advanceOnboarding' }
  | { type: 'skipOnboarding' }
  | { type: 'showLogin' }
  | { type: 'showSignUp' }
  | { type: 'signIn' }
  | { type: 'signOut' };

export type ActiveRoute =
  | { kind: 'onboarding'; step: OnboardingStep }
  | { kind: 'auth'; screen: AuthScreen }
  | { kind: 'tabs' };

export const initialAppFlowState: AppFlowState = {
  hasCompletedOnboarding: false,
  onboardingStep: 1,
  authScreen: 'login',
  isAuthenticated: false,
};

export function appFlowReducer(state: AppFlowState, action: AppFlowAction): AppFlowState {
  switch (action.type) {
    case 'advanceOnboarding':
      if (state.hasCompletedOnboarding) {
        return state;
      }

      if (state.onboardingStep === 3) {
        return {
          ...state,
          hasCompletedOnboarding: true,
          authScreen: 'login',
        };
      }

      return {
        ...state,
        onboardingStep: (state.onboardingStep + 1) as OnboardingStep,
      };
    case 'skipOnboarding':
      return {
        ...state,
        hasCompletedOnboarding: true,
        authScreen: 'login',
      };
    case 'showLogin':
      return {
        ...state,
        authScreen: 'login',
      };
    case 'showSignUp':
      return {
        ...state,
        authScreen: 'signUp',
      };
    case 'signIn':
      return {
        ...state,
        hasCompletedOnboarding: true,
        authScreen: 'login',
        isAuthenticated: true,
      };
    case 'signOut':
      return {
        ...state,
        authScreen: 'login',
        isAuthenticated: false,
      };
    default:
      return state;
  }
}

export function getActiveRoute(state: AppFlowState): ActiveRoute {
  if (!state.hasCompletedOnboarding) {
    return {
      kind: 'onboarding',
      step: state.onboardingStep,
    };
  }

  if (!state.isAuthenticated) {
    return {
      kind: 'auth',
      screen: state.authScreen,
    };
  }

  return {
    kind: 'tabs',
  };
}
