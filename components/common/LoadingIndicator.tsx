import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { LOADING_ANIMATION, COLOR_SCHEMES } from '../../lib/designSystem';

interface LoadingIndicatorProps {
  size?: number;
  color?: string;
  style?: ViewStyle;
  type?: 'spinner' | 'dots' | 'pulse';
}

export default function LoadingIndicator({
  size = LOADING_ANIMATION.SPINNER.size,
  color = LOADING_ANIMATION.SPINNER.color,
  style,
  type = 'spinner',
}: LoadingIndicatorProps) {
  const rotation = useSharedValue(0);
  const dot1Scale = useSharedValue(1);
  const dot2Scale = useSharedValue(1);
  const dot3Scale = useSharedValue(1);
  const pulseScale = useSharedValue(1);

  React.useEffect(() => {
    if (type === 'spinner') {
      rotation.value = withRepeat(
        withTiming(360, {
          duration: LOADING_ANIMATION.SPINNER.duration,
          easing: Easing.linear,
        }),
        -1
      );
    } else if (type === 'dots') {
      const animateDot = (value: Animated.SharedValue<number>, delay: number) => {
        value.value = withRepeat(
          withSequence(
            withDelay(
              delay,
              withTiming(1.5, {
                duration: 300,
                easing: Easing.bezier(0.4, 0, 0.2, 1),
              })
            ),
            withTiming(1, {
              duration: 300,
              easing: Easing.bezier(0.4, 0, 0.2, 1),
            })
          ),
          -1
        );
      };

      animateDot(dot1Scale, 0);
      animateDot(dot2Scale, 200);
      animateDot(dot3Scale, 400);
    } else if (type === 'pulse') {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.2, {
            duration: LOADING_ANIMATION.PULSE.duration / 2,
            easing: LOADING_ANIMATION.PULSE.easing,
          }),
          withTiming(1, {
            duration: LOADING_ANIMATION.PULSE.duration / 2,
            easing: LOADING_ANIMATION.PULSE.easing,
          })
        ),
        -1
      );
    }
  }, [type]);

  const spinnerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const dot1Style = useAnimatedStyle(() => ({
    transform: [{ scale: dot1Scale.value }],
  }));

  const dot2Style = useAnimatedStyle(() => ({
    transform: [{ scale: dot2Scale.value }],
  }));

  const dot3Style = useAnimatedStyle(() => ({
    transform: [{ scale: dot3Scale.value }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: withTiming(
      pulseScale.value === 1 ? 
        LOADING_ANIMATION.PULSE.maxOpacity : 
        LOADING_ANIMATION.PULSE.minOpacity
    ),
  }));

  if (type === 'spinner') {
    return (
      <View style={[styles.container, style]}>
        <Animated.View
          style={[
            styles.spinner,
            {
              width: size,
              height: size,
              borderColor: color,
            },
            spinnerStyle,
          ]}
        />
      </View>
    );
  }

  if (type === 'dots') {
    return (
      <View style={[styles.container, styles.dotsContainer, style]}>
        <Animated.View
          style={[
            styles.dot,
            { width: size / 3, height: size / 3, backgroundColor: color },
            dot1Style,
          ]}
        />
        <Animated.View
          style={[
            styles.dot,
            { width: size / 3, height: size / 3, backgroundColor: color },
            dot2Style,
          ]}
        />
        <Animated.View
          style={[
            styles.dot,
            { width: size / 3, height: size / 3, backgroundColor: color },
            dot3Style,
          ]}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <Animated.View
        style={[
          styles.pulse,
          {
            width: size,
            height: size,
            backgroundColor: color,
          },
          pulseStyle,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinner: {
    borderWidth: 2,
    borderRadius: 100,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    borderRadius: 100,
  },
  pulse: {
    borderRadius: 100,
  },
});
