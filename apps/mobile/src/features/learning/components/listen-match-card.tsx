import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../ui/theme-provider';
import type { ListenMatchPayload } from '@saya/core';
import { speakEnglish, stopSpeech } from '../../../platform/tts';

interface Props {
  payload: ListenMatchPayload;
  onAnswer: (answer: string, correct: boolean, responseMs: number) => void;
}

const WORD_TO_EMOJI: Record<string, string> = {
  cat: '🐱', dog: '🐶', bird: '🐦', fish: '🐟', horse: '🐴', bear: '🐻',
  rabbit: '🐰', frog: '🐸', lion: '🦁', tiger: '🐯',
  book: '📖', pen: '🖊️', table: '🪑', chair: '💺', bag: '🎒', teacher: '👩‍🏫',
  class: '🏫', pencil: '✏️', board: '📋', school: '🏫',
  mother: '👩', father: '👨', sister: '👧', brother: '👦', baby: '👶', family: '👨‍👩‍👧',
  grandmother: '👵', grandfather: '👴', aunt: '👩', uncle: '👨',
  apple: '🍎', bread: '🍞', milk: '🥛', egg: '🥚', water: '💧', juice: '🧃',
  cake: '🎂', cheese: '🧀', soup: '🍲', rice: '🍚',
  red: '🔴', blue: '🔵', green: '🟢', yellow: '🟡', white: '⚪', black: '⚫',
  orange: '🟠', pink: '💗', purple: '🟣', brown: '🟤',
  ball: '⚽', run: '🏃', swim: '🏊', jump: '🤸', tennis: '🎾', football: '⚽',
  basketball: '🏀', bike: '🚴', dance: '💃', win: '🏆',
};

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

export function ListenMatchCard({ payload, onAnswer }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const startTime = useRef(Date.now());
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);

  const options = useMemo(
    () => shuffle([payload.word, ...payload.distractors]),
    [payload.word],
  );

  const scale = useSharedValue(1);
  const speakerScale = useSharedValue(1);
  const pulseScale = useSharedValue(1);
  const cardStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const speakerStyle = useAnimatedStyle(() => ({ transform: [{ scale: speakerScale.value }] }));
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: 2 - pulseScale.value,
  }));

  useEffect(() => {
    const timer = setTimeout(() => speakEnglish(payload.word), 300);
    startTime.current = Date.now();
    setSelected(null);
    setAnswered(false);
    scale.value = withSequence(
      withTiming(0.96, { duration: 80 }),
      withSpring(1, { damping: 10, stiffness: 200 }),
    );
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 0 }),
        withTiming(1.5, { duration: 1000, easing: Easing.out(Easing.ease) }),
      ),
      -1,
    );
    return () => {
      clearTimeout(timer);
      stopSpeech();
    };
  }, [payload.word]);

  const handlePlaySpeaker = () => {
    speakerScale.value = withSequence(
      withTiming(0.88, { duration: 80 }),
      withSpring(1, { damping: 8, stiffness: 300 }),
    );
    speakEnglish(payload.word);
  };

  const handleChoice = (choice: string) => {
    if (answered) return;
    const responseMs = Date.now() - startTime.current;
    const correct = choice === payload.word;
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
      aspectRatio: 1,
      borderRadius: theme.borderRadius.card,
      borderWidth: theme.borderWidth.regular,
      borderColor: theme.colors.ink,
      backgroundColor: theme.colors.surface,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      ...theme.shadows.chip,
    };

    if (!answered) return baseStyle;
    if (choice === payload.word) {
      return { ...baseStyle, borderColor: theme.colors.success, backgroundColor: theme.tints.teal };
    }
    if (choice === selected) {
      return { ...baseStyle, borderColor: theme.colors.error, backgroundColor: theme.tints.coral };
    }
    return { ...baseStyle, opacity: 0.4 };
  };

  const hasEmojis = options.every((opt) => WORD_TO_EMOJI[opt.toLowerCase()]);

  return (
    <Animated.View style={[{
      backgroundColor: theme.tints.teal,
      borderRadius: theme.borderRadius.card,
      borderWidth: theme.borderWidth.thick,
      borderColor: theme.colors.ink,
      padding: theme.spacing[5],
      alignItems: 'center',
      gap: theme.spacing[4],
      ...theme.shadows.card,
    }, cardStyle]}>
      {/* Header with star */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[2] }}>
        <Text style={{ fontSize: 20 }}>⭐</Text>
        <Text style={{
          fontSize: theme.textStyles.heading.fontSize,
          fontWeight: '900',
          color: theme.colors.ink,
        }}>
          {t('learning.listenAndChoose')}
        </Text>
      </View>

      {/* Speaker button with pulse animation */}
      <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View style={[{
          position: 'absolute',
          width: 110,
          height: 110,
          borderRadius: 55,
          backgroundColor: theme.colors.secondary,
        }, pulseStyle]} />
        <Animated.View style={speakerStyle}>
          <TouchableOpacity
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: theme.colors.secondary,
              borderWidth: theme.borderWidth.thick,
              borderColor: theme.colors.ink,
              alignItems: 'center',
              justifyContent: 'center',
              ...theme.shadows.button,
            }}
            onPress={handlePlaySpeaker}
            accessibilityRole="button"
            accessibilityLabel={t('learning.playSound')}
          >
            <Text style={{ fontSize: 44 }}>🔊</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      <Text style={{
        fontSize: theme.textStyles.caption.fontSize,
        color: theme.colors.ink,
        opacity: 0.7,
      }}>
        {t('learning.listenAgain')}
      </Text>

      {/* Choice grid */}
      <View style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing[3],
        width: '100%',
        justifyContent: 'center',
      }}>
        {options.map((choice) => {
          const emoji = WORD_TO_EMOJI[choice.toLowerCase()];
          return (
            <TouchableOpacity
              key={choice}
              style={getChoiceStyle(choice)}
              onPress={() => handleChoice(choice)}
              disabled={answered}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={choice}
            >
              {hasEmojis && emoji ? (
                <Text style={{ fontSize: 48 }}>{emoji}</Text>
              ) : (
                <Text style={{
                  fontSize: theme.textStyles.heading.fontSize,
                  fontWeight: '800',
                  color: theme.colors.ink,
                  textAlign: 'center',
                }}>
                  {choice}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </Animated.View>
  );
}
