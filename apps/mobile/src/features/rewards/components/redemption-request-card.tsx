import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { CatalogReward } from '@saya/core';

interface Props {
  childName: string;
  reward: CatalogReward;
  requestedAt: Date;
  onApprove: () => void;
  onDecline: () => void;
  isPending?: boolean;
}

export function RedemptionRequestCard({
  childName,
  reward,
  requestedAt,
  onApprove,
  onDecline,
  isPending = false,
}: Props) {
  const { t } = useTranslation();

  const timeAgo = getTimeAgo(requestedAt);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.childName}>{childName}</Text>
        <Text style={styles.timeAgo}>{timeAgo}</Text>
      </View>

      <View style={styles.rewardRow}>
        <View style={styles.iconCircle}>
          <Text style={styles.icon}>🎁</Text>
        </View>
        <View style={styles.rewardInfo}>
          <Text style={styles.rewardTitle}>{reward.title}</Text>
          <Text style={styles.rewardCost}>
            {reward.costCoins} {t('child.coins')}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.btn, styles.approveBtn]}
          onPress={onApprove}
          disabled={isPending}
          accessibilityRole="button"
          accessibilityLabel={t('rewards.approve')}
        >
          <Text style={styles.approveBtnText}>{t('rewards.approve')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, styles.declineBtn]}
          onPress={onDecline}
          disabled={isPending}
          accessibilityRole="button"
          accessibilityLabel={t('rewards.decline')}
        >
          <Text style={styles.declineBtnText}>{t('rewards.decline')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  return `${diffDays}d`;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 16,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  childName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
  },
  timeAgo: {
    fontSize: 12,
    color: '#B45309',
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 20,
  },
  rewardInfo: {
    flex: 1,
  },
  rewardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  rewardCost: {
    fontSize: 13,
    color: '#6B7280',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  btn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  approveBtn: {
    backgroundColor: '#10B981',
  },
  approveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  declineBtn: {
    backgroundColor: '#F3F4F6',
  },
  declineBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
  },
});
