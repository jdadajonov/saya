import { useState, useEffect, useCallback } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import {
  getValidMoves,
  makeMove,
  type ChessSquare,
  type CapturePayload,
} from '@saya/core';
import { Chessboard } from './chessboard';
import { useTheme } from '../../../../ui/theme-provider';

type FeedbackState = 'idle' | 'correct' | 'wrong';

interface CaptureCardProps {
  payload: CapturePayload;
  onAnswer: (answer: string[], correct: boolean, responseMs: number) => void;
  disabled?: boolean;
}

export function CaptureCard({ payload, onAnswer, disabled }: CaptureCardProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [feedback, setFeedback] = useState<FeedbackState>('idle');
  const [currentFen, setCurrentFen] = useState(payload.fen);
  const [selectedSquare, setSelectedSquare] = useState<ChessSquare | null>(null);
  const [validMoves, setValidMoves] = useState<ChessSquare[]>([]);
  const [lastMove, setLastMove] = useState<{ from: ChessSquare; to: ChessSquare } | null>(null);
  const [capturedCount, setCapturedCount] = useState(0);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [startTime] = useState(Date.now());

  const scale = useSharedValue(1);
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const targetCount = payload.targetSquares.length;

  useEffect(() => {
    setFeedback('idle');
    setCurrentFen(payload.fen);
    setSelectedSquare(null);
    setValidMoves([]);
    setLastMove(null);
    setCapturedCount(0);
    setMoveHistory([]);
    scale.value = withSequence(
      withTiming(0.95, { duration: 80 }),
      withSpring(1, { damping: 10, stiffness: 200 })
    );
  }, [payload]);

  const handleSquarePress = useCallback(
    (square: ChessSquare) => {
      if (feedback !== 'idle' || disabled) return;

      if (selectedSquare) {
        if (validMoves.includes(square)) {
          const moveNotation = `${selectedSquare}${square}`;
          const newFen = makeMove(currentFen, moveNotation);

          if (newFen) {
            const newHistory = [...moveHistory, moveNotation];
            setMoveHistory(newHistory);
            setCurrentFen(newFen);
            setLastMove({ from: selectedSquare, to: square });
            setSelectedSquare(null);
            setValidMoves([]);

            const wasCapture = payload.targetSquares.includes(square);
            if (wasCapture) {
              const newCaptured = capturedCount + 1;
              setCapturedCount(newCaptured);
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

              if (newCaptured === targetCount) {
                setFeedback('correct');
                scale.value = withSequence(
                  withSpring(1.05, { damping: 8, stiffness: 300 }),
                  withSpring(1, { damping: 12, stiffness: 200 })
                );
                const responseMs = Date.now() - startTime;
                setTimeout(() => onAnswer(newHistory, true, responseMs), 800);
              }
            } else {
              void Haptics.selectionAsync();
            }
          }
        } else {
          setSelectedSquare(null);
          setValidMoves([]);
        }
      } else {
        const moves = getValidMoves(currentFen, square);
        if (moves.length > 0) {
          setSelectedSquare(square);
          setValidMoves(moves);
          void Haptics.selectionAsync();
        }
      }
    },
    [
      selectedSquare,
      validMoves,
      currentFen,
      moveHistory,
      feedback,
      disabled,
      payload.targetSquares,
      capturedCount,
      targetCount,
      startTime,
      onAnswer,
      scale,
    ]
  );

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
          <Text style={{ fontSize: 32 }}>⚔️</Text>
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
            {t('learning.chess.capturePrompt', { count: targetCount })} 🎯
          </Text>
        </View>
      </View>

      {/* Progress indicator */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: theme.spacing[3],
          gap: theme.spacing[2],
        }}
      >
        {Array.from({ length: targetCount }).map((_, i) => (
          <View
            key={i}
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: i < capturedCount ? theme.colors.success : theme.colors.disabled,
              borderWidth: theme.borderWidth.regular,
              borderColor: theme.colors.ink,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {i < capturedCount && (
              <Text style={{ fontSize: 14, color: theme.colors.onFill }}>✓</Text>
            )}
          </View>
        ))}
      </View>

      {/* Chessboard */}
      <View style={{ alignItems: 'center' }}>
        <Chessboard
          fen={currentFen}
          selectedSquare={selectedSquare}
          validMoves={validMoves}
          lastMove={lastMove}
          onSquarePress={handleSquarePress}
          disabled={feedback !== 'idle' || disabled}
        />
      </View>

      {/* Status */}
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
          {t('learning.chess.capturedCount', {
            captured: capturedCount,
            total: targetCount,
          })}
        </Text>
      </View>

      {/* Feedback message */}
      {feedback === 'correct' && (
        <View
          style={{
            marginTop: theme.spacing[4],
            backgroundColor: theme.tints.mint,
            borderRadius: theme.borderRadius.md,
            padding: theme.spacing[4],
            borderWidth: theme.borderWidth.thin,
            borderColor: theme.colors.ink,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              fontSize: theme.textStyles.heading.fontSize,
              color: theme.colors.ink,
              fontWeight: '700',
            }}
          >
            {t('learning.chess.allCaptured')} 🎉
          </Text>
        </View>
      )}
    </Animated.View>
  );
}
