import Svg, { Circle, Ellipse, Line, Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

export type MascotMood = 'happy' | 'idle' | 'thinking' | 'sleepy';

interface MascotProps {
  mood?: MascotMood;
  size?: number;
}

const INK = '#2B2140';
const CORAL = '#FF6B6B';
const TEAL = '#4ECDC4';
const TEAL_LIGHT = '#A7EDE7';
const BLUSH = '#FF8FA3';
const WHITE = '#FFFFFF';

export function Mascot({ mood = 'idle', size = 120 }: MascotProps) {
  const { t } = useTranslation();
  const scale = size / 120;

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      accessibilityRole="image"
      accessibilityLabel={t('mascot.name')}
    >
      {/* Antennae */}
      <Line x1="45" y1="30" x2="35" y2="11" stroke={INK} strokeWidth="4" strokeLinecap="round" />
      <Line x1="75" y1="30" x2="85" y2="11" stroke={INK} strokeWidth="4" strokeLinecap="round" />

      {/* Antenna tips */}
      <Circle cx="35" cy="10" r="7" fill={CORAL} stroke={INK} strokeWidth="3" />
      <Circle cx="85" cy="10" r="7" fill={CORAL} stroke={INK} strokeWidth="3" />

      {/* Body */}
      <Ellipse cx="60" cy="66" rx="46" ry="42" fill={TEAL} stroke={INK} strokeWidth="4" />

      {/* Belly */}
      <Ellipse cx="60" cy="82" rx="26" ry="18" fill={TEAL_LIGHT} />

      {/* Eye highlight */}
      <Path d="M30 46 Q34 40 40 42" fill="none" stroke={WHITE} strokeWidth="4" strokeLinecap="round" />

      {/* Left eye */}
      <Circle cx="45" cy="58" r="10" fill={WHITE} stroke={INK} strokeWidth="3" />
      <Circle cx="47" cy="59" r="4.5" fill={INK} />
      <Circle cx="49" cy="56" r="1.5" fill={WHITE} />

      {/* Right eye */}
      <Circle cx="75" cy="58" r="10" fill={WHITE} stroke={INK} strokeWidth="3" />
      <Circle cx="77" cy="59" r="4.5" fill={INK} />
      <Circle cx="79" cy="56" r="1.5" fill={WHITE} />

      {/* Cheeks */}
      <Ellipse cx="32" cy="72" rx="7" ry="5" fill={BLUSH} />
      <Ellipse cx="88" cy="72" rx="7" ry="5" fill={BLUSH} />

      {/* Mouth - varies by mood */}
      {mood === 'happy' && (
        <Path d="M45 74 Q60 90 75 74" fill="none" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
      )}
      {mood === 'idle' && (
        <Path d="M50 74 Q60 84 70 74" fill="none" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
      )}
      {mood === 'thinking' && (
        <Ellipse cx="60" cy="78" rx="6" ry="4" fill={INK} />
      )}
      {mood === 'sleepy' && (
        <>
          <Path d="M50 76 Q60 80 70 76" fill="none" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
          {/* Closed eyes for sleepy */}
          <Path d="M38 58 Q45 62 52 58" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
          <Path d="M68 58 Q75 62 82 58" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
        </>
      )}
    </Svg>
  );
}
