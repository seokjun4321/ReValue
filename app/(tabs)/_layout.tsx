import { Tabs } from "expo-router";
import { Ionicons } from '@expo/vector-icons';

export default function TabsLayout() {
  return (
    <Tabs 
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: route.name === 'index' 
          ? { display: 'none' }
          : {
              backgroundColor: '#ffffff',
              borderTopColor: '#22c55e',      // 메인 Green 컬러
              borderTopWidth: 0,              // 당근마켓 스타일: 테두리 제거
              borderRadius: 20,               // 둥근 모서리 (당근마켓 스타일)
              marginHorizontal: 16,           // 좌우 여백
              marginBottom: 8,                // 하단 여백 (플로팅 효과)
              paddingTop: 8,                  // 상단 패딩
              paddingBottom: 8,               // 하단 패딩 (안전 영역 고려)
              height: 70,                     // 높이 증가
              shadowColor: '#22c55e',         // Green 그림자
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,            // 더 진한 그림자
              shadowRadius: 12,               // 더 부드러운 그림자
              elevation: 8,                   // Android 그림자
            },
        tabBarActiveTintColor: '#22c55e',     // 활성 탭: 메인 Green
        tabBarInactiveTintColor: '#94a3b8',   // 비활성 탭: 회색
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',                  // 당근마켓 스타일: 볼드 폰트
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
        tabBarButton: route.name === 'index' ? () => null : undefined,
      })}
    >
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="home"
        options={{
          title: '홈',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ranking"
        options={{
          title: '랭킹',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="trophy" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="mapscreen"
        options={{
          title: '지도',
          tabBarIcon: ({ color, size}) => (
            <Ionicons name="map" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: '찜',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="heart" size={size} color={color} />
          ),
        }}
      />


      <Tabs.Screen
        name="profile"
        options={{
          title: '프로필',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}