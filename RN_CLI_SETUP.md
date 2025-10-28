# React Native CLI 설정 가이드

이 프로젝트는 Expo CLI에서 **React Native CLI**로 완전히 전환되었습니다.

## 🚀 실행 방법

### iOS
```bash
npm run ios
# 또는 특정 시뮬레이터 지정
npx react-native run-ios --simulator="iPhone 17 Pro"
```

### Android
```bash
npm run android
```

### Metro 번들러 시작
```bash
npm start
# 또는 캐시 초기화
npm run clean:cache
```

## 📦 주요 변경사항

### 제거된 항목
- ❌ Expo CLI (더 이상 사용하지 않음)
- ❌ 불필요한 Expo 패키지 (expo-maps, expo-speech 등)
- ❌ 중복된 Android 폴더 (app 2, app 3, build 2, gradle 2 등)
- ❌ 중복된 iOS 폴더 (Pods 2, Pods 3, Images 2.xcassets 등)

### 유지된 항목
- ✅ Expo 모듈 (expo-router, expo-image, expo-notifications 등)
  - 이유: React Native CLI에서도 독립적으로 사용 가능하며, 이미 많은 기능이 구현되어 있음
- ✅ 모든 기존 기능 및 컴포넌트

### 업데이트된 설정
- ✅ `package.json` - React Native CLI 스크립트로 변경
- ✅ `metro.config.js` - @react-native/metro-config 사용
- ✅ `babel.config.js` - React Native 프리셋 사용
- ✅ `eslint.config.js` - @react-native/eslint-config 사용
- ✅ `app.json` - 간소화

## 🛠️ 유용한 명령어

```bash
# 캐시 및 빌드 폴더 완전 정리
npm run clean

# iOS Pods 재설치
npm run pods

# 린트 실행
npm run lint

# 데이터베이스 초기화
npm run init-db
```

## 📱 네이티브 폴더 구조

### Android
```
android/
├── app/                 # 메인 앱 모듈 (정리됨)
├── build.gradle         # 루트 빌드 스크립트
├── gradle/              # Gradle 래퍼
├── local.properties     # Android SDK 경로
└── settings.gradle      # 프로젝트 설정
```

### iOS
```
ios/
├── revalue/            # 메인 앱 폴더 (정리됨)
├── revalue.xcodeproj/  # Xcode 프로젝트
├── revalue.xcworkspace/ # Xcode 워크스페이스 (CocoaPods)
├── Pods/               # 네이티브 의존성 (정리됨)
└── Podfile             # CocoaPods 설정
```

## ⚠️ 주의사항

1. **Expo Go 앱을 사용할 수 없습니다**
   - 개발 빌드가 필요합니다
   - iOS 시뮬레이터 또는 Android 에뮬레이터 사용

2. **네이티브 코드 변경 시**
   - iOS: Pods 재설치 필요 (`npm run pods`)
   - Android: Gradle 클린 필요 (`cd android && ./gradlew clean`)

3. **Metro 번들러**
   - 자동으로 시작되지 않으면 별도 터미널에서 `npm start` 실행

## 🔧 문제 해결

### iOS 빌드 오류
```bash
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..
npm run ios
```

### Android 빌드 오류
```bash
cd android
./gradlew clean
cd ..
npm run android
```

### 캐시 문제
```bash
npm run clean:cache
# 또는 완전 정리
npm run clean
npm install
npm run pods
```

## 📚 추가 정보

- [React Native CLI 문서](https://reactnative.dev/docs/environment-setup)
- [Expo 모듈 문서](https://docs.expo.dev/bare/overview/)

