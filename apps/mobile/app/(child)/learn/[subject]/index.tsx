import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../src/ui/theme-provider';
import { useSkillStarsQuery } from '../../../../src/features/learning/hooks/use-mission';

type GameMode = 'basic' | 'timed' | 'cumulative';

interface LevelConfig {
  number: number;
  modes: {
    mode: GameMode;
    code: string;
    label: string;
    icon: string;
  }[];
}

interface EnglishTopic {
  code: string;
  label: string;
  icon: string;
  wordCount: number;
}

const MODE_ICONS: Record<GameMode, string> = {
  basic: '📝',
  timed: '⏱️',
  cumulative: '🎯',
};

const MODE_LABELS: Record<GameMode, string> = {
  basic: 'Учим',
  timed: 'На время',
  cumulative: 'Микс',
};

const ENGLISH_TOPICS: EnglishTopic[] = [
  { code: 'en.a1.animals', label: 'Животные', icon: '🐱', wordCount: 20 },
  { code: 'en.a1.family', label: 'Семья', icon: '👨‍👩‍👧', wordCount: 20 },
  { code: 'en.a1.food', label: 'Еда', icon: '🍎', wordCount: 20 },
  { code: 'en.a1.colors', label: 'Цвета', icon: '🎨', wordCount: 15 },
  { code: 'en.a1.body', label: 'Тело', icon: '🫀', wordCount: 20 },
  { code: 'en.a1.home', label: 'Дом', icon: '🏠', wordCount: 20 },
  { code: 'en.a1.school', label: 'Школа', icon: '📚', wordCount: 20 },
  { code: 'en.a1.time', label: 'Время', icon: '⏰', wordCount: 20 },
  { code: 'en.a1.actions', label: 'Действия', icon: '🏃', wordCount: 29 },
  { code: 'en.a1.adjectives', label: 'Прилагательные', icon: '✨', wordCount: 25 },
  { code: 'en.a1.places', label: 'Места', icon: '🏙️', wordCount: 20 },
  { code: 'en.a1.nature', label: 'Природа', icon: '🌳', wordCount: 20 },
  { code: 'en.a1.transport', label: 'Транспорт', icon: '🚗', wordCount: 10 },
  { code: 'en.a1.clothes', label: 'Одежда', icon: '👕', wordCount: 15 },
  { code: 'en.a1.numbers', label: 'Числа', icon: '🔢', wordCount: 15 },
  { code: 'en.a1.sports', label: 'Спорт', icon: '⚽', wordCount: 15 },
];

function generateMathLevels(): LevelConfig[] {
  return [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => ({
    number: n,
    modes: [
      { mode: 'basic' as GameMode, code: `math.mul.${n}`, label: `×${n}`, icon: MODE_ICONS.basic },
      { mode: 'timed' as GameMode, code: `math.mul.${n}.timed`, label: `×${n}`, icon: MODE_ICONS.timed },
      { mode: 'cumulative' as GameMode, code: `math.mul.${n}.cumulative`, label: `×1-${n}`, icon: MODE_ICONS.cumulative },
    ],
  }));
}

function MathMapScreen({ subject, theme, router, starsQuery, t }: {
  subject: string;
  theme: ReturnType<typeof useTheme>;
  router: ReturnType<typeof useRouter>;
  starsQuery: ReturnType<typeof useSkillStarsQuery>;
  t: ReturnType<typeof useTranslation>['t'];
}) {
  const mathLevels = generateMathLevels();
  const getStars = (code: string) => (starsQuery.data?.get(code) ?? 0) as 0 | 1 | 2 | 3;

  const isUnlocked = (levelIndex: number, modeIndex: number) => {
    if (levelIndex === 0 && modeIndex === 0) return true;
    const level = mathLevels[levelIndex]!;
    if (modeIndex > 0) {
      const prevMode = level.modes[modeIndex - 1]!;
      return getStars(prevMode.code) >= 1;
    }
    const prevLevel = mathLevels[levelIndex - 1]!;
    return getStars(prevLevel.modes[0]!.code) >= 1;
  };

  const handleSelectLevel = (code: string, mode: GameMode, number: number) => {
    router.push(`/(child)/learn/${subject}/mission?skillCode=${code}&mode=${mode}&number=${number}`);
  };

  return (
    <>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: theme.spacing[5],
          paddingBottom: 120,
        }}
      >
        {mathLevels.map((level, levelIndex) => {
          const basicUnlocked = isUnlocked(levelIndex, 0);
          return (
            <View key={level.number} style={{ marginBottom: theme.spacing[4] }}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: theme.spacing[2],
              }}>
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: basicUnlocked ? theme.colors.primary : theme.colors.disabled,
                  borderWidth: theme.borderWidth.regular,
                  borderColor: theme.colors.ink,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Text style={{
                    fontSize: 18,
                    fontWeight: '900',
                    color: basicUnlocked ? theme.colors.onFill : theme.colors.textSecondary,
                  }}>
                    ×{level.number}
                  </Text>
                </View>
                {!basicUnlocked && (
                  <Text style={{ marginLeft: theme.spacing[2], fontSize: 16 }}>🔒</Text>
                )}
              </View>
              <View style={{ flexDirection: 'row', gap: theme.spacing[2] }}>
                {level.modes.map((modeConfig, modeIndex) => {
                  const unlocked = isUnlocked(levelIndex, modeIndex);
                  const stars = getStars(modeConfig.code);
                  return (
                    <TouchableOpacity
                      key={modeConfig.code}
                      disabled={!unlocked}
                      onPress={() => handleSelectLevel(modeConfig.code, modeConfig.mode, level.number)}
                      style={{
                        flex: 1,
                        backgroundColor: unlocked
                          ? (stars > 0 ? theme.tints.sun : theme.colors.surface)
                          : theme.colors.disabled,
                        borderRadius: theme.borderRadius.card,
                        borderWidth: theme.borderWidth.regular,
                        borderColor: unlocked ? theme.colors.ink : theme.colors.disabled,
                        padding: theme.spacing[3],
                        alignItems: 'center',
                        opacity: unlocked ? 1 : 0.5,
                      }}
                    >
                      <Text style={{ fontSize: 20, marginBottom: 4 }}>
                        {unlocked ? modeConfig.icon : '🔒'}
                      </Text>
                      <Text style={{
                        fontSize: 12,
                        fontWeight: '600',
                        color: theme.colors.ink,
                        marginBottom: 4,
                      }}>
                        {MODE_LABELS[modeConfig.mode]}
                      </Text>
                      {unlocked && (
                        <View style={{ flexDirection: 'row', gap: 2 }}>
                          {[1, 2, 3].map((s) => (
                            <Text key={s} style={{ fontSize: 10 }}>
                              {stars >= s ? '⭐' : '☆'}
                            </Text>
                          ))}
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })}
      </ScrollView>
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
            backgroundColor: theme.colors.primary,
            borderRadius: theme.borderRadius.button,
            borderWidth: theme.borderWidth.thick,
            borderColor: theme.colors.ink,
            paddingVertical: theme.spacing[4],
            alignItems: 'center',
            ...theme.shadows.button,
          }}
          onPress={() => router.push(`/(child)/learn/${subject}/mission?skillCode=${subject}&mode=basic`)}
        >
          <Text style={{
            fontSize: theme.textStyles.heading.fontSize,
            fontWeight: '900',
            color: theme.colors.onFill,
          }}>
            {t('learning.startBattle')} ⚔️
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

function EnglishMapScreen({ subject, theme, router, starsQuery }: {
  subject: string;
  theme: ReturnType<typeof useTheme>;
  router: ReturnType<typeof useRouter>;
  starsQuery: ReturnType<typeof useSkillStarsQuery>;
}) {
  const getStars = (code: string) => (starsQuery.data?.get(code) ?? 0) as 0 | 1 | 2 | 3;

  const handleSelectTopic = (code: string) => {
    router.push(`/(child)/learn/${subject}/mission?skillCode=${code}&mode=basic`);
  };

  return (
    <>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: theme.spacing[4],
          paddingBottom: 40,
        }}
      >
        <View style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: theme.spacing[3],
        }}>
          {ENGLISH_TOPICS.map((topic, index) => {
            const stars = getStars(topic.code);
            const isUnlocked = index === 0 || getStars(ENGLISH_TOPICS[index - 1]!.code) >= 1;

            return (
              <TouchableOpacity
                key={topic.code}
                disabled={!isUnlocked}
                onPress={() => handleSelectTopic(topic.code)}
                style={{
                  width: '47%',
                  backgroundColor: isUnlocked
                    ? (stars > 0 ? theme.tints.sun : theme.colors.surface)
                    : theme.colors.disabled,
                  borderRadius: theme.borderRadius.card,
                  borderWidth: theme.borderWidth.regular,
                  borderColor: isUnlocked ? theme.colors.ink : theme.colors.disabled,
                  padding: theme.spacing[4],
                  alignItems: 'center',
                  opacity: isUnlocked ? 1 : 0.6,
                  ...theme.shadows.card,
                }}
              >
                <Text style={{ fontSize: 36, marginBottom: theme.spacing[2] }}>
                  {isUnlocked ? topic.icon : '🔒'}
                </Text>
                <Text style={{
                  fontSize: 14,
                  fontWeight: '700',
                  color: theme.colors.ink,
                  textAlign: 'center',
                  marginBottom: theme.spacing[1],
                }}>
                  {topic.label}
                </Text>
                <Text style={{
                  fontSize: 11,
                  color: theme.colors.textSecondary,
                  marginBottom: theme.spacing[2],
                }}>
                  {topic.wordCount} слов
                </Text>
                {isUnlocked && (
                  <View style={{ flexDirection: 'row', gap: 2 }}>
                    {[1, 2, 3].map((s) => (
                      <Text key={s} style={{ fontSize: 12 }}>
                        {stars >= s ? '⭐' : '☆'}
                      </Text>
                    ))}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </>
  );
}

export default function MissionMapScreen() {
  const { subject } = useLocalSearchParams<{ subject: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const starsQuery = useSkillStarsQuery(subject ?? 'math.mul');

  const isEnglish = subject?.startsWith('en.');
  const headerTitle = isEnglish ? t('learning.english') : t('learning.multiplication');
  const headerEmoji = isEnglish ? '🇬🇧' : '🧮';

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
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
          <Text style={{ fontSize: 24, color: theme.colors.ink, fontWeight: '600' }}>‹</Text>
        </TouchableOpacity>
        <Text style={{
          fontSize: theme.textStyles.heading.fontSize,
          fontWeight: '900',
          color: theme.colors.ink,
        }}>
          {headerTitle} {headerEmoji}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      {starsQuery.isLoading ? (
        <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 48 }} />
      ) : isEnglish ? (
        <EnglishMapScreen subject={subject!} theme={theme} router={router} starsQuery={starsQuery} />
      ) : (
        <MathMapScreen subject={subject!} theme={theme} router={router} starsQuery={starsQuery} t={t} />
      )}
    </View>
  );
}
