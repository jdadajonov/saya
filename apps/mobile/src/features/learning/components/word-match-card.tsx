import { useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../ui/theme-provider';
import type { WordMatchPayload } from '@saya/core';

interface Props {
  payload: WordMatchPayload;
  onAnswer: (answer: string, correct: boolean, responseMs: number) => void;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i] as T;
    a[i] = a[j] as T;
    a[j] = tmp;
  }
  return a;
}

export function WordMatchCard({ payload, onAnswer }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const startTime = useRef(Date.now());
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);

  const options = useMemo(
    () => shuffle([payload.correctTranslation, ...payload.distractors]),
    [payload.word],
  );

  const scale = useSharedValue(1);
  const cardStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const reset = () => {
    startTime.current = Date.now();
    setSelected(null);
    setAnswered(false);
    scale.value = withSequence(
      withTiming(0.96, { duration: 80 }),
      withSpring(1, { damping: 10, stiffness: 200 }),
    );
  };

  const prevWord = useRef(payload.word);
  if (prevWord.current !== payload.word) {
    prevWord.current = payload.word;
    reset();
  }

  const handleChoice = (choice: string) => {
    if (answered) return;
    const responseMs = Date.now() - startTime.current;
    const correct = choice === payload.correctTranslation;
    setSelected(choice);
    setAnswered(true);

    if (correct) {
      scale.value = withSequence(
        withSpring(1.04, { damping: 8, stiffness: 300 }),
        withSpring(1, { damping: 12, stiffness: 200 }),
      );
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setTimeout(() => onAnswer(choice, true, responseMs), 600);
    } else {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setTimeout(() => onAnswer(choice, false, responseMs), 900);
    }
  };

  const getChoiceStyle = (choice: string) => {
    const baseStyle = {
      width: '46%' as const,
      paddingVertical: theme.spacing[4],
      paddingHorizontal: theme.spacing[3],
      borderRadius: theme.borderRadius.card,
      borderWidth: theme.borderWidth.regular,
      borderColor: theme.colors.ink,
      backgroundColor: theme.colors.surface,
      alignItems: 'center' as const,
      ...theme.shadows.chip,
    };

    if (!answered) return baseStyle;
    if (choice === payload.correctTranslation) {
      return { ...baseStyle, borderColor: theme.colors.success, backgroundColor: theme.tints.teal };
    }
    if (choice === selected) {
      return { ...baseStyle, borderColor: theme.colors.error, backgroundColor: theme.tints.coral };
    }
    return { ...baseStyle, opacity: 0.4 };
  };

  const getChoiceTextStyle = (choice: string) => {
    const baseStyle = {
      fontSize: theme.textStyles.body.fontSize,
      fontWeight: '700' as const,
      color: theme.colors.ink,
      textAlign: 'center' as const,
    };

    if (!answered) return baseStyle;
    if (choice === payload.correctTranslation) return { ...baseStyle, color: theme.colors.success };
    if (choice === selected) return { ...baseStyle, color: theme.colors.error };
    return { ...baseStyle, color: theme.colors.textSecondary };
  };

  return (
    <Animated.View style={[{
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.card,
      borderWidth: theme.borderWidth.thick,
      borderColor: theme.colors.ink,
      padding: theme.spacing[6],
      alignItems: 'center',
      gap: theme.spacing[5],
      ...theme.shadows.card,
    }, cardStyle]}>
      <Text style={{
        fontSize: theme.textStyles.caption.fontSize,
        fontWeight: '700',
        color: theme.colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
      }}>
        {t('learning.tapTranslation')}
      </Text>

      <View style={{
        backgroundColor: theme.tints.teal,
        borderRadius: theme.borderRadius.md,
        borderWidth: theme.borderWidth.regular,
        borderColor: theme.colors.ink,
        paddingHorizontal: theme.spacing[6],
        paddingVertical: theme.spacing[4],
        ...theme.shadows.chip,
      }}>
        <Text style={{
          fontSize: 44,
          fontWeight: '900',
          color: theme.colors.ink,
          letterSpacing: -1,
        }} accessibilityRole="text">
          {payload.word}
        </Text>
      </View>

      <View style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing[3],
        width: '100%',
        justifyContent: 'center',
      }}>
        {options.map((choice) => (
          <TouchableOpacity
            key={choice}
            style={getChoiceStyle(choice)}
            onPress={() => handleChoice(choice)}
            disabled={answered}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={choice}
          >
            <Text style={getChoiceTextStyle(choice)}>{choice}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </Animated.View>
  );
}
