import { Dimensions, Platform, PixelRatio } from 'react-native';
import { Easing } from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 기본 스케일 계산
const scale = SCREEN_WIDTH / 375; // iPhone 11 Pro를 기준으로 한 스케일

// 반응형 폰트 크기 계산
export function normalize(size: number): number {
  const newSize = size * scale;
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  }
  return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
}

// 애니메이션 지속 시간
export const ANIMATION_DURATION = {
  FAST: 200,
  NORMAL: 300,
  SLOW: 500,
};

// 애니메이션 타이밍 함수
export const ANIMATION_EASING = {
  // 부드러운 시작
  EASE_IN: Easing.bezier(0.4, 0, 1, 1),
  // 부드러운 종료
  EASE_OUT: Easing.bezier(0, 0, 0.2, 1),
  // 부드러운 시작과 종료
  EASE_IN_OUT: Easing.bezier(0.4, 0, 0.2, 1),
  // 탄력있는 효과
  SPRING: Easing.bezier(0.68, -0.6, 0.32, 1.6),
};

// 접근성 관련 설정
export const ACCESSIBILITY = {
  MINIMUM_TOUCH_SIZE: 44, // iOS 권장 최소 터치 영역
  FONT_SCALE_FACTORS: {
    SMALL: 0.8,
    NORMAL: 1,
    LARGE: 1.2,
    EXTRA_LARGE: 1.4,
  },
};

// 색상 대비 모드
export const COLOR_SCHEMES = {
  LIGHT: {
    background: '#ffffff',
    surface: '#f8f9fa',
    primary: '#e03131',
    primaryDark: '#c92a2a',
    primaryLight: '#ff6b6b',
    secondary: '#228be6',
    text: '#191f28',
    textSecondary: '#495057',
    textTertiary: '#868e96',
    border: '#f1f3f5',
    error: '#fa5252',
    success: '#40c057',
    warning: '#fd7e14',
    info: '#15aabf',
  },
  DARK: {
    background: '#1a1b1e',
    surface: '#26282b',
    primary: '#ff6b6b',
    primaryDark: '#fa5252',
    primaryLight: '#ffa8a8',
    secondary: '#74c0fc',
    text: '#f8f9fa',
    textSecondary: '#ced4da',
    textTertiary: '#adb5bd',
    border: '#343a40',
    error: '#ff6b6b',
    success: '#51cf66',
    warning: '#ffd43b',
    info: '#22b8cf',
  },
  HIGH_CONTRAST: {
    background: '#000000',
    surface: '#1a1a1a',
    primary: '#ffffff',
    primaryDark: '#e6e6e6',
    primaryLight: '#ffffff',
    secondary: '#ffffff',
    text: '#ffffff',
    textSecondary: '#ffffff',
    textTertiary: '#cccccc',
    border: '#ffffff',
    error: '#ff0000',
    success: '#00ff00',
    warning: '#ffff00',
    info: '#00ffff',
  },
};

// 그림자 스타일
export const SHADOWS = {
  SMALL: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  MEDIUM: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  LARGE: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
  },
};

// 모션 프리셋
export const MOTION_PRESETS = {
  SLIDE_UP: {
    from: {
      transform: [{ translateY: 20 }],
      opacity: 0,
    },
    to: {
      transform: [{ translateY: 0 }],
      opacity: 1,
    },
    duration: ANIMATION_DURATION.NORMAL,
    easing: ANIMATION_EASING.EASE_OUT,
  },
  FADE: {
    from: {
      opacity: 0,
    },
    to: {
      opacity: 1,
    },
    duration: ANIMATION_DURATION.NORMAL,
    easing: ANIMATION_EASING.EASE_IN_OUT,
  },
  SCALE: {
    from: {
      transform: [{ scale: 0.95 }],
      opacity: 0,
    },
    to: {
      transform: [{ scale: 1 }],
      opacity: 1,
    },
    duration: ANIMATION_DURATION.NORMAL,
    easing: ANIMATION_EASING.SPRING,
  },
};

// 로딩 애니메이션 설정
export const LOADING_ANIMATION = {
  SPINNER: {
    size: 24,
    color: COLOR_SCHEMES.LIGHT.primary,
    duration: 1000,
  },
  SKELETON: {
    baseColor: '#f1f3f5',
    highlightColor: '#e9ecef',
    duration: 1000,
    easing: ANIMATION_EASING.EASE_IN_OUT,
  },
  PULSE: {
    minOpacity: 0.4,
    maxOpacity: 0.9,
    duration: 1000,
    easing: ANIMATION_EASING.EASE_IN_OUT,
  },
};

// 인터랙션 피드백 설정
export const INTERACTION_FEEDBACK = {
  PRESS: {
    scale: 0.98,
    duration: 100,
    easing: ANIMATION_EASING.EASE_OUT,
  },
  LONG_PRESS: {
    scale: 0.95,
    duration: 200,
    easing: ANIMATION_EASING.EASE_OUT,
  },
  TAP: {
    opacity: 0.7,
    duration: 100,
    easing: ANIMATION_EASING.EASE_OUT,
  },
};
