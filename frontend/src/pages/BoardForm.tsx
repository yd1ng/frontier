import { useState, useEffect, FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { boardService, CreateBoardData } from '../services/board.service';
import { useAuthStore } from '../store/authStore';

const BoardForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isEdit = !!id;

  const [formData, setFormData] = useState<CreateBoardData>({
    title: '',
    content: '',
    category: 'anonymous',
    isAnonymous: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit && id) {
      loadBoard();
    }
  }, [id]);

  const loadBoard = async () => {
    try {
      const board = await boardService.getBoard(id!);
      setFormData({
        title: board.title,
        content: board.content,
        category: board.category,
        isAnonymous: board.isAnonymous,
      });
    } catch (error) {
      console.error('Failed to load board:', error);
      alert('게시글을 불러오는데 실패했습니다.');
      navigate('/boards');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim() || !formData.content.trim()) {
      setError('제목과 내용을 입력해주세요.');
      return;
    }

    if (formData.category === 'notice' && user?.role !== 'admin') {
      setError('공지사항은 관리자만 작성할 수 있습니다.');
      return;
    }

    try {
      setLoading(true);
      if (isEdit) {
        await boardService.updateBoard(id!, formData);
        alert('게시글이 수정되었습니다.');
      } else {
        const board = await boardService.createBoard(formData);
        alert('게시글이 작성되었습니다.');
        navigate(`/boards/${board._id}`);
        return;
      }
      navigate(`/boards/${id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || '게시글 작성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-night">
      <div className="mb-4">
        <Link
          to={isEdit ? `/boards/${id}` : '/boards'}
          className="text-night-muted hover:text-night"
        >
          ← 뒤로가기
        </Link>
      </div>

      <div className="card bg-surface-2 border border-night p-8 shadow-card">
        <h1 className="text-3xl font-semibold text-night-heading mb-6">
          {isEdit ? '게시글 수정' : '게시글 작성'}
        </h1>

        {error && (
          <div className="alert alert-error mb-4">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-night mb-2">
              카테고리
            </label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  category: e.target.value as any,
                })
              }
              className="input bg-[#0f1626]"
              disabled={isEdit}
            >
              {user?.role === 'admin' && (
                <option value="notice">공지사항</option>
              )}
              <option value="anonymous">익명 게시판</option>
              <option value="wargame-ctf">워게임 & CTF</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-night mb-2">
              제목
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="제목을 입력하세요"
              className="input"
              maxLength={200}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-night mb-2">
              내용
            </label>
            <textarea
              value={formData.content}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
              placeholder="내용을 입력하세요"
              className="input min-h-[320px]"
              rows={15}
            />
          </div>

          {formData.category !== 'notice' && (
            <div>
              <label className="flex items-center text-night-muted">
                <input
                  type="checkbox"
                  checked={formData.isAnonymous}
                  onChange={(e) =>
                    setFormData({ ...formData, isAnonymous: e.target.checked })
                  }
                  className="mr-2 accent-[#7c5dfa]"
                />
                <span className="text-sm">익명으로 작성</span>
              </label>
            </div>
          )}

          <div className="flex justify-end space-x-4">
            <Link
              to={isEdit ? `/boards/${id}` : '/boards'}
              className="btn btn-secondary"
            >
              취소
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? '처리 중...' : isEdit ? '수정하기' : '작성하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BoardForm;

