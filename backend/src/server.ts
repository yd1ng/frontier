import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import path from 'path';
import fs from 'fs';
import authRoutes from './routes/auth';
import boardRoutes from './routes/boards';
import recruitRoutes from './routes/recruits';
import seatRoutes from './routes/seats';
import chatbotRoutes from './routes/chatbot';
import discordRoutes from './routes/discord';
import uploadRoutes from './routes/upload';
import { apiLimiter, limitContentSize, sanitizeInput } from './middleware/security';
import { validateEnv } from './config/validateEnv';
import { startCleanupScheduler } from './utils/seatCleanup';
import { initializeSeatsIfEmpty } from './utils/initializeSeats';
import discordService from './services/discord.service';

// 환경 변수 검증
const config = validateEnv();

const app = express();
const PORT = config.PORT;
const MONGODB_URI = config.MONGODB_URI;
const NODE_ENV = config.NODE_ENV;

// Trust proxy - Nginx나 Load Balancer 뒤에서 실행될 때 필요
app.set('trust proxy', 1);

// Security Middleware
// Helmet: 보안 헤더 설정
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);

// CORS 설정 강화
const allowedOrigins = config.ALLOWED_ORIGINS
  ? config.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      if (NODE_ENV === 'development') {
        return callback(null, true);
      }

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

// Body parser with size limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB 쿼리 인젝션 방지
app.use(mongoSanitize());

// 입력 크기 제한
app.use(limitContentSize);

// 입력 검증
app.use(sanitizeInput);

// API Rate Limiting
app.use('/api/', apiLimiter);

// uploads 디렉토리 생성 (없으면)
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// 정적 파일 제공 (이미지)
app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/recruits', recruitRoutes);
app.use('/api/seats', seatRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/discord', discordRoutes);
app.use('/api/upload', uploadRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// 전역 에러 핸들러
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err.message);
  
  // 프로덕션 환경에서는 상세한 에러 정보 노출 방지
  if (NODE_ENV === 'production') {
    res.status(err.status || 500).json({
      error: 'An error occurred',
    });
  } else {
    res.status(err.status || 500).json({
      error: err.message,
      stack: err.stack,
    });
  }
});

// 404 핸들러
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({ error: 'Not Found' });
});

// MongoDB connection
mongoose
  .connect(MONGODB_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    console.log(`🌍 Environment: ${NODE_ENV}`);
    console.log(`🔒 Security features enabled`);
    
    // 좌석 자동 초기화 (좌석이 없을 경우에만)
    await initializeSeatsIfEmpty();
    
    // 좌석 예약 자동 정리 스케줄러 시작 (5분마다)
    startCleanupScheduler(5);
    
    // Discord 자동 동기화 스케줄러 시작 (1시간마다)
    setTimeout(() => {
      if (discordService.isConnected()) {
        discordService.startAutoSync(60);
      }
    }, 5000); // Discord Bot 연결 후 5초 대기
    
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      
      if (NODE_ENV === 'development') {
        console.log(`📝 API Documentation: http://localhost:${PORT}/api`);
      }
    });
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  mongoose.connection.close();
  process.exit(0);
});

export default app;

