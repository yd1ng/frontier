import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { boardService, Board } from '../services/board.service';
import { useAuthStore } from '../store/authStore';
import CategoryTabs from '../components/CategoryTabs';
import Pagination from '../components/Pagination';

const BOARD_CATEGORIES = [
  { value: 'all', label: '전체' },
  { value: 'notice', label: '공지사항' },
  { value: 'anonymous', label: '익명 게시판' },
  { value: 'wargame-ctf', label: '워게임 & CTF' },
];

const BoardList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });

  const category = searchParams.get('category') || 'all';
  const page = parseInt(searchParams.get('page') || '1');
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    loadBoards();
  }, [category, page]);

  const loadBoards = async () => {
    try {
      setLoading(true);
      const data = await boardService.getBoards(category, page);
      setBoards(data.boards);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Failed to load boards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (newCategory: string) => {
    setSearchParams({ category: newCategory, page: '1' });
  };

  const handlePageChange = (newPage: number) => {
    setSearchParams({ category, page: newPage.toString() });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        return `${diffMinutes}분 전`;
      }
      return `${diffHours}시간 전`;
    } else if (diffDays < 7) {
      return `${diffDays}일 전`;
    } else {
      return date.toLocaleDateString('ko-KR');
    }
  };

  const getCategoryBadge = (cat: string) => {
    const badges: Record<string, { text: string; color: string }> = {
      notice: { text: '공지', color: 'bg-red-100 text-red-800' },
      anonymous: { text: '익명', color: 'bg-gray-100 text-gray-800' },
      'wargame-ctf': { text: 'CTF', color: 'bg-blue-100 text-blue-800' },
    };
    const badge = badges[cat] || { text: cat, color: 'bg-gray-100 text-gray-800' };
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}
      >
        {badge.text}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">게시판</h1>
        {isAuthenticated && (
          <Link
            to="/boards/new"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium"
          >
            글쓰기
          </Link>
        )}
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4">
          <CategoryTabs
            tabs={BOARD_CATEGORIES}
            activeTab={category}
            onChange={handleCategoryChange}
          />
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">로딩 중...</div>
        ) : boards.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            게시글이 없습니다.
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-200">
              {boards.map((board) => (
                <Link
                  key={board._id}
                  to={`/boards/${board._id}`}
                  className="block px-6 py-4 hover:bg-gray-50 transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {getCategoryBadge(board.category)}
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {board.title}
                        </h3>
                      </div>
                      <div className="flex items-center text-sm text-gray-500 space-x-4">
                        <span>{board.author.username}</span>
                        <span>조회 {board.views}</span>
                        <span>댓글 {board.comments.length}</span>
                        <span>좋아요 {board.likes.length}</span>
                        <span>{formatDate(board.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="px-6 py-4">
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BoardList;

