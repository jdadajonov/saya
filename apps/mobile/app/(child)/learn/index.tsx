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
    titleKey: 'learning.chess',
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
      paddingHorizontal: theme.spacing[6],
      paddingTop: 60,
      gap: theme.spacing[5],
    }}>
      <Text
        style={{
          fontSize: theme.textStyles.title.fontSize,
          fontWeight: '900',
          color: theme.colors.ink,
          marginBottom: theme.spacing[2],
        }}
        accessibilityRole="header"
      >
        {t('learning.study')} 📖
      </Text>

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
            backgroundColor: subject.tintKey === 'coral' ? theme.colors.primary : subject.tintKey === 'violet' ? theme.palette.violet : theme.colors.secondary,
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
  );
}
