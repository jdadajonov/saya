import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Share,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../../../src/ui/theme-provider';
import { useAuthStore } from '../../../src/features/family/stores/auth-store';
import {
  useInvitationsQuery,
  useCreateInvitation,
} from '../../../src/features/family/hooks/use-invitations';

export default function InviteParentScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const family = useAuthStore((s) => s.family);
  const familyId = family?.id ?? null;

  const [email, setEmail] = useState('');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  const { data: invitations = [], isLoading } = useInvitationsQuery(familyId);
  const createMut = useCreateInvitation();

  const pendingInvites = invitations.filter(
    (inv) => !inv.acceptedAt && new Date(inv.expiresAt) > new Date()
  );

  const handleCreate = () => {
    if (!familyId) return;

    createMut.mutate(
      { familyId, email: email.trim() || undefined },
      {
        onSuccess: (data) => {
          setGeneratedCode(data.code);
          setEmail('');
        },
        onError: () => {
          Alert.alert(t('common.error'), t('common.retry'));
        },
      }
    );
  };

  const handleShare = async (code: string) => {
    const message = `Присоединяйся к нашей семье в Saya!\n\nКод приглашения: ${code}\n\nСкачай приложение и введи код при регистрации.`;
    await Share.share({ message });
  };

  const handleCopy = async (code: string) => {
    await Clipboard.setStringAsync(code);
    Alert.alert('Скопировано', `Код ${code} скопирован в буфер обмена`);
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
          Пригласить родителя
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: theme.spacing[5] }}>
        {/* Info */}
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
            Второй родитель сможет видеть прогресс детей, управлять наградами и расписанием.
          </Text>
        </View>

        {/* Generated code display */}
        {generatedCode && (
          <View
            style={{
              backgroundColor: theme.tints.mint,
              borderRadius: theme.borderRadius.card,
              borderWidth: theme.borderWidth.thick,
              borderColor: theme.colors.ink,
              padding: theme.spacing[5],
              marginBottom: theme.spacing[4],
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
              Код приглашения
            </Text>
            <Text
              style={{
                fontSize: 36,
                fontWeight: '900',
                color: theme.colors.ink,
                letterSpacing: 4,
                marginBottom: theme.spacing[4],
              }}
            >
              {generatedCode}
            </Text>
            <View style={{ flexDirection: 'row', gap: theme.spacing[3] }}>
              <TouchableOpacity
                style={{
                  backgroundColor: theme.colors.surface,
                  borderRadius: theme.borderRadius.button,
                  borderWidth: theme.borderWidth.regular,
                  borderColor: theme.colors.ink,
                  paddingHorizontal: theme.spacing[4],
                  paddingVertical: theme.spacing[3],
                  ...theme.shadows.chip,
                }}
                onPress={() => handleCopy(generatedCode)}
              >
                <Text
                  style={{
                    fontSize: theme.textStyles.body.fontSize,
                    fontWeight: '700',
                    color: theme.colors.ink,
                  }}
                >
                  Копировать
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  backgroundColor: theme.colors.primary,
                  borderRadius: theme.borderRadius.button,
                  borderWidth: theme.borderWidth.regular,
                  borderColor: theme.colors.ink,
                  paddingHorizontal: theme.spacing[4],
                  paddingVertical: theme.spacing[3],
                  ...theme.shadows.chip,
                }}
                onPress={() => handleShare(generatedCode)}
              >
                <Text
                  style={{
                    fontSize: theme.textStyles.body.fontSize,
                    fontWeight: '700',
                    color: theme.colors.onFill,
                  }}
                >
                  Поделиться
                </Text>
              </TouchableOpacity>
            </View>
            <Text
              style={{
                fontSize: theme.textStyles.caption.fontSize,
                color: theme.colors.textSecondary,
                marginTop: theme.spacing[3],
              }}
            >
              Код действителен 7 дней
            </Text>
          </View>
        )}

        {/* Create new invitation */}
        {!generatedCode && (
          <View style={{ marginBottom: theme.spacing[4] }}>
            <Text
              style={{
                fontSize: theme.textStyles.body.fontSize,
                fontWeight: '600',
                color: theme.colors.ink,
                marginBottom: theme.spacing[2],
              }}
            >
              Email (необязательно)
            </Text>
            <TextInput
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.md,
                borderWidth: theme.borderWidth.regular,
                borderColor: theme.colors.ink,
                paddingHorizontal: theme.spacing[4],
                paddingVertical: theme.spacing[3],
                fontSize: theme.textStyles.body.fontSize,
                color: theme.colors.ink,
                marginBottom: theme.spacing[3],
              }}
              placeholder="email@example.com"
              placeholderTextColor={theme.colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={{
                backgroundColor: theme.colors.primary,
                borderRadius: theme.borderRadius.button,
                borderWidth: theme.borderWidth.regular,
                borderColor: theme.colors.ink,
                paddingVertical: theme.spacing[4],
                alignItems: 'center',
                ...theme.shadows.card,
              }}
              onPress={handleCreate}
              disabled={createMut.isPending}
            >
              {createMut.isPending ? (
                <ActivityIndicator color={theme.colors.onFill} />
              ) : (
                <Text
                  style={{
                    fontSize: theme.textStyles.body.fontSize,
                    fontWeight: '700',
                    color: theme.colors.onFill,
                  }}
                >
                  Создать приглашение
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Button to create another */}
        {generatedCode && (
          <TouchableOpacity
            style={{
              borderWidth: 2,
              borderStyle: 'dashed',
              borderColor: theme.colors.ink,
              borderRadius: theme.borderRadius.card,
              paddingVertical: theme.spacing[4],
              alignItems: 'center',
              marginBottom: theme.spacing[4],
            }}
            onPress={() => setGeneratedCode(null)}
          >
            <Text
              style={{
                fontSize: theme.textStyles.body.fontSize,
                fontWeight: '600',
                color: theme.colors.textSecondary,
              }}
            >
              + Создать новое приглашение
            </Text>
          </TouchableOpacity>
        )}

        {/* Pending invitations */}
        {pendingInvites.length > 0 && (
          <>
            <Text
              style={{
                fontSize: theme.textStyles.heading.fontSize,
                fontWeight: '800',
                color: theme.colors.ink,
                marginBottom: theme.spacing[3],
              }}
            >
              Активные приглашения
            </Text>
            {pendingInvites.map((inv) => (
              <View
                key={inv.id}
                style={{
                  backgroundColor: theme.colors.surface,
                  borderRadius: theme.borderRadius.card,
                  borderWidth: theme.borderWidth.regular,
                  borderColor: theme.colors.ink,
                  padding: theme.spacing[4],
                  marginBottom: theme.spacing[3],
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <View>
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: '800',
                      color: theme.colors.ink,
                      letterSpacing: 2,
                    }}
                  >
                    {inv.code}
                  </Text>
                  {inv.email && (
                    <Text
                      style={{
                        fontSize: theme.textStyles.caption.fontSize,
                        color: theme.colors.textSecondary,
                        marginTop: 2,
                      }}
                    >
                      {inv.email}
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  style={{
                    backgroundColor: theme.tints.sky,
                    borderRadius: theme.borderRadius.button,
                    borderWidth: theme.borderWidth.thin,
                    borderColor: theme.colors.ink,
                    paddingHorizontal: theme.spacing[3],
                    paddingVertical: theme.spacing[2],
                  }}
                  onPress={() => handleShare(inv.code)}
                >
                  <Text
                    style={{
                      fontSize: theme.textStyles.caption.fontSize,
                      fontWeight: '600',
                      color: theme.colors.ink,
                    }}
                  >
                    Поделиться
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}
