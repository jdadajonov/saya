import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../src/ui/theme-provider';
import { useAcceptInvitation } from '../../src/features/family/hooks/use-invitations';

export default function JoinFamilyScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const acceptMut = useAcceptInvitation();

  const [code, setCode] = useState('');

  const handleJoin = () => {
    if (code.length !== 6) {
      Alert.alert('Ошибка', 'Введите 6-значный код приглашения');
      return;
    }

    acceptMut.mutate(code.toUpperCase(), {
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

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={{ flex: 1, padding: theme.spacing[5], paddingTop: 80 }}>
        {/* Header */}
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
            marginBottom: theme.spacing[4],
          }}
        >
          <Text style={{ fontSize: 20, color: theme.colors.ink }}>←</Text>
        </TouchableOpacity>

        {/* Title */}
        <Text
          style={{
            fontSize: 32,
            fontWeight: '900',
            color: theme.colors.ink,
            marginBottom: theme.spacing[2],
          }}
        >
          Присоединиться к семье
        </Text>
        <Text
          style={{
            fontSize: theme.textStyles.body.fontSize,
            color: theme.colors.textSecondary,
            marginBottom: theme.spacing[6],
          }}
        >
          Введите код приглашения, который вам отправил член семьи
        </Text>

        {/* Code input */}
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
              color: theme.colors.ink,
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
            value={code}
            onChangeText={(text) => setCode(text.toUpperCase().slice(0, 6))}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={6}
          />
        </View>

        {/* Join button */}
        <TouchableOpacity
          style={{
            backgroundColor:
              code.length === 6 ? theme.colors.primary : theme.colors.disabled,
            borderRadius: theme.borderRadius.button,
            borderWidth: theme.borderWidth.regular,
            borderColor: theme.colors.ink,
            paddingVertical: theme.spacing[4],
            alignItems: 'center',
            ...theme.shadows.card,
          }}
          onPress={handleJoin}
          disabled={code.length !== 6 || acceptMut.isPending}
        >
          {acceptMut.isPending ? (
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
    </KeyboardAvoidingView>
  );
}
