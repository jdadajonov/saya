import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

interface ComboBadgeProps {
  streak: number;
}

const LABELS: Record<number, string> = {
  3: '🔥 ×2',
  4: '🔥 ×2',
  5: '⚡ ×3',
  6: '⚡ ×3',
  7: '💥 ×3',
  8: '💥 ×3',
  9: '🌟 ×3',
};

function labelFor(streak: number): string | null {
  if (streak < 3) return null;
  return LABELS[streak] ?? '🌟 ×3';
}

export function ComboBadge({ streak }: ComboBadgeProps) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const label = labelFor(streak);

  useEffect(() => {
    if (streak >= 3) {
      scale.value = withSequence(
        withSpring(1.3, { damping: 6, stiffness: 400 }),
        withSpring(1.0, { damping: 10, stiffness: 300 }),
      );
      opacity.value = withTiming(1, { duration: 150 });
      if (streak >= 5) {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }
    } else {
      scale.value = withTiming(0, { duration: 200 });
      opacity.value = withTiming(0, { duration: 150 });
    }
  }, [streak]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!label) return null;

  const bg = streak >= 5 ? '#7C3AED' : '#F59E0B';

  return (
    <Animated.View style={[styles.badge, { backgroundColor: bg }, style]}>
      <Animated.Text style={styles.text}>{label}</Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'center',
  },
  text: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
