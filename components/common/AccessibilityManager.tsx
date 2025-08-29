import React, { createContext, useContext, useState, useEffect } from 'react';
import { AccessibilityInfo, AppState } from 'react-native';
import { ACCESSIBILITY, COLOR_SCHEMES } from '../../lib/designSystem';

interface AccessibilityContextType {
  isVoiceOverEnabled: boolean;
  fontScale: number;
  isHighContrastEnabled: boolean;
  colorScheme: keyof typeof COLOR_SCHEMES;
  setColorScheme: (scheme: keyof typeof COLOR_SCHEMES) => void;
  setFontScale: (scale: number) => void;
  announceForAccessibility: (message: string) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType>({
  isVoiceOverEnabled: false,
  fontScale: ACCESSIBILITY.FONT_SCALE_FACTORS.NORMAL,
  isHighContrastEnabled: false,
  colorScheme: 'LIGHT',
  setColorScheme: () => {},
  setFontScale: () => {},
  announceForAccessibility: () => {},
});

export const useAccessibility = () => useContext(AccessibilityContext);

interface AccessibilityProviderProps {
  children: React.ReactNode;
}

export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const [isVoiceOverEnabled, setIsVoiceOverEnabled] = useState(false);
  const [fontScale, setFontScale] = useState(ACCESSIBILITY.FONT_SCALE_FACTORS.NORMAL);
  const [isHighContrastEnabled, setIsHighContrastEnabled] = useState(false);
  const [colorScheme, setColorScheme] = useState<keyof typeof COLOR_SCHEMES>('LIGHT');

  useEffect(() => {
    // VoiceOver 상태 감지
    const voiceOverListener = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      setIsVoiceOverEnabled
    );

    // 초기 VoiceOver 상태 확인
    AccessibilityInfo.isScreenReaderEnabled().then(setIsVoiceOverEnabled);

    // 고대비 모드 상태 감지 (iOS only)
    if (AccessibilityInfo.isHighContrastEnabled) {
      const highContrastListener = AccessibilityInfo.addEventListener(
        'highContrastDidChange',
        setIsHighContrastEnabled
      );

      // 초기 고대비 모드 상태 확인
      AccessibilityInfo.isHighContrastEnabled().then(setIsHighContrastEnabled);

      return () => {
        voiceOverListener.remove();
        highContrastListener.remove();
      };
    }

    return () => {
      voiceOverListener.remove();
    };
  }, []);

  useEffect(() => {
    // 앱 상태 변경 감지 (백그라운드에서 포그라운드로 전환 시 설정 다시 확인)
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        AccessibilityInfo.isScreenReaderEnabled().then(setIsVoiceOverEnabled);
        if (AccessibilityInfo.isHighContrastEnabled) {
          AccessibilityInfo.isHighContrastEnabled().then(setIsHighContrastEnabled);
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // 고대비 모드가 활성화되면 자동으로 HIGH_CONTRAST 색상 스키마 적용
  useEffect(() => {
    if (isHighContrastEnabled) {
      setColorScheme('HIGH_CONTRAST');
    }
  }, [isHighContrastEnabled]);

  const announceForAccessibility = (message: string) => {
    if (isVoiceOverEnabled) {
      AccessibilityInfo.announceForAccessibility(message);
    }
  };

  const value = {
    isVoiceOverEnabled,
    fontScale,
    isHighContrastEnabled,
    colorScheme,
    setColorScheme,
    setFontScale,
    announceForAccessibility,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}

// 접근성 HOC
export function withAccessibility<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  return function AccessibleComponent(props: P) {
    const accessibility = useAccessibility();
    
    return <WrappedComponent {...props} accessibility={accessibility} />;
  };
}
