import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

const MOODS = [
  { value: 'great', emoji: '😄', labelKey: 'activities.moodGreat' },
  { value: 'good', emoji: '🙂', labelKey: 'activities.moodGood' },
  { value: 'ok', emoji: '😐', labelKey: 'activities.moodOk' },
  { value: 'bad', emoji: '😕', labelKey: 'activities.moodBad' },
  { value: 'awful', emoji: '😩', labelKey: 'activities.moodAwful' },
] as const;

export type MoodValue = (typeof MOODS)[number]['value'];

interface Props {
  value?: MoodValue | null;
  onSelect: (mood: MoodValue) => void;
}

export function MoodPicker({ value, onSelect }: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Text style={styles.prompt}>{t('activities.moodPrompt')}</Text>
      <View style={styles.row} accessibilityRole="radiogroup">
        {MOODS.map((m) => (
          <TouchableOpacity
            key={m.value}
            style={[styles.btn, value === m.value && styles.btnSelected]}
            onPress={() => onSelect(m.value)}
            accessibilityRole="radio"
            accessibilityState={{ checked: value === m.value }}
            accessibilityLabel={t(m.labelKey)}
          >
            <Text style={styles.emoji}>{m.emoji}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  prompt: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  btn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSelected: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
  emoji: { fontSize: 26 },
});
