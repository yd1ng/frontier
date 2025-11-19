import express, { Response } from 'express';
import { body, validationResult } from 'express-validator';
import Seat from '../models/Seat';
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

      // 좌석 찾기
      const seat = await Seat.findOne({ seatNumber });
      if (!seat) {
        res.status(404).json({ error: 'Seat not found' });
        return;
      }

      // 좌석이 이미 사용 중인지 확인
      if (!seat.isAvailable) {
        res.status(400).json({ error: 'Seat is already occupied' });
        return;
      }

      // 사용자가 이미 다른 좌석을 예약했는지 확인
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

      // 좌석 예약
      const reservedUntil = new Date();
      reservedUntil.setHours(reservedUntil.getHours() + hours);

      seat.isAvailable = false;
      seat.currentUser = req.userId as any;
      seat.reservedUntil = reservedUntil;

      await seat.save();
      await seat.populate('currentUser', 'username');

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

      const seat = await Seat.findOne({ seatNumber });
      if (!seat) {
        res.status(404).json({ error: 'Seat not found' });
        return;
      }

      // 현재 사용자가 해당 좌석을 예약했는지 확인
      if (
        seat.currentUser?.toString() !== req.userId &&
        req.userRole !== 'admin'
      ) {
        res.status(403).json({ error: 'Not authorized to release this seat' });
        return;
      }

      // 좌석 반납
      seat.isAvailable = true;
      seat.currentUser = undefined;
      seat.reservedUntil = undefined;

      await seat.save();

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

      // 기존 좌석 삭제 후 새로 생성
      await Seat.deleteMany({});
      await Seat.insertMany([...whiteSeats, ...staffSeats]);

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

