import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../src/ui/theme-provider';
import { useAuthStore } from '../../../../src/features/family/stores/auth-store';
import {
  useBalanceQuery,
  useRewardCatalogQuery,
  useRedemptionsQuery,
  useRequestRedemption,
} from '../../../../src/features/rewards/hooks/use-rewards';

const REWARD_ICONS = {
  movie: { emoji: '🎬', bg: '#FFE4EC' },
  dinner: { emoji: '🍕', bg: '#FFF4CC' },
  game: { emoji: '🎲', bg: '#FFE4EC' },
  book: { emoji: '📖', bg: '#E8E4FF' },
  outing: { emoji: '🎢', bg: '#E4F4FF' },
  screen: { emoji: '📱', bg: '#E4FFE8' },
  toy: { emoji: '🧸', bg: '#FFF4E4' },
  default: { emoji: '🎁', bg: '#F0F0FF' },
} as const;

function getRewardIcon(title: string): { emoji: string; bg: string } {
  const lower = title.toLowerCase();
  if (lower.includes('кино') || lower.includes('movie') || lower.includes('film')) return REWARD_ICONS.movie;
  if (lower.includes('ужин') || lower.includes('dinner') || lower.includes('еда') || lower.includes('food')) return REWARD_ICONS.dinner;
  if (lower.includes('настол') || lower.includes('game') || lower.includes('игр')) return REWARD_ICONS.game;
  if (lower.includes('книг') || lower.includes('book')) return REWARD_ICONS.book;
  if (lower.includes('парк') || lower.includes('zoo') || lower.includes('поход') || lower.includes('outing')) return REWARD_ICONS.outing;
  if (lower.includes('экран') || lower.includes('screen') || lower.includes('телефон')) return REWARD_ICONS.screen;
  if (lower.includes('игрушк') || lower.includes('toy')) return REWARD_ICONS.toy;
  return REWARD_ICONS.default;
}

export default function ChildRewardsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const { children, activeChildId, family } = useAuthStore();

  const child = children.find((c) => c.id === activeChildId);
  const childId = child?.id ?? null;
  const familyId = family?.id ?? null;

  const balanceQuery = useBalanceQuery(childId);
  const catalogQuery = useRewardCatalogQuery(familyId);
  const pendingQuery = useRedemptionsQuery(childId, 'pending');
  const requestMut = useRequestRedemption();

  const balance = balanceQuery.data;
  const catalog = catalogQuery.data ?? [];
  const pendingRequests = pendingQuery.data ?? [];
  const pendingRewardIds = new Set(pendingRequests.map((r) => r.rewardId));

  const handleRequest = (rewardId: string, rewardTitle: string) => {
    Alert.alert(
      t('rewards.confirmRequest'),
      t('rewards.confirmRequestDesc', { title: rewardTitle }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('rewards.request'),
          onPress: () =>
            requestMut.mutate(
              { childId: childId!, rewardId },
              {
                onSuccess: () =>
                  Alert.alert(t('rewards.requestSent'), t('rewards.requestSentDesc')),
                onError: () => Alert.alert(t('common.error'), t('common.retry')),
              },
            ),
        },
      ],
    );
  };

  if (balanceQuery.isLoading || catalogQuery.isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  const coins = balance?.coins ?? 0;
  const pendingReward = pendingRequests[0];
  const pendingRewardTitle = pendingReward
    ? catalog.find((r) => r.id === pendingReward.rewardId)?.title ?? ''
    : '';

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing[5], paddingTop: 60, paddingBottom: 120 }}>
        {/* Title */}
        <Text style={{
          fontSize: 28,
          fontWeight: '900',
          color: theme.colors.ink,
          marginBottom: theme.spacing[4],
        }} accessibilityRole="header">
          Витрина наград
        </Text>

        {/* Coin balance card */}
        <View style={{
          backgroundColor: theme.tints.sun,
          borderRadius: theme.borderRadius.card,
          borderWidth: theme.borderWidth.thick,
          borderColor: theme.colors.ink,
          padding: theme.spacing[5],
          marginBottom: theme.spacing[4],
          alignItems: 'center',
          ...theme.shadows.card,
        }}>
          <Text style={{
            fontSize: theme.textStyles.caption.fontSize,
            color: theme.colors.ink,
            marginBottom: theme.spacing[2],
          }}>
            У меня есть
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[2] }}>
            <Text style={{ fontSize: 32 }}>🪙</Text>
            <Text style={{
              fontSize: 36,
              fontWeight: '900',
              color: theme.colors.ink,
            }}>
              {coins} монеты
            </Text>
          </View>
        </View>

        {/* Pending request card */}
        {pendingReward && (
          <View style={{
            borderRadius: theme.borderRadius.card,
            borderWidth: 2,
            borderColor: theme.colors.ink,
            borderStyle: 'dashed',
            padding: theme.spacing[4],
            marginBottom: theme.spacing[4],
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.spacing[3],
          }}>
            <Text style={{ fontSize: 24 }}>⏳</Text>
            <Text style={{
              flex: 1,
              fontSize: theme.textStyles.body.fontSize,
              color: theme.colors.ink,
            }}>
              «{pendingRewardTitle}» — ждём ответа от родителя
            </Text>
          </View>
        )}

        {/* Section title */}
        <Text style={{
          fontSize: theme.textStyles.heading.fontSize,
          fontWeight: '800',
          color: theme.colors.ink,
          marginBottom: theme.spacing[3],
        }}>
          Награды от родителей
        </Text>

        {/* Rewards grid */}
        {catalog.length === 0 ? (
          <View style={{
            alignItems: 'center',
            paddingVertical: theme.spacing[8],
          }}>
            <Text style={{
              fontSize: theme.textStyles.body.fontSize,
              color: theme.colors.textSecondary,
            }}>
              {t('rewards.shopEmpty')}
            </Text>
          </View>
        ) : (
          <View style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: theme.spacing[3],
          }}>
            {catalog.map((reward) => {
              const icon = getRewardIcon(reward.title);
              const isPending = pendingRewardIds.has(reward.id);
              const canAfford = coins >= reward.costCoins;
              const coinsNeeded = reward.costCoins - coins;

              return (
                <View
                  key={reward.id}
                  style={{
                    width: '47%',
                    backgroundColor: icon.bg,
                    borderRadius: theme.borderRadius.card,
                    borderWidth: theme.borderWidth.regular,
                    borderColor: theme.colors.ink,
                    padding: theme.spacing[4],
                    alignItems: 'center',
                    gap: theme.spacing[2],
                    ...theme.shadows.card,
                  }}
                >
                  {/* Icon */}
                  <View style={{
                    width: 64,
                    height: 64,
                    borderRadius: theme.borderRadius.md,
                    backgroundColor: theme.colors.surface,
                    borderWidth: theme.borderWidth.regular,
                    borderColor: theme.colors.ink,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Text style={{ fontSize: 32 }}>{icon.emoji}</Text>
                  </View>

                  {/* Title */}
                  <Text style={{
                    fontSize: theme.textStyles.body.fontSize,
                    fontWeight: '700',
                    color: theme.colors.ink,
                    textAlign: 'center',
                  }} numberOfLines={2}>
                    {reward.title}
                  </Text>

                  {/* Cost */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={{ fontSize: 16 }}>🪙</Text>
                    <Text style={{
                      fontSize: theme.textStyles.body.fontSize,
                      fontWeight: '800',
                      color: theme.colors.ink,
                    }}>
                      {reward.costCoins}
                    </Text>
                  </View>

                  {/* Action button */}
                  {isPending ? (
                    <View style={{
                      backgroundColor: theme.tints.teal,
                      borderRadius: theme.borderRadius.button,
                      borderWidth: theme.borderWidth.thin,
                      borderColor: theme.colors.ink,
                      paddingHorizontal: theme.spacing[3],
                      paddingVertical: theme.spacing[2],
                    }}>
                      <Text style={{
                        fontSize: theme.textStyles.caption.fontSize,
                        fontWeight: '700',
                        color: theme.colors.ink,
                      }}>
                        Запрос отправлен
                      </Text>
                    </View>
                  ) : canAfford ? (
                    <TouchableOpacity
                      style={{
                        backgroundColor: theme.tints.sun,
                        borderRadius: theme.borderRadius.button,
                        borderWidth: theme.borderWidth.regular,
                        borderColor: theme.colors.ink,
                        paddingHorizontal: theme.spacing[4],
                        paddingVertical: theme.spacing[2],
                        ...theme.shadows.chip,
                      }}
                      onPress={() => handleRequest(reward.id, reward.title)}
                      disabled={requestMut.isPending}
                    >
                      <Text style={{
                        fontSize: theme.textStyles.body.fontSize,
                        fontWeight: '700',
                        color: theme.colors.ink,
                      }}>
                        Попросить
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={{
                      backgroundColor: theme.colors.surface,
                      borderRadius: theme.borderRadius.button,
                      borderWidth: theme.borderWidth.thin,
                      borderColor: theme.colors.disabled,
                      paddingHorizontal: theme.spacing[3],
                      paddingVertical: theme.spacing[2],
                    }}>
                      <Text style={{
                        fontSize: theme.textStyles.caption.fontSize,
                        fontWeight: '600',
                        color: theme.colors.textSecondary,
                      }}>
                        Ещё {coinsNeeded} монет
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
