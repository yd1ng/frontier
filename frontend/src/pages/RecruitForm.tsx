import { useState, useEffect, FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { recruitService, CreateRecruitData } from '../services/recruit.service';

const RecruitForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [formData, setFormData] = useState<CreateRecruitData & { status?: string }>({
    title: '',
    content: '',
    category: 'ctf',
    maxMembers: 5,
    tags: [],
    deadline: '',
  });
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit && id) {
      loadRecruit();
    }
  }, [id]);

  const loadRecruit = async () => {
    try {
      const recruit = await recruitService.getRecruit(id!);
      setFormData({
        title: recruit.title,
        content: recruit.content,
        category: recruit.category,
        maxMembers: recruit.maxMembers,
        tags: recruit.tags,
        deadline: recruit.deadline
          ? new Date(recruit.deadline).toISOString().slice(0, 16)
          : '',
        status: recruit.status,
      });
    } catch (error) {
      console.error('Failed to load recruit:', error);
      alert('모집글을 불러오는데 실패했습니다.');
      navigate('/recruits');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim() || !formData.content.trim()) {
      setError('제목과 내용을 입력해주세요.');
      return;
    }

    if (formData.maxMembers < 1) {
      setError('최대 인원은 1명 이상이어야 합니다.');
      return;
    }

    try {
      setLoading(true);
      const submitData: any = {
        title: formData.title,
        content: formData.content,
        category: formData.category,
        maxMembers: formData.maxMembers,
        tags: formData.tags,
        deadline: formData.deadline || undefined,
      };

      if (isEdit) {
        submitData.status = formData.status;
        await recruitService.updateRecruit(id!, submitData);
        alert('모집글이 수정되었습니다.');
      } else {
        const recruit = await recruitService.createRecruit(submitData);
        alert('모집글이 작성되었습니다.');
        navigate(`/recruits/${recruit._id}`);
        return;
      }
      navigate(`/recruits/${id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || '모집글 작성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter((t) => t !== tag) || [],
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-night">
      <div className="mb-4">
        <Link
          to={isEdit ? `/recruits/${id}` : '/recruits'}
          className="text-night-muted hover:text-night"
        >
          ← 뒤로가기
        </Link>
      </div>

      <div className="card bg-surface-2 border border-night p-8 shadow-card">
        <h1 className="text-3xl font-semibold text-night-heading mb-6">
          {isEdit ? '모집글 수정' : '모집글 작성'}
        </h1>

        {error && <div className="alert alert-error mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-night mb-2">
              카테고리
            </label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value as any })
              }
              className="input bg-[#0f1626]"
              disabled={isEdit}
            >
              <option value="ctf">CTF</option>
              <option value="project">프로젝트</option>
              <option value="study">스터디</option>
            </select>
          </div>

          {isEdit && (
            <div>
              <label className="block text-sm font-medium text-night mb-2">
                모집 상태
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className="input bg-[#0f1626]"
              >
                <option value="recruiting">모집중</option>
                <option value="closed">마감</option>
              </select>
            </div>
          )}

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

          <div>
            <label className="block text-sm font-medium text-night mb-2">
              모집 인원
            </label>
            <input
              type="number"
              value={formData.maxMembers}
              onChange={(e) =>
                setFormData({ ...formData, maxMembers: parseInt(e.target.value) })
              }
              min="1"
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-night mb-2">
              마감일 (선택사항)
            </label>
            <input
              type="datetime-local"
              value={formData.deadline}
              onChange={(e) =>
                setFormData({ ...formData, deadline: e.target.value })
              }
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-night mb-2">
              태그
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="태그 입력 후 추가 버튼 클릭"
                className="flex-1 input"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="btn btn-secondary"
              >
                추가
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags?.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-[#261c44] text-night"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-2 text-night-muted hover:text-night-heading"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Link
              to={isEdit ? `/recruits/${id}` : '/recruits'}
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

export default RecruitForm;

