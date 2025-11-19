import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const Home = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-white mb-6">
            Frontier CTF
          </h1>
          <p className="text-2xl text-white mb-12">
            CTF, 워게임, 프로젝트 모집을 위한 커뮤니티 플랫폼
          </p>

          <div className="flex justify-center space-x-4 mb-16">
            {isAuthenticated ? (
              <>
                <Link
                  to="/boards"
                  className="bg-white text-indigo-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition"
                >
                  게시판 보기
                </Link>
                <Link
                  to="/recruits"
                  className="bg-indigo-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-indigo-700 transition border-2 border-white"
                >
                  모집 보기
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/register"
                  className="bg-white text-indigo-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition"
                >
                  시작하기
                </Link>
                <Link
                  to="/login"
                  className="bg-indigo-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-indigo-700 transition border-2 border-white"
                >
                  로그인
                </Link>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-lg p-8 text-white">
              <div className="text-4xl mb-4">📢</div>
              <h3 className="text-xl font-semibold mb-2">게시판</h3>
              <p className="text-white text-opacity-90">
                공지사항, 익명 게시판, 워게임 & CTF 공유
              </p>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-lg p-8 text-white">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-xl font-semibold mb-2">모집</h3>
              <p className="text-white text-opacity-90">
                CTF, 프로젝트, 스터디 팀원 모집
              </p>
            </div>
            <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-lg p-8 text-white">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-semibold mb-2">익명성 보장</h3>
              <p className="text-white text-opacity-90">
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

