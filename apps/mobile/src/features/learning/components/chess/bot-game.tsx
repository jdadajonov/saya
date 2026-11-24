import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import {
  createGameManager,
  getDifficultyForAge,
  getValidMoves,
  type ChessSquare,
  type ChessColor,
  type GameState,
  type GameResult,
  type GameEndReason,
  type ChessGameManager,
  type AgeBand,
} from '@saya/core';
import { Chessboard } from './chessboard';
import { useTheme } from '../../../../ui/theme-provider';

interface BotGameProps {
  ageBand: AgeBand;
  level: number;
  playerColor?: ChessColor;
  onGameEnd?: (result: GameResult, reason: GameEndReason) => void;
  onResign?: () => void;
}

export function BotGame({
  ageBand,
  level,
  playerColor = 'w',
  onGameEnd,
  onResign,
}: BotGameProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const gameRef = useRef<ChessGameManager | null>(null);

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedSquare, setSelectedSquare] = useState<ChessSquare | null>(null);
  const [validMoves, setValidMoves] = useState<ChessSquare[]>([]);
  const [lastMove, setLastMove] = useState<{ from: ChessSquare; to: ChessSquare } | null>(null);
  const [botThinking, setBotThinking] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);

  const boardScale = useSharedValue(1);
  const boardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: boardScale.value }],
  }));

  useEffect(() => {
    const difficulty = getDifficultyForAge(ageBand, level);

    const manager = createGameManager(playerColor, level, difficulty, {
      onBotMoveStart: () => {
        setBotThinking(true);
      },
      onBotMove: (move) => {
        setBotThinking(false);
        setLastMove({ from: move.from as ChessSquare, to: move.to as ChessSquare });
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      },
      onStateChange: (state) => {
        setGameState(state);
      },
      onGameEnd: (result, reason) => {
        setGameEnded(true);
        boardScale.value = withSequence(
          withSpring(1.02, { damping: 8 }),
          withSpring(1, { damping: 12 })
        );
        void Haptics.notificationAsync(
          result === 'draw'
            ? Haptics.NotificationFeedbackType.Warning
            : (result === 'white_wins' && playerColor === 'w') ||
              (result === 'black_wins' && playerColor === 'b')
            ? Haptics.NotificationFeedbackType.Success
            : Haptics.NotificationFeedbackType.Error
        );
        onGameEnd?.(result, reason);
      },
    });

    gameRef.current = manager;
    manager.init().then(() => {
      setGameState(manager.getState());
    });

    return () => {
      manager.destroy();
    };
  }, [ageBand, level, playerColor, onGameEnd]);

  const handleSquarePress = useCallback(
    async (square: ChessSquare) => {
      if (!gameRef.current || botThinking || gameEnded) return;

      const state = gameRef.current.getState();
      if (state.turn !== playerColor) return;

      if (selectedSquare) {
        if (validMoves.includes(square)) {
          const success = await gameRef.current.makePlayerMove(selectedSquare, square);
          if (success) {
            setLastMove({ from: selectedSquare, to: square });
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          setSelectedSquare(null);
          setValidMoves([]);
        } else {
          const moves = gameRef.current.getValidMoves(square);
          if (moves.length > 0) {
            setSelectedSquare(square);
            setValidMoves(moves);
            void Haptics.selectionAsync();
          } else {
            setSelectedSquare(null);
            setValidMoves([]);
          }
        }
      } else {
        const moves = gameRef.current.getValidMoves(square);
        if (moves.length > 0) {
          setSelectedSquare(square);
          setValidMoves(moves);
          void Haptics.selectionAsync();
        }
      }
    },
    [selectedSquare, validMoves, botThinking, gameEnded, playerColor]
  );

  const handleResign = useCallback(() => {
    if (gameRef.current && !gameEnded) {
      gameRef.current.resign();
      setGameEnded(true);
      onResign?.();
    }
  }, [gameEnded, onResign]);

  const getResultText = (): string => {
    if (!gameState) return '';

    if (gameState.result === 'draw') {
      return t('learning.chess.game.draw');
    }

    const playerWon =
      (gameState.result === 'white_wins' && playerColor === 'w') ||
      (gameState.result === 'black_wins' && playerColor === 'b');

    return playerWon ? t('learning.chess.game.youWin') : t('learning.chess.game.youLose');
  };

  const getCheckSquare = (): ChessSquare | null => {
    if (!gameState?.isCheck) return null;

    const fen = gameState.fen;
    const turn = gameState.turn;

    const { Chess } = require('chess.js');
    const chess = new Chess(fen);

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
  };

  if (!gameState) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: theme.spacing[3], color: theme.colors.textSecondary }}>
          {t('common.loading')}
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Header with level and status */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: theme.spacing[4],
          paddingVertical: theme.spacing[3],
        }}
      >
        <View
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.borderRadius.md,
            borderWidth: theme.borderWidth.regular,
            borderColor: theme.colors.ink,
            paddingHorizontal: theme.spacing[3],
            paddingVertical: theme.spacing[2],
          }}
        >
          <Text
            style={{
              fontSize: theme.textStyles.caption.fontSize,
              color: theme.colors.textSecondary,
            }}
          >
            {t('learning.chess.game.level', { level })}
          </Text>
        </View>

        <View
          style={{
            backgroundColor: botThinking ? theme.tints.sun : theme.colors.surface,
            borderRadius: theme.borderRadius.md,
            borderWidth: theme.borderWidth.regular,
            borderColor: theme.colors.ink,
            paddingHorizontal: theme.spacing[3],
            paddingVertical: theme.spacing[2],
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.spacing[2],
          }}
        >
          {botThinking && <ActivityIndicator size="small" color={theme.colors.ink} />}
          <Text
            style={{
              fontSize: theme.textStyles.caption.fontSize,
              color: theme.colors.ink,
              fontWeight: '600',
            }}
          >
            {botThinking
              ? t('learning.chess.game.botThinking')
              : gameState.turn === playerColor
              ? t('learning.chess.game.yourTurn')
              : t('learning.chess.game.botTurn')}
          </Text>
        </View>
      </View>

      {/* Chessboard */}
      <Animated.View style={[{ alignItems: 'center', marginVertical: theme.spacing[4] }, boardStyle]}>
        <Chessboard
          fen={gameState.fen}
          selectedSquare={selectedSquare}
          validMoves={validMoves}
          lastMove={lastMove}
          checkSquare={getCheckSquare()}
          onSquarePress={handleSquarePress}
          flipped={playerColor === 'b'}
          disabled={botThinking || gameEnded || gameState.turn !== playerColor}
        />
      </Animated.View>

      {/* Move history */}
      <View
        style={{
          paddingHorizontal: theme.spacing[4],
          marginBottom: theme.spacing[3],
        }}
      >
        <Text
          style={{
            fontSize: theme.textStyles.caption.fontSize,
            color: theme.colors.textSecondary,
          }}
        >
          {gameState.moveHistory.length > 0
            ? gameState.moveHistory.map((m) => m.san).join(' ')
            : t('learning.chess.game.noMoves')}
        </Text>
      </View>

      {/* Game end message */}
      {gameEnded && (
        <View
          style={{
            marginHorizontal: theme.spacing[4],
            backgroundColor:
              gameState.result === 'draw'
                ? theme.tints.sun
                : (gameState.result === 'white_wins' && playerColor === 'w') ||
                  (gameState.result === 'black_wins' && playerColor === 'b')
                ? theme.tints.mint
                : theme.tints.wrong,
            borderRadius: theme.borderRadius.md,
            borderWidth: theme.borderWidth.regular,
            borderColor: theme.colors.ink,
            padding: theme.spacing[4],
            alignItems: 'center',
            ...theme.shadows.card,
          }}
        >
          <Text
            style={{
              fontSize: theme.textStyles.heading.fontSize,
              fontWeight: '700',
              color: theme.colors.ink,
            }}
          >
            {getResultText()}
          </Text>
          {gameState.endReason && (
            <Text
              style={{
                fontSize: theme.textStyles.caption.fontSize,
                color: theme.colors.textSecondary,
                marginTop: theme.spacing[1],
              }}
            >
              {t(`learning.chess.game.reason.${gameState.endReason}`)}
            </Text>
          )}
        </View>
      )}

      {/* Resign button */}
      {!gameEnded && (
        <View style={{ paddingHorizontal: theme.spacing[4], marginTop: 'auto', paddingBottom: theme.spacing[4] }}>
          <TouchableOpacity
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.button,
              borderWidth: theme.borderWidth.regular,
              borderColor: theme.colors.ink,
              paddingVertical: theme.spacing[3],
              alignItems: 'center',
            }}
            onPress={handleResign}
          >
            <Text
              style={{
                fontSize: theme.textStyles.body.fontSize,
                fontWeight: '600',
                color: theme.colors.error,
              }}
            >
              {t('learning.chess.game.resign')}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
