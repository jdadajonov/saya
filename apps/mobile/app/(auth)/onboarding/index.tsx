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
import { useCreateFamily } from '../../../src/features/family/hooks/use-family';

const LOCALES = [
  { value: 'ru', label: 'Русский' },
  { value: 'uz', label: "O'zbekcha" },
  { value: 'en', label: 'English' },
];

export default function CreateFamilyScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const createFamily = useCreateFamily();

  const [name, setName] = useState('');
  const [locale, setLocale] = useState('ru');

  const handleContinue = async () => {
    if (!name.trim()) return;
    try {
      await createFamily.mutateAsync({ name: name.trim(), locale });
      router.push('/(auth)/onboarding/add-child');
    } catch (err: unknown) {
      Alert.alert(t('common.error'), (err as Error).message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title} accessibilityRole="header">
        {t('onboarding.createFamily')}
      </Text>

      <Text style={styles.label}>{t('onboarding.familyNameLabel')}</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder={t('onboarding.familyNamePlaceholder')}
        autoCapitalize="words"
        accessibilityLabel={t('onboarding.familyNameLabel')}
      />

      <Text style={styles.label}>{t('onboarding.localeLabel')}</Text>
      <View style={styles.localeRow} accessibilityRole="radiogroup">
        {LOCALES.map((l) => (
          <TouchableOpacity
            key={l.value}
            style={[styles.localeChip, locale === l.value && styles.localeChipActive]}
            onPress={() => setLocale(l.value)}
            accessibilityRole="radio"
            accessibilityState={{ checked: locale === l.value }}
            accessibilityLabel={l.label}
          >
            <Text
              style={[styles.localeText, locale === l.value && styles.localeTextActive]}
            >
              {l.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.button, (!name.trim() || createFamily.isPending) && styles.buttonDisabled]}
        onPress={handleContinue}
        disabled={!name.trim() || createFamily.isPending}
        accessibilityRole="button"
        accessibilityLabel={t('onboarding.continue')}
      >
        {createFamily.isPending ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>{t('onboarding.continue')}</Text>
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
  localeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  localeChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  localeChipActive: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
  localeText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  localeTextActive: {
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
