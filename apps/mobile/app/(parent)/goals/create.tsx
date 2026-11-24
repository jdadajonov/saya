import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../src/ui/theme-provider';
import { useAuthStore } from '../../../src/features/family/stores/auth-store';
import { useCreateGoal } from '../../../src/features/goals/hooks/use-goals';
import type { GoalDomain } from '@saya/core';

interface GoalTemplate {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  domain: GoalDomain;
  milestones: { title: string; coins: number }[];
}

const TEMPLATES: GoalTemplate[] = [
  {
    id: 'mul7',
    icon: '7×',
    title: 'Таблица на 7',
    subtitle: 'Учёба · этапы закрываются сами',
    domain: 'learning',
    milestones: [
      { title: '7×1 – 7×3', coins: 20 },
      { title: '7×4 – 7×6', coins: 20 },
      { title: '7×7 – 7×9', coins: 20 },
    ],
  },
  {
    id: 'english100',
    icon: 'ABC',
    title: '100 английских слов',
    subtitle: 'Учёба · этапы закрываются сами',
    domain: 'learning',
    milestones: [
      { title: '1–25 слов', coins: 25 },
      { title: '26–50 слов', coins: 25 },
      { title: '51–75 слов', coins: 25 },
      { title: '76–100 слов', coins: 25 },
    ],
  },
  {
    id: 'climbing5c',
    icon: '🧗',
    title: 'Трасса уровня 5с',
    subtitle: 'Спорт · подтверждает взрослый',
    domain: 'activity',
    milestones: [
      { title: 'Пройти трассу 5а', coins: 15 },
      { title: 'Пройти трассу 5b', coins: 15 },
      { title: 'Пройти трассу 5с', coins: 20 },
    ],
  },
  {
    id: 'dishes',
    icon: '🍽️',
    title: 'Мытьё посуды',
    subtitle: 'Дом · подтверждает взрослый',
    domain: 'activity',
    milestones: [
      { title: 'Помыть посуду 5 раз', coins: 10 },
      { title: 'Помыть посуду 15 раз', coins: 15 },
      { title: 'Помыть посуду 30 раз', coins: 25 },
    ],
  },
  {
    id: 'room',
    icon: '🧹',
    title: 'Уборка комнаты',
    subtitle: 'Дом · подтверждает взрослый',
    domain: 'activity',
    milestones: [
      { title: 'Убрать комнату 3 раза', coins: 10 },
      { title: 'Убрать комнату 10 раз', coins: 20 },
      { title: 'Убрать комнату 20 раз', coins: 30 },
    ],
  },
  {
    id: 'bed',
    icon: '🛏️',
    title: 'Заправлять кровать',
    subtitle: 'Дом · подтверждает взрослый',
    domain: 'activity',
    milestones: [
      { title: 'Заправить 7 дней подряд', coins: 15 },
      { title: 'Заправить 14 дней подряд', coins: 20 },
      { title: 'Заправить 30 дней подряд', coins: 35 },
    ],
  },
  {
    id: 'trash',
    icon: '🗑️',
    title: 'Выносить мусор',
    subtitle: 'Дом · подтверждает взрослый',
    domain: 'activity',
    milestones: [
      { title: 'Вынести мусор 5 раз', coins: 10 },
      { title: 'Вынести мусор 15 раз', coins: 15 },
      { title: 'Вынести мусор 30 раз', coins: 25 },
    ],
  },
  {
    id: 'custom',
    icon: '+',
    title: 'Своя цель',
    subtitle: 'Название и этапы задаёте вы',
    domain: 'activity',
    milestones: [],
  },
];

export default function CreateGoalScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const { children } = useAuthStore();
  const createMut = useCreateGoal();

  const [selectedChildId, setSelectedChildId] = useState(children[0]?.id ?? '');
  const [selectedTemplate, setSelectedTemplate] = useState<GoalTemplate | null>(null);
  const [title, setTitle] = useState('');
  const [milestones, setMilestones] = useState<{ title: string; coins: number }[]>([]);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');

  const handleSelectTemplate = (tpl: GoalTemplate) => {
    setSelectedTemplate(tpl);
    if (tpl.id === 'custom') {
      setTitle('');
      setMilestones([]);
    } else {
      setTitle(tpl.title);
      setMilestones([...tpl.milestones]);
    }
  };

  const handleAddMilestone = () => {
    if (!newMilestoneTitle.trim()) return;
    setMilestones([...milestones, { title: newMilestoneTitle.trim(), coins: 20 }]);
    setNewMilestoneTitle('');
  };

  const handleRemoveMilestone = (idx: number) => {
    setMilestones(milestones.filter((_, i) => i !== idx));
  };

  const handleCreate = () => {
    const finalTitle = selectedTemplate?.id === 'custom' ? title.trim() : (selectedTemplate?.title ?? title.trim());

    if (!finalTitle) {
      Alert.alert('Ошибка', 'Введите название цели');
      return;
    }

    if (milestones.length === 0) {
      Alert.alert('Ошибка', 'Добавьте хотя бы один этап');
      return;
    }

    createMut.mutate(
      {
        childId: selectedChildId,
        domain: selectedTemplate?.domain ?? 'learning',
        title: finalTitle,
        proposedBy: 'parent',
        milestones: milestones.map((m) => ({ title: m.title })),
      },
      {
        onSuccess: () => router.back(),
        onError: () => Alert.alert(t('common.error'), t('common.retry')),
      },
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing[5], paddingTop: 60, paddingBottom: 100 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing[5] }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: theme.colors.surface,
              borderWidth: theme.borderWidth.regular,
              borderColor: theme.colors.ink,
              alignItems: 'center',
              justifyContent: 'center',
              ...theme.shadows.chip,
            }}
          >
            <Text style={{ fontSize: 20, color: theme.colors.ink }}>‹</Text>
          </TouchableOpacity>
          <Text style={{
            flex: 1,
            fontSize: 24,
            fontWeight: '900',
            color: theme.colors.ink,
            marginLeft: theme.spacing[3],
          }}>
            Новая цель
          </Text>
        </View>

        {/* Child selector */}
        <Text style={{
          fontSize: theme.textStyles.caption.fontSize,
          fontWeight: '600',
          color: theme.colors.textSecondary,
          marginBottom: theme.spacing[2],
        }}>
          Для кого
        </Text>
        <View style={{
          flexDirection: 'row',
          gap: theme.spacing[2],
          marginBottom: theme.spacing[5],
        }}>
          {children.map((child) => {
            const isSelected = child.id === selectedChildId;
            const age = new Date().getFullYear() - (child.birthYear ?? 2015);
            return (
              <TouchableOpacity
                key={child.id}
                style={{
                  flex: 1,
                  backgroundColor: isSelected ? theme.colors.secondary : theme.colors.surface,
                  borderRadius: theme.borderRadius.full,
                  borderWidth: theme.borderWidth.regular,
                  borderColor: theme.colors.ink,
                  paddingVertical: theme.spacing[3],
                  alignItems: 'center',
                  ...theme.shadows.chip,
                }}
                onPress={() => setSelectedChildId(child.id)}
              >
                <Text style={{
                  fontSize: theme.textStyles.body.fontSize,
                  fontWeight: '700',
                  color: theme.colors.ink,
                }}>
                  {child.displayName}, {age}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Templates */}
        <Text style={{
          fontSize: theme.textStyles.caption.fontSize,
          fontWeight: '600',
          color: theme.colors.textSecondary,
          marginBottom: theme.spacing[2],
        }}>
          Шаблон
        </Text>
        <View style={{ gap: theme.spacing[2], marginBottom: theme.spacing[5] }}>
          {TEMPLATES.map((tpl) => {
            const isSelected = selectedTemplate?.id === tpl.id;
            return (
              <TouchableOpacity
                key={tpl.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: theme.colors.surface,
                  borderRadius: theme.borderRadius.card,
                  borderWidth: isSelected ? theme.borderWidth.thick : theme.borderWidth.regular,
                  borderColor: isSelected ? theme.colors.secondary : theme.colors.ink,
                  padding: theme.spacing[3],
                  gap: theme.spacing[3],
                  ...theme.shadows.chip,
                }}
                onPress={() => handleSelectTemplate(tpl)}
              >
                <View style={{
                  width: 48,
                  height: 48,
                  borderRadius: theme.borderRadius.md,
                  backgroundColor: tpl.id === 'custom' ? theme.colors.surface : theme.tints.sun,
                  borderWidth: tpl.id === 'custom' ? 2 : theme.borderWidth.thin,
                  borderStyle: tpl.id === 'custom' ? 'dashed' : 'solid',
                  borderColor: theme.colors.ink,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Text style={{
                    fontSize: tpl.id === 'custom' ? 24 : 16,
                    fontWeight: '800',
                    color: theme.colors.ink,
                  }}>
                    {tpl.icon}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: theme.textStyles.body.fontSize,
                    fontWeight: '700',
                    color: theme.colors.ink,
                  }}>
                    {tpl.title}
                  </Text>
                  <Text style={{
                    fontSize: theme.textStyles.caption.fontSize,
                    color: theme.colors.textSecondary,
                  }}>
                    {tpl.subtitle}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Milestones section */}
        {selectedTemplate && (
          <View style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.card,
            borderWidth: theme.borderWidth.regular,
            borderColor: theme.colors.ink,
            padding: theme.spacing[4],
            ...theme.shadows.card,
          }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: theme.spacing[3],
            }}>
              <Text style={{
                fontSize: theme.textStyles.body.fontSize,
                fontWeight: '800',
                color: theme.colors.ink,
              }}>
                Этапы
              </Text>
              <Text style={{
                fontSize: theme.textStyles.caption.fontSize,
                color: theme.colors.textSecondary,
              }}>
                Закрываются по освоению
              </Text>
            </View>

            {/* Custom title input for custom goals */}
            {selectedTemplate.id === 'custom' && (
              <TextInput
                style={{
                  borderWidth: theme.borderWidth.regular,
                  borderColor: theme.colors.ink,
                  borderRadius: theme.borderRadius.md,
                  paddingHorizontal: theme.spacing[3],
                  paddingVertical: theme.spacing[3],
                  fontSize: theme.textStyles.body.fontSize,
                  color: theme.colors.ink,
                  backgroundColor: theme.colors.background,
                  marginBottom: theme.spacing[3],
                }}
                value={title}
                onChangeText={setTitle}
                placeholder="Название цели..."
                placeholderTextColor={theme.colors.textSecondary}
              />
            )}

            {/* Milestone list */}
            {milestones.map((m, idx) => (
              <TouchableOpacity
                key={idx}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: theme.spacing[3],
                  borderBottomWidth: idx < milestones.length - 1 ? theme.borderWidth.thin : 0,
                  borderBottomColor: theme.colors.disabled,
                }}
                onLongPress={() => handleRemoveMilestone(idx)}
              >
                <View style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: theme.colors.secondary,
                  borderWidth: theme.borderWidth.thin,
                  borderColor: theme.colors.ink,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: theme.spacing[3],
                }}>
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '700',
                    color: theme.colors.ink,
                  }}>
                    {idx + 1}
                  </Text>
                </View>
                <Text style={{
                  flex: 1,
                  fontSize: theme.textStyles.body.fontSize,
                  color: theme.colors.ink,
                }}>
                  {m.title}
                </Text>
                <Text style={{
                  fontSize: theme.textStyles.caption.fontSize,
                  color: theme.colors.textSecondary,
                }}>
                  +{m.coins} монет
                </Text>
              </TouchableOpacity>
            ))}

            {/* Add milestone button */}
            {selectedTemplate.id === 'custom' && (
              <View style={{ marginTop: theme.spacing[2] }}>
                {milestones.length === 0 && (
                  <Text style={{
                    fontSize: theme.textStyles.caption.fontSize,
                    color: theme.colors.textSecondary,
                    marginBottom: theme.spacing[2],
                    textAlign: 'center',
                  }}>
                    Добавьте хотя бы один этап для цели
                  </Text>
                )}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[2] }}>
                  <TextInput
                    style={{
                      flex: 1,
                      borderWidth: 2,
                      borderStyle: 'dashed',
                      borderColor: theme.colors.ink,
                      borderRadius: theme.borderRadius.md,
                      paddingHorizontal: theme.spacing[3],
                      paddingVertical: theme.spacing[3],
                      fontSize: theme.textStyles.body.fontSize,
                      color: theme.colors.ink,
                    }}
                    value={newMilestoneTitle}
                    onChangeText={setNewMilestoneTitle}
                    placeholder="Название этапа..."
                    placeholderTextColor={theme.colors.textSecondary}
                    onSubmitEditing={handleAddMilestone}
                    returnKeyType="done"
                  />
                  <TouchableOpacity
                    style={{
                      backgroundColor: newMilestoneTitle.trim() ? theme.colors.secondary : theme.colors.disabled,
                      borderRadius: theme.borderRadius.md,
                      borderWidth: theme.borderWidth.regular,
                      borderColor: theme.colors.ink,
                      paddingHorizontal: theme.spacing[3],
                      paddingVertical: theme.spacing[3],
                    }}
                    onPress={handleAddMilestone}
                    disabled={!newMilestoneTitle.trim()}
                  >
                    <Text style={{
                      fontSize: theme.textStyles.body.fontSize,
                      fontWeight: '700',
                      color: theme.colors.ink,
                    }}>
                      +
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Submit button */}
      {selectedTemplate && (
        <View style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: theme.spacing[5],
          backgroundColor: theme.colors.background,
        }}>
          <TouchableOpacity
            style={{
              backgroundColor: theme.colors.secondary,
              borderRadius: theme.borderRadius.button,
              borderWidth: theme.borderWidth.thick,
              borderColor: theme.colors.ink,
              paddingVertical: theme.spacing[4],
              alignItems: 'center',
              ...theme.shadows.button,
            }}
            onPress={handleCreate}
            disabled={createMut.isPending}
          >
            <Text style={{
              fontSize: theme.textStyles.heading.fontSize,
              fontWeight: '900',
              color: theme.colors.ink,
            }}>
              {createMut.isPending ? t('common.loading') : 'Поставить цель'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
