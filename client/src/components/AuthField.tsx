import { StyleSheet, Text, TextInput, View } from 'react-native';

import { colors } from '@/navigation/colors';

export function AuthField({
  label,
  placeholder,
  secureTextEntry,
}: {
  label: string;
  placeholder: string;
  secureTextEntry?: boolean;
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        secureTextEntry={secureTextEntry}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    minHeight: 54,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    paddingHorizontal: 16,
    fontSize: 15,
  },
});
