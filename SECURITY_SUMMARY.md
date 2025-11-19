# 보안 기능 요약

## ✅ 구현된 보안 기능

### 1. 인증 및 권한 관리

#### JWT 인증
- **구현 파일**: `backend/src/middleware/auth.ts`
- **토큰 만료**: 7일
- **알고리즘**: HS256
- **보안 조치**:
  - Bearer Token 방식
  - Secret key는 환경 변수로 분리
  - 최소 32자 이상 권장

#### 비밀번호 보안
- **해싱 알고리즘**: bcrypt
- **Salt rounds**: 10
- **프론트엔드 검증**: 
  - 최소 6자 (8자 이상 권장)
  - 강도 검사 (대소문자, 숫자, 특수문자)

#### 역할 기반 접근 제어 (RBAC)
- **역할**: user, admin
- **관리자 전용 기능**: 공지사항 작성

---

### 2. Rate Limiting

모든 rate limiting은 IP 기반으로 적용됩니다.

| 엔드포인트 | 제한 | 기간 | 파일 |
|-----------|------|------|------|
| 모든 API | 100회 | 15분 | `security.ts:apiLimiter` |
| 로그인 | 5회 | 15분 | `security.ts:authLimiter` |
| 회원가입 | 3회 | 1시간 | `security.ts:registerLimiter` |
| 게시글 작성 | 3회 | 1분 | `security.ts:createPostLimiter` |
| 댓글 작성 | 5회 | 1분 | `security.ts:commentLimiter` |

**적용 위치**:
- `backend/src/routes/auth.ts` - 로그인, 회원가입
- `backend/src/routes/boards.ts` - 게시글, 댓글 작성
- `backend/src/routes/recruits.ts` - 모집글, 댓글 작성

---

### 3. 입력 검증 및 Sanitization

#### 백엔드 (Express)

**express-validator**
- 모든 POST/PUT 요청에 적용
- 제목: 1-200자
- 내용: 필수
- 이메일: 이메일 형식 검증
- 사용자명: 3-20자

**express-mongo-sanitize**
- MongoDB 쿼리 인젝션 방지
- `$`, `.` 문자 제거

**커스텀 Sanitization** (`backend/src/middleware/security.ts`)
- 위험한 MongoDB 연산자 검증: `$where`, `$ne`, `$gt`, `$lt`, `$regex`
- 요청 크기 제한: 최대 10MB

#### 프론트엔드 (React)

**sanitize.ts 유틸리티**
- HTML 이스케이프
- URL 프로토콜 검증
- 이메일 형식 검증
- 사용자명 검증 (영문, 한글, 숫자, 특수문자 제한)
- 비밀번호 강도 검증
- XSS 위험 요소 제거 (script, iframe, on* 이벤트)

---

### 4. 보안 헤더 (Helmet.js)

**적용된 헤더**:
```javascript
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
Content-Security-Policy: default-src 'self'; ...
```

**구현 파일**: `backend/src/server.ts`

---

### 5. CORS 정책

**개발 환경**:
- 모든 origin 허용

**프로덕션 환경**:
- 환경 변수 `ALLOWED_ORIGINS`에 지정된 도메인만 허용
- Credentials 지원
- Preflight 요청 처리

**구현 파일**: `backend/src/server.ts`

---

### 6. 환경 변수 검증

**validateEnv.ts** (`backend/src/config/validateEnv.ts`)

**검증 항목**:
- ✅ 필수 환경 변수 존재 확인
- ✅ JWT_SECRET 길이 검증 (최소 32자)
- ✅ 기본값 감지 (예: "your_jwt_secret_key")
- ✅ NODE_ENV 검증
- ✅ 프로덕션 환경 추가 검증

**서버 시작 시 자동 실행**: 검증 실패 시 서버 시작 중단

---

### 7. 에러 처리

#### 프로덕션 환경
- 상세한 에러 스택 노출 방지
- 일반적인 에러 메시지만 반환

#### 개발 환경
- 상세한 에러 정보 제공
- 스택 트레이스 포함

**구현 파일**: `backend/src/server.ts` (전역 에러 핸들러)

---

### 8. 기타 보안 기능

#### Graceful Shutdown
- SIGTERM, SIGINT 신호 처리
- MongoDB 연결 정리
- 안전한 프로세스 종료

#### 404 핸들러
- 존재하지 않는 라우트 처리
- 정보 노출 방지

#### Trust Proxy
- Nginx, Load Balancer 뒤에서 실행 시 클라이언트 IP 올바르게 감지

---

## 🚨 아직 구현되지 않은 보안 기능

### 권장 사항

1. **2FA (Two-Factor Authentication)**
   - 관리자 계정에 2단계 인증 추가
   - TOTP (Time-based One-Time Password) 권장

2. **이메일 인증**
   - 회원가입 시 이메일 인증 필수
   - 비밀번호 재설정 기능

3. **CAPTCHA**
   - 로그인, 회원가입에 reCAPTCHA v3 추가
   - 봇 공격 방지

4. **세션 관리**
   - 동시 로그인 제한
   - 활성 세션 목록 및 강제 로그아웃

5. **파일 업로드 보안**
   - 파일 타입 검증
   - 파일 크기 제한
   - 바이러스 스캔
   - 안전한 저장소 (S3, CDN)

6. **로그 및 모니터링**
   - Winston, Morgan 등 로깅 라이브러리
   - 보안 이벤트 모니터링
   - 비정상 행위 탐지

7. **API 버전 관리**
   - API 버전 관리 (v1, v2)
   - 하위 호환성 유지

8. **IP 화이트리스트**
   - 관리자 접근 IP 제한
   - 특정 기능 지역 제한

---

## 📋 배포 체크리스트

### 필수

- [ ] **JWT_SECRET 변경**
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```

- [ ] **환경 변수 설정**
  ```env
  NODE_ENV=production
  MONGODB_URI=mongodb+srv://...
  ALLOWED_ORIGINS=https://yourdomain.com
  ```

- [ ] **HTTPS 설정**
  - Let's Encrypt 인증서
  - 자동 갱신 설정

- [ ] **MongoDB 보안**
  - MongoDB Atlas 사용 권장
  - Network Access 제한
  - 강력한 비밀번호

- [ ] **의존성 업데이트**
  ```bash
  npm audit
  npm update
  ```

### 권장

- [ ] 방화벽 설정
- [ ] DDoS 방어 서비스 (Cloudflare)
- [ ] 백업 자동화
- [ ] 로그 모니터링
- [ ] 보안 감사

---

## 🔍 보안 테스트

### 자동화 도구

```bash
# 의존성 취약점 검사
npm audit

# 보안 헤더 테스트
curl -I https://yourdomain.com

# SSL/TLS 테스트
openssl s_client -connect yourdomain.com:443 -tls1_2
```

### 온라인 도구

- **보안 헤더**: https://securityheaders.com/
- **SSL 테스트**: https://www.ssllabs.com/ssltest/
- **전체 보안**: https://observatory.mozilla.org/

---

## 📞 보안 문의

보안 취약점 발견 시:
- **공개 이슈로 올리지 마세요**
- 프로젝트 관리자에게 비공개로 연락
- [SECURITY.md](./SECURITY.md) 참고

---

## 📚 관련 문서

- [SECURITY.md](./SECURITY.md) - 상세 보안 정책
- [README.md](./README.md) - 프로젝트 소개
- [INSTALLATION.md](./INSTALLATION.md) - 설치 가이드

---

**최종 업데이트**: 2024년 11월

