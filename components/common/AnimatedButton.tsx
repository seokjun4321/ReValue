import React from 'react';
import { 
  TouchableWithoutFeedback, 
  ViewStyle, 
  StyleSheet, 
  AccessibilityRole 
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { INTERACTION_FEEDBACK, ACCESSIBILITY } from '../../lib/designSystem';

interface AnimatedButtonProps {
  onPress?: () => void;
  onLongPress?: () => void;
  style?: ViewStyle;
  disabled?: boolean;
  children: React.ReactNode;
  accessibilityLabel?: string;
  accessibilityRole?: AccessibilityRole;
  accessibilityHint?: string;
  feedbackType?: 'scale' | 'opacity';
}

export default function AnimatedButton({
  onPress,
  onLongPress,
  style,
  disabled,
  children,
  accessibilityLabel,
  accessibilityRole = 'button',
  accessibilityHint,
  feedbackType = 'scale',
}: AnimatedButtonProps) {
  const animation = useSharedValue(1);

  const handlePressIn = () => {
    if (feedbackType === 'scale') {
      animation.value = withSpring(
        INTERACTION_FEEDBACK.PRESS.scale,
        {
          damping: 15,
          stiffness: 300,
        }
      );
    } else {
      animation.value = withTiming(
        INTERACTION_FEEDBACK.TAP.opacity,
        {
          duration: INTERACTION_FEEDBACK.TAP.duration,
        }
      );
    }
  };

  const handlePressOut = () => {
    if (feedbackType === 'scale') {
      animation.value = withSpring(1, {
        damping: 15,
        stiffness: 300,
      });
    } else {
      animation.value = withTiming(1, {
        duration: INTERACTION_FEEDBACK.TAP.duration,
      });
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: feedbackType === 'scale' ? [{ scale: animation.value }] : undefined,
    opacity: feedbackType === 'opacity' ? animation.value : 1,
  }));

  return (
    <TouchableWithoutFeedback
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
      accessibilityHint={accessibilityHint}
      hitSlop={ACCESSIBILITY.MINIMUM_TOUCH_SIZE / 2}
    >
      <Animated.View style={[styles.button, style, animatedStyle]}>
        {children}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  button: {
    minWidth: ACCESSIBILITY.MINIMUM_TOUCH_SIZE,
    minHeight: ACCESSIBILITY.MINIMUM_TOUCH_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
