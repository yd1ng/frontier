import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
// import User from '../models/User'; // CTF 목적으로 MongoDB 대신 인메모리 사용
import { authLimiter, registerLimiter } from '../middleware/security';
import { AuthRequest, authenticateToken, isAdmin } from '../middleware/auth';

// CTF 목적: 간단한 인메모리 사용자 저장소
interface MockUser {
  _id: string;
  username: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
}

const mockUsers: MockUser[] = [];
let userCounter = 0;

const router = express.Router();

// 회원가입
router.post(
  '/register',
  registerLimiter,
  [
    body('username')
      .isLength({ min: 3, max: 20 })
      .withMessage('Username must be between 3 and 20 characters'),
    body('email').isEmail().withMessage('Invalid email'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { username, email, password } = req.body;

      // 첫 번째 사용자인지 확인 (중복 확인보다 먼저)
      const userCount = mockUsers.length;
      const isFirstUser = userCount === 0;

      // 사용자 중복 확인
      const existingUser = mockUsers.find(u => u.email === email || u.username === username);

      if (existingUser) {
        res.status(400).json({
          error: 'Username or email already exists',
        });
        return;
      }

      // 비밀번호 해싱
      const hashedPassword = await bcrypt.hash(password, 10);

      // 사용자 생성
      const user: MockUser = {
        _id: (++userCounter).toString(),
        username,
        email,
        password: hashedPassword,
        role: isFirstUser ? 'admin' : 'user', // 첫 번째 사용자는 자동으로 관리자
      };

      mockUsers.push(user);

      res.status(201).json({
        message: isFirstUser 
          ? 'First user registered successfully as admin' 
          : 'User registered successfully',
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// 로그인
router.post(
  '/login',
  authLimiter,
  [
    body('email').isEmail().withMessage('Invalid email'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { email, password } = req.body;

      // 사용자 찾기
      const user = mockUsers.find(u => u.email === email);
      if (!user) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      // 비밀번호 확인
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      // JWT 토큰 생성
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        throw new Error('JWT_SECRET is not configured');
      }

      // CTF 취약점: JWT 토큰에 숨겨진 플래그 추가 (debug 엔드포인트에서만 볼 수 있음)
      const token = jwt.sign(
        {
          userId: user._id,
          role: user.role,
          // CTF 플래그: JWT 토큰 payload에 숨겨진 정보
          debug_info: {
            internal_flag: 'hspace{jw70op5_d3bu9_0p3n3d_7h3_d00r}',
            server_secret: secret,
            admin_note: 'This is for debugging purposes only'
          },
          // 추가적인 민감한 정보
          sensitive_data: {
            db_connection: process.env.MONGODB_URI,
            api_keys: ['debug_key_123', 'admin_key_456']
          }
        },
        secret,
        { expiresIn: '7d' }
      );

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// 현재 사용자 정보 가져오기
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = mockUsers.find(u => u._id === req.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user: { id: user._id, username: user.username, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// CTF 취약점: Debug 엔드포인트 - JWT 토큰 분석 및 민감한 정보 노출 (admin 권한 필요)
router.post('/debug', authenticateToken, isAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({ error: 'Token is required' });
      return;
    }

    // CTF 취약점: 토큰을 그대로 디코딩해서 모든 정보 노출
    const parts = token.split('.');
    if (parts.length !== 3) {
      res.status(400).json({ error: 'Invalid JWT format' });
      return;
    }

    const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

    // CTF 취약점: 시크릿도 노출 (실제로는 하면 안됨)
    const secret = process.env.JWT_SECRET || 'default-secret';

    // CTF 취약점: 서명 검증 결과도 함께 제공
    let verificationResult = 'invalid';
    try {
      jwt.verify(token, secret);
      verificationResult = 'valid';
    } catch (verifyError) {
      verificationResult = 'invalid';
    }

    // CTF 취약점: 모든 JWT 관련 정보를 노출
    res.json({
      debug_info: {
        header,
        payload,
        signature: parts[2],
        secret_used: secret,
        verification: verificationResult,
        algorithm: header.alg,
        // CTF 취약점: 서버 환경 변수 일부 노출
        server_env: {
          node_env: process.env.NODE_ENV,
          port: process.env.PORT,
          jwt_secret_hint: secret.substring(0, 3) + '***' // 시크릿 일부만 힌트로 제공
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;

