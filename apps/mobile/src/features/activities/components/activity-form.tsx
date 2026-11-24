import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { expandSessions } from '@saya/core';
import type { RecurrenceRule, WeekDay } from '@saya/core';
import type { CreateActivityInput } from '../hooks/use-activities';

const KINDS = [
  { value: 'sport', emoji: '⚽', key: 'activities.kindSport' },
  { value: 'music', emoji: '🎵', key: 'activities.kindMusic' },
  { value: 'language', emoji: '💬', key: 'activities.kindLanguage' },
  { value: 'other', emoji: '✦', key: 'activities.kindOther' },
] as const;

const COLORS = ['#4F46E5', '#059669', '#DC2626', '#D97706', '#7C3AED', '#0EA5E9'];

const WEEKDAYS: Array<{ value: WeekDay; labelKey: string }> = [
  { value: 'MON', labelKey: 'activities.mon' },
  { value: 'TUE', labelKey: 'activities.tue' },
  { value: 'WED', labelKey: 'activities.wed' },
  { value: 'THU', labelKey: 'activities.thu' },
  { value: 'FRI', labelKey: 'activities.fri' },
  { value: 'SAT', labelKey: 'activities.sat' },
  { value: 'SUN', labelKey: 'activities.sun' },
];

function formatSessionPreview(d: Date): string {
  const days = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${days[d.getDay()]} ${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')} ${h}:${m}`;
}

interface Props {
  childId: string;
  onSubmit: (input: CreateActivityInput) => void;
  submitting?: boolean;
}

export function ActivityForm({ childId, onSubmit, submitting }: Props) {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [place, setPlace] = useState('');
  const [kind, setKind] = useState<string>('sport');
  const [color, setColor] = useState(COLORS[0] as string);
  const [days, setDays] = useState<WeekDay[]>(['MON', 'WED', 'FRI']);
  const [time, setTime] = useState('16:00');
  const [durationMin, setDurationMin] = useState('60');

  const rule: RecurrenceRule = {
    freq: 'weekly',
    days,
    time,
    durationMin: parseInt(durationMin, 10) || 60,
  };

  const preview = expandSessions(rule, new Date(), 1).slice(0, 3);

  const toggleDay = (day: WeekDay) => {
    setDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const isValid = title.trim().length > 0 && days.length > 0 && /^\d{2}:\d{2}$/.test(time);

  const handleSubmit = () => {
    if (!isValid) return;
    onSubmit({ childId, kind, title: title.trim(), place: place.trim() || undefined, color, rule });
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {/* Title */}
      <View style={styles.field}>
        <Text style={styles.label}>{t('activities.titleLabel')}</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder={t('activities.titlePlaceholder')}
          maxLength={40}
          accessibilityLabel={t('activities.titleLabel')}
        />
      </View>

      {/* Place */}
      <View style={styles.field}>
        <Text style={styles.label}>{t('activities.placeLabel')}</Text>
        <TextInput
          style={styles.input}
          value={place}
          onChangeText={setPlace}
          placeholder={t('activities.placePlaceholder')}
          maxLength={60}
          accessibilityLabel={t('activities.placeLabel')}
        />
      </View>

      {/* Kind */}
      <View style={styles.field}>
        <Text style={styles.label}>{t('activities.kindLabel')}</Text>
        <View style={styles.kindRow}>
          {KINDS.map((k) => (
            <TouchableOpacity
              key={k.value}
              style={[styles.kindBtn, kind === k.value && styles.kindBtnSelected]}
              onPress={() => setKind(k.value)}
              accessibilityRole="radio"
              accessibilityState={{ checked: kind === k.value }}
              accessibilityLabel={t(k.key)}
            >
              <Text style={styles.kindEmoji}>{k.emoji}</Text>
              <Text style={[styles.kindLabel, kind === k.value && styles.kindLabelSelected]}>
                {t(k.key)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Color */}
      <View style={styles.field}>
        <Text style={styles.label}>{t('activities.colorLabel')}</Text>
        <View style={styles.colorRow}>
          {COLORS.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.colorBtn, { backgroundColor: c }, color === c && styles.colorBtnSelected]}
              onPress={() => setColor(c)}
              accessibilityRole="radio"
              accessibilityState={{ checked: color === c }}
              accessibilityLabel={c}
            />
          ))}
        </View>
      </View>

      {/* Days */}
      <View style={styles.field}>
        <Text style={styles.label}>{t('activities.daysLabel')}</Text>
        <View style={styles.daysRow}>
          {WEEKDAYS.map((d) => (
            <TouchableOpacity
              key={d.value}
              style={[styles.dayBtn, days.includes(d.value) && styles.dayBtnSelected]}
              onPress={() => toggleDay(d.value)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: days.includes(d.value) }}
              accessibilityLabel={t(d.labelKey)}
            >
              <Text style={[styles.dayBtnText, days.includes(d.value) && styles.dayBtnTextSelected]}>
                {t(d.labelKey)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Time + Duration */}
      <View style={styles.row}>
        <View style={[styles.field, { flex: 1 }]}>
          <Text style={styles.label}>{t('activities.timeLabel')}</Text>
          <TextInput
            style={styles.input}
            value={time}
            onChangeText={setTime}
            placeholder="16:00"
            keyboardType="numbers-and-punctuation"
            maxLength={5}
            accessibilityLabel={t('activities.timeLabel')}
          />
        </View>
        <View style={[styles.field, { flex: 1 }]}>
          <Text style={styles.label}>{t('activities.durationLabel')}</Text>
          <TextInput
            style={styles.input}
            value={durationMin}
            onChangeText={setDurationMin}
            keyboardType="number-pad"
            maxLength={3}
            accessibilityLabel={t('activities.durationLabel')}
          />
        </View>
      </View>

      {/* Preview */}
      {preview.length > 0 && (
        <View style={styles.previewBox}>
          <Text style={styles.previewLabel}>{t('activities.nextSessions')}</Text>
          {preview.map((s, i) => (
            <Text key={i} style={styles.previewRow}>
              • {formatSessionPreview(s.startsAt)}
            </Text>
          ))}
        </View>
      )}

      <TouchableOpacity
        style={[styles.submitBtn, (!isValid || submitting) && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={!isValid || submitting}
        accessibilityRole="button"
        accessibilityLabel={t('activities.create')}
      >
        <Text style={styles.submitBtnText}>
          {submitting ? t('common.loading') : t('activities.create')}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 20 },
  field: { gap: 6 },
  row: { flexDirection: 'row', gap: 12 },
  label: { fontSize: 13, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 },
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
  kindRow: { flexDirection: 'row', gap: 8 },
  kindBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    gap: 4,
  },
  kindBtnSelected: { borderColor: '#4F46E5', backgroundColor: '#EEF2FF' },
  kindEmoji: { fontSize: 22 },
  kindLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '600' },
  kindLabelSelected: { color: '#4F46E5' },
  colorRow: { flexDirection: 'row', gap: 10 },
  colorBtn: { width: 32, height: 32, borderRadius: 16 },
  colorBtnSelected: { borderWidth: 3, borderColor: '#1F2937' },
  daysRow: { flexDirection: 'row', gap: 6 },
  dayBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  dayBtnSelected: { borderColor: '#4F46E5', backgroundColor: '#EEF2FF' },
  dayBtnText: { fontSize: 11, fontWeight: '700', color: '#9CA3AF' },
  dayBtnTextSelected: { color: '#4F46E5' },
  previewBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    gap: 4,
  },
  previewLabel: { fontSize: 12, fontWeight: '600', color: '#9CA3AF', marginBottom: 4 },
  previewRow: { fontSize: 14, color: '#374151' },
  submitBtn: {
    backgroundColor: '#4F46E5',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitBtnDisabled: { backgroundColor: '#E5E7EB' },
  submitBtnText: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
});
