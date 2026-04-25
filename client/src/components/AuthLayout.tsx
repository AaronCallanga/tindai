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
    <LinearGradient colors={[colors.background, '#F8F1DA', '#EDE2BD']} style={styles.screen}>
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
    top: -72,
    right: -24,
    width: 240,
    height: 240,
    borderRadius: 240,
    backgroundColor: 'rgba(31, 122, 99, 0.14)',
  },
  glowBottom: {
    position: 'absolute',
    bottom: -110,
    left: -40,
    width: 280,
    height: 280,
    borderRadius: 280,
    backgroundColor: 'rgba(242, 201, 76, 0.16)',
  },
  card: {
    gap: 22,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255, 253, 245, 0.92)',
    padding: 26,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: colors.card,
    paddingHorizontal: 15,
    paddingVertical: 9,
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
    lineHeight: 36,
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
