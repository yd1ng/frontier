import api from './api';

export interface Recruit {
  _id: string;
  title: string;
  content: string;
  category: 'ctf' | 'project' | 'study';
  author: {
    _id: string;
    username: string;
  };
  status: 'recruiting' | 'closed';
  maxMembers: number;
  currentMembers: number;
  tags: string[];
  deadline?: string;
  views: number;
  likes: string[];
  comments: RecruitComment[];
  createdAt: string;
  updatedAt: string;
}

export interface RecruitComment {
  _id: string;
  author: {
    _id: string;
    username: string;
  };
  content: string;
  createdAt: string;
}

export interface CreateRecruitData {
  title: string;
  content: string;
  category: 'ctf' | 'project' | 'study';
  maxMembers: number;
  tags?: string[];
  deadline?: string;
}

export const recruitService = {
  async getRecruits(category?: string, status?: string, page = 1, limit = 20) {
    const params = new URLSearchParams();
    if (category && category !== 'all') params.append('category', category);
    if (status && status !== 'all') params.append('status', status);
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    const response = await api.get(`/recruits?${params.toString()}`);
    return response.data;
  },

  async getRecruit(id: string) {
    const response = await api.get(`/recruits/${id}`);
    return response.data.recruit;
  },

  async createRecruit(data: CreateRecruitData) {
    const response = await api.post('/recruits', data);
    return response.data.recruit;
  },

  async updateRecruit(id: string, data: Partial<CreateRecruitData & { status: string }>) {
    const response = await api.put(`/recruits/${id}`, data);
    return response.data.recruit;
  },

  async deleteRecruit(id: string) {
    const response = await api.delete(`/recruits/${id}`);
    return response.data;
  },

  async likeRecruit(id: string) {
    const response = await api.post(`/recruits/${id}/like`);
    return response.data;
  },

  async addComment(recruitId: string, content: string) {
    const response = await api.post(`/recruits/${recruitId}/comments`, {
      content,
    });
    return response.data.comment;
  },

  async deleteComment(recruitId: string, commentId: string) {
    const response = await api.delete(`/recruits/${recruitId}/comments/${commentId}`);
    return response.data;
  },
};

