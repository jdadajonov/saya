import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { ChildBalance, StreakInfo } from '@saya/core';

interface Props {
  balance: ChildBalance;
  streak?: StreakInfo;
  compact?: boolean;
}

export function BalanceDisplay({ balance, streak, compact = false }: Props) {
  const { t } = useTranslation();

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.compactItem}>
          <Text style={styles.compactValue}>{balance.xp}</Text>
          <Text style={styles.compactLabel}>XP</Text>
        </View>
        <View style={styles.compactDivider} />
        <View style={styles.compactItem}>
          <Text style={styles.compactValue}>{balance.coins}</Text>
          <Text style={styles.compactLabel}>{t('child.coins')}</Text>
        </View>
        {streak && (
          <>
            <View style={styles.compactDivider} />
            <View style={styles.compactItem}>
              <Text style={styles.compactValue}>{streak.currentStreak}</Text>
              <Text style={styles.compactLabel}>{t('rewards.streak')}</Text>
            </View>
          </>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.levelBadge}>
        <Text style={styles.levelNumber}>{balance.level}</Text>
        <Text style={styles.levelLabel}>{t('rewards.level', { level: balance.level })}</Text>
      </View>

      <View style={styles.stats}>
        <View style={styles.xpSection}>
          <View style={styles.xpHeader}>
            <Text style={styles.xpLabel}>XP</Text>
            <Text style={styles.xpValue}>{balance.xp}</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${balance.xpProgress}%` }]} />
          </View>
          <Text style={styles.xpToNext}>
            {t('rewards.xpToNextLevel', { amount: balance.xpToNextLevel })}
          </Text>
        </View>

        <View style={styles.coinsSection}>
          <Text style={styles.coinsValue}>{balance.coins}</Text>
          <Text style={styles.coinsLabel}>{t('child.coins')}</Text>
        </View>

        {streak && (
          <View style={styles.streakSection}>
            <Text style={styles.streakFlame}>
              {streak.currentStreak > 0 ? '🔥' : '💤'}
            </Text>
            <Text style={styles.streakValue}>{streak.daysThisWeek}/7</Text>
            <Text style={styles.streakLabel}>{t('rewards.daysThisWeek')}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  levelBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  levelLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#C7D2FE',
    textTransform: 'uppercase',
  },
  stats: {
    flex: 1,
    gap: 12,
  },
  xpSection: {
    gap: 4,
  },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  xpLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },
  xpValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: 4,
  },
  xpToNext: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  coinsSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  coinsValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F59E0B',
  },
  coinsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  streakSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  streakFlame: {
    fontSize: 18,
  },
  streakValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  streakLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 12,
  },
  compactItem: {
    alignItems: 'center',
  },
  compactValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F2937',
  },
  compactLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
  },
  compactDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E5E7EB',
  },
});
