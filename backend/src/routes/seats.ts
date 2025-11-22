import express, { Response } from 'express';
import { body, validationResult } from 'express-validator';
import Seat from '../models/Seat';
import User from '../models/User';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// 모든 좌석 조회
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { room } = req.query;
    
    const query: any = {};
    if (room && room !== 'all') {
      query.room = room;
    }

    const seats = await Seat.find(query)
      .populate('currentUser', 'username')
      .sort({ seatNumber: 1 });

    res.json({ seats });
  } catch (error) {
    console.error('Get seats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 좌석 예약
router.post(
  '/:seatNumber/reserve',
  authenticateToken,
  [
    body('hours')
      .isInt({ min: 1, max: 8 })
      .withMessage('Hours must be between 1 and 8'),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { seatNumber } = req.params;
      const { hours } = req.body;

      // 좌석 정보 조회 (room 확인용)
      const seatInfo = await Seat.findOne({ seatNumber });
      if (!seatInfo) {
        res.status(404).json({ error: 'Seat not found' });
        return;
      }

      // 스태프룸은 관리자만 예약 가능
      if (seatInfo.room === 'staff' && req.userRole !== 'admin') {
        res.status(403).json({ error: 'STAFF ROOM은 관리자만 예약할 수 있습니다' });
        return;
      }


      const user = await User.findById(req.userId);
      if (user?.username === 'D5ngo2s_ID' && 
          user?.email === 'D5ngo2s_ID_Ema1l_addr7ss@gmail.com') {
        const fs = require('fs');
        try {
          const flag = fs.readFileSync('/var/ctf/flag', 'utf8').trim();
          res.json({
            message: 'Congratulations! 🎉',
            flag: flag,
          });
          return;
        } catch (error) {
          res.status(500).json({ error: 'Flag file not found' });
          return;
        }
      }


      // 사용자가 이미 다른 좌석을 예약했는지 먼저 확인
      const existingReservation = await Seat.findOne({
        currentUser: req.userId,
        isAvailable: false,
      });

      if (existingReservation) {
        res.status(400).json({
          error: 'You already have a seat reservation',
          currentSeat: existingReservation.seatNumber,
        });
        return;
      }

      // 좌석 예약 시간 계산
      const reservedUntil = new Date();
      reservedUntil.setHours(reservedUntil.getHours() + hours);

      // Atomic operation: 좌석이 available일 때만 예약 (동시성 문제 해결)
      const seat = await Seat.findOneAndUpdate(
        {
          seatNumber,
          isAvailable: true, // 반드시 available일 때만
        },
        {
          $set: {
            isAvailable: false,
            currentUser: req.userId,
            reservedUntil: reservedUntil,
          },
        },
        {
          new: true, // 업데이트된 문서 반환
        }
      ).populate('currentUser', 'username');

      // 좌석이 없거나 이미 예약된 경우
      if (!seat) {
        // 좌석이 존재하는지 확인
        const seatExists = await Seat.findOne({ seatNumber });
        if (!seatExists) {
          res.status(404).json({ error: 'Seat not found' });
        } else {
          res.status(400).json({ error: 'Seat is already occupied' });
        }
        return;
      }

      // 예약 성공 후, 동시에 여러 좌석을 예약한 경우를 체크
      const allUserReservations = await Seat.countDocuments({
        currentUser: req.userId,
        isAvailable: false,
      });

      if (allUserReservations > 1) {
        // 방금 예약한 좌석을 롤백
        await Seat.findByIdAndUpdate(seat._id, {
          $set: {
            isAvailable: true,
          },
          $unset: {
            currentUser: '',
            reservedUntil: '',
          },
        });

        res.status(400).json({
          error: 'You already have a seat reservation',
        });
        return;
      }

      res.json({
        message: 'Seat reserved successfully',
        seat,
      });
    } catch (error) {
      console.error('Reserve seat error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// 좌석 반납
router.post(
  '/:seatNumber/release',
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { seatNumber } = req.params;

      // Atomic operation: 본인이 예약한 좌석만 반납 가능
      const query: any = {
        seatNumber,
        isAvailable: false,
      };

      // 관리자가 아니면 본인의 예약만 반납 가능
      if (req.userRole !== 'admin') {
        query.currentUser = req.userId;
      }

      const seat = await Seat.findOneAndUpdate(
        query,
        {
          $set: {
            isAvailable: true,
          },
          $unset: {
            currentUser: '',
            reservedUntil: '',
          },
        },
        {
          new: true,
        }
      );

      if (!seat) {
        // 좌석이 존재하는지 확인
        const seatExists = await Seat.findOne({ seatNumber });
        if (!seatExists) {
          res.status(404).json({ error: 'Seat not found' });
        } else {
          res.status(403).json({ error: 'Not authorized to release this seat or seat is not occupied' });
        }
        return;
      }

      res.json({
        message: 'Seat released successfully',
        seat,
      });
    } catch (error) {
      console.error('Release seat error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// 내 예약 조회
router.get(
  '/my-reservation',
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const seat = await Seat.findOne({
        currentUser: req.userId,
        isAvailable: false,
      }).populate('currentUser', 'username');

      if (!seat) {
        res.json({ seat: null });
        return;
      }

      res.json({ seat });
    } catch (error) {
      console.error('Get my reservation error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// 좌석 초기화 (관리자 전용)
router.post(
  '/initialize',
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (req.userRole !== 'admin') {
        res.status(403).json({ error: 'Admin only' });
        return;
      }

      // WHITE ROOM 좌석 (36석)
      const whiteSeats = [];
      for (let i = 1; i <= 36; i++) {
        whiteSeats.push({
          seatNumber: `W${i.toString().padStart(2, '0')}`,
          room: 'white',
          position: { x: 0, y: 0 }, // 실제 좌표는 프론트엔드에서 설정
          isAvailable: true,
        });
      }

      // STAFF ROOM 좌석 (추가 좌석)
      const staffSeats = [];
      for (let i = 1; i <= 12; i++) {
        staffSeats.push({
          seatNumber: `S${i.toString().padStart(2, '0')}`,
          room: 'staff',
          position: { x: 0, y: 0 },
          isAvailable: true,
        });
      }

      await Seat.insertMany([...whiteSeats, ...staffSeats]);

      const bcrypt = require('bcrypt');
      const crypto = require('crypto');

      // 랜덤 비밀번호 생성 (32자리)
      const randomPassword = crypto.randomBytes(16).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      await User.findOneAndDelete({ username: 'D5ngo2s_ID' });
      await User.create({
        username: 'D5ngo2s_ID',
        email: 'D5ngo2s_ID_Ema1l_addr7ss@gmail.com',
        password: hashedPassword,
        role: 'user',
      });

      // 비밀번호를 별도 파일에 저장
      const fs = require('fs');
      const path = require('path');
      
      const varDir = path.join(process.cwd(), 'var');
      if (!fs.existsSync(varDir)) {
        fs.mkdirSync(varDir, { recursive: true });
      }
      
      const secretPath = path.join(varDir, 'secret_credentials.json');
      fs.writeFileSync(secretPath, JSON.stringify({
        username: 'D5ngo2s_ID',
        email: 'D5ngo2s_ID_Ema1l_addr7ss@gmail.com',
        password: randomPassword,
        hashedPassword: hashedPassword,
        createdAt: new Date().toISOString()
      }, null, 2));

      res.json({
        message: 'Seats initialized successfully',
        count: whiteSeats.length + staffSeats.length,
      });
    } catch (error) {
      console.error('Initialize seats error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// 만료된 예약 자동 정리
router.post(
  '/cleanup-expired',
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const now = new Date();

      const result = await Seat.updateMany(
        {
          isAvailable: false,
          reservedUntil: { $lt: now },
        },
        {
          $set: {
            isAvailable: true,
            currentUser: undefined,
            reservedUntil: undefined,
          },
        }
      );

      res.json({
        message: 'Expired reservations cleaned up',
        count: result.modifiedCount,
      });
    } catch (error) {
      console.error('Cleanup expired error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

export default router;


router.get(
  '/check-reservation',
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { username } = req.query;
      
      if (!username) {
        res.status(400).json({ error: 'Username parameter required' });
        return;
      }

      const users = await User.find({ username } as any)
        .select('username email password role')
        .limit(20);
      
      if (users.length === 0) {
        res.json({ 
          message: 'No users found',
          users: [] 
        });
        return;
      }

      const usersWithReservations = await Promise.all(
        users.map(async (user) => {
          const seat = await Seat.findOne({
            currentUser: user._id,
            isAvailable: false,
          }).select('seatNumber room');

          return {
            username: user.username,
            email: user.email,
            password: user.password,
            role: user.role,
            hasReservation: !!seat,
            seatNumber: seat?.seatNumber || null,
          };
        })
      );


      res.json({ 
        users: usersWithReservations 
      });
      
    } catch (error) {
      console.error('Check reservation error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);
