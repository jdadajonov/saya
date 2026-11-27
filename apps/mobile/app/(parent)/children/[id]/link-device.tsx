import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../src/ui/theme-provider';
import { useAuthStore } from '../../../../src/features/family/stores/auth-store';
import { useCreateChildDevicePin } from '../../../../src/features/family/hooks/use-invitations';

export default function LinkChildDeviceScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const { id: childId } = useLocalSearchParams<{ id: string }>();
  const children = useAuthStore((s) => s.children);

  const child = children.find((c) => c.id === childId);
  const createPinMut = useCreateChildDevicePin();

  const [pin, setPin] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    if (!expiresAt) return;

    const interval = setInterval(() => {
      const left = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
      setTimeLeft(left);
      if (left === 0) {
        setPin(null);
        setExpiresAt(null);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const handleGeneratePin = () => {
    if (!childId) return;

    createPinMut.mutate(childId, {
      onSuccess: (data) => {
        setPin(data.pin);
        setExpiresAt(new Date(data.expires_at));
      },
      onError: () => {
        Alert.alert(t('common.error'), t('common.retry'));
      },
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: theme.spacing[5],
          paddingTop: 60,
          paddingBottom: theme.spacing[4],
          gap: theme.spacing[3],
        }}
      >
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
        >
          <Text style={{ fontSize: 20, color: theme.colors.ink }}>←</Text>
        </TouchableOpacity>
        <Text
          style={{
            flex: 1,
            fontSize: theme.textStyles.title.fontSize,
            fontWeight: '900',
            color: theme.colors.ink,
          }}
        >
          Подключить устройство
        </Text>
      </View>

      <View style={{ flex: 1, padding: theme.spacing[5] }}>
        {/* Child name */}
        <View
          style={{
            backgroundColor: theme.tints.violet,
            borderRadius: theme.borderRadius.card,
            borderWidth: theme.borderWidth.regular,
            borderColor: theme.colors.ink,
            padding: theme.spacing[4],
            marginBottom: theme.spacing[4],
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.spacing[3],
          }}
        >
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: theme.colors.surface,
              borderWidth: theme.borderWidth.regular,
              borderColor: theme.colors.ink,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 24 }}>
              {child?.displayName.charAt(0).toUpperCase() ?? '?'}
            </Text>
          </View>
          <Text
            style={{
              fontSize: theme.textStyles.heading.fontSize,
              fontWeight: '800',
              color: theme.colors.ink,
            }}
          >
            {child?.displayName ?? 'Ребёнок'}
          </Text>
        </View>

        {/* Instructions */}
        <View
          style={{
            backgroundColor: theme.tints.sky,
            borderRadius: theme.borderRadius.card,
            borderWidth: theme.borderWidth.regular,
            borderColor: theme.colors.ink,
            padding: theme.spacing[4],
            marginBottom: theme.spacing[4],
          }}
        >
          <Text
            style={{
              fontSize: theme.textStyles.body.fontSize,
              color: theme.colors.ink,
              lineHeight: 22,
            }}
          >
            На устройстве ребёнка откройте приложение Saya и выберите «Войти как ребёнок».
            Затем введите PIN-код ниже.
          </Text>
        </View>

        {/* PIN display */}
        {pin ? (
          <View
            style={{
              backgroundColor: theme.tints.mint,
              borderRadius: theme.borderRadius.card,
              borderWidth: theme.borderWidth.thick,
              borderColor: theme.colors.ink,
              padding: theme.spacing[6],
              alignItems: 'center',
              ...theme.shadows.card,
            }}
          >
            <Text
              style={{
                fontSize: theme.textStyles.caption.fontSize,
                color: theme.colors.ink,
                marginBottom: theme.spacing[2],
              }}
            >
              PIN-код
            </Text>
            <Text
              style={{
                fontSize: 48,
                fontWeight: '900',
                color: theme.colors.ink,
                letterSpacing: 8,
                marginBottom: theme.spacing[3],
              }}
            >
              {pin}
            </Text>
            <View
              style={{
                backgroundColor: timeLeft < 60 ? theme.colors.error : theme.colors.surface,
                borderRadius: theme.borderRadius.full,
                paddingHorizontal: theme.spacing[3],
                paddingVertical: theme.spacing[2],
              }}
            >
              <Text
                style={{
                  fontSize: theme.textStyles.body.fontSize,
                  fontWeight: '700',
                  color: timeLeft < 60 ? theme.colors.onFill : theme.colors.ink,
                }}
              >
                {formatTime(timeLeft)}
              </Text>
            </View>
            <Text
              style={{
                fontSize: theme.textStyles.caption.fontSize,
                color: theme.colors.textSecondary,
                marginTop: theme.spacing[3],
                textAlign: 'center',
              }}
            >
              Введите этот код на устройстве ребёнка
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            style={{
              backgroundColor: theme.colors.primary,
              borderRadius: theme.borderRadius.card,
              borderWidth: theme.borderWidth.regular,
              borderColor: theme.colors.ink,
              paddingVertical: theme.spacing[5],
              alignItems: 'center',
              ...theme.shadows.card,
            }}
            onPress={handleGeneratePin}
            disabled={createPinMut.isPending}
          >
            {createPinMut.isPending ? (
              <ActivityIndicator color={theme.colors.onFill} />
            ) : (
              <>
                <Text style={{ fontSize: 32, marginBottom: theme.spacing[2] }}>
                  📱
                </Text>
                <Text
                  style={{
                    fontSize: theme.textStyles.heading.fontSize,
                    fontWeight: '700',
                    color: theme.colors.onFill,
                  }}
                >
                  Получить PIN-код
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Generate new PIN button */}
        {pin && (
          <TouchableOpacity
            style={{
              borderWidth: 2,
              borderStyle: 'dashed',
              borderColor: theme.colors.ink,
              borderRadius: theme.borderRadius.card,
              paddingVertical: theme.spacing[4],
              alignItems: 'center',
              marginTop: theme.spacing[4],
            }}
            onPress={handleGeneratePin}
            disabled={createPinMut.isPending}
          >
            <Text
              style={{
                fontSize: theme.textStyles.body.fontSize,
                fontWeight: '600',
                color: theme.colors.textSecondary,
              }}
            >
              Сгенерировать новый PIN
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
