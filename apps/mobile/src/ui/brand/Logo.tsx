import { View, Text } from 'react-native';
import { Mascot } from './Mascot';

export type LogoVariant = 'horizontal' | 'vertical';

interface LogoProps {
  variant?: LogoVariant;
  size?: number;
  showWordmark?: boolean;
}

const COLORS = {
  coral: '#FF6B6B',
  teal: '#4ECDC4',
  sun: '#FFE66D',
  violet: '#A07AFF',
  ink: '#2B2140',
};

function Wordmark({ size }: { size: number }) {
  const fontSize = size * 0.4;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Text style={{ fontSize, fontWeight: '900', color: COLORS.coral }}>S</Text>
      <Text style={{ fontSize, fontWeight: '900', color: COLORS.teal }}>a</Text>
      <Text style={{ fontSize, fontWeight: '900', color: COLORS.sun }}>y</Text>
      <Text style={{ fontSize, fontWeight: '900', color: COLORS.violet }}>a</Text>
    </View>
  );
}

export function Logo({ variant = 'horizontal', size = 120, showWordmark = true }: LogoProps) {
  const mascotSize = variant === 'horizontal' ? size * 0.8 : size * 0.6;

  if (variant === 'vertical') {
    return (
      <View style={{ alignItems: 'center', gap: size * 0.1 }}>
        <Mascot mood="happy" size={mascotSize} />
        {showWordmark && <Wordmark size={size} />}
      </View>
    );
  }

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: size * 0.15 }}>
      <Mascot mood="happy" size={mascotSize} />
      {showWordmark && <Wordmark size={size} />}
    </View>
  );
}
