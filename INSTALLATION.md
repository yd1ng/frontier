# Frontier CTF 설치 및 실행 가이드

## 목차
1. [개발 환경 설정](#개발-환경-설정)
2. [Docker로 실행](#docker로-실행)
3. [수동 설치 및 실행](#수동-설치-및-실행)
4. [환경 변수 설정](#환경-변수-설정)
5. [문제 해결](#문제-해결)

---

## 개발 환경 설정

### 필수 요구사항

- **Node.js**: 18.0.0 이상
- **MongoDB**: 7.0 이상 (또는 Docker)
- **npm**: 9.0.0 이상
- **Docker & Docker Compose**: (선택사항, Docker 실행 시)

---

## Docker로 실행 (권장)

Docker를 사용하면 별도의 설정 없이 한 번에 실행할 수 있습니다.

### 1. 저장소 클론

```bash
git clone <repository-url>
cd frontier-ctf
```

### 2. 환경 변수 설정

`docker-compose.yml` 파일에서 `JWT_SECRET`을 변경하세요:

```yaml
backend:
  environment:
    - JWT_SECRET=your_secure_random_string_here  # 이 값을 변경하세요
```

### 3. Docker Compose 실행

```bash
docker-compose up -d
```

### 4. 접속

- **프론트엔드**: http://localhost
- **백엔드 API**: http://localhost:5000/api
- **MongoDB**: localhost:27017

### 5. 중지 및 삭제

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
cp .env.example .env

# .env 파일 수정 (필수!)
# MONGODB_URI=mongodb://localhost:27017/frontier-ctf
# JWT_SECRET=your_secure_random_string_here
# PORT=5000
# NODE_ENV=development
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

### Backend (`backend/.env`)

```env
# MongoDB 연결 URI
MONGODB_URI=mongodb://localhost:27017/frontier-ctf

# JWT 시크릿 키 (보안을 위해 반드시 변경하세요!)
JWT_SECRET=your_secure_random_string_here_minimum_32_characters

# 서버 포트
PORT=5000

# 환경 (development/production)
NODE_ENV=development
```

### Frontend (`frontend/.env`)

```env
# API 서버 주소
VITE_API_URL=http://localhost:5000/api
```

**중요**: 프로덕션 환경에서는 `JWT_SECRET`을 안전한 랜덤 문자열로 변경해야 합니다.

```bash
# 랜덤 시크릿 생성 (Node.js)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 프로덕션 빌드

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

### Docker 프로덕션 배포

```bash
# 이미지 빌드 및 실행
docker-compose up -d --build

# 로그 확인
docker-compose logs -f
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
   netstat -ano | findstr :5173
   
   # macOS/Linux
   lsof -i :5000
   lsof -i :5173
   ```

2. 포트를 변경하거나 해당 프로세스 종료

### CORS 에러

**증상**: `Access to XMLHttpRequest has been blocked by CORS policy`

**해결**:
1. 백엔드가 실행 중인지 확인
2. 프론트엔드 `.env` 파일의 `VITE_API_URL` 확인
3. 백엔드 CORS 설정 확인 (`backend/src/server.ts`)

### 의존성 설치 오류

**해결**:
```bash
# npm 캐시 정리
npm cache clean --force

# node_modules 삭제 후 재설치
rm -rf node_modules package-lock.json
npm install
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

## 관리자 계정 생성

첫 사용자를 관리자로 만들려면:

1. 일반 계정으로 회원가입
2. MongoDB에 직접 접속하여 role 변경:

```bash
# MongoDB 쉘 접속
mongosh

# frontier-ctf 데이터베이스 선택
use frontier-ctf

# 사용자의 role을 admin으로 변경
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
)
```

또는 MongoDB Compass 같은 GUI 도구를 사용하여 수정할 수 있습니다.

---

## 추가 정보

### 디렉토리 구조

```
frontier-ctf/
├── backend/              # Express 백엔드
│   ├── src/
│   │   ├── models/      # MongoDB 모델
│   │   ├── routes/      # API 라우트
│   │   ├── middleware/  # 인증 미들웨어
│   │   └── server.ts    # 서버 진입점
│   └── Dockerfile
├── frontend/            # React 프론트엔드
│   ├── src/
│   │   ├── components/  # 재사용 가능한 컴포넌트
│   │   ├── pages/       # 페이지 컴포넌트
│   │   ├── services/    # API 서비스
│   │   ├── store/       # 상태 관리
│   │   └── App.tsx
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

### API 엔드포인트

#### 인증
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인
- `GET /api/auth/me` - 현재 사용자 정보

#### 게시판
- `GET /api/boards` - 게시글 목록
- `GET /api/boards/:id` - 게시글 상세
- `POST /api/boards` - 게시글 작성 (인증 필요)
- `PUT /api/boards/:id` - 게시글 수정 (인증 필요)
- `DELETE /api/boards/:id` - 게시글 삭제 (인증 필요)
- `POST /api/boards/:id/like` - 좋아요 (인증 필요)
- `POST /api/boards/:id/comments` - 댓글 작성 (인증 필요)
- `DELETE /api/boards/:boardId/comments/:commentId` - 댓글 삭제 (인증 필요)

#### 모집
- `GET /api/recruits` - 모집글 목록
- `GET /api/recruits/:id` - 모집글 상세
- `POST /api/recruits` - 모집글 작성 (인증 필요)
- `PUT /api/recruits/:id` - 모집글 수정 (인증 필요)
- `DELETE /api/recruits/:id` - 모집글 삭제 (인증 필요)
- `POST /api/recruits/:id/like` - 좋아요 (인증 필요)
- `POST /api/recruits/:id/comments` - 댓글 작성 (인증 필요)
- `DELETE /api/recruits/:recruitId/comments/:commentId` - 댓글 삭제 (인증 필요)

---

## 지원

문제가 발생하면 이슈를 등록해주세요.

