FROM node:18-alpine

WORKDIR /app

# 의존성 설치
COPY package*.json ./
RUN npm install

# 소스 코드 복사
COPY . .

# 포트 노출
EXPOSE 5000

# TypeScript를 직접 실행 (개발 모드)
CMD ["npm", "run", "dev"]

