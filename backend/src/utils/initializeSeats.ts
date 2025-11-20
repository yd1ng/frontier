import Seat from '../models/Seat';

/**
 * 좌석 자동 초기화 함수
 * 서버 시작 시 좌석이 없으면 자동으로 생성합니다.
 */
export const initializeSeatsIfEmpty = async () => {
  try {
    const seatCount = await Seat.countDocuments();
    
    if (seatCount > 0) {
      console.log(`✅ Seats already initialized (${seatCount} seats found)`);
      return;
    }

    console.log('📍 No seats found. Initializing seats...');

    const seatsToCreate = [];

    // WHITE ROOM (36 seats)
    for (let i = 1; i <= 36; i++) {
      seatsToCreate.push({
        seatNumber: `W${String(i).padStart(2, '0')}`,
        room: 'white',
        isAvailable: true,
        position: { x: 0, y: 0 }, // Frontend will handle layout
      });
    }

    // STAFF ROOM (12 seats)
    for (let i = 1; i <= 12; i++) {
      seatsToCreate.push({
        seatNumber: `S${String(i).padStart(2, '0')}`,
        room: 'staff',
        isAvailable: true,
        position: { x: 0, y: 0 }, // Frontend will handle layout
      });
    }

    const result = await Seat.insertMany(seatsToCreate);
    console.log(`✅ Seats initialized successfully (${result.length} seats created)`);
  } catch (error) {
    console.error('❌ Failed to initialize seats:', error);
  }
};



