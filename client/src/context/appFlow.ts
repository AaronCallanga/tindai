import type { LocalAuthMode, PermissionStatus } from '@/features/local-db/types';

export type AuthScreen = 'login' | 'signUp';

export type AppFlowState = {
  onboardingCompleted: boolean;
  authMode: LocalAuthMode;
  authScreen: AuthScreen;
  isAuthScreenVisible: boolean;
  isAuthenticated: boolean;
  permissions: {
    microphone: PermissionStatus;
    storage: PermissionStatus;
  };
  tutorialShown: boolean;
};

export type AppFlowAction =
  | { type: 'hydrate'; state: Partial<AppFlowState> }
  | { type: 'chooseGuestMode' }
  | { type: 'showLogin' }
  | { type: 'showSignUp' }
  | { type: 'closeAuth' }
  | { type: 'completeOnboarding' }
  | { type: 'setMicrophonePermission'; status: PermissionStatus }
  | { type: 'setStoragePermission'; status: PermissionStatus }
  | { type: 'markTutorialShown' }
  | { type: 'signIn' }
  | { type: 'signOut' };

export type ActiveRoute =
  | { kind: 'authChoice' }
  | { kind: 'auth'; screen: AuthScreen }
  | { kind: 'permissions' }
  | { kind: 'tabs' };

export const initialAppFlowState: AppFlowState = {
  onboardingCompleted: false,
  authMode: null,
  authScreen: 'login',
  isAuthScreenVisible: false,
  isAuthenticated: false,
  permissions: {
    microphone: 'pending',
    storage: 'pending',
  },
  tutorialShown: false,
};

export function appFlowReducer(state: AppFlowState, action: AppFlowAction): AppFlowState {
  switch (action.type) {
    case 'hydrate':
      return {
        ...state,
        ...action.state,
        permissions: {
          ...state.permissions,
          ...action.state.permissions,
        },
      };
    case 'chooseGuestMode':
      return {
        ...state,
        authMode: 'guest',
        isAuthScreenVisible: false,
      };
    case 'showLogin':
      return {
        ...state,
        authMode: 'account',
        authScreen: 'login',
        isAuthScreenVisible: true,
      };
    case 'showSignUp':
      return {
        ...state,
        authMode: 'account',
        authScreen: 'signUp',
        isAuthScreenVisible: true,
      };
    case 'closeAuth':
      return {
        ...state,
        authMode: state.isAuthenticated ? 'account' : null,
        isAuthScreenVisible: false,
      };
    case 'completeOnboarding':
      return {
        ...state,
        onboardingCompleted: true,
      };
    case 'setMicrophonePermission':
      return {
        ...state,
        permissions: {
          ...state.permissions,
          microphone: action.status,
        },
      };
    case 'setStoragePermission':
      return {
        ...state,
        permissions: {
          ...state.permissions,
          storage: action.status,
        },
      };
    case 'markTutorialShown':
      return {
        ...state,
        tutorialShown: true,
      };
    case 'signIn':
      return {
        ...state,
        authMode: 'account',
        isAuthScreenVisible: false,
        isAuthenticated: true,
      };
    case 'signOut':
      return {
        ...state,
        authMode: 'guest',
        isAuthScreenVisible: false,
        isAuthenticated: false,
      };
    default:
      return state;
  }
}

export function getActiveRoute(state: AppFlowState): ActiveRoute {
  if (state.isAuthScreenVisible) {
    return {
      kind: 'auth',
      screen: state.authScreen,
    };
  }

  if (!state.onboardingCompleted) {
    if (state.authMode === null) {
      return {
        kind: 'authChoice',
      };
    }

    return {
      kind: 'permissions',
    };
  }

  return {
    kind: 'tabs',
  };
}
