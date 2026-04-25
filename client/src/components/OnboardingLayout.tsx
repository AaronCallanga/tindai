import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/PrimaryButton';
import { colors } from '@/navigation/colors';

type OnboardingLayoutProps = {
  step: 1 | 2 | 3;
  eyebrow: string;
  title: string;
  description: string;
  panelTitle: string;
  panelBody: string;
  points: string[];
  nextLabel: string;
  onNext: () => void;
  onSkip: () => void;
};

export function OnboardingLayout({
  step,
  eyebrow,
  title,
  description,
  panelTitle,
  panelBody,
  points,
  nextLabel,
  onNext,
  onSkip,
}: OnboardingLayoutProps) {
  return (
    <LinearGradient colors={[colors.background, '#FBF3D7', '#EEE0B4']} style={styles.screen}>
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerRow}>
          <Text style={styles.progressText}>Step {step} of 3</Text>
          <Pressable onPress={onSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>

        <View style={styles.progressTrack}>
          {[1, 2, 3].map((value) => (
            <View
              key={value}
              style={[styles.progressDot, value <= step ? styles.progressDotActive : undefined]}
            />
          ))}
        </View>

        <View style={styles.content}>
          <View style={styles.copyBlock}>
            <Text style={styles.eyebrow}>{eyebrow}</Text>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.description}>{description}</Text>
          </View>

          <View style={styles.panel}>
            <View style={styles.panelBadge}>
              <Text style={styles.panelBadgeText}>0{step}</Text>
            </View>
            <Text style={styles.panelTitle}>{panelTitle}</Text>
            <Text style={styles.panelBody}>{panelBody}</Text>

            <View style={styles.points}>
              {points.map((point) => (
                <View key={point} style={styles.pointCard}>
                  <View style={styles.pointDot} />
                  <Text style={styles.pointText}>{point}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <PrimaryButton label={nextLabel} onPress={onNext} />
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
    paddingHorizontal: 24,
    paddingVertical: 18,
  },
  glowTop: {
    position: 'absolute',
    top: -80,
    right: -40,
    width: 230,
    height: 230,
    borderRadius: 230,
    backgroundColor: 'rgba(31, 122, 99, 0.12)',
  },
  glowBottom: {
    position: 'absolute',
    bottom: -90,
    left: -40,
    width: 260,
    height: 260,
    borderRadius: 260,
    backgroundColor: 'rgba(242, 153, 74, 0.14)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressText: {
    color: colors.primaryDeep,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  skipButton: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  skipText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  progressTrack: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  progressDot: {
    flex: 1,
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(31, 122, 99, 0.12)',
  },
  progressDotActive: {
    backgroundColor: colors.secondary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: 28,
  },
  copyBlock: {
    gap: 14,
  },
  eyebrow: {
    color: colors.primaryDeep,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    color: colors.text,
    fontSize: 40,
    fontWeight: '800',
    lineHeight: 46,
  },
  description: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 24,
    maxWidth: 360,
  },
  panel: {
    gap: 14,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255, 253, 245, 0.9)',
    padding: 24,
  },
  panelBadge: {
    alignSelf: 'flex-start',
    minWidth: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryDeep,
  },
  panelBadgeText: {
    color: colors.surface,
    fontSize: 18,
    fontWeight: '800',
  },
  panelTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  panelBody: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  points: {
    gap: 10,
    marginTop: 4,
  },
  pointCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    backgroundColor: colors.card,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  pointDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: colors.secondary,
  },
  pointText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  actions: {
    paddingBottom: 8,
  },
});
