import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { ClientTabLayout } from '@/components/ClientTabLayout';
import { getClientEnv } from '@/config/env';
import { supabase } from '@/config/supabase';
import { useAuth } from '@/context/AuthContext';
import { useLocalData } from '@/features/local-data/LocalDataContext';
import { colors } from '@/navigation/colors';

function getMigrationLabel(status: string | undefined) {
  switch (status) {
    case 'in_progress':
      return 'Inaakyat ang tala mo...';
    case 'completed':
      return 'Naakyat na ang tala mo.';
    case 'needs_review':
      return 'May ilang tala na kailangang tingnan.';
    case 'failed':
      return 'Hindi naakyat. Subukan ulit.';
    default:
      return 'Wala pang inaakyat.';
  }
}

export function ProfileScreen() {
  const { isAuthenticated, signOut, showLogin, showSignUp } = useAuth();
  const { store, appState, refresh, renameLocalStore, resolvePendingClaim } = useLocalData();
  const [storeName, setStoreName] = useState('');
  const [isSavingStore, setIsSavingStore] = useState(false);
  const [storeMessage, setStoreMessage] = useState<string | null>(null);
  const [isResolvingClaim, setIsResolvingClaim] = useState(false);

  useEffect(() => {
    setStoreName(store?.name ?? '');
  }, [store?.name]);

  const normalizedStoreName = storeName.trim();
  const hasStoreNameChanges = useMemo(() => {
    if (!store) {
      return false;
    }

    return normalizedStoreName !== store.name.trim();
  }, [normalizedStoreName, store]);

  const canSaveStoreName = Boolean(store && !isSavingStore && normalizedStoreName && hasStoreNameChanges);
  const hasPendingClaim = Boolean(appState?.pendingClaimOwnerUserId);

  const saveStoreName = async () => {
    if (!store || isSavingStore || !hasStoreNameChanges) {
      return;
    }

    const name = normalizedStoreName;
    if (!name) {
      setStoreMessage('Lagyan ng pangalan ang tindahan.');
      return;
    }

    setIsSavingStore(true);
    setStoreMessage(null);

    try {
      if (!isAuthenticated) {
        await renameLocalStore(name);
        setStoreMessage('Napalitan na ang pangalan ng tindahan.');
        return;
      }

      const { data } = await supabase.auth.getSession();
      const accessToken = data.session?.access_token;
      if (!accessToken) {
        setStoreMessage('Mag-login ulit para ma-save ang pangalan.');
        return;
      }

      const env = getClientEnv();
      const response = await fetch(`${env.EXPO_PUBLIC_API_BASE_URL}/api/v1/store/me`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(payload?.message ?? 'Hindi na-save ang pangalan ng tindahan.');
      }

      await refresh();
      setStoreMessage('Napalitan na ang pangalan ng tindahan.');
    } catch (caughtError) {
      setStoreMessage(caughtError instanceof Error ? caughtError.message : 'Hindi na-save ang pangalan ng tindahan.');
    } finally {
      setIsSavingStore(false);
    }
  };

  const handleResolveClaim = async (decision: 'claim' | 'discard') => {
    setIsResolvingClaim(true);
    try {
      await resolvePendingClaim(decision);
    } finally {
      setIsResolvingClaim(false);
    }
  };

  return (
    <ClientTabLayout
      label="Account"
      title="Ayusin ang account at tindahan mo."
      subtitle="Pwede ka pa ring gumamit kahit walang account. Dito ka magkokonekta kapag handa ka na."
      highlights={['Madaling palitan ang pangalan ng tindahan', 'Pwede gamitin kahit walang account', 'Kontrolado mo kung alin ang itutuloy na tala']}
    >
      <View style={styles.actionCard}>
        <Text style={styles.actionTitle}>Pangalan ng tindahan</Text>
        <Text style={styles.actionBody}>Pwede mo itong palitan anumang oras.</Text>

        <View style={styles.settingBlock}>
          <Text style={styles.settingLabel}>Pangalan</Text>
          <TextInput
            value={storeName}
            onChangeText={(value) => {
              setStoreName(value);
              setStoreMessage(null);
            }}
            placeholder="Halimbawa: Nena Store"
            placeholderTextColor={colors.muted}
            style={styles.settingInput}
          />
        </View>

        <View style={styles.readOnlyRow}>
          <View style={styles.readOnlyCard}>
            <Text style={styles.readOnlyLabel}>Pera</Text>
            <Text style={styles.readOnlyValue}>{store?.currencyCode ?? 'PHP'}</Text>
          </View>
          <View style={styles.readOnlyCard}>
            <Text style={styles.readOnlyLabel}>Oras</Text>
            <Text style={styles.readOnlyValue}>{store?.timezone ?? 'Asia/Manila'}</Text>
          </View>
        </View>

        <Pressable
          disabled={!canSaveStoreName}
          style={[styles.primaryButton, !canSaveStoreName && styles.buttonDisabled]}
          onPress={() => void saveStoreName()}
        >
          {isSavingStore ? <ActivityIndicator color={colors.surface} size="small" /> : <Text style={styles.primaryLabel}>I-save ang pangalan</Text>}
        </Pressable>

        {storeMessage ? <Text style={styles.storeMessage}>{storeMessage}</Text> : null}
      </View>

      <View style={styles.actionCard}>
        <Text style={styles.actionTitle}>Pagkonekta ng account</Text>
        {!isAuthenticated ? (
          <>
            <Text style={styles.actionBody}>Ang mga tala mo ay mananatili muna sa phone na ito.</Text>
            <Pressable style={styles.primaryButton} onPress={showSignUp}>
              <Text style={styles.primaryLabel}>Gumawa ng account</Text>
            </Pressable>
            <Pressable style={styles.secondaryButton} onPress={showLogin}>
              <Text style={styles.secondaryLabel}>Mag-login</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.actionBody}>{getMigrationLabel(appState?.migrationStatus)}</Text>
            {appState?.lastMigrationError ? <Text style={styles.errorText}>{appState.lastMigrationError}</Text> : null}
            {hasPendingClaim ? (
              <View style={styles.claimActions}>
                <Pressable
                  style={[styles.primaryButton, isResolvingClaim && styles.buttonDisabled]}
                  onPress={() => void handleResolveClaim('claim')}
                  disabled={isResolvingClaim}
                >
                  <Text style={styles.primaryLabel}>Ituloy ang mga tala</Text>
                </Pressable>
                <Pressable
                  style={[styles.secondaryButton, isResolvingClaim && styles.buttonDisabled]}
                  onPress={() => void handleResolveClaim('discard')}
                  disabled={isResolvingClaim}
                >
                  <Text style={styles.secondaryLabel}>Huwag ituloy ang mga tala</Text>
                </Pressable>
              </View>
            ) : null}
            <Pressable style={styles.signOutButton} onPress={() => void signOut()}>
              <Text style={styles.signOutText}>Mag-logout</Text>
            </Pressable>
          </>
        )}
      </View>
    </ClientTabLayout>
  );
}

const styles = StyleSheet.create({
  actionCard: {
    gap: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 20,
  },
  actionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  actionBody: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 22,
  },
  settingBlock: {
    gap: 8,
  },
  settingLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  settingInput: {
    minHeight: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    paddingHorizontal: 14,
    fontSize: 15,
    fontWeight: '600',
  },
  readOnlyRow: {
    flexDirection: 'row',
    gap: 10,
  },
  readOnlyCard: {
    flex: 1,
    gap: 4,
    borderRadius: 14,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  readOnlyLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  readOnlyValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  primaryButton: {
    minHeight: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryDeep,
    paddingHorizontal: 14,
  },
  primaryLabel: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '800',
  },
  secondaryButton: {
    minHeight: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: 14,
  },
  secondaryLabel: {
    color: colors.primaryDeep,
    fontSize: 14,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  storeMessage: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  claimActions: {
    gap: 8,
  },
  errorText: {
    color: '#BA1A1A',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  signOutButton: {
    marginTop: 4,
    minHeight: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(242, 153, 74, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(242, 153, 74, 0.3)',
  },
  signOutText: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: '700',
  },
});
