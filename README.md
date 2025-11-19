# Frontier CTF Community Platform

<div align="center">

**CTF, 워게임, 프로젝트 모집을 위한 커뮤니티 플랫폼**

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)

</div>

---

## 📋 목차

- [기능](#-기능)
- [기술 스택](#-기술-스택)
- [빠른 시작](#-빠른-시작)
- [보안](#-보안)
- [프로젝트 구조](#-프로젝트-구조)
- [스크린샷](#-스크린샷)
- [API 문서](#-api-문서)
- [배포](#-배포)
- [기여](#-기여)
- [라이선스](#-라이선스)

---

## 🚀 기능

### 현재 구현된 기능

#### 🔐 인증 시스템
- JWT 기반 인증
- 회원가입 / 로그인
- 비밀번호 암호화 (bcrypt)

#### 📢 게시판
- **공지사항**: 관리자 전용 공지 게시판
- **익명 게시판**: 익명으로 자유롭게 소통
- **워게임 & CTF**: CTF writeup, 풀이 공유

게시판 기능:
- 게시글 작성/수정/삭제
- 댓글 시스템
- 좋아요 기능
- 조회수 추적
- 카테고리별 필터링
- 페이지네이션

#### 👥 모집
- **CTF 팀**: CTF 대회 팀원 모집
- **프로젝트**: 프로젝트 협업자 모집
- **스터디**: 스터디 그룹 모집

모집 기능:
- 모집글 작성/수정/삭제
- 모집 상태 관리 (모집중/마감)
- 인원 수 설정
- 마감일 설정
- 태그 시스템
- 댓글 및 좋아요

### 향후 계획

- 🤖 **LLM 활용**: AI 기반 CTF 문제 힌트 제공
- 💬 **디스코드 연동**: 나이츠프론티어 디스코드 연동
- 🎫 **HSPACE 좌석 발권**: 좌석 예약 시스템

---

## 🛠 기술 스택

### Frontend
| 기술 | 설명 |
|------|------|
| **React 18** | UI 라이브러리 |
| **TypeScript** | 타입 안정성 |
| **Vite** | 빠른 빌드 도구 |
| **TailwindCSS** | 유틸리티 CSS 프레임워크 |
| **React Router** | 클라이언트 사이드 라우팅 |
| **Zustand** | 경량 상태 관리 |
| **Axios** | HTTP 클라이언트 |

### Backend
| 기술 | 설명 |
|------|------|
| **Node.js** | JavaScript 런타임 |
| **Express** | 웹 프레임워크 |
| **TypeScript** | 타입 안정성 |
| **MongoDB** | NoSQL 데이터베이스 |
| **Mongoose** | MongoDB ODM |
| **JWT** | 토큰 기반 인증 |
| **bcrypt** | 비밀번호 해싱 |

### DevOps
| 기술 | 설명 |
|------|------|
| **Docker** | 컨테이너화 |
| **Docker Compose** | 다중 컨테이너 관리 |
| **Nginx** | 리버스 프록시 |

---

## ⚡ 빠른 시작

### 방법 1: Docker 사용 (권장)

가장 빠르고 간단한 방법입니다.

```bash
# 1. 저장소 클론
git clone <repository-url>
cd frontier-ctf

# 2. Docker Compose 실행
docker-compose up -d

# 3. 접속
# Frontend: http://localhost
# Backend: http://localhost:5000
```

### 방법 2: 수동 설치

자세한 설치 방법은 [INSTALLATION.md](./INSTALLATION.md)를 참고하세요.

```bash
# 1. MongoDB 실행 (별도 터미널)
mongod

# 2. 의존성 설치
npm install
cd backend && npm install
cd ../frontend && npm install

# 3. 환경 변수 설정
cd backend
cp .env.example .env
# .env 파일 수정 (JWT_SECRET 등)

# 4. 개발 서버 실행 (루트 디렉토리)
cd ..
npm run dev
```

**접속:**
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

---

## 🔒 보안

이 프로젝트는 프로덕션 환경을 위한 다양한 보안 기능을 포함하고 있습니다.

### 주요 보안 기능

✅ **인증 & 권한**
- JWT 기반 인증
- bcrypt 비밀번호 해싱
- 역할 기반 접근 제어 (RBAC)

✅ **공격 방어**
- Rate Limiting (DDoS, 무차별 대입 공격 방지)
- XSS 방어 (입력 검증 & sanitization)
- CSRF 방어
- SQL/NoSQL Injection 방지
- 보안 헤더 (Helmet.js)

✅ **데이터 보호**
- HTTPS 지원
- CORS 정책
- 민감 정보 암호화
- 요청 크기 제한

### 배포 전 보안 체크리스트

프로덕션 환경에 배포하기 전 **반드시** 확인하세요:

```bash
# 1. JWT_SECRET 변경 (최소 32자 이상)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# 2. .env 파일 설정
# backend/.env
JWT_SECRET=<위에서 생성한 랜덤 문자열>
NODE_ENV=production
ALLOWED_ORIGINS=https://yourdomain.com
MONGODB_URI=mongodb+srv://...  # MongoDB Atlas 사용 권장

# 3. 의존성 취약점 검사
cd backend && npm audit
cd frontend && npm audit
```

### 보안 문서

자세한 보안 정책은 [SECURITY.md](./SECURITY.md)를 참고하세요.

**보안 취약점 신고**: 보안 이슈는 공개 이슈로 올리지 말고, 프로젝트 관리자에게 비공개로 연락 부탁드립니다.

---

## 📁 프로젝트 구조

```
frontier-ctf/
├── backend/                    # Express 백엔드
│   ├── src/
│   │   ├── models/            # MongoDB 모델
│   │   │   ├── User.ts        # 사용자 모델
│   │   │   ├── Board.ts       # 게시판 모델
│   │   │   └── Recruit.ts     # 모집 모델
│   │   ├── routes/            # API 라우트
│   │   │   ├── auth.ts        # 인증 API
│   │   │   ├── boards.ts      # 게시판 API
│   │   │   └── recruits.ts    # 모집 API
│   │   ├── middleware/        # 미들웨어
│   │   │   └── auth.ts        # JWT 인증
│   │   └── server.ts          # 서버 진입점
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                   # React 프론트엔드
│   ├── src/
│   │   ├── components/        # 재사용 컴포넌트
│   │   │   ├── Navbar.tsx
│   │   │   ├── CategoryTabs.tsx
│   │   │   ├── Pagination.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── pages/             # 페이지 컴포넌트
│   │   │   ├── Home.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── BoardList.tsx
│   │   │   ├── BoardDetail.tsx
│   │   │   ├── BoardForm.tsx
│   │   │   ├── RecruitList.tsx
│   │   │   ├── RecruitDetail.tsx
│   │   │   └── RecruitForm.tsx
│   │   ├── services/          # API 서비스
│   │   │   ├── api.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── board.service.ts
│   │   │   └── recruit.service.ts
│   │   ├── store/             # 상태 관리
│   │   │   └── authStore.ts
│   │   ├── App.tsx            # 앱 라우팅
│   │   ├── main.tsx           # 진입점
│   │   └── index.css          # 글로벌 스타일
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── docker-compose.yml          # Docker Compose 설정
├── README.md                   # 프로젝트 소개
├── INSTALLATION.md             # 상세 설치 가이드
└── .gitignore
```

---

## 🖼 스크린샷

### 메인 페이지
모던하고 깔끔한 UI로 설계된 메인 페이지

### 게시판
카테고리별로 구분된 게시판 시스템 (공지, 익명, 워게임&CTF)

### 모집
CTF, 프로젝트, 스터디 팀원 모집 기능

---

## 📚 API 문서

### 인증 API

| Method | Endpoint | 설명 | 인증 필요 |
|--------|----------|------|-----------|
| POST | `/api/auth/register` | 회원가입 | ❌ |
| POST | `/api/auth/login` | 로그인 | ❌ |
| GET | `/api/auth/me` | 현재 사용자 정보 | ✅ |

### 게시판 API

| Method | Endpoint | 설명 | 인증 필요 |
|--------|----------|------|-----------|
| GET | `/api/boards` | 게시글 목록 | ❌ |
| GET | `/api/boards/:id` | 게시글 상세 | ❌ |
| POST | `/api/boards` | 게시글 작성 | ✅ |
| PUT | `/api/boards/:id` | 게시글 수정 | ✅ |
| DELETE | `/api/boards/:id` | 게시글 삭제 | ✅ |
| POST | `/api/boards/:id/like` | 좋아요 | ✅ |
| POST | `/api/boards/:id/comments` | 댓글 작성 | ✅ |
| DELETE | `/api/boards/:boardId/comments/:commentId` | 댓글 삭제 | ✅ |

### 모집 API

| Method | Endpoint | 설명 | 인증 필요 |
|--------|----------|------|-----------|
| GET | `/api/recruits` | 모집글 목록 | ❌ |
| GET | `/api/recruits/:id` | 모집글 상세 | ❌ |
| POST | `/api/recruits` | 모집글 작성 | ✅ |
| PUT | `/api/recruits/:id` | 모집글 수정 | ✅ |
| DELETE | `/api/recruits/:id` | 모집글 삭제 | ✅ |
| POST | `/api/recruits/:id/like` | 좋아요 | ✅ |
| POST | `/api/recruits/:id/comments` | 댓글 작성 | ✅ |
| DELETE | `/api/recruits/:recruitId/comments/:commentId` | 댓글 삭제 | ✅ |

자세한 API 사용법은 각 엔드포인트를 테스트하거나 코드를 참고하세요.

---

## 🚢 배포

### Docker를 사용한 프로덕션 배포

```bash
# 1. 환경 변수 설정
# docker-compose.yml에서 JWT_SECRET 변경

# 2. 빌드 및 실행
docker-compose up -d --build

# 3. 로그 확인
docker-compose logs -f
```

### 수동 배포

```bash
# Frontend 빌드
cd frontend
npm run build

# Backend 빌드
cd ../backend
npm run build

# PM2를 사용한 프로세스 관리 (선택사항)
npm install -g pm2
pm2 start dist/server.js --name frontier-ctf-backend
```

---

## 🤝 기여

기여를 환영합니다! 다음 단계를 따라주세요:

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 라이선스

This project is licensed under the MIT License.

---

## 📧 연락처

프로젝트 관련 문의나 버그 리포트는 이슈를 등록해주세요.

---

<div align="center">

**Made with ❤️ for the CTF Community**

</div>

#   f r o n t i e r  
 