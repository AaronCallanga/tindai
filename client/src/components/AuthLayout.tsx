import { LinearGradient } from 'expo-linear-gradient';
import { type ReactNode, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/PrimaryButton';
import { colors } from '@/navigation/colors';

type AuthLayoutProps = {
  badge: string;
  title: string;
  subtitle: string;
  submitLabel: string;
  alternateLabel: string;
  onSubmit: () => Promise<void> | void;
  onAlternatePress: () => void;
  children: ReactNode;
};

export function AuthLayout({
  badge,
  title,
  subtitle,
  submitLabel,
  alternateLabel,
  onSubmit,
  onAlternatePress,
  children,
}: AuthLayoutProps) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);

    try {
      await onSubmit();
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#fffaf5', '#ffefdc', '#ffe1c3']} style={styles.screen}>
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.card}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>

          <View style={styles.copyBlock}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>

          <View style={styles.form}>{children}</View>

          <View style={styles.actions}>
            <PrimaryButton label={loading ? 'Please wait...' : submitLabel} onPress={handleSubmit} />
            <Pressable onPress={onAlternatePress} style={styles.linkButton}>
              <Text style={styles.linkText}>{alternateLabel}</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  glowTop: {
    position: 'absolute',
    top: -60,
    right: -20,
    width: 220,
    height: 220,
    borderRadius: 220,
    backgroundColor: 'rgba(251, 146, 60, 0.18)',
  },
  glowBottom: {
    position: 'absolute',
    bottom: -100,
    left: -30,
    width: 260,
    height: 260,
    borderRadius: 260,
    backgroundColor: 'rgba(194, 65, 12, 0.12)',
  },
  card: {
    gap: 22,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.76)',
    padding: 24,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  badgeText: {
    color: colors.primaryDeep,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  copyBlock: {
    gap: 8,
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 23,
  },
  form: {
    gap: 16,
  },
  actions: {
    gap: 12,
  },
  linkButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  linkText: {
    color: colors.primaryDeep,
    fontSize: 15,
    fontWeight: '700',
  },
});
