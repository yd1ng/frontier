# 🚀 프로덕션 배포 가이드

## ⚠️ 보안 주의사항

### 1. JWT_SECRET 변경
현재 `docker-compose.yml`에 하드코딩된 JWT_SECRET을 반드시 변경하세요!

```bash
# 새로운 랜덤 시크릿 생성 (Linux/Mac)
openssl rand -hex 64

# Windows PowerShell
$bytes = New-Object byte[] 64
[System.Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($bytes)
[System.BitConverter]::ToString($bytes).Replace("-", "").ToLower()
```

### 2. 환경변수 파일 사용
프로덕션에서는 `.env` 파일을 사용하세요:

#### 프로덕션용 docker-compose.override.yml 생성:
```yaml
version: '3.8'

services:
  backend:
    environment:
      - JWT_SECRET=${JWT_SECRET}
      - MONGODB_URI=${MONGODB_URI}
      - ALLOWED_ORIGINS=${ALLOWED_ORIGINS}
  
  mongodb:
    environment:
      - MONGO_INITDB_ROOT_USERNAME=${MONGO_ROOT_USER}
      - MONGO_INITDB_ROOT_PASSWORD=${MONGO_ROOT_PASSWORD}
```

#### .env 파일 생성 (깃헙에 업로드 금지!):
```bash
JWT_SECRET=your-new-super-secret-key-here
MONGODB_URI=mongodb://admin:password@mongodb:27017/frontier-ctf?authSource=admin
ALLOWED_ORIGINS=https://yourdomain.com
MONGO_ROOT_USER=admin
MONGO_ROOT_PASSWORD=your-secure-password
```

### 3. HTTPS 설정
프로덕션에서는 반드시 HTTPS를 사용하세요:
- Let's Encrypt (무료 SSL)
- Cloudflare
- Nginx Proxy Manager

### 4. MongoDB 인증 활성화
현재는 MongoDB가 인증 없이 실행 중입니다. 프로덕션에서는:

```yaml
mongodb:
  image: mongo:7
  environment:
    - MONGO_INITDB_ROOT_USERNAME=admin
    - MONGO_INITDB_ROOT_PASSWORD=strongpassword123
  volumes:
    - mongodb_data:/data/db
```

### 5. Rate Limiting 조정
필요에 따라 `backend/src/middleware/security.ts`의 제한 값을 조정하세요.

### 6. CORS 설정
`docker-compose.yml`의 `ALLOWED_ORIGINS`를 실제 도메인으로 변경:
```yaml
- ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### 7. 방화벽 설정
- MongoDB 포트 (27017)는 외부 접근 차단
- 백엔드 (5000), 프론트엔드 (80/443)만 허용

### 8. 정기 백업
```bash
# MongoDB 백업
docker exec frontier-ctf-mongodb mongodump --out /backup

# 백업 복원
docker exec frontier-ctf-mongodb mongorestore /backup
```

### 9. 로그 모니터링
```bash
# 로그 확인
docker-compose logs -f backend

# 로그 저장
docker-compose logs backend > backend.log
```

### 10. 컨테이너 업데이트
```bash
# 이미지 업데이트
docker-compose pull

# 재빌드 및 재시작
docker-compose up -d --build
```

## 📋 체크리스트

프로덕션 배포 전 확인사항:

- [ ] JWT_SECRET 변경
- [ ] MongoDB 인증 설정
- [ ] HTTPS 적용
- [ ] CORS 도메인 설정
- [ ] 환경변수 파일 (.env) 생성
- [ ] .env 파일이 .gitignore에 포함되어 있는지 확인
- [ ] 방화벽 설정
- [ ] 백업 시스템 구축
- [ ] 로그 모니터링 설정
- [ ] Rate Limiting 값 검토

## 🔐 깃헙에 업로드하면 안 되는 것들

- ❌ `.env` 파일
- ❌ `node_modules/`
- ❌ MongoDB 데이터 (Docker volume)
- ❌ 빌드 결과물 (`dist/`, `build/`)
- ❌ 로그 파일 (`*.log`)
- ❌ IDE 설정 (`.vscode/`, `.idea/`)

## ✅ 깃헙에 업로드해도 되는 것들

- ✅ 소스 코드
- ✅ `package.json`, `package-lock.json`
- ✅ `Dockerfile`, `docker-compose.yml`
- ✅ 설정 파일 (`tsconfig.json`, `vite.config.ts` 등)
- ✅ README, 문서
- ✅ `.env.example` (예시 파일, 실제 값 없음)

## 🆘 문제 해결

### JWT_SECRET이 깃헙에 노출된 경우:
1. 즉시 새로운 시크릿 생성
2. `docker-compose.yml` 또는 `.env` 업데이트
3. 모든 사용자 강제 로그아웃
4. GitHub에서 커밋 히스토리 정리 (또는 저장소 재생성)

```bash
# Git 히스토리에서 민감한 정보 제거
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch docker-compose.yml" \
  --prune-empty --tag-name-filter cat -- --all
```

