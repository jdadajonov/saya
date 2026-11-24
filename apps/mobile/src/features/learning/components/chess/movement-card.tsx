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
import type { MovementPayload, ChessSquare } from '@saya/core';
import { Chessboard } from './chessboard';
import { useTheme } from '../../../../ui/theme-provider';

type FeedbackState = 'idle' | 'correct' | 'wrong';

interface MovementCardProps {
  payload: MovementPayload;
  onAnswer: (answer: string, correct: boolean, responseMs: number) => void;
  disabled?: boolean;
}

export function MovementCard({ payload, onAnswer, disabled }: MovementCardProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [feedback, setFeedback] = useState<FeedbackState>('idle');
  const [selectedSquares, setSelectedSquares] = useState<Set<ChessSquare>>(new Set());
  const [startTime] = useState(Date.now());

  const scale = useSharedValue(1);
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const validSquaresSet = useMemo(
    () => new Set(payload.validSquares),
    [payload.validSquares]
  );

  useEffect(() => {
    setFeedback('idle');
    setSelectedSquares(new Set());
    scale.value = withSequence(
      withTiming(0.95, { duration: 80 }),
      withSpring(1, { damping: 10, stiffness: 200 })
    );
  }, [payload]);

  const handleSquarePress = (square: ChessSquare) => {
    if (feedback !== 'idle' || disabled) return;
    if (square === payload.pieceSquare) return;

    const newSelected = new Set(selectedSquares);
    if (newSelected.has(square)) {
      newSelected.delete(square);
    } else {
      newSelected.add(square);
    }
    setSelectedSquares(newSelected);
    void Haptics.selectionAsync();
  };

  const handleSubmit = () => {
    if (feedback !== 'idle' || disabled) return;

    const selectedArray = Array.from(selectedSquares);
    const allCorrect =
      selectedArray.length === payload.validSquares.length &&
      selectedArray.every((sq) => validSquaresSet.has(sq));

    setFeedback(allCorrect ? 'correct' : 'wrong');

    if (allCorrect) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      scale.value = withSequence(
        withSpring(1.03, { damping: 8, stiffness: 300 }),
        withSpring(1, { damping: 12, stiffness: 200 })
      );
    } else {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const responseMs = Date.now() - startTime;
    setTimeout(
      () => onAnswer(JSON.stringify(selectedArray), allCorrect, responseMs),
      allCorrect ? 600 : 1500
    );
  };

  const getHighlightSquares = (): ChessSquare[] => {
    if (feedback === 'idle') {
      return Array.from(selectedSquares);
    }
    if (feedback === 'correct') {
      return payload.validSquares;
    }
    return payload.validSquares;
  };

  const getHighlightColor = (): string => {
    if (feedback === 'correct') return 'rgba(0, 200, 100, 0.5)';
    if (feedback === 'wrong') return 'rgba(255, 100, 100, 0.5)';
    return 'rgba(100, 150, 255, 0.5)';
  };

  return (
    <Animated.View style={cardStyle}>
      {/* Mascot prompt */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          marginBottom: theme.spacing[4],
          gap: theme.spacing[3],
        }}
      >
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
            {t('learning.chess.movementPrompt')} 👆
          </Text>
        </View>
      </View>

      {/* Chessboard */}
      <View style={{ alignItems: 'center' }}>
        <Chessboard
          fen={payload.fen}
          selectedSquare={payload.pieceSquare}
          highlightSquares={getHighlightSquares()}
          highlightColor={getHighlightColor()}
          onSquarePress={handleSquarePress}
          disabled={feedback !== 'idle' || disabled}
        />
      </View>

      {/* Progress indicator */}
      <View
        style={{
          marginTop: theme.spacing[4],
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            fontSize: theme.textStyles.body.fontSize,
            color: theme.colors.textSecondary,
          }}
        >
          {t('learning.chess.selectedCount', {
            selected: selectedSquares.size,
            total: payload.validSquares.length,
          })}
        </Text>
      </View>

      {/* Submit button */}
      <TouchableOpacity
        style={{
          marginTop: theme.spacing[4],
          backgroundColor:
            selectedSquares.size > 0 ? theme.colors.primary : theme.colors.disabled,
          borderRadius: theme.borderRadius.button,
          borderWidth: theme.borderWidth.regular,
          borderColor: theme.colors.ink,
          paddingVertical: theme.spacing[4],
          alignItems: 'center',
          ...theme.shadows.button,
        }}
        onPress={handleSubmit}
        disabled={feedback !== 'idle' || disabled || selectedSquares.size === 0}
      >
        <Text
          style={{
            fontSize: theme.textStyles.heading.fontSize,
            fontWeight: '700',
            color: theme.colors.onFill,
          }}
        >
          {t('learning.chess.checkAnswer')} ✓
        </Text>
      </TouchableOpacity>

      {/* Feedback message */}
      {feedback !== 'idle' && (
        <View
          style={{
            marginTop: theme.spacing[3],
            backgroundColor: feedback === 'correct' ? theme.tints.mint : theme.tints.wrong,
            borderRadius: theme.borderRadius.md,
            padding: theme.spacing[3],
            borderWidth: theme.borderWidth.thin,
            borderColor: theme.colors.ink,
          }}
        >
          <Text
            style={{
              fontSize: theme.textStyles.body.fontSize,
              color: theme.colors.ink,
              textAlign: 'center',
              fontWeight: '600',
            }}
          >
            {feedback === 'correct'
              ? t('learning.chess.allCorrect')
              : t('learning.chess.tryAgain', {
                  missed: payload.validSquares.length - selectedSquares.size,
                })}
          </Text>
        </View>
      )}
    </Animated.View>
  );
}
