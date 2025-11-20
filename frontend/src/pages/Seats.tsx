import { useState, useEffect } from 'react';
import { seatService, Seat } from '../services/seat.service';
import { useAuthStore } from '../store/authStore';

const Seats = () => {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [myReservation, setMyReservation] = useState<Seat | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<'all' | 'white' | 'staff'>('white');
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [reserveHours, setReserveHours] = useState(4);
  const [showReserveModal, setShowReserveModal] = useState(false);
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    loadSeats();
    if (isAuthenticated) {
      loadMyReservation();
    }

    // 30초마다 자동 새로고침
    const interval = setInterval(() => {
      loadSeats();
      if (isAuthenticated) {
        loadMyReservation();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedRoom, isAuthenticated]);

  const loadSeats = async () => {
    try {
      setLoading(true);
      const data = await seatService.getSeats(selectedRoom);
      setSeats(data);
    } catch (error) {
      console.error('Failed to load seats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMyReservation = async () => {
    try {
      const data = await seatService.getMyReservation();
      setMyReservation(data);
    } catch (error) {
      console.error('Failed to load my reservation:', error);
    }
  };

  const handleSeatClick = (seat: Seat) => {
    if (!isAuthenticated) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (!seat.isAvailable) {
      // 본인이 예약한 좌석인 경우
      if (seat.currentUser?._id === user?.id) {
        if (window.confirm('좌석을 반납하시겠습니까?')) {
          handleReleaseSeat(seat.seatNumber);
        }
      } else {
        alert('이미 사용 중인 좌석입니다.');
      }
      return;
    }

    // 빈 좌석 클릭 - 예약
    if (myReservation) {
      alert('이미 예약된 좌석이 있습니다. 먼저 반납해주세요.');
      return;
    }

    setSelectedSeat(seat);
    setShowReserveModal(true);
  };

  const handleReserveSeat = async () => {
    if (!selectedSeat) return;

    try {
      await seatService.reserveSeat(selectedSeat.seatNumber, reserveHours);
      alert(`좌석 ${selectedSeat.seatNumber}이(가) ${reserveHours}시간 동안 예약되었습니다.`);
      setShowReserveModal(false);
      setSelectedSeat(null);
      loadSeats();
      loadMyReservation();
    } catch (error: any) {
      console.error('Failed to reserve seat:', error);
      alert(error.response?.data?.error || '좌석 예약에 실패했습니다.');
    }
  };

  const handleReleaseSeat = async (seatNumber: string) => {
    try {
      await seatService.releaseSeat(seatNumber);
      alert('좌석이 반납되었습니다.');
      loadSeats();
      loadMyReservation();
    } catch (error: any) {
      console.error('Failed to release seat:', error);
      alert(error.response?.data?.error || '좌석 반납에 실패했습니다.');
    }
  };

  const getRemainingTime = (reservedUntil: string) => {
    const now = new Date();
    const until = new Date(reservedUntil);
    const diff = until.getTime() - now.getTime();
    
    if (diff <= 0) return '만료됨';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}시간 ${minutes}분`;
  };

  // WHITE ROOM 좌석 배치 (이미지 기준)
  const renderWhiteRoomSeats = () => {
    const whiteSeats = seats.filter(s => s.room === 'white');
    
    // 상단 12석 (2줄)
    const topSeats = whiteSeats.slice(0, 12);
    // 하단 24석 (2줄)
    const bottomSeats = whiteSeats.slice(12, 36);

    return (
      <div className="space-y-8">
        {/* 상단 섹션 */}
        <div>
          <h3 className="text-sm font-semibold mb-2 text-gray-600">Section A</h3>
          <div className="grid grid-cols-6 gap-3">
            {topSeats.map((seat) => (
              <button
                key={seat._id}
                onClick={() => handleSeatClick(seat)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  seat.isAvailable
                    ? 'bg-green-50 border-green-300 hover:bg-green-100 cursor-pointer'
                    : seat.currentUser?._id === user?.id
                    ? 'bg-blue-500 border-blue-600 text-white cursor-pointer'
                    : 'bg-red-50 border-red-300 cursor-not-allowed'
                }`}
                disabled={!seat.isAvailable && seat.currentUser?._id !== user?.id}
              >
                <div className="text-center">
                  <div className="font-bold text-sm">{seat.seatNumber}</div>
                  {!seat.isAvailable && (
                    <div className="text-xs mt-1">
                      {seat.currentUser?._id === user?.id ? '사용중' : '예약됨'}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 하단 섹션 */}
        <div>
          <h3 className="text-sm font-semibold mb-2 text-gray-600">Section B</h3>
          <div className="grid grid-cols-8 gap-3">
            {bottomSeats.map((seat) => (
              <button
                key={seat._id}
                onClick={() => handleSeatClick(seat)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  seat.isAvailable
                    ? 'bg-green-50 border-green-300 hover:bg-green-100 cursor-pointer'
                    : seat.currentUser?._id === user?.id
                    ? 'bg-blue-500 border-blue-600 text-white cursor-pointer'
                    : 'bg-red-50 border-red-300 cursor-not-allowed'
                }`}
                disabled={!seat.isAvailable && seat.currentUser?._id !== user?.id}
              >
                <div className="text-center">
                  <div className="font-bold text-sm">{seat.seatNumber}</div>
                  {!seat.isAvailable && (
                    <div className="text-xs mt-1">
                      {seat.currentUser?._id === user?.id ? '사용중' : '예약됨'}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // STAFF ROOM 좌석 배치
  const renderStaffRoomSeats = () => {
    const staffSeats = seats.filter(s => s.room === 'staff');
    
    return (
      <div className="grid grid-cols-6 gap-4">
        {staffSeats.map((seat) => (
          <button
            key={seat._id}
            onClick={() => handleSeatClick(seat)}
            className={`p-6 rounded-lg border-2 transition-all ${
              seat.isAvailable
                ? 'bg-green-50 border-green-300 hover:bg-green-100 cursor-pointer'
                : seat.currentUser?._id === user?.id
                ? 'bg-blue-500 border-blue-600 text-white cursor-pointer'
                : 'bg-red-50 border-red-300 cursor-not-allowed'
            }`}
            disabled={!seat.isAvailable && seat.currentUser?._id !== user?.id}
          >
            <div className="text-center">
              <div className="font-bold">{seat.seatNumber}</div>
              {!seat.isAvailable && (
                <div className="text-xs mt-1">
                  {seat.currentUser?._id === user?.id ? '사용중' : '예약됨'}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-gray-500">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">HSPACE 좌석 예약</h1>
        
        {/* 내 예약 정보 */}
        {myReservation && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-blue-900">현재 예약 좌석</h3>
                <p className="text-sm text-blue-700 mt-1">
                  좌석: <span className="font-bold">{myReservation.seatNumber}</span> | 
                  남은 시간: <span className="font-bold">{getRemainingTime(myReservation.reservedUntil!)}</span>
                </p>
              </div>
              <button
                onClick={() => handleReleaseSeat(myReservation.seatNumber)}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                좌석 반납
              </button>
            </div>
          </div>
        )}

        {/* 범례 */}
        <div className="flex items-center gap-6 text-sm mb-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-50 border-2 border-green-300 rounded"></div>
            <span>이용 가능</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 border-2 border-blue-600 rounded"></div>
            <span>내 좌석</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-50 border-2 border-red-300 rounded"></div>
            <span>사용 중</span>
          </div>
        </div>

        {/* 방 선택 탭 */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setSelectedRoom('white')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              selectedRoom === 'white'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            WHITE ROOM (36석)
          </button>
          <button
            onClick={() => setSelectedRoom('staff')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              selectedRoom === 'staff'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            STAFF ROOM (12석)
          </button>
        </div>
      </div>

      {/* 좌석 배치도 */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-xl font-bold mb-6">
          {selectedRoom === 'white' ? 'WHITE ROOM' : 'STAFF ROOM'}
        </h2>
        {selectedRoom === 'white' ? renderWhiteRoomSeats() : renderStaffRoomSeats()}
      </div>

      {/* 예약 모달 */}
      {showReserveModal && selectedSeat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">좌석 예약</h3>
            <p className="text-gray-600 mb-4">
              좌석 <span className="font-bold text-indigo-600">{selectedSeat.seatNumber}</span>을(를) 예약하시겠습니까?
            </p>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이용 시간
              </label>
              <select
                value={reserveHours}
                onChange={(e) => setReserveHours(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={1}>1시간</option>
                <option value={2}>2시간</option>
                <option value={3}>3시간</option>
                <option value={4}>4시간</option>
                <option value={5}>5시간</option>
                <option value={6}>6시간</option>
                <option value={7}>7시간</option>
                <option value={8}>8시간</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleReserveSeat}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium"
              >
                예약하기
              </button>
              <button
                onClick={() => {
                  setShowReserveModal(false);
                  setSelectedSeat(null);
                }}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md font-medium"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Seats;


