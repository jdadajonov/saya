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
import { useAddChild } from '../../../src/features/family/hooks/use-family';
import type { Child } from '../../../src/features/family/stores/auth-store';

export default function AddChildScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const addChild = useAddChild();

  const [displayName, setDisplayName] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [ageBand, setAgeBand] = useState<Child['ageBand']>('7-9');

  const handleSave = async () => {
    const year = parseInt(birthYear, 10);
    if (!displayName.trim() || !year || year < 2001 || year > 2023) return;
    try {
      await addChild.mutateAsync({ displayName: displayName.trim(), birthYear: year, ageBand });
      router.back();
    } catch (err: unknown) {
      Alert.alert(t('common.error'), (err as Error).message);
    }
  };

  const AGE_BANDS: Array<{ value: Child['ageBand']; label: string; emoji: string }> = [
    { value: '7-9', label: t('onboarding.ageBand79'), emoji: '🧒' },
    { value: '10-13', label: t('onboarding.ageBand1013'), emoji: '🧑' },
  ];

  const isValid = displayName.trim() && birthYear.length === 4;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing[5],
        paddingTop: 60,
        paddingBottom: theme.spacing[4],
      }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: theme.colors.surface,
            borderWidth: theme.borderWidth.regular,
            borderColor: theme.colors.ink,
            alignItems: 'center',
            justifyContent: 'center',
            ...theme.shadows.chip,
          }}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
        >
          <Text style={{ fontSize: 20, color: theme.colors.ink }}>←</Text>
        </TouchableOpacity>
        <Text style={{
          fontSize: theme.textStyles.title.fontSize,
          fontWeight: '900',
          color: theme.colors.ink,
        }} accessibilityRole="header">
          {t('parent.addChild')}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: theme.spacing[5],
          paddingBottom: 48,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Child Name */}
        <Text style={{
          fontSize: theme.textStyles.caption.fontSize,
          fontWeight: '700',
          color: theme.colors.textSecondary,
          marginBottom: theme.spacing[2],
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}>
          {t('onboarding.childNameLabel')}
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
          value={displayName}
          onChangeText={setDisplayName}
          placeholder={t('onboarding.childNamePlaceholder')}
          placeholderTextColor={theme.colors.textSecondary}
          autoCapitalize="words"
          accessibilityLabel={t('onboarding.childNameLabel')}
        />

        {/* Birth Year */}
        <Text style={{
          fontSize: theme.textStyles.caption.fontSize,
          fontWeight: '700',
          color: theme.colors.textSecondary,
          marginTop: theme.spacing[5],
          marginBottom: theme.spacing[2],
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}>
          {t('onboarding.birthYearLabel')}
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
          value={birthYear}
          onChangeText={setBirthYear}
          placeholder={t('onboarding.birthYearPlaceholder')}
          placeholderTextColor={theme.colors.textSecondary}
          keyboardType="number-pad"
          maxLength={4}
          accessibilityLabel={t('onboarding.birthYearLabel')}
        />

        {/* Age Band */}
        <Text style={{
          fontSize: theme.textStyles.caption.fontSize,
          fontWeight: '700',
          color: theme.colors.textSecondary,
          marginTop: theme.spacing[5],
          marginBottom: theme.spacing[2],
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}>
          {t('onboarding.ageBandLabel')}
        </Text>
        <View
          style={{ flexDirection: 'row', gap: theme.spacing[3] }}
          accessibilityRole="radiogroup"
        >
          {AGE_BANDS.map((band) => (
            <TouchableOpacity
              key={band.value}
              style={{
                flex: 1,
                paddingVertical: theme.spacing[4],
                borderRadius: theme.borderRadius.card,
                borderWidth: theme.borderWidth.regular,
                borderColor: ageBand === band.value ? theme.colors.ink : theme.colors.disabled,
                backgroundColor: ageBand === band.value ? theme.tints.sun : theme.colors.surface,
                alignItems: 'center',
                ...(ageBand === band.value ? theme.shadows.card : {}),
              }}
              onPress={() => setAgeBand(band.value)}
              accessibilityRole="radio"
              accessibilityState={{ checked: ageBand === band.value }}
              accessibilityLabel={band.label}
            >
              <Text style={{ fontSize: 28, marginBottom: theme.spacing[1] }}>{band.emoji}</Text>
              <Text style={{
                fontSize: theme.textStyles.body.fontSize,
                color: theme.colors.ink,
                fontWeight: ageBand === band.value ? '700' : '500',
              }}>
                {band.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={{
            backgroundColor: !isValid || addChild.isPending
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
          onPress={handleSave}
          disabled={!isValid || addChild.isPending}
          accessibilityRole="button"
          accessibilityLabel={t('common.save')}
        >
          {addChild.isPending ? (
            <ActivityIndicator color={theme.colors.onFill} />
          ) : (
            <Text style={{
              fontSize: theme.textStyles.body.fontSize,
              fontWeight: '900',
              color: theme.colors.onFill,
            }}>
              {t('common.save')}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
