import { Redirect } from 'expo-router';

// 이 파일은 /(tabs) 경로로 접근했을 때 /home으로 리디렉션하기 위한 용도입니다.
export default function TabsIndex() {
  return <Redirect href="/(tabs)/home" />;
}

// index 탭을 숨기기 위한 옵션
export const unstable_settings = {
  initialRouteName: 'home'
};

// 탭 바에서 숨기기
TabsIndex.navigationOptions = {
  tabBarButton: () => null,
  tabBarStyle: { display: 'none' },
};