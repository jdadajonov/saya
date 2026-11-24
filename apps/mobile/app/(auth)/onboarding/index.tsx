import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../src/ui/theme-provider';
import { useCreateFamily } from '../../../src/features/family/hooks/use-family';
import { supabase } from '../../../src/platform/supabase';

const LOCALES = [
  { value: 'ru', label: '🇷🇺 Русский' },
  { value: 'uz', label: "🇺🇿 O'zbekcha" },
  { value: 'en', label: '🇬🇧 English' },
];

export default function CreateFamilyScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace('/(auth)/login');
  };

  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        backgroundColor: theme.colors.background,
        paddingHorizontal: theme.spacing[6],
        paddingTop: 80,
        paddingBottom: 48,
      }}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={{ fontSize: 48, textAlign: 'center', marginBottom: theme.spacing[2] }}>
        👨‍👩‍👧‍👦
      </Text>
      <Text
        style={{
          fontSize: theme.textStyles.title.fontSize,
          fontWeight: '900',
          color: theme.colors.ink,
          textAlign: 'center',
          marginBottom: theme.spacing[6],
        }}
        accessibilityRole="header"
      >
        {t('onboarding.createFamily')}
      </Text>

      <Text
        style={{
          fontSize: theme.textStyles.caption.fontSize,
          fontWeight: '700',
          color: theme.colors.textSecondary,
          marginBottom: theme.spacing[2],
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}
      >
        {t('onboarding.familyNameLabel')}
      </Text>
      <TextInput
        style={{
          borderWidth: theme.borderWidth.regular,
          borderColor: theme.colors.ink,
          borderRadius: theme.borderRadius.card,
          paddingHorizontal: theme.spacing[4],
          paddingVertical: theme.spacing[4],
          fontSize: theme.textStyles.body.fontSize,
          color: theme.colors.ink,
          backgroundColor: theme.colors.surface,
          fontWeight: '600',
          ...theme.shadows.card,
        }}
        value={name}
        onChangeText={setName}
        placeholder={t('onboarding.familyNamePlaceholder')}
        placeholderTextColor={theme.colors.textSecondary}
        autoCapitalize="words"
        accessibilityLabel={t('onboarding.familyNameLabel')}
      />

      <Text
        style={{
          fontSize: theme.textStyles.caption.fontSize,
          fontWeight: '700',
          color: theme.colors.textSecondary,
          marginTop: theme.spacing[5],
          marginBottom: theme.spacing[2],
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}
      >
        {t('onboarding.localeLabel')}
      </Text>
      <View
        style={{
          flexDirection: 'row',
          gap: theme.spacing[2],
        }}
        accessibilityRole="radiogroup"
      >
        {LOCALES.map((l) => (
          <TouchableOpacity
            key={l.value}
            style={{
              flex: 1,
              paddingVertical: theme.spacing[3],
              borderRadius: theme.borderRadius.sm,
              borderWidth: theme.borderWidth.regular,
              borderColor: locale === l.value ? theme.colors.ink : theme.colors.disabled,
              backgroundColor: locale === l.value ? theme.tints.sun : theme.colors.surface,
              alignItems: 'center',
              ...(locale === l.value ? theme.shadows.chip : {}),
            }}
            onPress={() => setLocale(l.value)}
            accessibilityRole="radio"
            accessibilityState={{ checked: locale === l.value }}
            accessibilityLabel={l.label}
          >
            <Text
              style={{
                fontSize: theme.textStyles.caption.fontSize,
                color: theme.colors.ink,
                fontWeight: locale === l.value ? '700' : '500',
              }}
            >
              {l.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={{
          backgroundColor: !name.trim() || createFamily.isPending
            ? theme.colors.disabled
            : theme.colors.primary,
          borderRadius: theme.borderRadius.button,
          borderWidth: theme.borderWidth.thick,
          borderColor: theme.colors.ink,
          paddingVertical: theme.spacing[4],
          alignItems: 'center',
          marginTop: theme.spacing[6],
          ...theme.shadows.button,
        }}
        onPress={handleContinue}
        disabled={!name.trim() || createFamily.isPending}
        accessibilityRole="button"
        accessibilityLabel={t('onboarding.continue')}
      >
        {createFamily.isPending ? (
          <ActivityIndicator color={theme.colors.onFill} />
        ) : (
          <Text
            style={{
              fontSize: theme.textStyles.body.fontSize,
              fontWeight: '900',
              color: theme.colors.onFill,
            }}
          >
            {t('onboarding.continue')} →
          </Text>
        )}
      </TouchableOpacity>

      {__DEV__ && (
        <TouchableOpacity
          style={{
            marginTop: theme.spacing[6],
            padding: theme.spacing[3],
          }}
          onPress={handleSignOut}
        >
          <Text style={{
            fontSize: theme.textStyles.caption.fontSize,
            color: theme.colors.error,
            textAlign: 'center',
          }}>
            🚪 Выйти и войти заново
          </Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}
