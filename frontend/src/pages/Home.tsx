import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const Home = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="min-h-screen bg-apple">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
        <div className="text-center animate-fade-in">
          <h1 className="text-apple-headline mb-6 text-[#1d1d1f]">
            Frontier CTF
          </h1>
          <p className="text-apple-subheadline text-appleGray-700 mb-12 max-w-2xl mx-auto">
            CTF, 워게임, 프로젝트 모집을 위한 커뮤니티 플랫폼
          </p>

          <div className="flex justify-center gap-4 mb-20">
            {isAuthenticated ? (
              <>
                <Link
                  to="/boards"
                  className="btn btn-secondary text-lg px-8 py-3.5"
                >
                  게시판 보기
                </Link>
                <Link
                  to="/recruits"
                  className="btn btn-primary text-lg px-8 py-3.5"
                >
                  모집 보기
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/register"
                  className="btn btn-secondary text-lg px-8 py-3.5"
                >
                  시작하기
                </Link>
                <Link
                  to="/login"
                  className="btn btn-primary text-lg px-8 py-3.5"
                >
                  로그인
                </Link>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="card p-10 text-center hover:shadow-apple-lg transition-all duration-300">
              <div className="text-5xl mb-6">📢</div>
              <h3 className="text-2xl font-semibold mb-3 text-[#1d1d1f]">게시판</h3>
              <p className="text-apple-body text-appleGray-700">
                공지사항, 익명 게시판, 워게임 & CTF 공유
              </p>
            </div>
            <div className="card p-10 text-center hover:shadow-apple-lg transition-all duration-300">
              <div className="text-5xl mb-6">👥</div>
              <h3 className="text-2xl font-semibold mb-3 text-[#1d1d1f]">모집</h3>
              <p className="text-apple-body text-appleGray-700">
                CTF, 프로젝트, 스터디 팀원 모집
              </p>
            </div>
            <div className="card p-10 text-center hover:shadow-apple-lg transition-all duration-300">
              <div className="text-5xl mb-6">🔒</div>
              <h3 className="text-2xl font-semibold mb-3 text-[#1d1d1f]">익명성 보장</h3>
              <p className="text-apple-body text-appleGray-700">
                익명 게시판에서 자유롭게 소통하세요
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;

