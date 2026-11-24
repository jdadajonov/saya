import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../src/ui/theme-provider';
import { useAuthStore } from '../../../src/features/family/stores/auth-store';
import {
  useRewardCatalogQuery,
  usePendingRedemptionsForFamily,
  useApproveRedemption,
} from '../../../src/features/rewards/hooks/use-rewards';
import { ParentTabBar } from '../../../src/features/family/components/parent-tab-bar';

const AVATAR_COLORS = ['#5DD4C8', '#FFB6C1', '#B4A7FF', '#FFD93D'];

function formatTimeAgo(date: string | Date): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins} мин назад`;
  if (diffHours < 24) return `${diffHours} ч назад`;
  if (diffDays === 1) return 'вчера';
  return `${diffDays} дн назад`;
}

export default function ParentRewardsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const { family, user, children } = useAuthStore();

  const familyId = family?.id ?? null;
  const catalogQuery = useRewardCatalogQuery(familyId);
  const pendingQuery = usePendingRedemptionsForFamily(familyId);
  const approveMut = useApproveRedemption();

  const catalog = catalogQuery.data ?? [];
  const pendingRequests = pendingQuery.data ?? [];

  const handleApprove = (redemptionId: string, approve: boolean) => {
    approveMut.mutate({
      redemptionId,
      approve,
      resolvedBy: user?.id ?? '',
    });
  };

  if (catalogQuery.isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing[5], paddingTop: 60, paddingBottom: 100 }}>
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: theme.spacing[5],
        }}>
          <Text style={{
            fontSize: 28,
            fontWeight: '900',
            color: theme.colors.ink,
          }} accessibilityRole="header">
            Награды
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.full,
              borderWidth: theme.borderWidth.regular,
              borderColor: theme.colors.ink,
              paddingHorizontal: theme.spacing[4],
              paddingVertical: theme.spacing[2],
              ...theme.shadows.chip,
            }}
            onPress={() => router.push('/(parent)/rewards/create' as never)}
          >
            <Text style={{
              fontSize: theme.textStyles.body.fontSize,
              fontWeight: '600',
              color: theme.colors.ink,
            }}>
              Каталог
            </Text>
          </TouchableOpacity>
        </View>

        {/* Pending requests section */}
        {pendingRequests.length > 0 && (
          <>
            <Text style={{
              fontSize: theme.textStyles.heading.fontSize,
              fontWeight: '800',
              color: theme.colors.ink,
              marginBottom: theme.spacing[3],
            }}>
              Ждут решения
            </Text>

            {pendingRequests.map((req, idx) => {
              const child = children.find((c) => c.id === req.childId);
              const childInitial = child?.displayName?.charAt(0).toUpperCase() ?? '?';
              const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length];
              const childCoins = 24 + idx * 17; // Mock balance

              return (
                <View
                  key={req.id}
                  style={{
                    backgroundColor: theme.colors.surface,
                    borderRadius: theme.borderRadius.card,
                    borderWidth: theme.borderWidth.regular,
                    borderColor: theme.colors.ink,
                    padding: theme.spacing[4],
                    marginBottom: theme.spacing[3],
                    ...theme.shadows.card,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    {/* Avatar */}
                    <View style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: avatarColor,
                      borderWidth: theme.borderWidth.thin,
                      borderColor: theme.colors.ink,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: theme.spacing[3],
                    }}>
                      <Text style={{
                        fontSize: 16,
                        fontWeight: '800',
                        color: theme.colors.ink,
                      }}>
                        {childInitial}
                      </Text>
                    </View>

                    {/* Info */}
                    <View style={{ flex: 1 }}>
                      <Text style={{
                        fontSize: theme.textStyles.body.fontSize,
                        fontWeight: '800',
                        color: theme.colors.ink,
                      }}>
                        {req.reward?.title ?? 'Награда'}
                      </Text>
                      <Text style={{
                        fontSize: theme.textStyles.caption.fontSize,
                        color: theme.colors.textSecondary,
                      }}>
                        {child?.displayName ?? 'Ребёнок'} · {formatTimeAgo(req.requestedAt)} · есть {childCoins}
                      </Text>
                    </View>

                    {/* Cost */}
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{ fontSize: 16 }}>🪙</Text>
                      <Text style={{
                        fontSize: theme.textStyles.body.fontSize,
                        fontWeight: '800',
                        color: theme.colors.ink,
                        marginLeft: 4,
                      }}>
                        {req.reward?.costCoins ?? 0}
                      </Text>
                    </View>
                  </View>

                  {/* Action buttons */}
                  <View style={{
                    flexDirection: 'row',
                    gap: theme.spacing[3],
                    marginTop: theme.spacing[3],
                  }}>
                    <TouchableOpacity
                      style={{
                        flex: 1,
                        backgroundColor: theme.colors.secondary,
                        borderRadius: theme.borderRadius.button,
                        borderWidth: theme.borderWidth.regular,
                        borderColor: theme.colors.ink,
                        paddingVertical: theme.spacing[3],
                        alignItems: 'center',
                        ...theme.shadows.chip,
                      }}
                      onPress={() => handleApprove(req.id, true)}
                      disabled={approveMut.isPending}
                    >
                      <Text style={{
                        fontSize: theme.textStyles.body.fontSize,
                        fontWeight: '700',
                        color: theme.colors.ink,
                      }}>
                        Одобрить
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{
                        flex: 1,
                        backgroundColor: theme.colors.surface,
                        borderRadius: theme.borderRadius.button,
                        borderWidth: theme.borderWidth.regular,
                        borderColor: theme.colors.ink,
                        paddingVertical: theme.spacing[3],
                        alignItems: 'center',
                      }}
                      onPress={() => handleApprove(req.id, false)}
                      disabled={approveMut.isPending}
                    >
                      <Text style={{
                        fontSize: theme.textStyles.body.fontSize,
                        fontWeight: '600',
                        color: theme.colors.ink,
                      }}>
                        Не сейчас
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}

            {/* Info box */}
            <View style={{
              backgroundColor: theme.tints.sun,
              borderRadius: theme.borderRadius.card,
              borderWidth: 2,
              borderStyle: 'dashed',
              borderColor: theme.colors.ink,
              padding: theme.spacing[4],
              marginBottom: theme.spacing[4],
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: theme.spacing[3],
            }}>
              <Text style={{ fontSize: 20 }}>⭐</Text>
              <Text style={{
                flex: 1,
                fontSize: theme.textStyles.caption.fontSize,
                color: theme.colors.ink,
                lineHeight: 18,
              }}>
                Монеты списываются только после одобрения. Отказ без штрафа: монеты остаются у ребёнка.
              </Text>
            </View>
          </>
        )}

        {/* Empty state for no pending requests */}
        {pendingRequests.length === 0 && (
          <View style={{
            alignItems: 'center',
            paddingVertical: theme.spacing[8],
          }}>
            <Text style={{ fontSize: 48, marginBottom: theme.spacing[3] }}>🎁</Text>
            <Text style={{
              fontSize: theme.textStyles.body.fontSize,
              color: theme.colors.textSecondary,
              textAlign: 'center',
            }}>
              Пока нет запросов на награды
            </Text>
          </View>
        )}

        {/* Surprise button */}
        <TouchableOpacity
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.card,
            borderWidth: theme.borderWidth.regular,
            borderColor: theme.colors.ink,
            paddingVertical: theme.spacing[4],
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: theme.spacing[2],
            ...theme.shadows.card,
          }}
          onPress={() => Alert.alert('Сюрприз', 'Выберите ребёнка и награду для сюрприза!')}
        >
          <Text style={{ fontSize: 20 }}>🎁</Text>
          <Text style={{
            fontSize: theme.textStyles.body.fontSize,
            fontWeight: '700',
            color: theme.colors.ink,
          }}>
            Устроить сюрприз
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <ParentTabBar activeTab="rewards" />
    </View>
  );
}
