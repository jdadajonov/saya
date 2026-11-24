import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { CatalogReward } from '@saya/core';

interface Props {
  reward: CatalogReward;
  currentCoins: number;
  onRequest: () => void;
  disabled?: boolean;
}

export function RewardCard({ reward, currentCoins, onRequest, disabled = false }: Props) {
  const { t } = useTranslation();
  const canAfford = currentCoins >= reward.costCoins;
  const isDisabled = disabled || !canAfford;

  return (
    <View style={styles.card}>
      <View style={styles.iconCircle}>
        <Text style={styles.icon}>🎁</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{reward.title}</Text>
        {reward.description && (
          <Text style={styles.description} numberOfLines={2}>
            {reward.description}
          </Text>
        )}
      </View>

      <View style={styles.action}>
        <View style={styles.costBadge}>
          <Text style={styles.costValue}>{reward.costCoins}</Text>
          <Text style={styles.costLabel}>{t('child.coins')}</Text>
        </View>

        <TouchableOpacity
          style={[styles.requestBtn, isDisabled && styles.requestBtnDisabled]}
          onPress={onRequest}
          disabled={isDisabled}
          accessibilityRole="button"
          accessibilityLabel={t('child.requestReward')}
        >
          <Text style={[styles.requestBtnText, isDisabled && styles.requestBtnTextDisabled]}>
            {canAfford ? t('rewards.request') : t('rewards.notEnough')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 24,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  description: {
    fontSize: 13,
    color: '#6B7280',
  },
  action: {
    alignItems: 'center',
    gap: 8,
  },
  costBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  costValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F59E0B',
  },
  costLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  requestBtn: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  requestBtnDisabled: {
    backgroundColor: '#E5E7EB',
  },
  requestBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  requestBtnTextDisabled: {
    color: '#9CA3AF',
  },
});
