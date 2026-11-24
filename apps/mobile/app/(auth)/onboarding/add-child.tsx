import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAddChild } from '../../../src/features/family/hooks/use-family';
import type { Child } from '../../../src/features/family/stores/auth-store';

export default function AddFirstChildScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const addChild = useAddChild();

  const [displayName, setDisplayName] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [ageBand, setAgeBand] = useState<Child['ageBand']>('7-9');

  const handleFinish = async () => {
    const year = parseInt(birthYear, 10);
    if (!displayName.trim() || !year || year < 2001 || year > 2023) return;

    try {
      await addChild.mutateAsync({ displayName: displayName.trim(), birthYear: year, ageBand });
      router.replace('/(parent)');
    } catch (err: unknown) {
      Alert.alert(t('common.error'), (err as Error).message);
    }
  };

  const AGE_BANDS: Array<{ value: Child['ageBand']; label: string }> = [
    { value: '7-9', label: t('onboarding.ageBand79') },
    { value: '10-13', label: t('onboarding.ageBand1013') },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title} accessibilityRole="header">
        {t('onboarding.addChild')}
      </Text>

      <Text style={styles.label}>{t('onboarding.childNameLabel')}</Text>
      <TextInput
        style={styles.input}
        value={displayName}
        onChangeText={setDisplayName}
        placeholder={t('onboarding.childNamePlaceholder')}
        autoCapitalize="words"
        accessibilityLabel={t('onboarding.childNameLabel')}
      />

      <Text style={styles.label}>{t('onboarding.birthYearLabel')}</Text>
      <TextInput
        style={styles.input}
        value={birthYear}
        onChangeText={setBirthYear}
        placeholder={t('onboarding.birthYearPlaceholder')}
        keyboardType="number-pad"
        maxLength={4}
        accessibilityLabel={t('onboarding.birthYearLabel')}
      />

      <Text style={styles.label}>{t('onboarding.ageBandLabel')}</Text>
      <View style={styles.ageBandRow} accessibilityRole="radiogroup">
        {AGE_BANDS.map((band) => (
          <TouchableOpacity
            key={band.value}
            style={[styles.bandChip, ageBand === band.value && styles.bandChipActive]}
            onPress={() => setAgeBand(band.value)}
            accessibilityRole="radio"
            accessibilityState={{ checked: ageBand === band.value }}
            accessibilityLabel={band.label}
          >
            <Text style={[styles.bandText, ageBand === band.value && styles.bandTextActive]}>
              {band.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.button, addChild.isPending && styles.buttonDisabled]}
        onPress={handleFinish}
        disabled={addChild.isPending}
        accessibilityRole="button"
        accessibilityLabel={t('onboarding.finish')}
      >
        {addChild.isPending ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>{t('onboarding.finish')}</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#FFFEF0',
    paddingHorizontal: 24,
    paddingTop: 72,
    paddingBottom: 48,
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  ageBandRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  bandChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  bandChipActive: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
  bandText: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },
  bandTextActive: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
