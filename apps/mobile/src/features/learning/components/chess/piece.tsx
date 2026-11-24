import { Text, View, StyleSheet } from 'react-native';
import type { ChessPiece as ChessPieceType, ChessColor } from '@saya/core';

const PIECE_SYMBOLS: Record<ChessPieceType, { w: string; b: string }> = {
  k: { w: '♔', b: '♚' },
  q: { w: '♕', b: '♛' },
  r: { w: '♖', b: '♜' },
  b: { w: '♗', b: '♝' },
  n: { w: '♘', b: '♞' },
  p: { w: '♙', b: '♟' },
};

interface PieceProps {
  piece: ChessPieceType;
  color: ChessColor;
  size?: number;
}

export function Piece({ piece, color, size = 40 }: PieceProps) {
  const symbol = PIECE_SYMBOLS[piece]?.[color] ?? '?';

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Text
        style={[
          styles.piece,
          {
            fontSize: size * 0.85,
            color: color === 'w' ? '#FFFFFF' : '#1A1A1A',
            textShadowColor: color === 'w' ? '#1A1A1A' : '#FFFFFF',
          },
        ]}
        accessibilityLabel={`${color === 'w' ? 'white' : 'black'} ${piece}`}
      >
        {symbol}
      </Text>
    </View>
  );
}

export function PieceIcon({ piece, color, size = 60 }: PieceProps) {
  const symbol = PIECE_SYMBOLS[piece]?.[color] ?? '?';

  return (
    <View
      style={[
        styles.iconContainer,
        {
          width: size,
          height: size,
          backgroundColor: color === 'w' ? '#F5F5DC' : '#4A4A4A',
          borderRadius: size / 4,
        },
      ]}
    >
      <Text
        style={[
          styles.piece,
          {
            fontSize: size * 0.7,
            color: color === 'w' ? '#1A1A1A' : '#F5F5DC',
          },
        ]}
      >
        {symbol}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#1A1A1A',
  },
  piece: {
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
});
