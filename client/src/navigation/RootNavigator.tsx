import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useAuth } from '@/context/AuthContext';
import { colors } from '@/navigation/colors';
import { HomeTabs } from '@/screens/HomeTabs';
import { LoginScreen } from '@/screens/auth/LoginScreen';
import { SignUpScreen } from '@/screens/auth/SignUpScreen';
import { AuthChoiceScreen } from '@/screens/onboarding/AuthChoiceScreen';
import { OnboardingOverlay } from '@/screens/onboarding/OnboardingOverlay';
import { PermissionsScreen } from '@/screens/onboarding/PermissionsScreen';

export function RootNavigator() {
  const { activeRoute, isAuthLoading, onboardingCompleted, tutorialShown, markTutorialShown } = useAuth();

  if (isAuthLoading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color={colors.primaryDeep} size="large" />
      </View>
    );
  }

  if (activeRoute.kind === 'authChoice') {
    return <AuthChoiceScreen />;
  }

  if (activeRoute.kind === 'auth') {
    return activeRoute.screen === 'login' ? <LoginScreen /> : <SignUpScreen />;
  }

  if (activeRoute.kind === 'permissions') {
    return <PermissionsScreen />;
  }

  return (
    <View style={styles.tabsRoot}>
      <HomeTabs />
      {onboardingCompleted && !tutorialShown ? (
        <OnboardingOverlay onDismiss={() => void markTutorialShown()} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  tabsRoot: {
    flex: 1,
  },
});

