import { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
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
  isCheckmate,
  isCheck,
  type ChessSquare,
  type MateInOnePayload,
  type PuzzlePayload,
} from '@saya/core';
import { Chessboard } from './chessboard';
import { useTheme } from '../../../../ui/theme-provider';

type FeedbackState = 'idle' | 'correct' | 'wrong';

interface PuzzleCardProps {
  payload: MateInOnePayload | PuzzlePayload;
  onAnswer: (answer: string[], correct: boolean, responseMs: number) => void;
  disabled?: boolean;
  isMateInOne?: boolean;
}

export function PuzzleCard({
  payload,
  onAnswer,
  disabled,
  isMateInOne = false,
}: PuzzleCardProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [feedback, setFeedback] = useState<FeedbackState>('idle');
  const [currentFen, setCurrentFen] = useState(payload.fen);
  const [selectedSquare, setSelectedSquare] = useState<ChessSquare | null>(null);
  const [validMoves, setValidMoves] = useState<ChessSquare[]>([]);
  const [lastMove, setLastMove] = useState<{ from: ChessSquare; to: ChessSquare } | null>(null);
  const [checkSquare, setCheckSquare] = useState<ChessSquare | null>(null);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [startTime] = useState(Date.now());
  const [showHint, setShowHint] = useState(false);

  const scale = useSharedValue(1);
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  useEffect(() => {
    setFeedback('idle');
    setCurrentFen(payload.fen);
    setSelectedSquare(null);
    setValidMoves([]);
    setLastMove(null);
    setCheckSquare(null);
    setMoveHistory([]);
    setShowHint(false);
    scale.value = withSequence(
      withTiming(0.95, { duration: 80 }),
      withSpring(1, { damping: 10, stiffness: 200 })
    );
  }, [payload]);

  const findCheckSquare = useCallback((fen: string): ChessSquare | null => {
    if (!isCheck(fen)) return null;
    const { Chess } = require('chess.js');
    const chess = new Chess(fen);
    const turn = chess.turn();
    for (let file = 0; file < 8; file++) {
      for (let rank = 0; rank < 8; rank++) {
        const square = `${String.fromCharCode(97 + file)}${rank + 1}` as ChessSquare;
        const piece = chess.get(square);
        if (piece && piece.type === 'k' && piece.color === turn) {
          return square;
        }
      }
    }
    return null;
  }, []);

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
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

            if (isMateInOne && isCheckmate(newFen)) {
              setFeedback('correct');
              scale.value = withSequence(
                withSpring(1.05, { damping: 8, stiffness: 300 }),
                withSpring(1, { damping: 12, stiffness: 200 })
              );
              const responseMs = Date.now() - startTime;
              setTimeout(() => onAnswer(newHistory, true, responseMs), 800);
            } else if (!isMateInOne) {
              const puzzlePayload = payload as PuzzlePayload;
              const expectedMoves = puzzlePayload.moves;
              const moveIndex = newHistory.length - 1;

              if (moveIndex < expectedMoves.length) {
                const expectedMove = expectedMoves[moveIndex];
                const moveMatches =
                  moveNotation === expectedMove ||
                  moveNotation.toLowerCase() === expectedMove?.toLowerCase();

                if (moveMatches) {
                  if (newHistory.length === expectedMoves.length) {
                    setFeedback('correct');
                    scale.value = withSequence(
                      withSpring(1.05, { damping: 8, stiffness: 300 }),
                      withSpring(1, { damping: 12, stiffness: 200 })
                    );
                    const responseMs = Date.now() - startTime;
                    setTimeout(() => onAnswer(newHistory, true, responseMs), 800);
                  }
                } else {
                  setFeedback('wrong');
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  const responseMs = Date.now() - startTime;
                  setTimeout(() => onAnswer(newHistory, false, responseMs), 1000);
                }
              }
            } else {
              setFeedback('wrong');
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              const responseMs = Date.now() - startTime;
              setTimeout(() => onAnswer(newHistory, false, responseMs), 1000);
            }

            setCheckSquare(findCheckSquare(newFen));
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
      isMateInOne,
      payload,
      startTime,
      onAnswer,
      findCheckSquare,
      scale,
    ]
  );

  const hint = isMateInOne ? (payload as MateInOnePayload).hint : undefined;

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
          <Text style={{ fontSize: 32 }}>👑</Text>
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
            {isMateInOne
              ? t('learning.chess.mateInOnePrompt')
              : t('learning.chess.puzzlePrompt')}{' '}
            ⚔️
          </Text>
        </View>
      </View>

      {/* Chessboard */}
      <View style={{ alignItems: 'center' }}>
        <Chessboard
          fen={currentFen}
          selectedSquare={selectedSquare}
          validMoves={validMoves}
          lastMove={lastMove}
          checkSquare={checkSquare}
          onSquarePress={handleSquarePress}
          disabled={feedback !== 'idle' || disabled}
        />
      </View>

      {/* Hint button */}
      {hint && feedback === 'idle' && (
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
        >
          <Text style={{ fontSize: 20 }}>💡</Text>
          <Text
            style={{
              fontSize: theme.textStyles.body.fontSize,
              fontWeight: '700',
              color: theme.colors.ink,
            }}
          >
            {t('learning.hint')}
          </Text>
        </TouchableOpacity>
      )}

      {showHint && hint && (
        <View
          style={{
            marginTop: theme.spacing[3],
            backgroundColor: theme.tints.sun,
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
            }}
          >
            {t(`learning.chess.hints.${hint}`)}
          </Text>
        </View>
      )}

      {/* Feedback message */}
      {feedback !== 'idle' && (
        <View
          style={{
            marginTop: theme.spacing[4],
            backgroundColor: feedback === 'correct' ? theme.tints.mint : theme.tints.wrong,
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
            {feedback === 'correct'
              ? isMateInOne
                ? t('learning.chess.checkmate')
                : t('learning.chess.puzzleSolved')
              : t('learning.chess.notQuite')}
          </Text>
        </View>
      )}
    </Animated.View>
  );
}
