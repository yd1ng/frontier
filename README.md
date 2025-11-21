# Frontier CTF & HSPACE 설치 및 실행 가이드

## 목차
1. [개발 환경 설정](#개발-환경-설정)
2. [Docker로 실행](#docker로-실행-권장)
3. [수동 설치 및 실행](#수동-설치-및-실행)
4. [환경 변수 설정](#환경-변수-설정)
5. [초기 설정](#초기-설정)
6. [문제 해결](#문제-해결)

---

## 개발 환경 설정

### 필수 요구사항

- **Node.js**: 18.0.0 이상
- **MongoDB**: 7.0 이상 (또는 Docker)
- **npm**: 9.0.0 이상
- **Docker & Docker Compose**: (선택사항, Docker 실행 시)
- **OpenAI API Key**: (챗봇 기능 사용 시)

---

## Docker로 실행 (권장)

Docker를 사용하면 별도의 설정 없이 한 번에 실행할 수 있습니다.

### 1. 저장소 클론

```bash
git clone <repository-url>
cd frontier-ctf
```

### 2. 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하세요:

```bash
# .env.example을 복사
cp .env.example .env
```

`.env` 파일 수정:

```env
# JWT 시크릿 (보안을 위해 반드시 변경!)
JWT_SECRET=your-secure-random-64-character-string-here

# OpenAI API 키 (챗봇 기능 사용 시 필수)
OPENAI_API_KEY=sk-proj-your-openai-api-key-here
```

**OpenAI API 키 발급받기:**
1. https://platform.openai.com/api-keys 접속
2. "Create new secret key" 클릭
3. 키 복사하여 `.env` 파일에 입력

### 3. Docker Compose 실행

```bash
docker-compose up -d --build
```

### 4. 접속

- **프론트엔드**: http://localhost
- **백엔드 API**: http://localhost:5000/api
- **MongoDB**: localhost:27017

### 5. 초기 설정

1. **첫 번째 사용자 등록** (자동으로 관리자 권한 부여)
   - http://localhost/register 접속
   - 회원가입 (첫 사용자가 자동으로 관리자가 됩니다)

2. **좌석 초기화** (관리자 전용)
   - http://localhost/admin 접속
   - "좌석 초기화" 버튼 클릭
   - WHITE ROOM 36석 + STAFF ROOM 12석 생성

### 6. 중지 및 삭제

```bash
# 중지
docker-compose stop

# 중지 및 컨테이너 삭제
docker-compose down

# 중지, 컨테이너 삭제, 볼륨 삭제 (데이터베이스 초기화)
docker-compose down -v
```

---

## 수동 설치 및 실행

### 1. MongoDB 설치 및 실행

#### Windows
1. [MongoDB 다운로드](https://www.mongodb.com/try/download/community)
2. 설치 후 서비스로 자동 실행됩니다

#### macOS (Homebrew)
```bash
brew tap mongodb/brew
brew install mongodb-community@7.0
brew services start mongodb-community@7.0
```

#### Linux (Ubuntu/Debian)
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
```

### 2. 프로젝트 클론

```bash
git clone <repository-url>
cd frontier-ctf
```

### 3. 루트 디렉토리 의존성 설치

```bash
npm install
```

### 4. 백엔드 설정

```bash
cd backend

# 의존성 설치
npm install

# 환경 변수 파일 생성
echo "MONGODB_URI=mongodb://localhost:27017/frontier-ctf
JWT_SECRET=your-secure-random-string-here
PORT=5000
NODE_ENV=development
OPENAI_API_KEY=sk-proj-your-openai-api-key-here" > .env
```

### 5. 프론트엔드 설정

```bash
cd ../frontend

# 의존성 설치
npm install

# 환경 변수 파일 생성
echo "VITE_API_URL=http://localhost:5000/api" > .env
```

### 6. 개발 서버 실행

#### 방법 1: 루트 디렉토리에서 동시 실행 (권장)

```bash
cd ..
npm run dev
```

이 명령어는 백엔드와 프론트엔드를 동시에 실행합니다.

#### 방법 2: 각각 실행

**터미널 1 - 백엔드:**
```bash
cd backend
npm run dev
```

**터미널 2 - 프론트엔드:**
```bash
cd frontend
npm run dev
```

### 7. 접속

- **프론트엔드**: http://localhost:5173
- **백엔드 API**: http://localhost:5000/api

---

## 환경 변수 설정

### Backend (`.env`)

```env
# MongoDB 연결 URI
MONGODB_URI=mongodb://localhost:27017/frontier-ctf

# JWT 시크릿 키 (보안을 위해 반드시 변경하세요!)
JWT_SECRET=your-secure-random-64-character-string-here

# 서버 포트
PORT=5000

# 환경 (development/production)
NODE_ENV=development

# OpenAI API 키 (챗봇 기능 사용 시 필수)
OPENAI_API_KEY=sk-proj-your-actual-openai-api-key-here

# CORS 허용 도메인 (프로덕션 환경)
ALLOWED_ORIGINS=http://localhost,http://localhost:3000,http://localhost:5173
```

### Frontend (`frontend/.env`)

```env
# API 서버 주소
VITE_API_URL=http://localhost:5000/api
```

### 랜덤 시크릿 생성

```bash
# JWT_SECRET 생성 (Node.js)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# 또는 OpenSSL
openssl rand -hex 64
```

**⚠️ 중요**: 
- `.env` 파일은 Git에 커밋하지 마세요! (이미 `.gitignore`에 포함됨)
- 프로덕션 환경에서는 반드시 시크릿을 변경하세요
- OpenAI API 키는 절대 공개하지 마세요

---

## 초기 설정

### 1. 첫 번째 사용자 등록 (관리자)

- http://localhost/register 접속
- 회원가입
- **첫 번째 사용자가 자동으로 관리자 권한을 받습니다**

### 2. 좌석 초기화 (관리자 전용)

관리자로 로그인 후:

1. 상단 우측 **"👑 관리자"** 버튼 클릭
2. 관리자 패널에서 **"좌석 초기화"** 클릭
3. WHITE ROOM 36석 + STAFF ROOM 12석 자동 생성

### 3. 공지사항 작성 (관리자 전용)

1. 관리자 패널에서 **"공지사항 작성하기"** 클릭
2. 카테고리에서 **"공지"** 선택
3. 내용 작성 후 게시

---

## 기능 안내

### 🎯 주요 기능

#### 1. **게시판**
- **공지사항**: 관리자만 작성 가능
- **자유게시판**: 모든 회원이 작성 가능
- **익명게시판**: 익명으로 작성 가능
- **CTF/워게임**: CTF 및 워게임 공유

#### 2. **모집**
- **CTF 팀원 모집**
- **프로젝트 팀원 모집**
- **스터디 팀원 모집**
- 현재 모집 인원 실시간 관리

#### 3. **HSPACE 좌석 예약**
- **WHITE ROOM**: 36석
- **STAFF ROOM**: 12석
- 1~8시간 예약 가능
- 1인 1좌석 제한
- 자동 만료 시스템 (5분마다)

#### 4. **AI 챗봇**
- HSPACE 정보 안내
- 좌석 예약 방법 안내
- 위치, 시설, 활동 정보 제공
- GPT-3.5-turbo 기반

#### 5. **관리자 기능**
- 모든 게시글/댓글 관리
- 공지사항 작성
- 좌석 시스템 관리
- 만료된 예약 정리

---

## 프로덕션 빌드

### Docker 프로덕션 배포

```bash
# 이미지 빌드 및 실행
docker-compose up -d --build

# 로그 확인
docker-compose logs -f

# 특정 서비스 로그만 확인
docker-compose logs -f backend
docker-compose logs -f frontend
```

### 수동 빌드

```bash
# 프론트엔드 빌드
cd frontend
npm run build

# 백엔드 빌드
cd ../backend
npm run build

# 프로덕션 실행
npm start
```

---

## 문제 해결

### MongoDB 연결 오류

**증상**: `MongoServerError: connect ECONNREFUSED`

**해결**:
1. MongoDB가 실행 중인지 확인
   ```bash
   # Windows
   net start MongoDB
   
   # macOS
   brew services list
   
   # Linux
   sudo systemctl status mongod
   ```

2. `.env` 파일의 `MONGODB_URI` 확인

### 포트 충돌

**증상**: `EADDRINUSE: address already in use`

**해결**:
1. 다른 프로세스가 포트를 사용 중인지 확인
   ```bash
   # Windows
   netstat -ano | findstr :5000
   netstat -ano | findstr :80
   
   # macOS/Linux
   lsof -i :5000
   lsof -i :80
   ```

2. 포트를 변경하거나 해당 프로세스 종료

### CORS 에러

**증상**: `Access to XMLHttpRequest has been blocked by CORS policy`

**해결**:
1. 백엔드가 실행 중인지 확인
2. 프론트엔드 `.env` 파일의 `VITE_API_URL` 확인
3. 백엔드 `.env` 파일의 `ALLOWED_ORIGINS` 확인

### OpenAI API 에러

**증상**: `Invalid OpenAI API key` 또는 챗봇 응답 없음

**해결**:
1. `.env` 파일에 `OPENAI_API_KEY`가 올바르게 설정되었는지 확인
2. API 키가 유효한지 확인 (https://platform.openai.com/api-keys)
3. OpenAI 계정에 크레딧이 있는지 확인
4. 컨테이너 재시작: `docker-compose restart backend`

### 관리자 권한이 없음

**해결**:
1. 완전히 새로운 데이터베이스에서 첫 번째 사용자로 회원가입
2. 또는 MongoDB에서 수동으로 권한 변경:
   ```bash
   mongosh
   use frontier-ctf
   db.users.updateOne(
     { email: "your-email@example.com" },
     { $set: { role: "admin" } }
   )
   ```

### 브라우저 캐시 문제

**증상**: 업데이트가 반영되지 않음

**해결**:
```bash
# 강제 새로고침
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)

# 또는 캐시 삭제 후 재접속
Ctrl + Shift + Delete
```

### Docker 빌드 오류

**해결**:
```bash
# 이전 컨테이너 및 볼륨 정리
docker-compose down -v

# Docker 캐시 없이 재빌드
docker-compose build --no-cache

# 재실행
docker-compose up -d
```

---

## API 엔드포인트

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
- `POST /api/boards/:id/like` - 좋아요 (인증 필요)
- `POST /api/boards/:id/comments` - 댓글 작성 (인증 필요)
- `DELETE /api/boards/:boardId/comments/:commentId` - 댓글 삭제 (인증 필요)

### 모집
- `GET /api/recruits` - 모집글 목록
- `GET /api/recruits/:id` - 모집글 상세
- `POST /api/recruits` - 모집글 작성 (인증 필요)
- `PUT /api/recruits/:id` - 모집글 수정 (인증 필요)
- `DELETE /api/recruits/:id` - 모집글 삭제 (인증 필요)
- `POST /api/recruits/:id/like` - 좋아요 (인증 필요)
- `POST /api/recruits/:id/comments` - 댓글 작성 (인증 필요)
- `DELETE /api/recruits/:recruitId/comments/:commentId` - 댓글 삭제 (인증 필요)

### 좌석 예약
- `GET /api/seats` - 좌석 목록 조회
- `POST /api/seats/:seatNumber/reserve` - 좌석 예약 (인증 필요)
- `POST /api/seats/:seatNumber/release` - 좌석 반납 (인증 필요)
- `GET /api/seats/my-reservation` - 내 예약 조회 (인증 필요)
- `POST /api/seats/initialize` - 좌석 초기화 (관리자 전용)
- `POST /api/seats/cleanup-expired` - 만료된 예약 정리

### 챗봇
- `POST /api/chatbot/chat` - 챗봇 메시지 전송 (인증 필요)

---

## 디렉토리 구조

```
frontier-ctf/
├── backend/                 # Express 백엔드
│   ├── src/
│   │   ├── models/         # MongoDB 모델
│   │   │   ├── User.ts
│   │   │   ├── Board.ts
│   │   │   ├── Recruit.ts
│   │   │   └── Seat.ts
│   │   ├── routes/         # API 라우트
│   │   │   ├── auth.ts
│   │   │   ├── boards.ts
│   │   │   ├── recruits.ts
│   │   │   ├── seats.ts
│   │   │   └── chatbot.ts
│   │   ├── middleware/     # 미들웨어
│   │   │   ├── auth.ts
│   │   │   └── security.ts
│   │   ├── config/
│   │   ├── utils/
│   │   └── server.ts       # 서버 진입점
│   ├── package.json
│   └── Dockerfile
├── frontend/               # React 프론트엔드
│   ├── src/
│   │   ├── components/    # 재사용 가능한 컴포넌트
│   │   ├── pages/         # 페이지 컴포넌트
│   │   │   ├── Home.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── BoardList.tsx
│   │   │   ├── RecruitList.tsx
│   │   │   ├── Seats.tsx
│   │   │   ├── Chatbot.tsx
│   │   │   └── AdminPanel.tsx
│   │   ├── services/      # API 서비스
│   │   ├── store/         # 상태 관리 (Zustand)
│   │   └── App.tsx
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
├── .env                    # 환경 변수 (Git에서 무시됨)
├── .env.example           # 환경 변수 예시
├── .gitignore
├── README.md
├── INSTALLATION.md
└── PRODUCTION_GUIDE.md
```

---

## 보안 고려사항

> 📖 **상세한 보안 가이드 (Path Traversal 방어, 보안 검증 등)는 [SECURITY.md](./SECURITY.md)를 참고하세요.**

### 환경 변수 보호
- ✅ `.env` 파일은 `.gitignore`에 포함됨
- ✅ `.env.example`만 Git에 커밋됨
- ⚠️ 절대 `.env` 파일을 Git에 커밋하지 마세요!

### API 키 관리
- OpenAI API 키는 환경변수로만 관리
- 프로덕션에서는 시크릿 관리 서비스 사용 권장
  - AWS Secrets Manager
  - Google Cloud Secret Manager
  - HashiCorp Vault

### JWT 시크릿
- 최소 64자 이상의 랜덤 문자열 사용
- 프로덕션과 개발 환경에서 다른 시크릿 사용
- 정기적으로 시크릿 교체

---

## 지원 및 문의

문제가 발생하면 이슈를 등록해주세요.

### 유용한 링크
- **HSPACE 공식**: https://hspace.io/
- **HSPACE 블로그**: https://blog.hspace.io/
- **OpenAI API**: https://platform.openai.com/

---

## 라이선스

MIT License
