import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../ui/theme-provider';
import type { SpellItPayload } from '@saya/core';

type FeedbackState = 'idle' | 'correct' | 'wrong';

interface Props {
  payload: SpellItPayload;
  onAnswer: (answer: string, correct: boolean, responseMs: number) => void;
}

export function SpellItCard({ payload, onAnswer }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<FeedbackState>('idle');
  const startTime = useRef(Date.now());
  const inputRef = useRef<ComponentRef<typeof TextInput>>(null);

  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const bgOpacity = useSharedValue(0);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateX: translateX.value }],
  }));
  const overlayStyle = useAnimatedStyle(() => ({ opacity: bgOpacity.value }));

  useEffect(() => {
    setInput('');
    setFeedback('idle');
    startTime.current = Date.now();
    scale.value = withSequence(
      withTiming(0.95, { duration: 80 }),
      withSpring(1, { damping: 10, stiffness: 200 }),
    );
    setTimeout(() => inputRef.current?.focus(), 150);
  }, [payload]);

  const handleSubmit = () => {
    if (!input.trim() || feedback !== 'idle') return;
    const responseMs = Date.now() - startTime.current;
    const answer = input.trim();
    const correct = answer.toLowerCase() === payload.word.toLowerCase();

    setFeedback(correct ? 'correct' : 'wrong');

    if (correct) {
      bgOpacity.value = withSequence(
        withTiming(1, { duration: 100 }),
        withTiming(0, { duration: 400, easing: Easing.out(Easing.quad) }),
      );
      scale.value = withSequence(
        withSpring(1.08, { damping: 8, stiffness: 300 }),
        withSpring(1, { damping: 12, stiffness: 200 }),
      );
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setTimeout(() => onAnswer(answer, true, responseMs), 500);
    } else {
      translateX.value = withSequence(
        withTiming(-12, { duration: 60 }),
        withTiming(12, { duration: 60 }),
        withTiming(-8, { duration: 60 }),
        withTiming(8, { duration: 60 }),
        withTiming(0, { duration: 60 }),
      );
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setTimeout(() => onAnswer(answer, false, responseMs), 800);
    }
  };

  const borderColor =
    feedback === 'correct' ? theme.colors.success : feedback === 'wrong' ? theme.colors.error : theme.colors.ink;

  return (
    <Animated.View style={[{
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.card,
      borderWidth: theme.borderWidth.thick,
      borderColor,
      padding: theme.spacing[6],
      alignItems: 'center',
      gap: theme.spacing[5],
      overflow: 'hidden',
      ...theme.shadows.card,
    }, cardStyle]}>
      <Animated.View
        style={[StyleSheet.absoluteFill, {
          backgroundColor: theme.colors.success,
          borderRadius: theme.borderRadius.card - 2,
          opacity: 0,
        }, overlayStyle]}
        pointerEvents="none"
      />

      <Text style={{
        fontSize: theme.textStyles.caption.fontSize,
        fontWeight: '700',
        color: theme.colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
      }}>
        {t('learning.writeInEnglish')}
      </Text>

      <View style={{
        backgroundColor: theme.tints.violet,
        borderRadius: theme.borderRadius.md,
        borderWidth: theme.borderWidth.regular,
        borderColor: theme.colors.ink,
        paddingHorizontal: theme.spacing[6],
        paddingVertical: theme.spacing[4],
        ...theme.shadows.chip,
      }}>
        <Text style={{
          fontSize: 40,
          fontWeight: '900',
          color: theme.colors.ink,
          letterSpacing: -0.5,
          textAlign: 'center',
        }} accessibilityRole="text">
          {payload.translation}
        </Text>
      </View>

      <TextInput
        ref={inputRef}
        style={{
          borderWidth: theme.borderWidth.regular,
          borderRadius: theme.borderRadius.card,
          borderColor,
          paddingHorizontal: theme.spacing[5],
          paddingVertical: theme.spacing[4],
          fontSize: 28,
          fontWeight: '700',
          textAlign: 'center',
          color: theme.colors.ink,
          width: '100%',
          backgroundColor: theme.colors.background,
        }}
        value={input}
        onChangeText={(v) => {
          setInput(v);
          setFeedback('idle');
        }}
        onSubmitEditing={handleSubmit}
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={30}
        placeholder="..."
        placeholderTextColor={theme.colors.textSecondary}
        editable={feedback === 'idle'}
        accessibilityLabel={t('learning.writeInEnglish')}
        returnKeyType="done"
        blurOnSubmit={false}
      />

      {feedback === 'wrong' && (
        <View style={{ alignItems: 'center', gap: theme.spacing[1] }}>
          <Text style={{
            fontSize: theme.textStyles.caption.fontSize,
            color: theme.colors.error,
            fontWeight: '600',
          }} accessibilityLiveRegion="polite">
            {t('learning.incorrect')}
          </Text>
          <Text style={{
            fontSize: theme.textStyles.body.fontSize,
            fontWeight: '900',
            color: theme.colors.success,
            letterSpacing: 2,
          }}>
            {payload.word}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={{
          backgroundColor: !input.trim() || feedback !== 'idle' ? theme.colors.disabled : theme.colors.secondary,
          borderRadius: theme.borderRadius.button,
          borderWidth: theme.borderWidth.regular,
          borderColor: theme.colors.ink,
          paddingHorizontal: theme.spacing[6],
          paddingVertical: theme.spacing[4],
          width: '100%',
          alignItems: 'center',
          ...(!input.trim() || feedback !== 'idle' ? {} : theme.shadows.button),
        }}
        onPress={handleSubmit}
        disabled={!input.trim() || feedback !== 'idle'}
        accessibilityRole="button"
        accessibilityLabel={t('learning.checkAnswer')}
      >
        <Text style={{
          fontSize: theme.textStyles.body.fontSize,
          fontWeight: '800',
          color: !input.trim() || feedback !== 'idle' ? theme.colors.textSecondary : theme.colors.ink,
        }}>
          {t('learning.checkAnswer')}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}
