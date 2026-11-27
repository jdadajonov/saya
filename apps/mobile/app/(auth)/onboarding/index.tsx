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
import { useAcceptInvitation } from '../../../src/features/family/hooks/use-invitations';
import { supabase } from '../../../src/platform/supabase';

type Mode = 'choose' | 'create' | 'join';

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
  const acceptInvitation = useAcceptInvitation();

  const [mode, setMode] = useState<Mode>('choose');
  const [name, setName] = useState('');
  const [locale, setLocale] = useState('ru');
  const [inviteCode, setInviteCode] = useState('');

  const handleContinue = async () => {
    if (!name.trim()) return;
    try {
      await createFamily.mutateAsync({ name: name.trim(), locale });
      router.push('/(auth)/onboarding/add-child');
    } catch (err: unknown) {
      Alert.alert(t('common.error'), (err as Error).message);
    }
  };

  const handleJoinFamily = () => {
    if (inviteCode.length !== 6) {
      Alert.alert('Ошибка', 'Введите 6-значный код приглашения');
      return;
    }

    acceptInvitation.mutate(inviteCode.toUpperCase(), {
      onSuccess: (data) => {
        Alert.alert(
          'Добро пожаловать!',
          `Вы присоединились к семье «${data.family_name}»`,
          [{ text: 'OK', onPress: () => router.replace('/(parent)') }]
        );
      },
      onError: (error) => {
        const message =
          error.message === 'Invalid or expired invitation code'
            ? 'Неверный или просроченный код'
            : error.message === 'Already a member of this family'
            ? 'Вы уже состоите в этой семье'
            : 'Не удалось присоединиться';
        Alert.alert('Ошибка', message);
      },
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace('/(auth)/login');
  };

  // Choose mode screen
  if (mode === 'choose') {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.background,
          paddingHorizontal: theme.spacing[6],
          paddingTop: 100,
        }}
      >
        <Text style={{ fontSize: 48, textAlign: 'center', marginBottom: theme.spacing[2] }}>
          👋
        </Text>
        <Text
          style={{
            fontSize: theme.textStyles.title.fontSize,
            fontWeight: '900',
            color: theme.colors.ink,
            textAlign: 'center',
            marginBottom: theme.spacing[2],
          }}
        >
          Добро пожаловать!
        </Text>
        <Text
          style={{
            fontSize: theme.textStyles.body.fontSize,
            color: theme.colors.textSecondary,
            textAlign: 'center',
            marginBottom: theme.spacing[8],
          }}
        >
          Как вы хотите начать?
        </Text>

        <TouchableOpacity
          style={{
            backgroundColor: theme.colors.primary,
            borderRadius: theme.borderRadius.card,
            borderWidth: theme.borderWidth.thick,
            borderColor: theme.colors.ink,
            padding: theme.spacing[5],
            marginBottom: theme.spacing[4],
            ...theme.shadows.card,
          }}
          onPress={() => setMode('create')}
        >
          <Text style={{ fontSize: 32, textAlign: 'center', marginBottom: theme.spacing[2] }}>
            👨‍👩‍👧‍👦
          </Text>
          <Text
            style={{
              fontSize: theme.textStyles.heading.fontSize,
              fontWeight: '800',
              color: theme.colors.onFill,
              textAlign: 'center',
            }}
          >
            Создать семью
          </Text>
          <Text
            style={{
              fontSize: theme.textStyles.caption.fontSize,
              color: theme.colors.onFill,
              textAlign: 'center',
              marginTop: theme.spacing[1],
              opacity: 0.8,
            }}
          >
            Я первый родитель в приложении
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.card,
            borderWidth: theme.borderWidth.thick,
            borderColor: theme.colors.ink,
            padding: theme.spacing[5],
            ...theme.shadows.card,
          }}
          onPress={() => setMode('join')}
        >
          <Text style={{ fontSize: 32, textAlign: 'center', marginBottom: theme.spacing[2] }}>
            🔗
          </Text>
          <Text
            style={{
              fontSize: theme.textStyles.heading.fontSize,
              fontWeight: '800',
              color: theme.colors.ink,
              textAlign: 'center',
            }}
          >
            Присоединиться
          </Text>
          <Text
            style={{
              fontSize: theme.textStyles.caption.fontSize,
              color: theme.colors.textSecondary,
              textAlign: 'center',
              marginTop: theme.spacing[1],
            }}
          >
            У меня есть код приглашения
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Join family screen
  if (mode === 'join') {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.background,
          paddingHorizontal: theme.spacing[6],
          paddingTop: 80,
        }}
      >
        <TouchableOpacity
          onPress={() => setMode('choose')}
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
            marginBottom: theme.spacing[4],
          }}
        >
          <Text style={{ fontSize: 20, color: theme.colors.ink }}>←</Text>
        </TouchableOpacity>

        <Text style={{ fontSize: 48, textAlign: 'center', marginBottom: theme.spacing[2] }}>
          🔗
        </Text>
        <Text
          style={{
            fontSize: theme.textStyles.title.fontSize,
            fontWeight: '900',
            color: theme.colors.ink,
            textAlign: 'center',
            marginBottom: theme.spacing[2],
          }}
        >
          Присоединиться к семье
        </Text>
        <Text
          style={{
            fontSize: theme.textStyles.body.fontSize,
            color: theme.colors.textSecondary,
            textAlign: 'center',
            marginBottom: theme.spacing[6],
          }}
        >
          Введите код, который вам отправил член семьи
        </Text>

        <View
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.card,
            borderWidth: theme.borderWidth.thick,
            borderColor: theme.colors.ink,
            padding: theme.spacing[4],
            marginBottom: theme.spacing[4],
            ...theme.shadows.card,
          }}
        >
          <Text
            style={{
              fontSize: theme.textStyles.caption.fontSize,
              fontWeight: '600',
              color: theme.colors.textSecondary,
              marginBottom: theme.spacing[2],
              textAlign: 'center',
            }}
          >
            Код приглашения
          </Text>
          <TextInput
            style={{
              fontSize: 32,
              fontWeight: '900',
              color: theme.colors.ink,
              textAlign: 'center',
              letterSpacing: 6,
              paddingVertical: theme.spacing[3],
            }}
            placeholder="XXXXXX"
            placeholderTextColor={theme.colors.disabled}
            value={inviteCode}
            onChangeText={(text) => setInviteCode(text.toUpperCase().slice(0, 6))}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={6}
          />
        </View>

        <TouchableOpacity
          style={{
            backgroundColor:
              inviteCode.length === 6 ? theme.colors.primary : theme.colors.disabled,
            borderRadius: theme.borderRadius.button,
            borderWidth: theme.borderWidth.regular,
            borderColor: theme.colors.ink,
            paddingVertical: theme.spacing[4],
            alignItems: 'center',
            ...theme.shadows.card,
          }}
          onPress={handleJoinFamily}
          disabled={inviteCode.length !== 6 || acceptInvitation.isPending}
        >
          {acceptInvitation.isPending ? (
            <ActivityIndicator color={theme.colors.onFill} />
          ) : (
            <Text
              style={{
                fontSize: theme.textStyles.body.fontSize,
                fontWeight: '700',
                color: theme.colors.onFill,
              }}
            >
              Присоединиться
            </Text>
          )}
        </TouchableOpacity>
      </View>
    );
  }

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
