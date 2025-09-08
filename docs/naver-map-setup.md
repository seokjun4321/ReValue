# 🗺️ 네이버 지도 API 설정 가이드

## 1. 네이버 클라우드 플랫폼 설정

### 1.1 계정 생성 및 로그인
1. [네이버 클라우드 플랫폼](https://www.ncloud.com/) 접속
2. 회원가입 또는 로그인
3. 본인인증 및 결제수단 등록 (무료 사용량 내에서는 과금되지 않음)

### 1.2 Maps API 신청
1. 콘솔 → **AI·Application Service** → **Maps** 선택
2. **Application 등록** 클릭
3. 다음 정보 입력:
   ```
   서비스명: ReValue
   서비스 URL: http://localhost:8081, http://localhost:8082
   Bundle ID: host.exp.exponent (Expo Go 사용 시)
            또는 com.yourcompany.revalue (실제 빌드 시)
   ```

⚠️ **중요**: Expo Go를 사용할 때는 Bundle ID를 `host.exp.exponent`로 설정해야 합니다!

### 1.3 Client ID 발급
1. Application 등록 완료 후 **Client ID** 확인
2. **Web Dynamic Map API** 사용 설정 확인

## 2. 프로젝트 설정

### 2.1 환경 변수 설정
프로젝트 루트에 `.env` 파일 생성:
```env
# 네이버 지도 API 설정
NAVER_MAP_CLIENT_ID=your_client_id_here
```

### 2.2 Client ID 적용
`components/NaverMap.tsx` 파일에서 다음 부분 수정:
```javascript
// 37번째 줄 근처
<script type="text/javascript" src="https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=YOUR_CLIENT_ID"></script>
```

실제 Client ID로 교체:
```javascript
<script type="text/javascript" src="https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=your_actual_client_id"></script>
```

## 3. 기능 설명

### 3.1 현재 구현된 기능
- ✅ 기본 지도 표시
- ✅ 커스텀 마커 (카테고리별 이모지)
- ✅ 현재 위치 표시
- ✅ 마커 클릭 이벤트
- ✅ 할인율 배지 표시
- ✅ Green 테마 적용

### 3.2 마커 스타일
- **일반 매장**: 흰색 배경 + Green 테두리
- **신규 매장**: Green 배경 + 흰색 아이콘
- **50% 이상 할인**: Green 할인율 배지 표시
- **카테고리별 이모지**: 음식(🍽️), 의류(👕), 생활용품(🏠) 등

### 3.3 상호작용
- **마커 클릭**: 상품 미리보기 모달 표시
- **현재 위치**: 파란색 원으로 표시
- **자동 센터링**: 현재 위치 기준으로 지도 이동

## 4. 개발자 도구

### 4.1 디버깅
WebView 내 JavaScript 콘솔 확인:
```javascript
// Chrome DevTools에서 확인 가능
console.log('지도 초기화 완료');
console.log('마커 클릭:', markerId);
```

### 4.2 성능 최적화
- 마커 수가 많을 때 클러스터링 구현 권장
- 지도 영역 밖 마커는 숨김 처리
- 실시간 위치 업데이트 주기 조절

## 5. 문제 해결

### 5.1 지도가 표시되지 않는 경우
1. Client ID 확인
2. 네트워크 연결 상태 확인
3. 네이버 클라우드 플랫폼에서 API 사용량 확인

### 5.2 마커가 표시되지 않는 경우
1. 좌표 데이터 형식 확인 (위도, 경도)
2. 마커 데이터 구조 확인
3. JavaScript 콘솔 오류 메시지 확인

### 5.3 현재 위치가 표시되지 않는 경우
1. 위치 권한 허용 여부 확인
2. GPS 활성화 상태 확인
3. 실내에서는 GPS 정확도가 낮을 수 있음

## 6. 추가 개발 사항

### 6.1 향후 구현 예정
- [ ] 경로 탐색 기능
- [ ] 교통 정보 표시
- [ ] 마커 클러스터링
- [ ] 오프라인 지도 캐싱
- [ ] 거리 측정 도구

### 6.2 API 한도
- **무료 사용량**: 월 100,000회 호출
- **초과 시**: 호출당 0.5원
- **모니터링**: 네이버 클라우드 플랫폼 콘솔에서 확인

## 7. 참고 자료

- [네이버 지도 API 공식 문서](https://navermaps.github.io/maps.js.ncp/)
- [네이버 클라우드 플랫폼 가이드](https://guide.ncloud-docs.com/docs/naveropenapiv3-maps-overview)
- [React Native WebView 문서](https://github.com/react-native-webview/react-native-webview)
