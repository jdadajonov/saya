import { useState, useRef } from 'react';
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
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { useTheme } from '../../src/ui/theme-provider';
import { useLinkChildDevice } from '../../src/features/family/hooks/use-invitations';
import { useAuthStore } from '../../src/features/family/stores/auth-store';

const DEVICE_TOKEN_KEY = 'child_device_token';

async function getOrCreateDeviceToken(): Promise<string> {
  let token = await SecureStore.getItemAsync(DEVICE_TOKEN_KEY);
  if (!token) {
    token = Crypto.randomUUID();
    await SecureStore.setItemAsync(DEVICE_TOKEN_KEY, token);
  }
  return token;
}

export default function ChildLoginScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const linkMut = useLinkChildDevice();
  const { switchToChild } = useAuthStore();

  const [pin, setPin] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<Array<{ focus: () => void } | null>>([]);

  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleLogin = async () => {
    const pinCode = pin.join('');
    if (pinCode.length !== 6) {
      Alert.alert('Ошибка', 'Введите 6-значный PIN-код');
      return;
    }

    try {
      const deviceToken = await getOrCreateDeviceToken();

      linkMut.mutate(
        { pin: pinCode, deviceToken },
        {
          onSuccess: (data) => {
            switchToChild(data.child_id);
            Alert.alert(
              `Привет, ${data.child_name}!`,
              'Добро пожаловать в Saya!',
              [{ text: 'Начать!', onPress: () => router.replace('/(child)/(tabs)') }]
            );
          },
          onError: (error) => {
            const message =
              error.message === 'Invalid or expired PIN'
                ? 'Неверный или просроченный PIN-код. Попроси родителя создать новый.'
                : 'Не удалось подключиться';
            Alert.alert('Ошибка', message);
            setPin(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
          },
        }
      );
    } catch {
      Alert.alert('Ошибка', 'Не удалось подключиться');
    }
  };

  const isPinComplete = pin.every((d) => d !== '');

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View
        style={{
          flex: 1,
          padding: theme.spacing[5],
          paddingTop: 80,
          alignItems: 'center',
        }}
      >
        {/* Header */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            position: 'absolute',
            top: 60,
            left: theme.spacing[5],
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
        >
          <Text style={{ fontSize: 20, color: theme.colors.ink }}>←</Text>
        </TouchableOpacity>

        {/* Icon */}
        <View
          style={{
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: theme.tints.sun,
            borderWidth: theme.borderWidth.thick,
            borderColor: theme.colors.ink,
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 40,
            marginBottom: theme.spacing[4],
            ...theme.shadows.card,
          }}
        >
          <Text style={{ fontSize: 48 }}>🧒</Text>
        </View>

        {/* Title */}
        <Text
          style={{
            fontSize: 28,
            fontWeight: '900',
            color: theme.colors.ink,
            marginBottom: theme.spacing[2],
            textAlign: 'center',
          }}
        >
          Привет!
        </Text>
        <Text
          style={{
            fontSize: theme.textStyles.body.fontSize,
            color: theme.colors.textSecondary,
            marginBottom: theme.spacing[6],
            textAlign: 'center',
            paddingHorizontal: theme.spacing[4],
          }}
        >
          Попроси родителя показать PIN-код и введи его здесь
        </Text>

        {/* PIN input */}
        <View
          style={{
            flexDirection: 'row',
            gap: theme.spacing[2],
            marginBottom: theme.spacing[6],
          }}
        >
          {pin.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => { inputRefs.current[index] = ref; }}
              style={{
                width: 48,
                height: 64,
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.md,
                borderWidth: theme.borderWidth.thick,
                borderColor: digit ? theme.colors.primary : theme.colors.ink,
                fontSize: 28,
                fontWeight: '800',
                color: theme.colors.ink,
                textAlign: 'center',
              }}
              value={digit}
              onChangeText={(value) => handleDigitChange(index, value)}
              onKeyPress={({ nativeEvent }) =>
                handleKeyPress(index, nativeEvent.key)
              }
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        {/* Login button */}
        <TouchableOpacity
          style={{
            backgroundColor: isPinComplete
              ? theme.colors.primary
              : theme.colors.disabled,
            borderRadius: theme.borderRadius.button,
            borderWidth: theme.borderWidth.regular,
            borderColor: theme.colors.ink,
            paddingVertical: theme.spacing[4],
            paddingHorizontal: theme.spacing[8],
            alignItems: 'center',
            ...theme.shadows.card,
          }}
          onPress={handleLogin}
          disabled={!isPinComplete || linkMut.isPending}
        >
          {linkMut.isPending ? (
            <ActivityIndicator color={theme.colors.onFill} />
          ) : (
            <Text
              style={{
                fontSize: theme.textStyles.heading.fontSize,
                fontWeight: '700',
                color: theme.colors.onFill,
              }}
            >
              Войти
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
