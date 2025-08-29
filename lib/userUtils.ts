import { auth } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { collections, User } from './types';

/**
 * 현재 로그인한 사용자의 타입을 확인합니다.
 * @returns 'seller' | 'buyer' | 'both' | null
 */
export const getCurrentUserType = async (): Promise<'seller' | 'buyer' | 'both' | null> => {
  try {
    const user = auth.currentUser;
    if (!user) return null;

    const userDoc = await getDoc(doc(db, collections.users, user.uid));
    if (!userDoc.exists()) return null;

    const userData = userDoc.data() as User;
    return userData.userType;
  } catch (error) {
    console.error('Error getting user type:', error);
    return null;
  }
};

/**
 * 사용자가 판매자 권한이 있는지 확인합니다.
 * @returns boolean
 */
export const hasSellerPermission = async (): Promise<boolean> => {
  const userType = await getCurrentUserType();
  return userType === 'seller' || userType === 'both';
};

/**
 * 사용자가 구매자 권한이 있는지 확인합니다.
 * @returns boolean
 */
export const hasBuyerPermission = async (): Promise<boolean> => {
  const userType = await getCurrentUserType();
  return userType === 'buyer' || userType === 'both';
};

/**
 * 사용자가 판매자로 등록되어 있고 필요한 정보가 모두 있는지 확인합니다.
 * @returns boolean
 */
export const isSellerProfileComplete = async (): Promise<boolean> => {
  try {
    const user = auth.currentUser;
    if (!user) return false;

    const userDoc = await getDoc(doc(db, collections.users, user.uid));
    if (!userDoc.exists()) return false;

    const userData = userDoc.data() as User;
    return (
      (userData.userType === 'seller' || userData.userType === 'both') &&
      !!userData.storeId &&
      !!userData.businessLicense &&
      !!userData.phoneNumber
    );
  } catch (error) {
    console.error('Error checking seller profile:', error);
    return false;
  }
};
