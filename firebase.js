// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDcReJ2gI9LQwEgYZnTkG2yTFAtJT1uW8k",
  authDomain: "revalue-e8246.firebaseapp.com",
  projectId: "revalue-e8246",
  storageBucket: "revalue-e8246.firebasestorage.app",
  messagingSenderId: "816141764936",
  appId: "1:816141764936:web:91449f39be7f7118bf4b7d",
  measurementId: "G-MG63RFB1H1"
};

// Firebase 앱 초기화
const app = initializeApp(firebaseConfig);

// 각 Firebase 서비스의 인스턴스를 가져옵니다.
// 이 인스턴스들을 다른 파일에서 가져다 쓸 수 있도록 export 합니다.

// AsyncStorage를 사용한 Auth 퍼시스턴스 설정
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export const db = getFirestore(app); // Firestore 데이터베이스 서비스
export const storage = getStorage(app); // Storage 서비스

export default app;