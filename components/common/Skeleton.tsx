import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { LOADING_ANIMATION } from '../../lib/designSystem';

interface SkeletonProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export default function Skeleton({
  width,
  height,
  borderRadius = 4,
  style,
}: SkeletonProps) {
  const translateX = useSharedValue(-width);

  React.useEffect(() => {
    translateX.value = withRepeat(
      withSequence(
        withTiming(-width, {
          duration: 0,
          easing: Easing.linear,
        }),
        withDelay(
          500,
          withTiming(width, {
            duration: LOADING_ANIMATION.SKELETON.duration,
            easing: LOADING_ANIMATION.SKELETON.easing,
          })
        )
      ),
      -1
    );
  }, [width]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: LOADING_ANIMATION.SKELETON.baseColor,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <AnimatedLinearGradient
        colors={[
          'transparent',
          LOADING_ANIMATION.SKELETON.highlightColor,
          'transparent',
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[
          {
            ...StyleSheet.absoluteFillObject,
            width: '100%',
            height: '100%',
          },
          animatedStyle,
        ]}
      />
    </View>
  );
}
