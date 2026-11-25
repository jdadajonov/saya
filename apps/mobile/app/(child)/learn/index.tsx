import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../src/ui/theme-provider';

const SUBJECTS = [
  {
    code: 'math.mul',
    icon: '✖️',
    emoji: '🧮',
    tintKey: 'coral' as const,
    titleKey: 'learning.multiplication',
    subKey: 'learning.multiplicationSub',
  },
  {
    code: 'en.a1',
    icon: '🔤',
    emoji: '🇬🇧',
    tintKey: 'teal' as const,
    titleKey: 'learning.english',
    subKey: 'learning.englishSub',
  },
  {
    code: 'chess',
    icon: '♟️',
    emoji: '♟️',
    tintKey: 'violet' as const,
    titleKey: 'learning.chess.title',
    subKey: 'learning.chessSub',
  },
];

export default function SubjectListScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();

  console.log('SubjectListScreen rendered');

  return (
    <View style={{
      flex: 1,
      backgroundColor: theme.colors.background,
    }}>
      {/* Header with back button */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing[5],
        paddingTop: 60,
        paddingBottom: theme.spacing[4],
        gap: theme.spacing[3],
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
          <Text style={{ fontSize: 24, color: theme.colors.ink, fontWeight: '600' }}>‹</Text>
        </TouchableOpacity>
        <Text
          style={{
            fontSize: theme.textStyles.title.fontSize,
            fontWeight: '900',
            color: theme.colors.ink,
            flex: 1,
          }}
          accessibilityRole="header"
        >
          {t('learning.study')} 📖
        </Text>
      </View>

      <View style={{
        paddingHorizontal: theme.spacing[6],
        gap: theme.spacing[5],
      }}>

      {SUBJECTS.map((subject) => (
        <TouchableOpacity
          key={subject.code}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.tints[subject.tintKey],
            borderRadius: theme.borderRadius.card,
            borderWidth: theme.borderWidth.thick,
            borderColor: theme.colors.ink,
            padding: theme.spacing[5],
            gap: theme.spacing[4],
            ...theme.shadows.card,
          }}
          onPress={() => router.push(`/(child)/learn/${subject.code}`)}
          accessibilityRole="button"
          accessibilityLabel={t(subject.titleKey)}
        >
          <View style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: subject.tintKey === 'coral' ? theme.colors.primary : subject.tintKey === 'violet' ? theme.colors.masteryBadge : theme.colors.secondary,
            borderWidth: theme.borderWidth.regular,
            borderColor: theme.colors.ink,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Text style={{ fontSize: 32 }}>{subject.emoji}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: theme.textStyles.heading.fontSize,
              fontWeight: '900',
              color: theme.colors.ink,
            }}>
              {t(subject.titleKey)}
            </Text>
            <Text style={{
              fontSize: theme.textStyles.caption.fontSize,
              color: theme.colors.textSecondary,
              marginTop: 4,
            }}>
              {t(subject.subKey)}
            </Text>
          </View>
          <Text style={{
            fontSize: 36,
            color: theme.colors.ink,
            fontWeight: '300',
          }}>›</Text>
        </TouchableOpacity>
      ))}
      </View>
    </View>
  );
}
