import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/navigation/colors';

type OnboardingOverlayProps = {
  onDismiss: () => void;
};

export function OnboardingOverlay({ onDismiss }: OnboardingOverlayProps) {
  return (
    <View pointerEvents="box-none" style={styles.layer}>
      <View style={styles.backdrop} />
      <View style={styles.card}>
        <Text style={styles.eyebrow}>Unang gamit</Text>
        <Text style={styles.title}>I-tap dito para magsalita ng utos</Text>
        <Text style={styles.body}>Halimbawa: "Nakabenta ako ng dalawang Coke."</Text>
        <View style={styles.arrowWrap}>
          <Text style={styles.arrow}>↓</Text>
          <Text style={styles.arrowLabel}>Mic button</Text>
        </View>
        <View style={styles.actions}>
          <Pressable style={styles.secondaryButton} onPress={onDismiss}>
            <Text style={styles.secondaryLabel}>Skip</Text>
          </Pressable>
          <Pressable style={styles.primaryButton} onPress={onDismiss}>
            <Text style={styles.primaryLabel}>Sige</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.42)',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    gap: 10,
  },
  eyebrow: {
    color: colors.primaryDeep,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 30,
  },
  body: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
  },
  arrowWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  arrow: {
    color: colors.primaryDeep,
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 34,
  },
  arrowLabel: {
    color: colors.primaryDeep,
    fontSize: 13,
    fontWeight: '700',
  },
  actions: {
    marginTop: 6,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  secondaryButton: {
    minHeight: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  secondaryLabel: {
    color: colors.primaryDeep,
    fontSize: 14,
    fontWeight: '700',
  },
  primaryButton: {
    minHeight: 42,
    borderRadius: 12,
    backgroundColor: colors.primaryDeep,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primaryLabel: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '700',
  },
});
