import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withSequence,
  withTiming,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../ui/theme-provider';
import type { MissionResult } from '@saya/core';

interface MissionCompleteProps {
  result: MissionResult;
  onPlayAgain: () => void;
  onExit: () => void;
  timerSeconds?: number;
  errorCount?: number;
}

type MoodValue = 'great' | 'good' | 'ok' | 'bad' | 'awful';

const MOODS: { value: MoodValue; emoji: string; labelKey: string }[] = [
  { value: 'great', emoji: '😄', labelKey: 'activities.moodGreat' },
  { value: 'good', emoji: '🙂', labelKey: 'activities.moodGood' },
  { value: 'ok', emoji: '😐', labelKey: 'activities.moodOk' },
  { value: 'bad', emoji: '😕', labelKey: 'activities.moodBad' },
  { value: 'awful', emoji: '😩', labelKey: 'activities.moodAwful' },
];

function Confetti({ delay, x, color }: { delay: number; x: number; color: string }) {
  const translateY = useSharedValue(-50);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 200 }));
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(20, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(-20, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      ),
    );
    rotate.value = withDelay(
      delay,
      withRepeat(withTiming(360, { duration: 4000 }), -1),
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    position: 'absolute',
    left: x,
    top: 20,
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  return (
    <Animated.View style={style}>
      <View style={{
        width: 12,
        height: 12,
        borderRadius: 2,
        backgroundColor: color,
        transform: [{ rotate: '45deg' }],
      }} />
    </Animated.View>
  );
}

function Mascot() {
  const bounce = useSharedValue(0);

  useEffect(() => {
    bounce.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 400, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 400, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: bounce.value }],
  }));

  return (
    <Animated.View style={[{ alignItems: 'center' }, style]}>
      <View style={{
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#5DD4C8',
        borderWidth: 3,
        borderColor: '#1F2937',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}>
        {/* Antennae */}
        <View style={{
          position: 'absolute',
          top: -20,
          left: 25,
          width: 4,
          height: 20,
          backgroundColor: '#5DD4C8',
          borderRadius: 2,
        }} />
        <View style={{
          position: 'absolute',
          top: -28,
          left: 22,
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: '#FF6B9D',
          borderWidth: 2,
          borderColor: '#1F2937',
        }} />
        <View style={{
          position: 'absolute',
          top: -20,
          right: 25,
          width: 4,
          height: 20,
          backgroundColor: '#5DD4C8',
          borderRadius: 2,
        }} />
        <View style={{
          position: 'absolute',
          top: -28,
          right: 22,
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: '#5DD4C8',
          borderWidth: 2,
          borderColor: '#1F2937',
        }} />
        {/* Happy face */}
        <View style={{ flexDirection: 'row', gap: 16, marginBottom: 4 }}>
          <View style={{
            width: 8,
            height: 4,
            backgroundColor: '#1F2937',
            borderRadius: 4,
            transform: [{ rotate: '-10deg' }],
          }} />
          <View style={{
            width: 8,
            height: 4,
            backgroundColor: '#1F2937',
            borderRadius: 4,
            transform: [{ rotate: '10deg' }],
          }} />
        </View>
        <View style={{
          width: 40,
          height: 20,
          borderBottomLeftRadius: 20,
          borderBottomRightRadius: 20,
          backgroundColor: '#1F2937',
        }} />
        {/* Cheeks */}
        <View style={{
          position: 'absolute',
          left: 10,
          top: 50,
          width: 16,
          height: 10,
          borderRadius: 5,
          backgroundColor: '#FFB6C1',
        }} />
        <View style={{
          position: 'absolute',
          right: 10,
          top: 50,
          width: 16,
          height: 10,
          borderRadius: 5,
          backgroundColor: '#FFB6C1',
        }} />
      </View>
    </Animated.View>
  );
}

export function MissionComplete({ result, onPlayAgain, onExit, timerSeconds, errorCount }: MissionCompleteProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [mood, setMood] = useState<MoodValue | null>(null);

  const cardScale = useSharedValue(0.8);
  const cardOpacity = useSharedValue(0);

  useEffect(() => {
    cardScale.value = withSpring(1, { damping: 12, stiffness: 200 });
    cardOpacity.value = withTiming(1, { duration: 300 });
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
    opacity: cardOpacity.value,
  }));

  const confettiColors = [theme.tints.coral, theme.tints.teal, theme.tints.sun, theme.tints.violet, '#FF6B9D'];

  return (
    <View style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: theme.tints.sun,
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      {/* Confetti decorations */}
      {confettiColors.map((color, i) => (
        <Confetti key={`l${i}`} delay={i * 100} x={30 + i * 20} color={color} />
      ))}
      {confettiColors.map((color, i) => (
        <Confetti key={`r${i}`} delay={i * 100 + 50} x={280 + i * 15} color={color} />
      ))}

      {/* Stars decoration */}
      <View style={{ position: 'absolute', top: 60, left: 40 }}>
        <Text style={{ fontSize: 20, color: theme.colors.ink }}>⭐</Text>
      </View>
      <View style={{ position: 'absolute', top: 100, right: 50 }}>
        <Text style={{ fontSize: 16, color: '#FF6B9D' }}>★</Text>
      </View>
      <View style={{ position: 'absolute', top: 180, left: 30 }}>
        <Text style={{ fontSize: 14, color: theme.colors.ink, opacity: 0.3 }}>✦</Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: theme.spacing[5],
        }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[{ alignItems: 'center', width: '100%' }, cardStyle]}>
          {/* Mascot */}
          <Mascot />

          {/* Title */}
          <Text style={{
            fontSize: 32,
            fontWeight: '900',
            color: theme.colors.ink,
            marginTop: theme.spacing[4],
            marginBottom: theme.spacing[3],
          }} accessibilityRole="header">
            {t('learning.missionComplete')}
          </Text>

          {/* Rewards badges */}
          <View style={{
            flexDirection: 'row',
            gap: theme.spacing[3],
            marginBottom: theme.spacing[4],
          }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.full,
              borderWidth: theme.borderWidth.regular,
              borderColor: theme.colors.ink,
              paddingHorizontal: theme.spacing[4],
              paddingVertical: theme.spacing[2],
              gap: theme.spacing[2],
              ...theme.shadows.chip,
            }}>
              <Text style={{ fontSize: 20 }}>⭐</Text>
              <Text style={{
                fontSize: theme.textStyles.body.fontSize,
                fontWeight: '800',
                color: theme.colors.ink,
              }}>
                +{result.xpEarned} XP
              </Text>
            </View>

            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.full,
              borderWidth: theme.borderWidth.regular,
              borderColor: theme.colors.ink,
              paddingHorizontal: theme.spacing[4],
              paddingVertical: theme.spacing[2],
              gap: theme.spacing[2],
              ...theme.shadows.chip,
            }}>
              <Text style={{ fontSize: 20 }}>🪙</Text>
              <Text style={{
                fontSize: theme.textStyles.body.fontSize,
                fontWeight: '800',
                color: theme.colors.ink,
              }}>
                +2
              </Text>
            </View>
          </View>

          {/* Timer stats for timed mode */}
          {timerSeconds !== undefined && (
            <View style={{
              flexDirection: 'row',
              gap: theme.spacing[3],
              marginBottom: theme.spacing[4],
            }}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.full,
                borderWidth: theme.borderWidth.regular,
                borderColor: theme.colors.ink,
                paddingHorizontal: theme.spacing[4],
                paddingVertical: theme.spacing[2],
                gap: theme.spacing[2],
                ...theme.shadows.chip,
              }}>
                <Text style={{ fontSize: 20 }}>⏱️</Text>
                <Text style={{
                  fontSize: theme.textStyles.body.fontSize,
                  fontWeight: '800',
                  color: theme.colors.ink,
                }}>
                  {Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, '0')}
                </Text>
              </View>

              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: (errorCount ?? 0) === 0 ? theme.colors.success : theme.colors.error,
                borderRadius: theme.borderRadius.full,
                borderWidth: theme.borderWidth.regular,
                borderColor: theme.colors.ink,
                paddingHorizontal: theme.spacing[4],
                paddingVertical: theme.spacing[2],
                gap: theme.spacing[2],
                ...theme.shadows.chip,
              }}>
                <Text style={{ fontSize: 20 }}>{(errorCount ?? 0) === 0 ? '✅' : '❌'}</Text>
                <Text style={{
                  fontSize: theme.textStyles.body.fontSize,
                  fontWeight: '800',
                  color: theme.colors.onFill,
                }}>
                  {errorCount ?? 0} {(errorCount ?? 0) === 1 ? 'ошибка' : (errorCount ?? 0) >= 2 && (errorCount ?? 0) <= 4 ? 'ошибки' : 'ошибок'}
                </Text>
              </View>
            </View>
          )}

          {/* Achievement message */}
          {result.selfCorrectedCount > 0 && (
            <View style={{
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.card,
              borderWidth: theme.borderWidth.regular,
              borderColor: theme.colors.ink,
              padding: theme.spacing[4],
              marginBottom: theme.spacing[4],
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: theme.spacing[3],
              width: '100%',
              ...theme.shadows.card,
            }}>
              <View style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: theme.colors.success,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>✓</Text>
              </View>
              <Text style={{
                flex: 1,
                fontSize: theme.textStyles.body.fontSize,
                color: theme.colors.ink,
                lineHeight: 22,
              }}>
                {t('learning.selfCorrected')} ×{result.selfCorrectedCount}. {t('learning.correct')}
              </Text>
            </View>
          )}

          {/* Mood picker */}
          <View style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.card,
            borderWidth: theme.borderWidth.regular,
            borderColor: theme.colors.ink,
            padding: theme.spacing[4],
            marginBottom: theme.spacing[5],
            width: '100%',
            ...theme.shadows.card,
          }}>
            <Text style={{
              fontSize: theme.textStyles.body.fontSize,
              fontWeight: '700',
              color: theme.colors.ink,
              textAlign: 'center',
              marginBottom: theme.spacing[3],
            }}>
              {t('child.howWasIt')}
            </Text>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
            }}>
              {MOODS.map((m) => (
                <TouchableOpacity
                  key={m.value}
                  style={{
                    alignItems: 'center',
                    gap: theme.spacing[1],
                  }}
                  onPress={() => setMood(m.value)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: mood === m.value }}
                  accessibilityLabel={t(m.labelKey)}
                >
                  <View style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    borderWidth: mood === m.value ? theme.borderWidth.thick : theme.borderWidth.regular,
                    borderColor: mood === m.value ? theme.colors.primary : theme.colors.ink,
                    backgroundColor: mood === m.value ? theme.tints.sun : theme.colors.surface,
                    alignItems: 'center',
                    justifyContent: 'center',
                    ...theme.shadows.chip,
                  }}>
                    <Text style={{ fontSize: 24 }}>{m.emoji}</Text>
                  </View>
                  <Text style={{
                    fontSize: 11,
                    fontWeight: '600',
                    color: theme.colors.textSecondary,
                  }}>
                    {t(m.labelKey)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Action button */}
          <TouchableOpacity
            style={{
              backgroundColor: theme.tints.sun,
              borderRadius: theme.borderRadius.button,
              borderWidth: theme.borderWidth.thick,
              borderColor: theme.colors.ink,
              paddingVertical: theme.spacing[5],
              paddingHorizontal: theme.spacing[8],
              width: '100%',
              alignItems: 'center',
              ...theme.shadows.button,
            }}
            onPress={onExit}
            accessibilityRole="button"
          >
            <Text style={{
              fontSize: theme.textStyles.heading.fontSize,
              fontWeight: '900',
              color: theme.colors.ink,
            }}>
              {t('learning.missionCompleteHome')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              marginTop: theme.spacing[3],
              paddingVertical: theme.spacing[3],
            }}
            onPress={onPlayAgain}
            accessibilityRole="button"
            accessibilityLabel={t('learning.playAgain')}
          >
            <Text style={{
              fontSize: theme.textStyles.body.fontSize,
              fontWeight: '600',
              color: theme.colors.textSecondary,
            }}>
              {t('learning.playAgain')} →
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
