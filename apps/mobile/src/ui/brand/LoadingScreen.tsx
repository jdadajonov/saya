import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, AccessibilityInfo } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { Mascot } from './Mascot';

const SUN = '#FFE66D';
const INK = '#2B2140';
const CORAL = '#FF6B6B';
const TEAL = '#4ECDC4';
const VIOLET = '#A07AFF';
const WHITE = '#FFFFFF';

function Wordmark() {
  return (
    <View style={styles.wordmark}>
      <Text style={[styles.letter, { color: CORAL }]}>S</Text>
      <Text style={[styles.letter, { color: TEAL }]}>a</Text>
      <Text style={[styles.letter, { color: WHITE }]}>y</Text>
      <Text style={[styles.letter, { color: VIOLET }]}>a</Text>
    </View>
  );
}

function BouncingDots({ reduceMotion }: { reduceMotion: boolean }) {
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;

    const bounce = (delay: number) =>
      withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(-8, { duration: 300 }),
            withTiming(0, { duration: 300 })
          ),
          -1,
          false
        )
      );

    dot1.value = bounce(0);
    dot2.value = bounce(150);
    dot3.value = bounce(300);
  }, [reduceMotion, dot1, dot2, dot3]);

  const style1 = useAnimatedStyle(() => ({ transform: [{ translateY: dot1.value }] }));
  const style2 = useAnimatedStyle(() => ({ transform: [{ translateY: dot2.value }] }));
  const style3 = useAnimatedStyle(() => ({ transform: [{ translateY: dot3.value }] }));

  return (
    <View style={styles.dots}>
      <Animated.View style={[styles.dot, style1]} />
      <Animated.View style={[styles.dot, style2]} />
      <Animated.View style={[styles.dot, style3]} />
    </View>
  );
}

export function LoadingScreen() {
  const hopValue = useSharedValue(0);
  const reduceMotion = useRef(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      reduceMotion.current = enabled;
      if (!enabled) {
        hopValue.value = withRepeat(
          withSequence(
            withTiming(-10, { duration: 400 }),
            withTiming(0, { duration: 400 }),
            withDelay(800, withTiming(0, { duration: 0 }))
          ),
          -1,
          false
        );
      }
    });
  }, [hopValue]);

  const mascotStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: hopValue.value }],
  }));

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Animated.View style={mascotStyle}>
          <Mascot mood="happy" size={100} />
        </Animated.View>
        <Wordmark />
      </View>
      <BouncingDots reduceMotion={reduceMotion.current} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SUN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    gap: 16,
  },
  wordmark: {
    flexDirection: 'row',
  },
  letter: {
    fontSize: 40,
    fontWeight: '900',
  },
  dots: {
    position: 'absolute',
    bottom: 100,
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: INK,
  },
});
