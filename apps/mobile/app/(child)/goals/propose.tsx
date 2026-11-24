import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../src/ui/theme-provider';
import { useAuthStore } from '../../../src/features/family/stores/auth-store';
import { useCreateGoal } from '../../../src/features/goals/hooks/use-goals';
import type { GoalDomain, MilestoneTemplate } from '@saya/core';

export default function ProposeGoalScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const { children, activeChildId } = useAuthStore();
  const createMut = useCreateGoal();

  const child = children.find((c) => c.id === activeChildId);
  const childId = child?.id ?? '';

  const [title, setTitle] = useState('');
  const [domain, setDomain] = useState<GoalDomain>('learning');
  const [milestones, setMilestones] = useState<MilestoneTemplate[]>([]);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');

  const handleAddMilestone = () => {
    if (!newMilestoneTitle.trim()) return;
    setMilestones([...milestones, { title: newMilestoneTitle.trim() }]);
    setNewMilestoneTitle('');
  };

  const handleRemoveMilestone = (idx: number) => {
    setMilestones(milestones.filter((_, i) => i !== idx));
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      Alert.alert(t('common.error'), t('goals.needTitle'));
      return;
    }
    if (milestones.length === 0) {
      Alert.alert(t('common.error'), t('goals.needMilestones'));
      return;
    }

    createMut.mutate(
      {
        childId,
        domain,
        title: title.trim(),
        proposedBy: 'child',
        milestones,
      },
      {
        onSuccess: () => {
          Alert.alert(t('goals.proposalSent'), t('goals.proposalSentDesc'), [
            { text: t('common.ok'), onPress: () => router.back() },
          ]);
        },
        onError: () => Alert.alert(t('common.error'), t('common.retry')),
      },
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing[5],
        paddingTop: 60,
        paddingBottom: theme.spacing[4],
      }}>
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
        <Text style={{
          fontSize: theme.textStyles.title.fontSize,
          fontWeight: '900',
          color: theme.colors.ink,
        }}>
          {t('goals.proposeGoal')}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: theme.spacing[5] }}>
        <Text style={{
          fontSize: theme.textStyles.body.fontSize,
          color: theme.colors.textSecondary,
          lineHeight: 22,
          marginBottom: theme.spacing[5],
        }}>
          {t('goals.proposeIntro')}
        </Text>

        {/* Title */}
        <Text style={{
          fontSize: theme.textStyles.caption.fontSize,
          fontWeight: '700',
          color: theme.colors.textSecondary,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginBottom: theme.spacing[2],
        }}>
          {t('goals.titleLabel')}
        </Text>
        <TextInput
          style={{
            borderWidth: theme.borderWidth.regular,
            borderColor: theme.colors.ink,
            borderRadius: theme.borderRadius.card,
            paddingHorizontal: theme.spacing[4],
            paddingVertical: theme.spacing[4],
            fontSize: theme.textStyles.body.fontSize,
            color: theme.colors.ink,
            backgroundColor: theme.colors.surface,
            fontWeight: '600',
            ...theme.shadows.card,
          }}
          value={title}
          onChangeText={setTitle}
          placeholder={t('goals.proposeTitlePlaceholder')}
          placeholderTextColor={theme.colors.textSecondary}
          maxLength={60}
        />

        {/* Domain */}
        <Text style={{
          fontSize: theme.textStyles.caption.fontSize,
          fontWeight: '700',
          color: theme.colors.textSecondary,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginTop: theme.spacing[5],
          marginBottom: theme.spacing[2],
        }}>
          {t('goals.domainLabel')}
        </Text>
        <View style={{ flexDirection: 'row', gap: theme.spacing[3] }}>
          <TouchableOpacity
            style={{
              flex: 1,
              paddingVertical: theme.spacing[4],
              borderRadius: theme.borderRadius.card,
              borderWidth: theme.borderWidth.regular,
              borderColor: domain === 'learning' ? theme.colors.ink : theme.colors.disabled,
              backgroundColor: domain === 'learning' ? theme.tints.violet : theme.colors.surface,
              alignItems: 'center',
              ...(domain === 'learning' ? theme.shadows.card : {}),
            }}
            onPress={() => setDomain('learning')}
          >
            <Text style={{ fontSize: 24, marginBottom: theme.spacing[1] }}>📚</Text>
            <Text style={{
              fontSize: theme.textStyles.body.fontSize,
              fontWeight: domain === 'learning' ? '700' : '500',
              color: theme.colors.ink,
            }}>
              {t('goals.domains.learning')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              flex: 1,
              paddingVertical: theme.spacing[4],
              borderRadius: theme.borderRadius.card,
              borderWidth: theme.borderWidth.regular,
              borderColor: domain === 'activity' ? theme.colors.ink : theme.colors.disabled,
              backgroundColor: domain === 'activity' ? theme.tints.teal : theme.colors.surface,
              alignItems: 'center',
              ...(domain === 'activity' ? theme.shadows.card : {}),
            }}
            onPress={() => setDomain('activity')}
          >
            <Text style={{ fontSize: 24, marginBottom: theme.spacing[1] }}>⚽</Text>
            <Text style={{
              fontSize: theme.textStyles.body.fontSize,
              fontWeight: domain === 'activity' ? '700' : '500',
              color: theme.colors.ink,
            }}>
              {t('goals.domains.activity')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Milestones */}
        <Text style={{
          fontSize: theme.textStyles.caption.fontSize,
          fontWeight: '700',
          color: theme.colors.textSecondary,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginTop: theme.spacing[5],
          marginBottom: theme.spacing[1],
        }}>
          {t('goals.stepsLabel')}
        </Text>
        <Text style={{
          fontSize: theme.textStyles.caption.fontSize,
          color: theme.colors.textSecondary,
          marginBottom: theme.spacing[3],
        }}>
          {t('goals.stepsHint')}
        </Text>

        {milestones.map((m, i) => (
          <View
            key={i}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.card,
              borderWidth: theme.borderWidth.regular,
              borderColor: theme.colors.ink,
              padding: theme.spacing[3],
              marginBottom: theme.spacing[2],
              ...theme.shadows.card,
            }}
          >
            <View style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: theme.colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: theme.spacing[3],
            }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: theme.colors.onFill }}>{i + 1}</Text>
            </View>
            <Text style={{
              flex: 1,
              fontSize: theme.textStyles.body.fontSize,
              color: theme.colors.ink,
            }}>
              {m.title}
            </Text>
            <TouchableOpacity onPress={() => handleRemoveMilestone(i)}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: theme.colors.error }}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Add milestone */}
        <View style={{ flexDirection: 'row', gap: theme.spacing[3], marginTop: theme.spacing[2] }}>
          <TextInput
            style={{
              flex: 1,
              borderWidth: theme.borderWidth.regular,
              borderColor: theme.colors.ink,
              borderRadius: theme.borderRadius.card,
              paddingHorizontal: theme.spacing[4],
              paddingVertical: theme.spacing[3],
              fontSize: theme.textStyles.body.fontSize,
              color: theme.colors.ink,
              backgroundColor: theme.colors.surface,
              ...theme.shadows.card,
            }}
            value={newMilestoneTitle}
            onChangeText={setNewMilestoneTitle}
            placeholder={t('goals.addStepPlaceholder')}
            placeholderTextColor={theme.colors.textSecondary}
            maxLength={40}
            onSubmitEditing={handleAddMilestone}
          />
          <TouchableOpacity
            style={{
              width: 52,
              height: 52,
              borderRadius: theme.borderRadius.card,
              backgroundColor: theme.colors.primary,
              borderWidth: theme.borderWidth.regular,
              borderColor: theme.colors.ink,
              alignItems: 'center',
              justifyContent: 'center',
              ...theme.shadows.button,
            }}
            onPress={handleAddMilestone}
          >
            <Text style={{ fontSize: 24, color: theme.colors.onFill, fontWeight: '300' }}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={{
            backgroundColor: createMut.isPending ? theme.colors.disabled : theme.colors.secondary,
            borderRadius: theme.borderRadius.button,
            borderWidth: theme.borderWidth.thick,
            borderColor: theme.colors.ink,
            paddingVertical: theme.spacing[4],
            alignItems: 'center',
            marginTop: theme.spacing[6],
            ...theme.shadows.button,
          }}
          onPress={handleSubmit}
          disabled={createMut.isPending}
        >
          <Text style={{
            fontSize: theme.textStyles.body.fontSize,
            fontWeight: '900',
            color: theme.colors.ink,
          }}>
            {createMut.isPending ? t('common.loading') : t('goals.sendProposal')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
