// 푸시 알림 관련 유틸리티 함수들

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// 알림 핸들러 설정
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// FCM 프로젝트 ID (Firebase Console에서 확인)
const FCM_PROJECT_ID = 'revalue-e8246'; // firebase.js의 projectId와 동일

/**
 * 푸시 알림 권한 요청 및 토큰 획득
 */
export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#22c55e',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('푸시 알림 권한이 거부되었습니다.');
      return;
    }
    
    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? FCM_PROJECT_ID;
      
      token = (
        await Notifications.getExpoPushTokenAsync({
          projectId,
        })
      ).data;
      
      console.log('Expo Push Token:', token);
    } catch (error) {
      console.error('푸시 토큰 획득 실패:', error);
    }
  } else {
    console.log('푸시 알림은 실제 디바이스에서만 작동합니다.');
  }

  return token;
}

/**
 * 로컬 알림 스케줄링 (테스트용)
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  seconds: number = 5
) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { timestamp: Date.now() },
    },
    trigger: { seconds },
  });
}

/**
 * 즉시 로컬 알림 표시
 */
export async function showLocalNotification(title: string, body: string, data?: any) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data || {},
    },
    trigger: null, // 즉시 표시
  });
}

/**
 * 떨이 관련 알림 타입들
 */
export const NOTIFICATION_TYPES = {
  NEW_DEAL_NEARBY: 'new_deal_nearby',
  DEAL_EXPIRING: 'deal_expiring', 
  FAVORITE_STORE_UPDATE: 'favorite_store_update',
  ORDER_STATUS_UPDATE: 'order_status_update',
  PRICE_DROP: 'price_drop'
} as const;

export type NotificationType = typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES];

/**
 * 특정 타입의 알림 전송 (로컬)
 */
export async function sendDealNotification(
  type: NotificationType,
  dealTitle: string,
  storeName: string,
  distance?: string,
  discountRate?: number
) {
  let title = '';
  let body = '';

  switch (type) {
    case NOTIFICATION_TYPES.NEW_DEAL_NEARBY:
      title = '🎯 새로운 떨이 발견!';
      body = `${storeName}에서 ${dealTitle}을(를) ${distance}에서 발견했어요!`;
      break;
      
    case NOTIFICATION_TYPES.DEAL_EXPIRING:
      title = '⏰ 마감 임박!';
      body = `찜한 ${dealTitle}이(가) 곧 마감됩니다. 서둘러 주세요!`;
      break;
      
    case NOTIFICATION_TYPES.FAVORITE_STORE_UPDATE:
      title = '❤️ 찜한 매장 소식';
      body = `${storeName}에 새로운 떨이가 등록되었어요!`;
      break;
      
    case NOTIFICATION_TYPES.PRICE_DROP:
      title = '💰 가격 인하!';
      body = `${dealTitle}의 할인율이 ${discountRate}%로 올랐어요!`;
      break;
      
    default:
      title = 'ReValue 알림';
      body = '새로운 소식이 있어요!';
  }

  await showLocalNotification(title, body, {
    type,
    dealTitle,
    storeName,
    distance,
    discountRate,
    timestamp: Date.now()
  });
}

/**
 * 거리 기반 알림 체크 (임시 - 실제로는 백그라운드 서비스 필요)
 */
export function shouldSendDistanceNotification(
  userLat: number,
  userLon: number,
  dealLat: number,
  dealLon: number,
  radiusMeters: number = 500
): boolean {
  const distance = calculateDistance(userLat, userLon, dealLat, dealLon);
  return distance <= radiusMeters;
}

/**
 * 거리 계산 (Haversine formula)
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // 지구 반지름 (km)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c * 1000; // 미터 단위로 반환
}

/**
 * 알림 리스너 등록
 */
export function addNotificationListeners() {
  // 앱이 포그라운드에 있을 때 알림 수신
  const foregroundSubscription = Notifications.addNotificationReceivedListener(notification => {
    console.log('포그라운드 알림 수신:', notification);
  });

  // 알림 탭했을 때
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('알림 응답:', response);
    
    const data = response.notification.request.content.data;
    
    // 알림 타입에 따른 네비게이션 처리
    if (data.type === NOTIFICATION_TYPES.NEW_DEAL_NEARBY) {
      // 지도 화면으로 이동
      console.log('지도 화면으로 이동');
    } else if (data.type === NOTIFICATION_TYPES.DEAL_EXPIRING) {
      // 찜 화면으로 이동
      console.log('찜 화면으로 이동');
    }
  });

  return {
    remove: () => {
      foregroundSubscription.remove();
      responseSubscription.remove();
    }
  };
}

/**
 * 모든 알림 제거
 */
export async function clearAllNotifications() {
  await Notifications.dismissAllNotificationsAsync();
}

/**
 * 예약된 알림 취소
 */
export async function cancelScheduledNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}