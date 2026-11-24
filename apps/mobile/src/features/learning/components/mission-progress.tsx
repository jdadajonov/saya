import { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../ui/theme-provider';

interface MissionProgressProps {
  current: number;
  total: number;
  xpPreview: number;
  comboStreak: number;
}

export function MissionProgress({ current, total, xpPreview, comboStreak }: MissionProgressProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withSpring(current / total, { damping: 15, stiffness: 100 });
  }, [current, total]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const barColor = comboStreak >= 5 ? theme.colors.xp : comboStreak >= 3 ? theme.tints.sun : theme.colors.secondary;

  return (
    <View style={{ flex: 1, gap: theme.spacing[2] }}>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[3],
      }}>
        {/* Progress bar */}
        <View style={{
          flex: 1,
          height: 12,
          backgroundColor: theme.colors.surface,
          borderRadius: 6,
          borderWidth: theme.borderWidth.thin,
          borderColor: theme.colors.ink,
          overflow: 'hidden',
        }} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: total, now: current }}>
          <Animated.View style={[{
            height: '100%',
            backgroundColor: barColor,
            borderRadius: 4,
          }, barStyle]} />
        </View>

        {/* Counter */}
        <Text style={{
          fontSize: theme.textStyles.body.fontSize,
          fontWeight: '800',
          color: theme.colors.ink,
          minWidth: 40,
        }} accessibilityLabel={t('learning.progressLabel', { current, total })}>
          {current} / {total}
        </Text>
      </View>
    </View>
  );
}
