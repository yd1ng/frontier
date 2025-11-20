import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <span className="text-2xl font-semibold text-[#1d1d1f] tracking-tight">
                Frontier CTF
              </span>
            </Link>
            <div className="ml-10 flex items-center space-x-1">
              <Link
                to="/announcements"
                className="px-4 py-2 rounded-xl text-sm font-medium text-appleGray-700 hover:text-[#1d1d1f] hover:bg-appleGray-100 transition-colors"
              >
                미션
              </Link>
              <Link
                to="/boards"
                className="px-4 py-2 rounded-xl text-sm font-medium text-appleGray-700 hover:text-[#1d1d1f] hover:bg-appleGray-100 transition-colors"
              >
                게시판
              </Link>
              <Link
                to="/recruits"
                className="px-4 py-2 rounded-xl text-sm font-medium text-appleGray-700 hover:text-[#1d1d1f] hover:bg-appleGray-100 transition-colors"
              >
                모집
              </Link>
              <Link
                to="/seats"
                className="px-4 py-2 rounded-xl text-sm font-medium text-appleGray-700 hover:text-[#1d1d1f] hover:bg-appleGray-100 transition-colors"
              >
                좌석 예약
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {isAuthenticated ? (
              <>
                {user?.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="btn btn-secondary text-sm px-4 py-2"
                  >
                    관리자
                  </Link>
                )}
                <span className="text-sm text-appleGray-700 px-3">
                  안녕하세요, <span className="font-semibold text-[#1d1d1f]">{user?.username}</span>님
                </span>
                <button
                  onClick={handleLogout}
                  className="btn btn-secondary text-sm"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl text-sm font-medium text-appleGray-700 hover:text-[#1d1d1f] hover:bg-appleGray-100 transition-colors"
                >
                  로그인
                </Link>
                <Link
                  to="/register"
                  className="btn btn-primary text-sm"
                >
                  회원가입
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

