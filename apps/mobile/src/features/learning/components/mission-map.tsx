import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';

interface MissionMapLevel {
  skillCode: string;
  label: string;
  stars: 0 | 1 | 2 | 3;
  unlocked: boolean;
}

interface MissionMapProps {
  levels: MissionMapLevel[];
  onSelectLevel: (skillCode: string) => void;
}

function StarsDisplay({ count }: { count: 0 | 1 | 2 | 3 }) {
  return (
    <View style={styles.starsRow}>
      {[1, 2, 3].map((i) => (
        <Text key={i} style={[styles.starIcon, { opacity: count >= i ? 1 : 0.2 }]}>★</Text>
      ))}
    </View>
  );
}

export function MissionMap({ levels, onSelectLevel }: MissionMapProps) {
  const { t } = useTranslation();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {levels.map((level, index) => {
        const isLocked = !level.unlocked;
        return (
          <View key={level.skillCode} style={styles.levelRow}>
            {index < levels.length - 1 && (
              <View style={[styles.connector, { backgroundColor: level.stars > 0 ? '#4F46E5' : '#E5E7EB' }]} />
            )}
            <TouchableOpacity
              style={[
                styles.levelCell,
                level.stars > 0 && styles.levelCellDone,
                isLocked && styles.levelCellLocked,
              ]}
              onPress={() => !isLocked && onSelectLevel(level.skillCode)}
              disabled={isLocked}
              accessibilityRole="button"
              accessibilityState={{ disabled: isLocked }}
              accessibilityLabel={
                isLocked
                  ? t('learning.levelLocked', { label: level.label })
                  : t('learning.levelLabel', { label: level.label, stars: level.stars })
              }
            >
              {isLocked ? (
                <Text style={styles.lockIcon}>🔒</Text>
              ) : (
                <>
                  <Text style={[styles.levelLabel, level.stars > 0 && styles.levelLabelDone]}>
                    {level.label}
                  </Text>
                  <StarsDisplay count={level.stars} />
                </>
              )}
            </TouchableOpacity>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 0,
  },
  levelRow: {
    alignItems: 'center',
  },
  connector: {
    width: 3,
    height: 24,
    borderRadius: 2,
  },
  levelCell: {
    width: 120,
    height: 90,
    borderRadius: 20,
    borderWidth: 2.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  levelCellDone: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
  levelCellLocked: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  levelLabel: {
    fontSize: 20,
    fontWeight: '800',
    color: '#9CA3AF',
  },
  levelLabelDone: {
    color: '#4F46E5',
  },
  lockIcon: {
    fontSize: 24,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 1,
  },
  starIcon: {
    fontSize: 14,
    color: '#F59E0B',
  },
});
