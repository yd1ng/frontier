import { useState, useEffect, FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { recruitService, Recruit } from '../services/recruit.service';
import { useAuthStore } from '../store/authStore';

const RecruitDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [recruit, setRecruit] = useState<Recruit | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (id) {
      loadRecruit();
    }
  }, [id]);

  const loadRecruit = async () => {
    try {
      setLoading(true);
      const data = await recruitService.getRecruit(id!);
      setRecruit(data);
    } catch (error) {
      console.error('Failed to load recruit:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      await recruitService.likeRecruit(id!);
      loadRecruit();
    } catch (error) {
      console.error('Failed to like recruit:', error);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('정말 삭제하시겠습니까?')) {
      return;
    }

    try {
      await recruitService.deleteRecruit(id!);
      alert('삭제되었습니다.');
      navigate('/recruits');
    } catch (error) {
      console.error('Failed to delete recruit:', error);
      alert('삭제에 실패했습니다.');
    }
  };

  const handleCommentSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      return;
    }

    try {
      setSubmitting(true);
      await recruitService.addComment(id!, comment);
      setComment('');
      loadRecruit();
    } catch (error) {
      console.error('Failed to add comment:', error);
      alert('댓글 작성에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCommentDelete = async (commentId: string) => {
    if (!window.confirm('댓글을 삭제하시겠습니까?')) {
      return;
    }

    try {
      await recruitService.deleteComment(id!, commentId);
      loadRecruit();
    } catch (error) {
      console.error('Failed to delete comment:', error);
      alert('댓글 삭제에 실패했습니다.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR');
  };

  const getCategoryName = (cat: string) => {
    const names: Record<string, string> = {
      ctf: 'CTF',
      project: '프로젝트',
      study: '스터디',
    };
    return names[cat] || cat;
  };

  const isAuthor = recruit && user && recruit.author._id === user.id;
  const isAdmin = user?.role === 'admin';

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (!recruit) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-gray-500">모집글을 찾을 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-4">
        <Link
          to="/recruits"
          className="text-indigo-600 hover:text-indigo-800"
        >
          ← 목록으로
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* 헤더 */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                {getCategoryName(recruit.category)}
              </span>
              <span
                className={`px-2 py-1 text-xs font-medium rounded ${
                  recruit.status === 'recruiting'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {recruit.status === 'recruiting' ? '모집중' : '마감'}
              </span>
            </div>
            {(isAuthor || isAdmin) && (
              <div className="flex space-x-2">
                <Link
                  to={`/recruits/${id}/edit`}
                  className="text-sm text-indigo-600 hover:text-indigo-800"
                >
                  수정
                </Link>
                <button
                  onClick={handleDelete}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  삭제
                </button>
              </div>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {recruit.title}
          </h1>
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-4">
              <span>{recruit.author.username}</span>
              <span>{formatDate(recruit.createdAt)}</span>
            </div>
            <div className="flex items-center space-x-4">
              <span>
                {recruit.currentMembers}/{recruit.maxMembers}명
              </span>
              <span>조회 {recruit.views}</span>
              <span>좋아요 {recruit.likes.length}</span>
            </div>
          </div>
          {recruit.deadline && (
            <div className="mt-2 text-sm text-red-600">
              마감일: {formatDate(recruit.deadline)}
            </div>
          )}
        </div>

        {/* 태그 */}
        {recruit.tags.length > 0 && (
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
            <div className="flex flex-wrap gap-2">
              {recruit.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-800"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 내용 */}
        <div className="px-6 py-8">
          <div className="prose max-w-none">
            <div style={{ whiteSpace: 'pre-wrap' }}>{recruit.content}</div>
          </div>
        </div>

        {/* 좋아요 버튼 */}
        <div className="px-6 py-4 border-t border-gray-200">
          <button
            onClick={handleLike}
            disabled={!isAuthenticated}
            className="flex items-center space-x-2 mx-auto bg-gray-100 hover:bg-gray-200 text-gray-800 px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>👍</span>
            <span>좋아요 {recruit.likes.length}</span>
          </button>
        </div>

        {/* 댓글 */}
        <div className="px-6 py-4 border-t border-gray-200">
          <h3 className="text-lg font-semibold mb-4">
            댓글 {recruit.comments.length}
          </h3>

          {isAuthenticated && (
            <form onSubmit={handleCommentSubmit} className="mb-6">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="댓글을 입력하세요"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={3}
              />
              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={submitting || !comment.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? '작성 중...' : '댓글 작성'}
                </button>
              </div>
            </form>
          )}

          <div className="space-y-4">
            {recruit.comments.map((comment) => (
              <div
                key={comment._id}
                className="bg-gray-50 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="font-semibold text-gray-900">
                      {comment.author.username}
                    </span>
                    <span className="text-sm text-gray-500 ml-2">
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>
                  {isAuthenticated &&
                    (user?.id === comment.author._id || isAdmin) && (
                      <button
                        onClick={() => handleCommentDelete(comment._id)}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        삭제
                      </button>
                    )}
                </div>
                <p className="text-gray-700" style={{ whiteSpace: 'pre-wrap' }}>
                  {comment.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecruitDetail;

