import { Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';

import { colors } from '@/navigation/colors';

export function PrimaryButton({
  label,
  onPress,
  variant = 'solid',
}: {
  label: string;
  onPress: () => void;
  variant?: 'solid' | 'ghost';
}) {
  const ghost = variant === 'ghost';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        ghost ? styles.ghost : styles.solid,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.label, ghost && styles.ghostLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  } satisfies ViewStyle,
  solid: {
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.primaryDeep,
  },
  ghost: {
    borderWidth: 1,
    borderColor: 'rgba(31, 122, 99, 0.24)',
    backgroundColor: colors.surface,
  },
  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.985 }],
  },
  label: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  ghostLabel: {
    color: colors.primaryDeep,
  },
});
