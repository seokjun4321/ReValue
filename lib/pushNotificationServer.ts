// Firebase Cloud Messaging 서버 사이드 푸시 알림

/**
 * 이 파일은 실제 프로덕션에서는 Firebase Functions나 
 * 별도의 Node.js 서버에서 실행되어야 합니다.
 * 
 * 클라이언트에서는 보안상 직접 FCM API를 호출할 수 없으므로,
 * 여기서는 구조와 예시 코드만 제공합니다.
 */

interface PushNotificationData {
  title: string;
  body: string;
  data?: Record<string, any>;
  imageUrl?: string;
}

interface NotificationTarget {
  token?: string;
  topic?: string;
  condition?: string;
}

/**
 * FCM 서버 키 (Firebase Console > Project Settings > Cloud Messaging)
 * 실제로는 환경 변수나 Firebase Admin SDK를 사용해야 함
 */
const FCM_SERVER_KEY = 'YOUR_FCM_SERVER_KEY_HERE';

/**
 * 단일 디바이스에 푸시 알림 전송
 * 
 * @example
 * // Firebase Functions에서 사용 예시:
 * import { sendToDevice } from './pushNotificationServer';
 * 
 * export const sendDealAlert = functions.firestore
 *   .document('deals/{dealId}')
 *   .onCreate(async (snap, context) => {
 *     const deal = snap.data();
 *     await sendPushNotification({
 *       token: userToken,
 *       title: '새로운 떨이!',
 *       body: `${deal.title}이 등록되었습니다!`,
 *       data: { dealId: context.params.dealId }
 *     });
 *   });
 */
export async function sendPushNotification(
  target: NotificationTarget,
  notification: PushNotificationData
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const payload = {
      notification: {
        title: notification.title,
        body: notification.body,
        image: notification.imageUrl,
      },
      data: notification.data || {},
      android: {
        notification: {
          channelId: 'default',
          priority: 'high' as const,
          defaultSound: true,
          color: '#22c55e',
          icon: 'ic_notification',
        },
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title: notification.title,
              body: notification.body,
            },
            sound: 'default',
            badge: 1,
          },
        },
      },
      webpush: {
        notification: {
          title: notification.title,
          body: notification.body,
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png',
          tag: 'revalue-notification',
          requireInteraction: true,
        },
      },
    };

    // 실제 구현에서는 Firebase Admin SDK 사용
    /* 
    import admin from 'firebase-admin';
    
    const message = {
      ...payload,
      token: target.token,  // 또는 topic, condition
    };
    
    const response = await admin.messaging().send(message);
    return { success: true, messageId: response };
    */

    // 임시 Mock 응답
    console.log('푸시 알림 전송 시뮬레이션:', {
      target,
      payload,
    });

    return {
      success: true,
      messageId: `mock_${Date.now()}`,
    };
  } catch (error: any) {
    console.error('푸시 알림 전송 실패:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * 토픽 구독자들에게 알림 전송
 */
export async function sendToTopic(
  topic: string,
  notification: PushNotificationData
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  return sendPushNotification({ topic }, notification);
}

/**
 * 조건부 알림 전송 (예: 특정 지역 + 특정 관심사)
 */
export async function sendToCondition(
  condition: string,
  notification: PushNotificationData
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  return sendPushNotification({ condition }, notification);
}

/**
 * 다중 디바이스 토큰에 알림 전송
 */
export async function sendToMultipleDevices(
  tokens: string[],
  notification: PushNotificationData
): Promise<{
  successCount: number;
  failureCount: number;
  responses: Array<{ success: boolean; messageId?: string; error?: string }>;
}> {
  const promises = tokens.map(token =>
    sendPushNotification({ token }, notification)
  );

  const responses = await Promise.all(promises);
  const successCount = responses.filter(r => r.success).length;
  const failureCount = responses.length - successCount;

  return {
    successCount,
    failureCount,
    responses,
  };
}

/**
 * 사용자 그룹별 알림 전송 헬퍼 함수들
 */
export const NotificationHelpers = {
  /**
   * 새로운 떨이 등록 시 주변 사용자들에게 알림
   */
  async notifyNearbyUsers(
    dealId: string,
    dealTitle: string,
    storeName: string,
    latitude: number,
    longitude: number,
    radiusKm: number = 5
  ) {
    // 실제로는 사용자 위치 데이터베이스에서 해당 반경 내 사용자들을 찾아서 알림
    const condition = `'location_${Math.floor(latitude)}_${Math.floor(longitude)}' in topics`;
    
    return sendToCondition(condition, {
      title: '🎯 주변에 새로운 떨이!',
      body: `${storeName}에서 ${dealTitle}을(를) 특가로 판매합니다!`,
      data: {
        type: 'new_deal_nearby',
        dealId,
        storeName,
        latitude: latitude.toString(),
        longitude: longitude.toString(),
      },
    });
  },

  /**
   * 마감 임박 알림 (찜한 사용자들에게)
   */
  async notifyDealExpiring(
    dealId: string,
    dealTitle: string,
    userTokens: string[]
  ) {
    return sendToMultipleDevices(userTokens, {
      title: '⏰ 마감 임박!',
      body: `찜하신 ${dealTitle}이(가) 곧 마감됩니다!`,
      data: {
        type: 'deal_expiring',
        dealId,
      },
    });
  },

  /**
   * 가격 인하 알림
   */
  async notifyPriceDropped(
    dealId: string,
    dealTitle: string,
    newDiscountRate: number,
    userTokens: string[]
  ) {
    return sendToMultipleDevices(userTokens, {
      title: '💰 가격 인하!',
      body: `${dealTitle}의 할인율이 ${newDiscountRate}%로 증가했습니다!`,
      data: {
        type: 'price_drop',
        dealId,
        discountRate: newDiscountRate.toString(),
      },
    });
  },

  /**
   * 주문 상태 변경 알림
   */
  async notifyOrderStatusChanged(
    orderId: string,
    dealTitle: string,
    newStatus: string,
    userToken: string
  ) {
    const statusMessages = {
      confirmed: '주문이 확인되었습니다',
      ready: '상품 준비가 완료되었습니다',
      completed: '거래가 완료되었습니다',
      cancelled: '주문이 취소되었습니다',
    };

    const message = statusMessages[newStatus as keyof typeof statusMessages] || '주문 상태가 변경되었습니다';

    return sendPushNotification({ token: userToken }, {
      title: '📦 주문 상태 변경',
      body: `${dealTitle}: ${message}`,
      data: {
        type: 'order_status_update',
        orderId,
        status: newStatus,
      },
    });
  },
};

/**
 * Firebase Functions 예시 코드
 * 
 * 실제 배포 시에는 이런 식으로 functions/src/index.ts에 작성:
 * 
 * import * as functions from 'firebase-functions';
 * import * as admin from 'firebase-admin';
 * import { NotificationHelpers } from './pushNotificationServer';
 * 
 * admin.initializeApp();
 * 
 * // 새 떨이 등록 시 트리거
 * export const onDealCreated = functions.firestore
 *   .document('deals/{dealId}')
 *   .onCreate(async (snap, context) => {
 *     const deal = snap.data();
 *     await NotificationHelpers.notifyNearbyUsers(
 *       context.params.dealId,
 *       deal.title,
 *       deal.storeName,
 *       deal.location.latitude,
 *       deal.location.longitude
 *     );
 *   });
 * 
 * // 주문 상태 변경 시 트리거
 * export const onOrderStatusChanged = functions.firestore
 *   .document('orders/{orderId}')
 *   .onUpdate(async (change, context) => {
 *     const before = change.before.data();
 *     const after = change.after.data();
 *     
 *     if (before.status !== after.status) {
 *       await NotificationHelpers.notifyOrderStatusChanged(
 *         context.params.orderId,
 *         after.dealTitle,
 *         after.status,
 *         after.buyerToken
 *       );
 *     }
 *   });
 */