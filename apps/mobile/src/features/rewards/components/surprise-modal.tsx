import { useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Modal, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withSequence,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useTheme } from '../../../ui/theme-provider';
import type { CatalogReward } from '@saya/core';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CONFETTI_COLORS = ['#FFD93D', '#FF6B6B', '#4ECDC4', '#A78BFA', '#F472B6', '#34D399'];
const CONFETTI_COUNT = 30;

function ConfettiPiece({ index, onComplete }: { index: number; onComplete?: () => void }) {
  const startX = Math.random() * SCREEN_WIDTH;
  const translateY = useSharedValue(-50);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    const delay = index * 50;
    const duration = 2000 + Math.random() * 1000;
    const drift = (Math.random() - 0.5) * 100;

    translateY.value = withDelay(delay, withTiming(SCREEN_HEIGHT + 50, { duration }));
    translateX.value = withDelay(delay, withTiming(drift, { duration }));
    rotate.value = withDelay(delay, withTiming(360 * (Math.random() > 0.5 ? 1 : -1), { duration }));
    opacity.value = withDelay(delay + duration - 500, withTiming(0, { duration: 500 }, () => {
      if (index === 0 && onComplete) runOnJS(onComplete)();
    }));
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
  const size = 8 + Math.random() * 8;

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: startX,
          top: 0,
          width: size,
          height: size * 1.5,
          backgroundColor: color,
          borderRadius: 2,
        },
        style,
      ]}
    />
  );
}

interface SurpriseModalProps {
  visible: boolean;
  reward: CatalogReward | null;
  onDismiss: () => void;
}

export function SurpriseModal({ visible, reward, onDismiss }: SurpriseModalProps) {
  const theme = useTheme();
  const scale = useSharedValue(0);
  const giftScale = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, { damping: 12, stiffness: 150 });
      giftScale.value = withSequence(
        withDelay(300, withSpring(1.3, { damping: 8 })),
        withSpring(1, { damping: 10 })
      );
    } else {
      scale.value = 0;
    }
  }, [visible]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const giftStyle = useAnimatedStyle(() => ({
    transform: [{ scale: giftScale.value }],
  }));

  if (!reward) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* Confetti */}
        {visible && [...Array(CONFETTI_COUNT)].map((_, i) => (
          <ConfettiPiece key={i} index={i} />
        ))}

        {/* Card */}
        <Animated.View style={[{
          width: SCREEN_WIDTH * 0.85,
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.card,
          borderWidth: theme.borderWidth.thick,
          borderColor: theme.colors.ink,
          padding: theme.spacing[6],
          alignItems: 'center',
          ...theme.shadows.card,
        }, cardStyle]}>
          {/* Gift icon */}
          <Animated.View style={[{
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: theme.tints.sun,
            borderWidth: theme.borderWidth.regular,
            borderColor: theme.colors.ink,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: theme.spacing[4],
          }, giftStyle]}>
            <Text style={{ fontSize: 56 }}>🎁</Text>
          </Animated.View>

          {/* Title */}
          <Text style={{
            fontSize: 28,
            fontWeight: '900',
            color: theme.colors.ink,
            textAlign: 'center',
            marginBottom: theme.spacing[2],
          }}>
            Сюрприз!
          </Text>

          {/* Subtitle */}
          <Text style={{
            fontSize: theme.textStyles.body.fontSize,
            color: theme.colors.textSecondary,
            textAlign: 'center',
            marginBottom: theme.spacing[4],
          }}>
            Родители подарили тебе награду
          </Text>

          {/* Reward card */}
          <View style={{
            width: '100%',
            backgroundColor: theme.tints.mint,
            borderRadius: theme.borderRadius.md,
            borderWidth: theme.borderWidth.regular,
            borderColor: theme.colors.ink,
            padding: theme.spacing[4],
            alignItems: 'center',
            marginBottom: theme.spacing[5],
          }}>
            <Text style={{
              fontSize: theme.textStyles.heading.fontSize,
              fontWeight: '800',
              color: theme.colors.ink,
              textAlign: 'center',
            }}>
              {reward.title}
            </Text>
          </View>

          {/* Button */}
          <TouchableOpacity
            style={{
              width: '100%',
              backgroundColor: theme.colors.primary,
              borderRadius: theme.borderRadius.button,
              borderWidth: theme.borderWidth.thick,
              borderColor: theme.colors.ink,
              paddingVertical: theme.spacing[4],
              alignItems: 'center',
              ...theme.shadows.button,
            }}
            onPress={onDismiss}
          >
            <Text style={{
              fontSize: theme.textStyles.heading.fontSize,
              fontWeight: '900',
              color: theme.colors.onFill,
            }}>
              Ура! 🎉
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}
