/*
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, Text, TextInput, TouchableOpacity, View } from "react-native";
import "./global.css";

  export default function Index() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = () => {
      if (username === 'admin' && password === '1234') {
        Alert.alert("로그인 성공!", "메인 화면으로 이동합니다.");
        router.replace('/home'); // 로그인 후 뒤로 가기 방지를 위해 replace 사용
      } else {
        Alert.alert("로그인 실패", "아이디 또는 비밀번호를 확인해주세요.");
      }
    };

    return (
      <View className="flex-1 items-center justify-center bg-green-100">
        <Text className="text-5xl text-center font-bold text-yellow-100 mb-5">
          Re:Value에 오신것을 환영합니다!
        </Text>
        <Text className='text-4xl text-center font-semibold text-yellow-100 mb-2'>
          로그인을 해볼까요?
        </Text>
        <Image className="mb-2"
            source={require('../assets/images/logo.png')}
            style={{width: 200, height: 200}}
          />
        <TextInput className='font-bold text-yellow-100 text-center px-6 mb-2'
          style={{
            height: 40,
            width : 150,
            borderColor: 'yellow',
            borderWidth: 1,
          }}
          placeholder="Username"
          placeholderTextColor="yellow"
          onChangeText={setUsername}
          value={username}
        />
        <TextInput className='font-bold text-yellow-100 text-center px-7 mb-4'
          style={{
            height: 40,
            width : 150,
            borderColor: 'yellow',
            borderWidth: 1,
          }}
          placeholder="Password"
          placeholderTextColor="yellow"
          onChangeText={setPassword}
          value={password}
        />
        <TouchableOpacity
          className="bg-yellow-300 py-3 px-10 rounded-full shadow-lg"
          onPress={handleLogin}>
          <Text className='font-bold text-green-800 text-center text-lg'>
            Login
          </Text>
        </TouchableOpacity>
      </View>
    );
  }
*/
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'; // Firebase 인증 함수 임포트
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { auth, db } from '../firebase.js'; // <--- firebase.js 파일에서 auth 객체를 가져옵니다.
import "./global.css";

export default function Index() {
  const router = useRouter();
  const [email, setEmail] = useState(''); // username 대신 email 사용 (Firebase Auth는 이메일을 주로 사용)
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [isConsumer, setIsConsumer] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false); // 회원가입/로그인 토글을 위한 상태

  // 로그인 처리 함수
  const handleLogin = async () => {
    try {
      // Firebase signInWithEmailAndPassword 함수 사용
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // 로그인 성공 시
      Alert.alert("로그인 성공!", `${userCredential.user.email}님 환영합니다!`);
      router.replace('./home'); // 로그인 후 맵 화면으로 이동
    } catch (error: any) { // 에러 타입 명시
      // 로그인 실패 시
      let errorMessage = "로그인에 실패했습니다. 다시 시도해주세요.";
      if (error.code === 'auth/invalid-email') {
        errorMessage = "유효하지 않은 이메일 형식입니다.";
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = "비활성화된 사용자 계정입니다.";
      } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = "이메일 또는 비밀번호가 잘못되었습니다.";
      } else if (error.code === 'auth/invalid-credential') { // 최신 버전 Firebase SDK에서 사용
        errorMessage = "잘못된 자격 증명입니다. 이메일 또는 비밀번호를 확인해주세요.";
      }
      Alert.alert("로그인 실패", errorMessage);
      console.error("로그인 에러:", error.code, error.message);
    }
  };

  // 회원가입 처리 함수
  const handleRegister = async () => {
    if(!nickname){
      Alert.alert("입력 오류", "닉네임을 입력해주세요.");
      return;
    }
    try {
      // 1. Firebase Authentication으로 회원가입
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Firestore에 사용자 추가 정보 저장
      // 'users' 컬렉션에 문서 ID를 사용자의 UID로 하여 문서 생성/업데이트
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        nickname: nickname,
        consumer: isConsumer,
        registeredAt: serverTimestamp(), // 가입 시간 타임스탬프
        // 필요하다면 추가 정보 (profileImageUrl, address 등)
      });
      // 회원가입 성공 시
      Alert.alert("회원가입 성공!", `${nickname}님 환영합니다! 계정이 생성 되었습니다.`);
      // 회원가입 성공 후 로그인 화면으로 전환하거나, 바로 로그인 상태로 전환할 수 있습니다.
      // 여기서는 바로 로그인 상태가 되므로, 홈으로 이동시킵니다.
      router.replace('./home');
    } catch (error: any) { // 에러 타입 명시
      // 회원가입 실패 시
      let errorMessage = "회원가입에 실패했습니다. 다시 시도해주세요.";
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "이미 사용 중인 이메일 주소입니다.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "비밀번호는 6자 이상이어야 합니다.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "유효하지 않은 이메일 형식입니다.";
      }
      Alert.alert("회원가입 실패", errorMessage);
      console.error("회원가입 에러:", error.code, error.message);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{flex: 1}}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={{flexGrow:1}}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 items-center justify-center bg-green-100">
          <Text className="text-5xl text-center font-bold text-yellow-100 mb-5">
            Re:Value에 오신것을 환영합니다!
          </Text>
          <Text className='text-4xl text-center font-semibold text-yellow-100 mb-2'>
            {isRegistering ? '회원가입을 해볼까요?' : '로그인을 해볼까요?'}
          </Text>
          <Image
            source={require('../assets/images/logo.png')}
            style={{ width: 200, height: 200 }}
          />
          {isRegistering && ( // <--- 회원가입 모드일 때 소비자인지 판매자인지
            <TouchableOpacity
              className="bg-yellow-100 py-2 px-10 rounded-full shadow-lg mb-4"
              onPress={() => setIsConsumer(!isConsumer)}>
              <Text className='font-bold text-green-800 text-center text-base'>
                {isConsumer ? '소비자' : '판매자'}
              </Text>
            </TouchableOpacity>
          )}
          {isRegistering && ( // <--- 회원가입 모드일 때만 닉네임 입력 필드 표시
            <TextInput
              className='font-bold text-yellow-100 text-center px-6 mb-2'
              style={{
                height: 40,
                width: 250,
                borderColor: 'yellow',
                borderWidth: 1,
              }}
              placeholder="닉네임 (Nickname)"
              placeholderTextColor="yellow"
              onChangeText={setNickname}
              value={nickname}
              autoCapitalize="none"
            />
          )}
          <TextInput
            className='font-bold text-yellow-100 text-center px-6 mb-2'
            style={{
              height: 40,
              width: 250, // 너비 조절, 이메일 주소가 길어질 수 있으니
              borderColor: 'yellow',
              borderWidth: 1,
            }}
            placeholder="이메일 (Email)" // 이메일 입력으로 변경
            placeholderTextColor="yellow"
            onChangeText={setEmail}
            value={email}
            keyboardType="email-address" // 이메일 입력에 적합한 키보드 타입
            autoCapitalize="none" // 자동 대문자 방지
          />
          <TextInput
            className='font-bold text-yellow-100 text-center px-7 mb-4'
            style={{
              height: 40,
              width: 250, // 너비 조절
              borderColor: 'yellow',
              borderWidth: 1,
            }}
            placeholder="비밀번호 (Password)" // 비밀번호 입력으로 변경
            placeholderTextColor="yellow"
            onChangeText={setPassword}
            value={password}
            secureTextEntry // 비밀번호 숨김
          />
          <TouchableOpacity
            className="bg-yellow-300 py-3 px-10 rounded-full shadow-lg mb-4" // 마진 추가
            onPress={isRegistering ? handleRegister : handleLogin} // 상태에 따라 함수 호출
          >
            <Text className='font-bold text-green-800 text-center text-lg'>
              {isRegistering ? '회원가입' : '로그인'}
            </Text>
          </TouchableOpacity>

          {/* 로그인/회원가입 전환 버튼 */}
          <TouchableOpacity onPress={() => setIsRegistering(!isRegistering)}>
            <Text className='font-bold text-yellow-100 text-center text-base'>
              {isRegistering ? '이미 계정이 있으신가요? 로그인' : '계정이 없으신가요? 회원가입'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}