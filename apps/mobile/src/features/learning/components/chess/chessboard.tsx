import { useCallback, useMemo } from 'react';
import { View, TouchableOpacity, Dimensions, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { getPiecesOnBoard, type ChessSquare, type PieceOnBoard } from '@saya/core';
import { Piece } from './piece';
import { useTheme } from '../../../../ui/theme-provider';

const BOARD_SIZE = 8;
const SCREEN_WIDTH = Dimensions.get('window').width;
const BOARD_PADDING = 16;
const BOARD_WIDTH = Math.min(SCREEN_WIDTH - BOARD_PADDING * 2, 360);
const SQUARE_SIZE = BOARD_WIDTH / BOARD_SIZE;

const LIGHT_SQUARE = '#F0D9B5';
const DARK_SQUARE = '#B58863';
const SELECTED_SQUARE = '#829769';
const VALID_MOVE_COLOR = 'rgba(0, 128, 0, 0.3)';
const LAST_MOVE_COLOR = 'rgba(255, 255, 0, 0.3)';
const CHECK_COLOR = 'rgba(255, 0, 0, 0.5)';

interface ChessboardProps {
  fen: string;
  selectedSquare?: ChessSquare | null;
  validMoves?: ChessSquare[];
  lastMove?: { from: ChessSquare; to: ChessSquare } | null;
  checkSquare?: ChessSquare | null;
  onSquarePress?: (square: ChessSquare) => void;
  flipped?: boolean;
  disabled?: boolean;
  highlightSquares?: ChessSquare[];
  highlightColor?: string;
}

function squareToIndex(square: ChessSquare): { row: number; col: number } {
  const col = square.charCodeAt(0) - 'a'.charCodeAt(0);
  const row = parseInt(square[1]!, 10) - 1;
  return { row, col };
}

function indexToSquare(row: number, col: number): ChessSquare {
  const file = String.fromCharCode('a'.charCodeAt(0) + col);
  const rank = String(row + 1);
  return `${file}${rank}` as ChessSquare;
}

interface SquareProps {
  row: number;
  col: number;
  piece: PieceOnBoard | null;
  isSelected: boolean;
  isValidMove: boolean;
  isLastMove: boolean;
  isCheck: boolean;
  isHighlighted: boolean;
  highlightColor?: string;
  onPress: () => void;
  disabled: boolean;
}

function Square({
  row,
  col,
  piece,
  isSelected,
  isValidMove,
  isLastMove,
  isCheck,
  isHighlighted,
  highlightColor,
  onPress,
  disabled,
}: SquareProps) {
  const isLight = (row + col) % 2 === 1;
  const baseColor = isLight ? LIGHT_SQUARE : DARK_SQUARE;

  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = useCallback(() => {
    if (disabled) return;
    scale.value = withSequence(
      withTiming(0.9, { duration: 50 }),
      withSpring(1, { damping: 10, stiffness: 300 })
    );
    onPress();
  }, [onPress, disabled, scale]);

  let backgroundColor = baseColor;
  if (isSelected) backgroundColor = SELECTED_SQUARE;
  else if (isCheck) backgroundColor = CHECK_COLOR;
  else if (isLastMove) backgroundColor = LAST_MOVE_COLOR;
  else if (isHighlighted && highlightColor) backgroundColor = highlightColor;

  return (
    <TouchableOpacity
      style={[styles.square, { backgroundColor }]}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${indexToSquare(row, col)}${piece ? ` with ${piece.color === 'w' ? 'white' : 'black'} ${piece.piece}` : ''}`}
    >
      {isValidMove && !piece && (
        <View style={styles.validMoveIndicator} />
      )}
      {isValidMove && piece && (
        <View style={styles.captureIndicator} />
      )}
      {piece && (
        <Animated.View style={animatedStyle}>
          <Piece
            piece={piece.piece}
            color={piece.color}
            size={SQUARE_SIZE * 0.9}
          />
        </Animated.View>
      )}
    </TouchableOpacity>
  );
}

export function Chessboard({
  fen,
  selectedSquare,
  validMoves = [],
  lastMove,
  checkSquare,
  onSquarePress,
  flipped = false,
  disabled = false,
  highlightSquares = [],
  highlightColor = 'rgba(0, 200, 100, 0.4)',
}: ChessboardProps) {
  const theme = useTheme();

  const pieces = useMemo(() => {
    const piecesArray = getPiecesOnBoard(fen);
    const pieceMap = new Map<string, PieceOnBoard>();
    for (const p of piecesArray) {
      pieceMap.set(p.square, p);
    }
    return pieceMap;
  }, [fen]);

  const validMovesSet = useMemo(() => new Set(validMoves), [validMoves]);
  const highlightSet = useMemo(() => new Set(highlightSquares), [highlightSquares]);

  const lastMoveSquares = useMemo(() => {
    if (!lastMove) return new Set<string>();
    return new Set([lastMove.from, lastMove.to]);
  }, [lastMove]);

  const renderSquare = useCallback(
    (row: number, col: number) => {
      const displayRow = flipped ? row : 7 - row;
      const displayCol = flipped ? 7 - col : col;
      const square = indexToSquare(displayRow, displayCol);
      const piece = pieces.get(square) ?? null;

      return (
        <Square
          key={square}
          row={displayRow}
          col={displayCol}
          piece={piece}
          isSelected={selectedSquare === square}
          isValidMove={validMovesSet.has(square)}
          isLastMove={lastMoveSquares.has(square)}
          isCheck={checkSquare === square}
          isHighlighted={highlightSet.has(square)}
          highlightColor={highlightColor}
          onPress={() => onSquarePress?.(square)}
          disabled={disabled}
        />
      );
    },
    [
      flipped,
      pieces,
      selectedSquare,
      validMovesSet,
      lastMoveSquares,
      checkSquare,
      highlightSet,
      highlightColor,
      onSquarePress,
      disabled,
    ]
  );

  return (
    <View
      style={[
        styles.board,
        {
          borderColor: theme.colors.ink,
          borderWidth: theme.borderWidth.thick,
          borderRadius: theme.borderRadius.md,
          ...theme.shadows.card,
        },
      ]}
    >
      {Array.from({ length: BOARD_SIZE }, (_, row) => (
        <View key={row} style={styles.row}>
          {Array.from({ length: BOARD_SIZE }, (_, col) => renderSquare(row, col))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    width: BOARD_WIDTH,
    height: BOARD_WIDTH,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
  },
  square: {
    width: SQUARE_SIZE,
    height: SQUARE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  validMoveIndicator: {
    position: 'absolute',
    width: SQUARE_SIZE * 0.3,
    height: SQUARE_SIZE * 0.3,
    borderRadius: SQUARE_SIZE * 0.15,
    backgroundColor: VALID_MOVE_COLOR,
  },
  captureIndicator: {
    position: 'absolute',
    width: SQUARE_SIZE * 0.9,
    height: SQUARE_SIZE * 0.9,
    borderRadius: SQUARE_SIZE * 0.45,
    borderWidth: 4,
    borderColor: VALID_MOVE_COLOR,
  },
});

export { SQUARE_SIZE, BOARD_WIDTH };
