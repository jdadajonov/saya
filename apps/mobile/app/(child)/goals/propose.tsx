import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore, Child } from '../../../src/features/family/stores/auth-store';
import { useCreateGoal } from '../../../src/features/goals/hooks/use-goals';
import type { GoalDomain, MilestoneTemplate } from '@saya/core';

export default function ProposeGoalScreen() {
  const { t } = useTranslation();
  const router = useRouter();
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
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('goals.proposeGoal')}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.form}>
        <Text style={styles.intro}>{t('goals.proposeIntro')}</Text>

        {/* Title */}
        <View style={styles.field}>
          <Text style={styles.label}>{t('goals.titleLabel')}</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder={t('goals.proposeTitlePlaceholder')}
            maxLength={60}
          />
        </View>

        {/* Domain */}
        <View style={styles.field}>
          <Text style={styles.label}>{t('goals.domainLabel')}</Text>
          <View style={styles.domainRow}>
            <TouchableOpacity
              style={[styles.domainBtn, domain === 'learning' && styles.domainBtnSelected]}
              onPress={() => setDomain('learning')}
            >
              <Text style={[styles.domainBtnText, domain === 'learning' && styles.domainBtnTextSelected]}>
                {t('goals.domains.learning')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.domainBtn, domain === 'activity' && styles.domainBtnSelected]}
              onPress={() => setDomain('activity')}
            >
              <Text style={[styles.domainBtnText, domain === 'activity' && styles.domainBtnTextSelected]}>
                {t('goals.domains.activity')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Milestones */}
        <View style={styles.field}>
          <Text style={styles.label}>{t('goals.stepsLabel')}</Text>
          <Text style={styles.hint}>{t('goals.stepsHint')}</Text>
          {milestones.map((m, i) => (
            <View key={i} style={styles.milestoneRow}>
              <Text style={styles.milestoneNum}>{i + 1}</Text>
              <Text style={styles.milestoneTitle}>{m.title}</Text>
              <TouchableOpacity onPress={() => handleRemoveMilestone(i)}>
                <Text style={styles.milestoneRemove}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
          <View style={styles.addMilestoneRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={newMilestoneTitle}
              onChangeText={setNewMilestoneTitle}
              placeholder={t('goals.addStepPlaceholder')}
              maxLength={40}
              onSubmitEditing={handleAddMilestone}
            />
            <TouchableOpacity style={styles.addMilestoneBtn} onPress={handleAddMilestone}>
              <Text style={styles.addMilestoneBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, createMut.isPending && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={createMut.isPending}
        >
          <Text style={styles.submitBtnText}>
            {createMut.isPending ? t('common.loading') : t('goals.sendProposal')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 28, color: '#4F46E5', fontWeight: '300' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', color: '#1F2937' },
  form: { padding: 20, gap: 20 },
  intro: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
  },
  field: { gap: 8 },
  label: { fontSize: 13, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' },
  hint: { fontSize: 13, color: '#9CA3AF' },
  input: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
  },
  domainRow: { flexDirection: 'row', gap: 10 },
  domainBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1.5, borderColor: '#E5E7EB', alignItems: 'center' },
  domainBtnSelected: { borderColor: '#4F46E5', backgroundColor: '#EEF2FF' },
  domainBtnText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  domainBtnTextSelected: { color: '#4F46E5' },
  milestoneRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F9FAFB', borderRadius: 10, padding: 12 },
  milestoneNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#4F46E5', color: '#FFFFFF', textAlign: 'center', lineHeight: 24, fontSize: 12, fontWeight: '700' },
  milestoneTitle: { flex: 1, fontSize: 15, color: '#1F2937' },
  milestoneRemove: { fontSize: 14, color: '#EF4444', fontWeight: '700' },
  addMilestoneRow: { flexDirection: 'row', gap: 10 },
  addMilestoneBtn: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#4F46E5', alignItems: 'center', justifyContent: 'center' },
  addMilestoneBtnText: { fontSize: 24, color: '#FFFFFF', fontWeight: '300' },
  submitBtn: { backgroundColor: '#10B981', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 16 },
  submitBtnDisabled: { backgroundColor: '#E5E7EB' },
  submitBtnText: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
});
