import { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import type { IdentifyPiecePayload, ChessPiece } from '@saya/core';
import { PieceIcon } from './piece';
import { useTheme } from '../../../../ui/theme-provider';

type FeedbackState = 'idle' | 'correct' | 'wrong';

interface IdentifyCardProps {
  payload: IdentifyPiecePayload;
  onAnswer: (answer: string, correct: boolean, responseMs: number) => void;
  disabled?: boolean;
}

const PIECE_NAMES: Record<ChessPiece, string> = {
  k: 'chessPieces.king',
  q: 'chessPieces.queen',
  r: 'chessPieces.rook',
  b: 'chessPieces.bishop',
  n: 'chessPieces.knight',
  p: 'chessPieces.pawn',
};

export function IdentifyCard({ payload, onAnswer, disabled }: IdentifyCardProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [feedback, setFeedback] = useState<FeedbackState>('idle');
  const [selectedAnswer, setSelectedAnswer] = useState<ChessPiece | null>(null);
  const [startTime] = useState(Date.now());

  const scale = useSharedValue(1);
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const shuffledOptions = useMemo(
    () => [...payload.options].sort(() => Math.random() - 0.5),
    [payload.options]
  );

  useEffect(() => {
    setFeedback('idle');
    setSelectedAnswer(null);
    scale.value = withSequence(
      withTiming(0.95, { duration: 80 }),
      withSpring(1, { damping: 10, stiffness: 200 })
    );
  }, [payload]);

  const handleSelectAnswer = (answer: ChessPiece) => {
    if (feedback !== 'idle' || disabled) return;

    setSelectedAnswer(answer);
    const correct = answer === payload.piece;
    setFeedback(correct ? 'correct' : 'wrong');

    if (correct) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      scale.value = withSequence(
        withSpring(1.05, { damping: 8, stiffness: 300 }),
        withSpring(1, { damping: 12, stiffness: 200 })
      );
    } else {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const responseMs = Date.now() - startTime;
    setTimeout(() => onAnswer(answer, correct, responseMs), correct ? 600 : 1000);
  };

  const getOptionStyle = (option: ChessPiece) => {
    if (selectedAnswer === null) {
      return {
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.ink,
      };
    }
    if (option === payload.piece) {
      return {
        backgroundColor: theme.tints.mint,
        borderColor: theme.colors.success,
      };
    }
    if (option === selectedAnswer && option !== payload.piece) {
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
      {/* Mascot prompt */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: theme.spacing[4], gap: theme.spacing[3] }}>
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: theme.colors.secondary,
            borderWidth: theme.borderWidth.regular,
            borderColor: theme.colors.ink,
            alignItems: 'center',
            justifyContent: 'center',
            ...theme.shadows.chip,
          }}
        >
          <Text style={{ fontSize: 32 }}>♟️</Text>
        </View>
        <View
          style={{
            flex: 1,
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.md,
            borderWidth: theme.borderWidth.regular,
            borderColor: theme.colors.ink,
            padding: theme.spacing[3],
            ...theme.shadows.chip,
          }}
        >
          <Text
            style={{
              fontSize: theme.textStyles.body.fontSize,
              color: theme.colors.ink,
              fontWeight: '600',
            }}
          >
            {t('learning.chess.identifyPrompt')} 🤔
          </Text>
        </View>
      </View>

      {/* Main piece display */}
      <View
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.card,
          borderWidth: theme.borderWidth.thick,
          borderColor: theme.colors.ink,
          padding: theme.spacing[6],
          alignItems: 'center',
          ...theme.shadows.card,
        }}
      >
        <PieceIcon piece={payload.piece} color={payload.color} size={120} />
      </View>

      {/* Answer options */}
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: theme.spacing[3],
          marginTop: theme.spacing[4],
          justifyContent: 'center',
        }}
      >
        {shuffledOptions.map((option) => {
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
              <Text
                style={{
                  fontSize: theme.textStyles.heading.fontSize,
                  fontWeight: '700',
                  color: theme.colors.ink,
                }}
              >
                {t(PIECE_NAMES[option])}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </Animated.View>
  );
}
