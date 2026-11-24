import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { SessionRow, ActivityRow } from '../hooks/use-activities';

interface Props {
  weekStart: Date;
  sessions: SessionRow[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

const DAY_ABBR_KEYS = ['activities.sun', 'activities.mon', 'activities.tue', 'activities.wed', 'activities.thu', 'activities.fri', 'activities.sat'];

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

export function WeeklyStrip({ weekStart, sessions, selectedDate, onSelectDate }: Props) {
  const { t } = useTranslation();
  const today = new Date();

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      accessibilityRole="tablist"
    >
      {days.map((day) => {
        const isSelected = isSameDay(day, selectedDate);
        const isToday = isSameDay(day, today);
        const daySessions = sessions.filter((s) =>
          isSameDay(new Date(s.starts_at), day) && s.status !== 'cancelled',
        );

        return (
          <TouchableOpacity
            key={day.toISOString()}
            style={[styles.day, isSelected && styles.daySelected]}
            onPress={() => onSelectDate(day)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={t('activities.dayLabel', { date: day.getDate(), month: day.getMonth() + 1 })}
          >
            <Text style={[styles.dayAbbr, isSelected && styles.dayAbbrSelected]}>
              {t(DAY_ABBR_KEYS[day.getDay()] ?? 'activities.mon')}
            </Text>
            <Text style={[styles.dayNum, isToday && styles.dayNumToday, isSelected && styles.dayNumSelected]}>
              {day.getDate()}
            </Text>
            {/* Dots */}
            <View style={styles.dots}>
              {daySessions.slice(0, 3).map((s) => (
                <View
                  key={s.id}
                  style={[styles.dot, { backgroundColor: (s.activity as ActivityRow | undefined)?.color ?? '#4F46E5' }]}
                />
              ))}
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
  },
  day: {
    width: 44,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 14,
    gap: 4,
  },
  daySelected: {
    backgroundColor: '#4F46E5',
  },
  dayAbbr: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
  },
  dayAbbrSelected: { color: '#C7D2FE' },
  dayNum: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  dayNumToday: { color: '#4F46E5' },
  dayNumSelected: { color: '#FFFFFF' },
  dots: {
    flexDirection: 'row',
    gap: 3,
    minHeight: 7,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
