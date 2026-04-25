import { createContext, useContext, useMemo, useReducer, type ReactNode } from 'react';

import {
  appFlowReducer,
  getActiveRoute,
  initialAppFlowState,
  type ActiveRoute,
  type AuthScreen,
  type OnboardingStep,
} from '@/context/appFlow';

type AuthContextValue = {
  activeRoute: ActiveRoute;
  onboardingStep: OnboardingStep;
  isAuthenticated: boolean;
  authScreen: AuthScreen;
  nextOnboardingStep: () => void;
  skipOnboarding: () => void;
  showLogin: () => void;
  showSignUp: () => void;
  signIn: () => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appFlowReducer, initialAppFlowState);

  const value = useMemo<AuthContextValue>(
    () => ({
      activeRoute: getActiveRoute(state),
      onboardingStep: state.onboardingStep,
      isAuthenticated: state.isAuthenticated,
      authScreen: state.authScreen,
      nextOnboardingStep: () => dispatch({ type: 'advanceOnboarding' }),
      skipOnboarding: () => dispatch({ type: 'skipOnboarding' }),
      showLogin: () => dispatch({ type: 'showLogin' }),
      showSignUp: () => dispatch({ type: 'showSignUp' }),
      signIn: () => dispatch({ type: 'signIn' }),
      signOut: () => dispatch({ type: 'signOut' }),
    }),
    [state],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
