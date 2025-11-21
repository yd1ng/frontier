import dotenv from 'dotenv';

dotenv.config();

interface EnvConfig {
  MONGODB_URI: string;
  JWT_SECRET: string;
  PORT: number;
  NODE_ENV: string;
  ALLOWED_ORIGINS?: string;
}

const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];

export const validateEnv = (): EnvConfig => {
  const missingVars: string[] = [];

  // CTF 모의해킹을 위한 기본값 설정
  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'ctf_jwt_secret_for_testing_purposes_only';
  }
  if (!process.env.MONGODB_URI) {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/frontier_ctf';
  }

  // 필수 환경 변수 확인
  for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}\n` +
      `Please create a .env file based on .env.example`
    );
  }

  // JWT_SECRET 보안 검증
  const jwtSecret = process.env.JWT_SECRET!;
  if (jwtSecret.length < 32) {
    console.warn(
      '⚠️  WARNING: JWT_SECRET should be at least 32 characters for better security!'
    );
  }

  // NODE_ENV 검증
  const nodeEnv = process.env.NODE_ENV || 'development';
  if (!['development', 'production', 'test'].includes(nodeEnv)) {
    console.warn(
      `⚠️  WARNING: NODE_ENV is set to "${nodeEnv}". Valid values are: development, production, test`
    );
  }

  // 프로덕션 환경 추가 검증
  if (nodeEnv === 'production') {
    if (!process.env.ALLOWED_ORIGINS) {
      console.warn(
        '⚠️  WARNING: ALLOWED_ORIGINS is not set in production. CORS will block all origins except localhost.'
      );
    }

    // MongoDB URI 검증
    const mongoUri = process.env.MONGODB_URI!;
    if (mongoUri.includes('localhost') || mongoUri.includes('127.0.0.1')) {
      console.warn(
        '⚠️  WARNING: Using localhost MongoDB in production is not recommended.'
      );
    }
  }

  return {
    MONGODB_URI: process.env.MONGODB_URI!,
    JWT_SECRET: process.env.JWT_SECRET!,
    PORT: parseInt(process.env.PORT || '5000', 10),
    NODE_ENV: nodeEnv,
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
  };
};

export const getEnvConfig = (): EnvConfig => {
  return {
    MONGODB_URI: process.env.MONGODB_URI!,
    JWT_SECRET: process.env.JWT_SECRET!,
    PORT: parseInt(process.env.PORT || '5000', 10),
    NODE_ENV: process.env.NODE_ENV || 'development',
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
  };
};

