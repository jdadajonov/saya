import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { GOAL_TEMPLATES } from '@saya/core';
import type { GoalTemplate } from '@saya/core';

const ICONS: Record<string, string> = {
  'multiplication-mastery': '✖',
  'english-a1-vocabulary': '🔤',
  'sports-consistency': '⚽',
  'reading-challenge': '📚',
};

const COLORS: Record<string, string> = {
  'multiplication-mastery': '#4F46E5',
  'english-a1-vocabulary': '#059669',
  'sports-consistency': '#DC2626',
  'reading-challenge': '#7C3AED',
};

interface Props {
  onSelect: (template: GoalTemplate) => void;
}

export function TemplatePicker({ onSelect }: Props) {
  const { t } = useTranslation();

  return (
    <ScrollView contentContainerStyle={styles.grid}>
      {GOAL_TEMPLATES.map((tpl) => (
        <TouchableOpacity
          key={tpl.id}
          style={[styles.card, { borderColor: COLORS[tpl.id] ?? '#4F46E5' }]}
          onPress={() => onSelect(tpl)}
          accessibilityRole="button"
          accessibilityLabel={t(tpl.titleKey)}
        >
          <View style={[styles.iconCircle, { backgroundColor: COLORS[tpl.id] ?? '#4F46E5' }]}>
            <Text style={styles.icon}>{ICONS[tpl.id] ?? '🎯'}</Text>
          </View>
          <Text style={styles.title} numberOfLines={2}>
            {t(tpl.titleKey)}
          </Text>
          <Text style={styles.meta}>
            {tpl.milestones.length} {t('goals.milestones')}
          </Text>
        </TouchableOpacity>
      ))}

      {/* Custom goal card */}
      <TouchableOpacity
        style={[styles.card, styles.cardCustom]}
        onPress={() => onSelect({
          id: 'custom',
          domain: 'learning',
          titleKey: '',
          milestones: [],
        })}
        accessibilityRole="button"
        accessibilityLabel={t('goals.createCustom')}
      >
        <View style={[styles.iconCircle, styles.iconCircleCustom]}>
          <Text style={styles.icon}>+</Text>
        </View>
        <Text style={styles.title}>{t('goals.createCustom')}</Text>
        <Text style={styles.meta}>{t('goals.customDesc')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  card: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    padding: 16,
    gap: 8,
    alignItems: 'center',
  },
  cardCustom: {
    borderColor: '#9CA3AF',
    borderStyle: 'dashed',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleCustom: {
    backgroundColor: '#F3F4F6',
  },
  icon: {
    fontSize: 22,
    color: '#FFFFFF',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
  },
  meta: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
