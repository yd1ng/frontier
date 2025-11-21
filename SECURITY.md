# 🔒 보안 가이드 (Security Guide)

## 목차
1. [Path Traversal 방어](#path-traversal-방어)
2. [보안 검증 단계](#보안-검증-단계)
3. [테스트된 공격 벡터](#테스트된-공격-벡터)
4. [보안 로깅](#보안-로깅)
5. [보안 권장사항](#보안-권장사항)

---

## Path Traversal 방어

### 🎯 보호 대상
- `.env` - 환경 변수 및 시크릿
- `package.json` - 의존성 정보
- `docker-compose.yml` - 인프라 설정
- 소스 코드 파일들 (`.ts`, `.js`)
- 시스템 설정 파일들

### 🛡️ 8중 방어 시스템

파일 삭제 엔드포인트 (`DELETE /api/upload/:filename`)에 구현된 보안 계층:

#### 1. 파일명 길이 제한
```typescript
// DoS 공격 방지
if (!filename || filename.length > 255) {
  return 400; // Bad Request
}
```

#### 2. Null Byte 공격 차단
```typescript
// Null byte injection 방지
if (filename.includes('\0') || filename.includes('%00')) {
  console.warn(`[SECURITY] Null byte attack detected: ${filename}`);
  return 400;
}
```

#### 3. Path Traversal 패턴 차단
차단되는 패턴:
- `..` - 상위 디렉토리
- `/`, `\` - 디렉토리 구분자
- `\u2215` - 유니코드 슬래시 (∕)
- `\uff0f` - 전각 슬래시 (／)
- `%2e`, `%2f`, `%5c` - URL 인코딩

#### 4. 시스템 파일 블랙리스트
차단되는 파일명 패턴:
```typescript
/^\.env/i              // .env, .env.local
/^package\.json$/i     // package.json
/^docker-compose/i     // docker-compose.yml
/^dockerfile$/i        // Dockerfile
/^tsconfig/i           // tsconfig.json
/^\.git/i              // Git 관련
/^node_modules/i       // Dependencies
/^src\//i              // 소스 코드
/^config/i             // 설정 파일
```

#### 5. 화이트리스트 파일명 검증
**허용되는 형식만 통과:**
```regex
/^[0-9]+-[0-9]+-[a-zA-Z0-9가-힣._-]+\.(jpg|jpeg|png|gif|webp)$/i
```

예시:
- ✅ `1732176000-123456789-profile.jpg`
- ✅ `1732176000-987654321-사진.png`
- ❌ `.env`
- ❌ `../../../etc/passwd`
- ❌ `shell.php`

#### 6. DB 권한 검증
```typescript
// 업로더 본인 또는 관리자만 삭제 가능
if (fileRecord.uploader !== req.userId && req.userRole !== 'admin') {
  return 403; // Forbidden
}
```

#### 7. 경로 정규화 검증
```typescript
const uploadsDir = path.resolve(__dirname, '../../uploads');
const normalizedPath = path.resolve(path.join(uploadsDir, filename));

// uploads 디렉토리 내부인지 확인
if (!normalizedPath.startsWith(uploadsDir + path.sep)) {
  console.warn(`[SECURITY] Path escape attempt`);
  return 400;
}
```

#### 8. 정규화 전후 비교
```typescript
const expectedPath = path.join(uploadsDir, filename);
if (normalizedPath !== expectedPath) {
  console.warn(`[SECURITY] Path normalization mismatch`);
  return 400;
}
```

---

## 보안 검증 단계

### 요청 흐름
```
사용자 요청 → Rate Limiting → CORS → 인증 → 8중 검증 → 파일 삭제
              ↓              ↓      ↓      ↓            ↓
              429            403    401    400          200/404
```

### 응답 코드
- `400` - 잘못된 파일명 (공격 시도 차단)
- `401` - 인증 필요
- `403` - 권한 없음 (다른 사용자의 파일)
- `404` - 파일 없음 / URL 레벨 차단
- `429` - Rate Limit 초과 (DoS 방지)

---

## 테스트된 공격 벡터

### ✅ 차단된 공격 (91개 테스트)

#### 1. 기본 Path Traversal (5개)
- `../.env`
- `../../package.json`
- `../../../etc/passwd`

#### 2. URL 인코딩 우회 (10개)
- `%2e%2e%2f.env`
- `%252e%252e%252f.env` (이중 인코딩)
- `..%2f.env`

#### 3. Windows 경로 (10개)
- `..\\.env`
- `C:\\Windows\\System32\\config\\SAM`
- `\\\\127.0.0.1\\c$\\.env`

#### 4. 유니코드 변형 (5개)
- `..∕.env` (U+2215)
- `..＼.env` (U+FF3C)
- `．．／.env` (전각 문자)

#### 5. Null Byte Injection (3개)
- `../.env%00.jpg`
- `../../package.json%00`

#### 6. 시스템 파일 직접 접근 (15개)
- `.env`
- `package.json`
- `Dockerfile`
- `tsconfig.json`
- `/etc/passwd`
- `/proc/self/environ`

#### 7. 특수 문자 조합 (10개)
- `../.env;.jpg`
- `../.env&.jpg`
- `../.env|.jpg`
- CRLF injection

#### 8. Buffer Overflow 시도 (3개)
- 100번 반복 상위 경로
- 1000자 파일명
- 긴 확장자

#### 9. 웹셸 업로드 시도 (5개)
- `shell.php`
- `shell.jsp`
- `backdoor.py`
- `evil.js`

#### 10. 소스 코드 접근 시도 (25개)
- `../src/server.ts`
- `../src/middleware/auth.ts`
- `../src/models/User.ts`

---

## 보안 로깅

### 경고 로그
공격 시도가 감지되면 서버 로그에 기록됩니다:

```
[SECURITY] Null byte attack detected: ../.env%00.jpg
[SECURITY] Path traversal attack detected: ../../package.json
[SECURITY] System file access attempt: .env
[SECURITY] Invalid filename format: shell.php
[SECURITY] Path escape attempt: ../../../etc/passwd
[SECURITY] Path normalization mismatch: .../.env
```

### 로그 모니터링
```bash
# 실시간 보안 로그 확인
docker-compose logs -f backend | grep SECURITY

# 공격 시도 통계
docker-compose logs backend | grep SECURITY | wc -l
```

---

## 보안 권장사항

### 1. 환경 변수 관리
```bash
# ✅ 좋은 예
JWT_SECRET=$(openssl rand -base64 64)

# ❌ 나쁜 예
JWT_SECRET=secret123
```

### 2. 파일 업로드 제한
현재 구현된 제한:
- 최대 파일 크기: 5MB
- 최대 파일 개수: 5개
- 허용 파일 형식: 이미지만 (jpg, png, gif, webp)

### 3. Rate Limiting
```typescript
// 15분당 100개 요청으로 제한
app.use('/api/', apiLimiter);
```

### 4. 정기 보안 점검
```bash
# 의존성 취약점 검사
npm audit

# 고위험 취약점 자동 수정
npm audit fix

# 패키지 업데이트
npm update
```

### 5. 프로덕션 배포 체크리스트
- [ ] `.env` 파일이 Git에 커밋되지 않았는지 확인
- [ ] JWT_SECRET이 64자 이상 랜덤 문자열인지 확인
- [ ] CORS 설정이 특정 도메인만 허용하는지 확인
- [ ] HTTPS 사용 (프로덕션 환경)
- [ ] Helmet 보안 헤더 활성화 확인
- [ ] Rate Limiting 설정 확인
- [ ] 에러 메시지에 민감한 정보가 노출되지 않는지 확인

### 6. 사고 대응
공격 시도가 감지되면:
1. 로그 확인 및 보관
2. 의심스러운 IP 차단
3. 영향받은 사용자 확인
4. 필요시 JWT 시크릿 교체
5. 사용자에게 비밀번호 변경 권고

---

## 추가 보안 기능

### CORS 설정
```typescript
// 신뢰할 수 있는 Origin만 허용
origin: ['https://yourdomain.com']
```

### Helmet 보안 헤더
- Content Security Policy (CSP)
- X-Frame-Options (클릭재킹 방지)
- Strict-Transport-Security (HSTS)
- X-Content-Type-Options (MIME 스니핑 방지)

### 입력 검증
- MongoDB 쿼리 인젝션 방지 (express-mongo-sanitize)
- XSS 방지 (xss-clean)
- SQL Injection 방지 (ORM 사용)

### 인증 & 권한
- JWT 토큰 기반 인증
- 역할 기반 접근 제어 (RBAC)
- 비밀번호 해싱 (bcrypt)

---


## 참고 자료

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Path Traversal](https://owasp.org/www-community/attacks/Path_Traversal)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

---
