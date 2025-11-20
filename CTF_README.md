# 🚩 Git-Based CTF 프로젝트 - 브랜치 전략

## 📋 프로젝트 구조

### `main` 브랜치 (현재)
✅ **안전한 프로덕션 코드** - 취약점 없음
- 이 브랜치는 정상적으로 작동하는 웹 서비스
- 모든 보안 취약점 제거 완료
- CTF 참가자들이 비교/학습할 수 있는 기준 코드

### CTF용 취약점 브랜치 (생성 필요)
각 브랜치별로 특정 취약점을 추가:

```bash
# 예시 브랜치 구조
main (안전)
├── vulnerable/sql-injection
├── vulnerable/xss
├── vulnerable/csrf
├── vulnerable/jwt-weak
├── vulnerable/file-upload
├── vulnerable/nosql-injection
└── vulnerable/auth-bypass
```

---

## ✅ Main 브랜치 보안 상태 (최종 점검)

### 🔒 수정 완료된 취약점
1. ✅ **JWT Secret 기본값 제거**
   - `process.env.JWT_SECRET || 'default_secret'` → 필수값 강제
   - 파일: `auth.ts`, `middleware/auth.ts`

2. ✅ **MongoDB 포트 외부 노출 제거**
   - `ports: - '27017:27017'` 주석 처리
   - 내부 네트워크만 접근 가능

3. ✅ **파일명 Sanitization**
   - Path Traversal 방지
   - 특수문자 필터링

4. ✅ **에러 메시지 상세 정보 제거**
   - `error.message` 노출 제거
   - 프로덕션 모드 에러 핸들링

### 🟢 안전한 보안 기능 (유지)
- ✅ Rate Limiting (로그인, 회원가입, 게시글)
- ✅ NoSQL Injection 방어
- ✅ XSS 방어 (express-validator, xss-clean)
- ✅ CORS 설정
- ✅ Helmet 보안 헤더
- ✅ 입력 검증
- ✅ 파일 업로드 제한
- ✅ JWT 인증
- ✅ 권한 분리 (admin/user)

### 🔐 환경변수 관리
- ✅ `.env` 파일 `.gitignore` 처리
- ✅ `.env.example` 템플릿 제공
- ✅ Git 히스토리에 민감 정보 없음 (확인 완료)

---

## 🚩 CTF용 취약점 브랜치 생성 가이드

### 1. SQL Injection 브랜치 (예시)
```bash
git checkout -b vulnerable/sql-injection
# MongoDB를 MySQL로 변경하고
# 쿼리에 직접 문자열 삽입
```

### 2. JWT Weak Secret 브랜치
```bash
git checkout -b vulnerable/jwt-weak
# JWT_SECRET을 'secret123'으로 하드코딩
# 또는 기본값 폴백 추가
```

**수정 예시**:
```typescript
// vulnerable/jwt-weak 브랜치에서만
const secret = process.env.JWT_SECRET || 'secret123';  // 취약!
```

### 3. NoSQL Injection 브랜치
```bash
git checkout -b vulnerable/nosql-injection
# sanitizeInput 미들웨어 제거
# MongoDB 쿼리에 직접 req.body 사용
```

**수정 예시**:
```typescript
// vulnerable/nosql-injection 브랜치에서만
// 입력 검증 없이 직접 쿼리
const user = await User.findOne({ username: req.body.username });
// → req.body.username = { $ne: null } 공격 가능
```

### 4. File Upload Vulnerability 브랜치
```bash
git checkout -b vulnerable/file-upload
# 파일 타입 검증 제거
# 파일 크기 제한 제거
# Path Traversal 방어 제거
```

**수정 예시**:
```typescript
// vulnerable/file-upload 브랜치에서만
const fileFilter = (req, file, cb) => {
  cb(null, true);  // 모든 파일 허용! (취약)
};
```

### 5. Authentication Bypass 브랜치
```bash
git checkout -b vulnerable/auth-bypass
# JWT 검증 약화
# 관리자 권한 체크 우회 가능하게
```

**수정 예시**:
```typescript
// vulnerable/auth-bypass 브랜치에서만
export const isAdmin = (req, res, next) => {
  // 체크 없이 통과
  next();
};
```

### 6. XSS 브랜치
```bash
git checkout -b vulnerable/xss
# XSS 방어 제거
# 입력 sanitization 제거
```

### 7. CSRF 브랜치
```bash
git checkout -b vulnerable/csrf
# CSRF 토큰 검증 제거
# SameSite 쿠키 설정 제거
```

---

## 📝 CTF 문제 작성 가이드

### 각 브랜치별 FLAG 삽입 위치

1. **환경변수**
```env
# 각 브랜치 .env 파일에
FLAG_1=FLAG{jwt_secret_is_weak}
FLAG_2=FLAG{nosql_injection_master}
```

2. **데이터베이스**
```javascript
// 관리자 계정에 숨김
{
  username: "admin",
  password: "...",
  secret_note: "FLAG{you_found_admin_account}"
}
```

3. **파일 시스템**
```bash
# /uploads/flag.txt
FLAG{arbitrary_file_read}
```

4. **코드 주석**
```typescript
// DEBUG: FLAG{source_code_exposed}
const debugKey = "FLAG{debug_mode_enabled}";
```

---

## 🎯 CTF 참가자 가이드 (README에 추가)

### 목표
각 브랜치의 취약점을 찾아 FLAG를 획득하세요!

### 브랜치 목록
```bash
git branch -a
# vulnerable/sql-injection      (100 points)
# vulnerable/jwt-weak            (150 points)
# vulnerable/nosql-injection     (200 points)
# vulnerable/file-upload         (250 points)
# vulnerable/auth-bypass         (300 points)
```

### 시작하기
```bash
# 1. 저장소 클론
git clone <repository-url>

# 2. 취약점 브랜치 선택
git checkout vulnerable/jwt-weak

# 3. Docker로 실행
docker-compose up -d

# 4. 취약점 찾기 및 익스플로잇
# ...

# 5. FLAG 획득!
```

---

## ⚠️ 중요 사항

### Main 브랜치 보호
- **절대 main 브랜치에 취약점 추가 금지!**
- Main은 항상 안전한 상태 유지
- 모든 취약점은 별도 브랜치에서만

### 브랜치 명명 규칙
```
vulnerable/<취약점-이름>
```

### 각 브랜치 필수 파일
1. `VULNERABILITY.md` - 힌트 및 학습 자료
2. `FLAG.txt` - 인코딩된 FLAG
3. `.env` - 브랜치별 설정

---

## 📊 현재 상태

### Main 브랜치
- ✅ 모든 Critical/High 취약점 제거
- ✅ 보안 검토 완료
- ✅ 프로덕션 배포 가능 상태

### 다음 단계
1. 각 취약점별 브랜치 생성
2. 취약점 추가 및 FLAG 삽입
3. 각 브랜치별 `VULNERABILITY.md` 작성
4. CTF 플랫폼 설정
5. 참가자 가이드 작성

---

## 🔗 참고 자료

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CTF 101 Guide](https://ctf101.org/)
- [Web Security Academy](https://portswigger.net/web-security)

