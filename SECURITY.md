# 보안 정책 (Security Policy)

## 🔒 보안 기능

Frontier CTF 플랫폼은 다음과 같은 보안 기능을 구현하고 있습니다:

### 1. 인증 및 권한 관리

- **JWT 기반 인증**: JSON Web Token을 사용한 stateless 인증
- **비밀번호 해싱**: bcrypt를 사용한 안전한 비밀번호 저장 (salt rounds: 10)
- **역할 기반 접근 제어**: user/admin 권한 구분
- **토큰 만료**: 7일 후 자동 만료

### 2. Rate Limiting

다양한 엔드포인트에 대한 요청 제한:

| 엔드포인트 | 제한 | 기간 | 설명 |
|-----------|------|------|------|
| 일반 API | 100회 | 15분 | 모든 API 요청 |
| 로그인 | 5회 | 15분 | 무차별 대입 공격 방지 |
| 회원가입 | 3회 | 1시간 | 스팸 계정 생성 방지 |
| 게시글 작성 | 3회 | 1분 | 스팸 게시글 방지 |
| 댓글 작성 | 5회 | 1분 | 스팸 댓글 방지 |

### 3. 입력 검증 및 Sanitization

- **express-validator**: 모든 입력값 검증
- **express-mongo-sanitize**: MongoDB 쿼리 인젝션 방지
- **XSS 방지**: 특수문자 필터링 및 이스케이프
- **Content-Type 검증**: JSON만 허용
- **요청 크기 제한**: 최대 10MB

### 4. 보안 헤더

Helmet.js를 통한 보안 헤더 설정:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- `Content-Security-Policy`: XSS 공격 방지

### 5. CORS 정책

- 개발 환경: localhost 허용
- 프로덕션 환경: 허용된 도메인만 접근 가능
- Credentials 지원

### 6. 데이터베이스 보안

- **Connection String 암호화**: 환경 변수로 분리
- **NoSQL Injection 방지**: Mongoose 스키마 검증
- **민감 정보 제외**: 응답 시 비밀번호 필드 제외

---

## 🚨 보안 취약점 신고

보안 취약점을 발견하신 경우:

### 신고 절차

1. **공개 이슈로 올리지 마세요!**
2. 프로젝트 관리자에게 비공개로 연락
3. 다음 정보를 포함해주세요:
   - 취약점 유형
   - 재현 방법
   - 영향 범위
   - 가능하다면 패치 제안

### 대응 프로세스

1. **24시간 이내**: 신고 접수 확인
2. **7일 이내**: 취약점 확인 및 심각도 평가
3. **30일 이내**: 패치 개발 및 배포
4. **패치 후**: 공개 및 크레딧 제공

---

## 🛡️ 보안 모범 사례

### 배포 전 체크리스트

#### 필수 사항

- [ ] `JWT_SECRET` 변경 (최소 32자 이상)
- [ ] `ALLOWED_ORIGINS` 설정 (실제 도메인)
- [ ] `NODE_ENV=production` 설정
- [ ] MongoDB Atlas 또는 보안된 데이터베이스 사용
- [ ] HTTPS 사용
- [ ] 방화벽 설정
- [ ] 정기 백업 설정

#### 권장 사항

- [ ] 로그 모니터링 시스템 구축
- [ ] 침입 탐지 시스템(IDS) 설정
- [ ] DDoS 방어 서비스 사용
- [ ] SSL/TLS 인증서 자동 갱신
- [ ] 정기 보안 감사
- [ ] 의존성 취약점 스캔 (`npm audit`)

### 환경 변수 보안

#### 개발 환경

```bash
# backend/.env
MONGODB_URI=mongodb://localhost:27017/frontier-ctf
JWT_SECRET=dev_secret_minimum_32_characters_long
PORT=5000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

#### 프로덕션 환경

```bash
# backend/.env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/frontier-ctf
JWT_SECRET=<64자 이상의 강력한 랜덤 문자열>
PORT=5000
NODE_ENV=production
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

**JWT_SECRET 생성 방법:**

```bash
# Node.js로 생성 (권장)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# OpenSSL로 생성
openssl rand -hex 64
```

### 데이터베이스 보안

#### MongoDB Atlas 사용 시

1. **Network Access 설정**
   - IP Whitelist 사용
   - VPC Peering 구성

2. **Database Access 설정**
   - 강력한 비밀번호 사용
   - 최소 권한 원칙
   - 읽기 전용 계정 분리

3. **백업 설정**
   - 자동 백업 활성화
   - Point-in-time Recovery 설정

#### Self-hosted MongoDB

1. **인증 활성화**
   ```bash
   mongod --auth
   ```

2. **방화벽 설정**
   ```bash
   # 27017 포트는 localhost만 허용
   sudo ufw allow from 127.0.0.1 to any port 27017
   ```

3. **SSL/TLS 사용**
   ```bash
   mongod --sslMode requireSSL --sslPEMKeyFile /path/to/ssl-cert-key.pem
   ```

### HTTPS 설정

#### Let's Encrypt 사용 (권장)

```bash
# Certbot 설치
sudo apt-get install certbot

# 인증서 발급
sudo certbot certonly --standalone -d yourdomain.com

# Nginx 설정
sudo certbot --nginx -d yourdomain.com
```

#### Nginx 설정 예시

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # 강력한 SSL 설정
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# HTTP to HTTPS 리다이렉트
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

### Docker 보안

#### Docker Compose 프로덕션 설정

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:7
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD}
    volumes:
      - mongodb_data:/data/db
    networks:
      - backend
    # 외부 접근 차단
    expose:
      - "27017"

  backend:
    build: ./backend
    restart: unless-stopped
    environment:
      MONGODB_URI: mongodb://admin:${MONGO_PASSWORD}@mongodb:27017/frontier-ctf?authSource=admin
      JWT_SECRET: ${JWT_SECRET}
      NODE_ENV: production
      ALLOWED_ORIGINS: ${ALLOWED_ORIGINS}
    depends_on:
      - mongodb
    networks:
      - backend
      - frontend
    expose:
      - "5000"

  frontend:
    build: ./frontend
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - backend
    networks:
      - frontend

volumes:
  mongodb_data:

networks:
  backend:
    driver: bridge
  frontend:
    driver: bridge
```

---

## 🔍 보안 감사

### 정기 점검 항목

#### 주간
- [ ] 로그 검토 (비정상적인 접근 시도)
- [ ] 실패한 로그인 시도 확인
- [ ] Rate Limit 초과 기록 확인

#### 월간
- [ ] `npm audit` 실행 및 의존성 업데이트
- [ ] 사용자 권한 검토
- [ ] 백업 무결성 확인

#### 분기
- [ ] 전체 시스템 보안 감사
- [ ] 침투 테스트
- [ ] 보안 정책 업데이트

### 의존성 취약점 검사

```bash
# 취약점 확인
npm audit

# 자동 수정 (주의: 테스트 필요)
npm audit fix

# 강제 업데이트 (breaking changes 포함)
npm audit fix --force

# 특정 패키지 업데이트
npm update <package-name>
```

### 보안 헤더 테스트

온라인 도구:
- [Security Headers](https://securityheaders.com/)
- [SSL Labs](https://www.ssllabs.com/ssltest/)
- [Mozilla Observatory](https://observatory.mozilla.org/)

---

## 📋 알려진 제약사항

### 현재 미구현 기능

1. **2FA (Two-Factor Authentication)**: 향후 추가 예정
2. **계정 잠금**: 반복 로그인 실패 시 계정 임시 잠금
3. **비밀번호 정책**: 복잡도 요구사항 강화
4. **세션 관리**: 동시 로그인 제한
5. **IP 화이트리스트**: 관리자 접근 제한

### 보안 주의사항

1. **파일 업로드**: 현재 미구현 (향후 추가 시 검증 필수)
2. **이메일 인증**: 미구현 (스팸 방지 위해 구현 권장)
3. **CAPTCHA**: 미구현 (봇 방지 위해 구현 권장)

---

## 🆘 사고 대응

### 보안 사고 발생 시

1. **즉시 조치**
   - 영향받는 시스템 격리
   - 로그 백업
   - 관리자 비밀번호 변경

2. **조사**
   - 침입 경로 파악
   - 영향 범위 확인
   - 데이터 유출 여부 확인

3. **복구**
   - 취약점 패치
   - 시스템 복원
   - 보안 설정 강화

4. **사후 조치**
   - 사용자 알림
   - 재발 방지 대책 수립
   - 문서화

---

## 📚 참고 자료

### 보안 가이드

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express.js Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [MongoDB Security Checklist](https://docs.mongodb.com/manual/administration/security-checklist/)

### 도구

- [Snyk](https://snyk.io/) - 의존성 취약점 스캔
- [OWASP ZAP](https://www.zaproxy.org/) - 웹 애플리케이션 보안 테스트
- [Burp Suite](https://portswigger.net/burp) - 침투 테스트

---

## 📞 연락처

보안 관련 문의:
- **이메일**: security@yourdomain.com
- **GPG Key**: [링크]

---

**최종 업데이트**: 2024년 11월
**버전**: 1.0.0

