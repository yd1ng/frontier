# Frontier CTF & HSPACE

Frontier CTF와 HSPACE를 위한 통합 웹 애플리케이션입니다.

## 🚀 빠른 시작 (Docker)

### 1. 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하세요:

```env
# JWT 시크릿 (보안을 위해 반드시 변경!)
JWT_SECRET=your-secure-random-64-character-string-here

# OpenAI API 키 (챗봇 기능 사용 시 필수)
OPENAI_API_KEY=sk-proj-your-openai-api-key-here

# Discord 봇 토큰 (Discord 연동 기능 사용 시)
DISCORD_BOT_TOKEN=your-discord-bot-token-here

# Discord 미션 채널 ID (Discord 연동 기능 사용 시)
DISCORD_MISSION_CHANNEL=your-discord-channel-id-here
```

**JWT_SECRET 생성 방법:**
```bash
# Node.js 사용
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# 또는 OpenSSL 사용
openssl rand -hex 64
```

### 2. Docker 이미지 빌드

```bash
docker build -t frontier-ctf:latest .
```

### 3. 컨테이너 실행

```bash
docker run -d \
  --name frontier-ctf-app \
  -p 5000:5000 \
  -v mongodb_data:/data/db \
  -v uploads_data:/app/uploads \
  -e MONGODB_URI=mongodb://127.0.0.1:27017/frontier-ctf \
  -e JWT_SECRET=${JWT_SECRET} \
  -e OPENAI_API_KEY=${OPENAI_API_KEY} \
  -e DISCORD_BOT_TOKEN=${DISCORD_BOT_TOKEN} \
  -e DISCORD_MISSION_CHANNEL=${DISCORD_MISSION_CHANNEL} \
  -e NODE_ENV=production \
  -e PORT=3000 \
  frontier-ctf:latest
```

**또는 `.env` 파일을 사용하여 실행:**

```bash
# .env 파일에서 환경 변수 로드하여 실행
docker run -d \
  --name frontier-ctf-app \
  -p 5000:5000 \
  -v mongodb_data:/data/db \
  -v uploads_data:/app/uploads \
  --env-file .env \
  -e MONGODB_URI=mongodb://127.0.0.1:27017/frontier-ctf \
  -e NODE_ENV=production \
  -e PORT=3000 \
  frontier-ctf:latest
```

### 4. 접속

- **프론트엔드**: http://localhost:5000
- **백엔드 API**: http://localhost:5000/api

### 5. 초기 설정

1. **첫 번째 사용자 등록** (자동으로 관리자 권한 부여)
   - http://localhost:5000/register 접속
   - 회원가입 (첫 사용자가 자동으로 관리자가 됩니다)

2. **좌석 초기화** (관리자 전용)
   - http://localhost:5000/admin 접속
   - "좌석 초기화" 버튼 클릭
   - WHITE ROOM 36석 + STAFF ROOM 12석 생성

## 📋 컨테이너 관리

### 컨테이너 중지
```bash
docker stop frontier-ctf-app
```

### 컨테이너 시작
```bash
docker start frontier-ctf-app
```

### 컨테이너 삭제
```bash
docker stop frontier-ctf-app
docker rm frontier-ctf-app
```

### 로그 확인
```bash
# 전체 로그
docker logs frontier-ctf-app

# 실시간 로그
docker logs -f frontier-ctf-app

# 최근 100줄만
docker logs --tail 100 frontier-ctf-app
```

### 데이터베이스 초기화
```bash
# 컨테이너 중지 및 삭제
docker stop frontier-ctf-app
docker rm frontier-ctf-app

# MongoDB 데이터 볼륨 삭제
docker volume rm mongodb_data

# 다시 실행 (새로운 데이터베이스로 시작)
docker run -d \
  --name frontier-ctf-app \
  -p 80:80 \
  -v mongodb_data:/data/db \
  -v uploads_data:/app/uploads \
  --env-file .env \
  -e MONGODB_URI=mongodb://127.0.0.1:27017/frontier-ctf \
  -e NODE_ENV=production \
  frontier-ctf:latest
```

## 🏗️ 아키텍처

이 애플리케이션은 단일 Docker 컨테이너에서 다음 서비스들을 실행합니다:

- **MongoDB**: 데이터베이스 (내부에서만 접근 가능)
- **Backend**: Node.js/Express API 서버 (포트 5000)
- **Frontend**: React 애플리케이션 (Nginx로 서빙, 포트 80)
- **Supervisor**: 모든 서비스를 관리하는 프로세스 매니저

## 🔧 환경 변수

| 변수명 | 설명 | 필수 | 기본값 |
|--------|------|------|--------|
| `MONGODB_URI` | MongoDB 연결 URI | ✅ | `mongodb://127.0.0.1:27017/frontier-ctf` |
| `JWT_SECRET` | JWT 토큰 시크릿 키 | ✅ | - |
| `OPENAI_API_KEY` | OpenAI API 키 | ❌ | - |
| `DISCORD_BOT_TOKEN` | Discord 봇 토큰 | ❌ | - |
| `DISCORD_MISSION_CHANNEL` | Discord 미션 채널 ID | ❌ | - |
| `NODE_ENV` | 환경 설정 | ❌ | `production` |
| `PORT` | Backend 포트 (내부) | ❌ | `3000` |

## 📦 볼륨

| 볼륨명 | 설명 |
|--------|------|
| `mongodb_data` | MongoDB 데이터 저장소 (`/data/db`) |
| `uploads_data` | 업로드된 이미지 파일 저장소 (`/app/uploads`) |

## 🎯 주요 기능

### 1. 게시판
- 공지사항 (관리자 전용)
- 자유게시판
- 익명게시판
- CTF/워게임 게시판
- 마크다운 지원
- 이미지 업로드 (최대 5개, 각 5MB)

### 2. 모집
- CTF 팀원 모집
- 프로젝트 팀원 모집
- 스터디 팀원 모집
- 팀 참가 및 승인 시스템
- 실시간 팀 채팅 (Socket.io)
- 마크다운 지원
- 이미지 업로드

### 3. 좌석 예약
- WHITE ROOM: 36석
- STAFF ROOM: 12석 (관리자 전용)
- 1~8시간 예약 가능
- 1인 1좌석 제한
- 자동 만료 시스템

### 4. AI 챗봇
- HSPACE 정보 안내
- 좌석 예약 방법 안내
- GPT-3.5-turbo 기반

### 5. Discord 연동
- Discord 포럼 채널 자동 동기화
- 실시간 미션 업데이트
- 마크다운 렌더링

### 6. 관리자 기능
- 모든 게시글/댓글 관리
- 좌석 시스템 관리
- 만료된 예약 정리

## 🔒 보안 기능

- JWT 기반 인증
- Rate Limiting (API, 로그인, 회원가입)
- XSS 방지
- NoSQL Injection 방지
- Path Traversal 방지
- 파일 업로드 검증 (MIME 타입, 크기 제한)
- CORS 설정
- Helmet 보안 헤더
- 입력 검증 및 Sanitization

## 🐛 문제 해결

### MongoDB 연결 오류

**증상**: `MongoServerError: connect ECONNREFUSED`

**해결**:
1. 컨테이너가 실행 중인지 확인: `docker ps`
2. MongoDB가 시작되었는지 로그 확인: `docker logs frontier-ctf-app | grep mongodb`
3. 컨테이너 재시작: `docker restart frontier-ctf-app`

### 포트 충돌

**증상**: `EADDRINUSE: address already in use`

**해결**:
```bash
# 포트 80을 사용하는 프로세스 확인
# Windows
netstat -ano | findstr :80

# macOS/Linux
lsof -i :80

# 다른 포트 사용 (예: 8080)
docker run -d \
  --name frontier-ctf-app \
  -p 8080:80 \
  ...
```

### 컨테이너가 시작되지 않음

**해결**:
```bash
# 로그 확인
docker logs frontier-ctf-app

# 컨테이너 상태 확인
docker ps -a

# 이전 컨테이너 삭제 후 재실행
docker rm -f frontier-ctf-app
docker run -d ...
```

### 환경 변수가 적용되지 않음

**해결**:
```bash
# 컨테이너 재시작
docker restart frontier-ctf-app

# 또는 컨테이너 재생성
docker stop frontier-ctf-app
docker rm frontier-ctf-app
docker run -d ...
```

## 📝 개발 모드

개발 모드로 실행하려면:

```bash
# 백엔드 개발 서버
cd backend
npm install
npm run dev

# 프론트엔드 개발 서버
cd frontend
npm install
npm run dev
```

## 📚 API 문서

### 인증
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인
- `GET /api/auth/me` - 현재 사용자 정보

### 게시판
- `GET /api/boards` - 게시글 목록
- `GET /api/boards/:id` - 게시글 상세
- `POST /api/boards` - 게시글 작성 (인증 필요)
- `PUT /api/boards/:id` - 게시글 수정 (인증 필요)
- `DELETE /api/boards/:id` - 게시글 삭제 (인증 필요)

### 모집
- `GET /api/recruits` - 모집글 목록
- `GET /api/recruits/:id` - 모집글 상세
- `POST /api/recruits` - 모집글 작성 (인증 필요)
- `POST /api/recruits/:id/join` - 팀 참가 (인증 필요)
- `GET /api/recruits/:id/chat` - 팀 채팅 조회 (인증 필요)
- `POST /api/recruits/:id/chat` - 팀 채팅 메시지 전송 (인증 필요)

### 좌석 예약
- `GET /api/seats` - 좌석 목록 조회
- `POST /api/seats/:seatNumber/reserve` - 좌석 예약 (인증 필요)
- `POST /api/seats/:seatNumber/release` - 좌석 반납 (인증 필요)
- `GET /api/seats/my-reservation` - 내 예약 조회 (인증 필요)

### 챗봇
- `POST /api/chatbot/chat` - 챗봇 메시지 전송 (인증 필요)

## 📄 라이선스

MIT License
