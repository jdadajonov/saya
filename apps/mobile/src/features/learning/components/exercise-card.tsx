import { useEffect, useState, useMemo } from 'react';
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import type { MultiplicationPayload } from '@saya/core';
import { useTheme } from '../../../ui/theme-provider';

export type FeedbackState = 'idle' | 'correct' | 'wrong';

interface ExerciseCardProps {
  payload: MultiplicationPayload;
  onAnswer: (answer: string, correct: boolean, responseMs: number) => void;
  disabled?: boolean;
}

function generateOptions(correctAnswer: number): number[] {
  const options = new Set<number>([correctAnswer]);

  while (options.size < 4) {
    const offset = Math.floor(Math.random() * 20) - 10;
    const wrong = correctAnswer + offset;
    if (wrong > 0 && wrong !== correctAnswer) {
      options.add(wrong);
    }
  }

  return Array.from(options).sort(() => Math.random() - 0.5);
}

function DotGrid({ rows, cols, theme }: { rows: number; cols: number; theme: ReturnType<typeof useTheme> }) {
  const dotColors = [theme.colors.primary, theme.colors.secondary, theme.colors.xp, theme.tints.mint];

  return (
    <View style={{
      backgroundColor: theme.tints.sun,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing[3],
      alignItems: 'center',
    }}>
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <View key={rowIdx} style={{ flexDirection: 'row', gap: 6, marginVertical: 2 }}>
          {Array.from({ length: cols }).map((_, colIdx) => (
            <View
              key={colIdx}
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: dotColors[(rowIdx + colIdx) % dotColors.length],
                borderWidth: 1,
                borderColor: theme.colors.ink,
              }}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

export function ExerciseCard({ payload, onAnswer, disabled }: ExerciseCardProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [feedback, setFeedback] = useState<FeedbackState>('idle');
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [startTime] = useState(Date.now());

  const options = useMemo(
    () => generateOptions(payload.answer),
    [payload.a, payload.b, payload.answer]
  );

  const scale = useSharedValue(1);
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  useEffect(() => {
    setFeedback('idle');
    setSelectedAnswer(null);
    setShowHint(false);
    scale.value = withSequence(
      withTiming(0.95, { duration: 80 }),
      withSpring(1, { damping: 10, stiffness: 200 }),
    );
  }, [payload]);

  const handleSelectAnswer = (answer: number) => {
    if (feedback !== 'idle' || disabled) return;

    setSelectedAnswer(answer);
    const correct = answer === payload.answer;
    setFeedback(correct ? 'correct' : 'wrong');

    if (correct) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      scale.value = withSequence(
        withSpring(1.05, { damping: 8, stiffness: 300 }),
        withSpring(1, { damping: 12, stiffness: 200 }),
      );
    } else {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const responseMs = Date.now() - startTime;
    setTimeout(() => onAnswer(String(answer), correct, responseMs), correct ? 600 : 1000);
  };

  const getOptionStyle = (option: number) => {
    if (selectedAnswer === null) {
      return {
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.ink,
      };
    }
    if (option === payload.answer) {
      return {
        backgroundColor: theme.tints.mint,
        borderColor: theme.colors.success,
      };
    }
    if (option === selectedAnswer && option !== payload.answer) {
      return {
        backgroundColor: theme.tints.wrong,
        borderColor: theme.colors.error,
      };
    }
    return {
      backgroundColor: theme.colors.disabled,
      borderColor: theme.colors.ink,
    };
  };

  return (
    <Animated.View style={cardStyle}>
      {/* Mascot with hint */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: theme.spacing[4], gap: theme.spacing[3] }}>
        <View style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: theme.colors.secondary,
          borderWidth: theme.borderWidth.regular,
          borderColor: theme.colors.ink,
          alignItems: 'center',
          justifyContent: 'center',
          ...theme.shadows.chip,
        }}>
          <Text style={{ fontSize: 32 }}>🤖</Text>
        </View>
        <View style={{
          flex: 1,
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.md,
          borderWidth: theme.borderWidth.regular,
          borderColor: theme.colors.ink,
          padding: theme.spacing[3],
          ...theme.shadows.chip,
        }}>
          <Text style={{
            fontSize: theme.textStyles.body.fontSize,
            color: theme.colors.ink,
            fontWeight: '600',
          }}>
            {t('learning.countDots', { rows: payload.a, cols: payload.b })} 🔢
          </Text>
        </View>
      </View>

      {/* Main equation card */}
      <View style={{
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.card,
        borderWidth: theme.borderWidth.thick,
        borderColor: theme.colors.ink,
        padding: theme.spacing[5],
        alignItems: 'center',
        gap: theme.spacing[4],
        ...theme.shadows.card,
      }}>
        {/* Equation */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3] }}>
          <Text style={{
            fontSize: 48,
            fontWeight: '900',
            color: theme.colors.ink,
          }}>
            {payload.a}
          </Text>
          <Text style={{
            fontSize: 36,
            fontWeight: '700',
            color: theme.colors.textSecondary,
          }}>
            ×
          </Text>
          <Text style={{
            fontSize: 48,
            fontWeight: '900',
            color: theme.colors.ink,
          }}>
            {payload.b}
          </Text>
          <Text style={{
            fontSize: 36,
            fontWeight: '700',
            color: theme.colors.textSecondary,
          }}>
            =
          </Text>
          <Text style={{
            fontSize: 48,
            fontWeight: '900',
            color: feedback === 'correct' ? theme.colors.success : theme.colors.primary,
          }}>
            {feedback === 'correct' ? payload.answer : '?'}
          </Text>
        </View>

        {/* Dot grid visualization */}
        {payload.a <= 10 && payload.b <= 10 && (
          <DotGrid rows={payload.a} cols={payload.b} theme={theme} />
        )}
      </View>

      {/* Answer options */}
      <View style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing[3],
        marginTop: theme.spacing[4],
        justifyContent: 'center',
      }}>
        {options.map((option) => {
          const optionStyle = getOptionStyle(option);
          return (
            <TouchableOpacity
              key={option}
              style={{
                width: '45%',
                backgroundColor: optionStyle.backgroundColor,
                borderRadius: theme.borderRadius.button,
                borderWidth: theme.borderWidth.regular,
                borderColor: optionStyle.borderColor,
                paddingVertical: theme.spacing[4],
                alignItems: 'center',
                ...theme.shadows.button,
              }}
              onPress={() => handleSelectAnswer(option)}
              disabled={feedback !== 'idle' || disabled}
            >
              <Text style={{
                fontSize: 32,
                fontWeight: '800',
                color: theme.colors.ink,
              }}>
                {option}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Hint button */}
      <TouchableOpacity
        style={{
          marginTop: theme.spacing[4],
          borderRadius: theme.borderRadius.button,
          borderWidth: 2,
          borderColor: theme.colors.ink,
          borderStyle: 'dashed',
          paddingVertical: theme.spacing[3],
          paddingHorizontal: theme.spacing[5],
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'center',
          gap: theme.spacing[2],
        }}
        onPress={() => setShowHint(!showHint)}
        disabled={feedback !== 'idle'}
      >
        <Text style={{ fontSize: 20 }}>💡</Text>
        <Text style={{
          fontSize: theme.textStyles.body.fontSize,
          fontWeight: '700',
          color: theme.colors.ink,
        }}>
          {t('learning.hint')}
        </Text>
      </TouchableOpacity>

      {showHint && (
        <View style={{
          marginTop: theme.spacing[3],
          backgroundColor: theme.tints.sun,
          borderRadius: theme.borderRadius.md,
          padding: theme.spacing[3],
          borderWidth: theme.borderWidth.thin,
          borderColor: theme.colors.ink,
        }}>
          <Text style={{
            fontSize: theme.textStyles.body.fontSize,
            color: theme.colors.ink,
            textAlign: 'center',
          }}>
            {payload.a} + {payload.a} + ... ({payload.b} {t('learning.times')}) = {payload.answer}
          </Text>
        </View>
      )}
    </Animated.View>
  );
}
