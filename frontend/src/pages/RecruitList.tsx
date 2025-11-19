import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { recruitService, Recruit } from '../services/recruit.service';
import { useAuthStore } from '../store/authStore';
import CategoryTabs from '../components/CategoryTabs';
import Pagination from '../components/Pagination';

const RECRUIT_CATEGORIES = [
  { value: 'all', label: '전체' },
  { value: 'ctf', label: 'CTF' },
  { value: 'project', label: '프로젝트' },
  { value: 'study', label: '스터디' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'recruiting', label: '모집중' },
  { value: 'closed', label: '마감' },
];

const RecruitList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [recruits, setRecruits] = useState<Recruit[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });

  const category = searchParams.get('category') || 'all';
  const status = searchParams.get('status') || 'all';
  const page = parseInt(searchParams.get('page') || '1');
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    loadRecruits();
  }, [category, status, page]);

  const loadRecruits = async () => {
    try {
      setLoading(true);
      const data = await recruitService.getRecruits(category, status, page);
      setRecruits(data.recruits);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Failed to load recruits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (newCategory: string) => {
    setSearchParams({ category: newCategory, status, page: '1' });
  };

  const handleStatusChange = (newStatus: string) => {
    setSearchParams({ category, status: newStatus, page: '1' });
  };

  const handlePageChange = (newPage: number) => {
    setSearchParams({ category, status, page: newPage.toString() });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR');
  };

  const getCategoryBadge = (cat: string) => {
    const badges: Record<string, { text: string; color: string }> = {
      ctf: { text: 'CTF', color: 'bg-blue-100 text-blue-800' },
      project: { text: '프로젝트', color: 'bg-green-100 text-green-800' },
      study: { text: '스터디', color: 'bg-purple-100 text-purple-800' },
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

  const getStatusBadge = (stat: string) => {
    return stat === 'recruiting' ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        모집중
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        마감
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">모집</h1>
        {isAuthenticated && (
          <Link
            to="/recruits/new"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium"
          >
            모집글 작성
          </Link>
        )}
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4">
          <CategoryTabs
            tabs={RECRUIT_CATEGORIES}
            activeTab={category}
            onChange={handleCategoryChange}
          />
        </div>

        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">상태:</span>
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleStatusChange(opt.value)}
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  status === opt.value
                    ? 'bg-indigo-100 text-indigo-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">로딩 중...</div>
        ) : recruits.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            모집글이 없습니다.
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-200">
              {recruits.map((recruit) => (
                <Link
                  key={recruit._id}
                  to={`/recruits/${recruit._id}`}
                  className="block px-6 py-4 hover:bg-gray-50 transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {getCategoryBadge(recruit.category)}
                        {getStatusBadge(recruit.status)}
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {recruit.title}
                        </h3>
                      </div>
                      <div className="flex items-center text-sm text-gray-500 space-x-4 mb-2">
                        <span>{recruit.author.username}</span>
                        <span>
                          {recruit.currentMembers}/{recruit.maxMembers}명
                        </span>
                        <span>조회 {recruit.views}</span>
                        <span>댓글 {recruit.comments.length}</span>
                        <span>{formatDate(recruit.createdAt)}</span>
                      </div>
                      {recruit.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {recruit.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
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

export default RecruitList;

