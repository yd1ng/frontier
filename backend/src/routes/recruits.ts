import express, { Response } from 'express';
import { body, validationResult } from 'express-validator';
import Recruit from '../models/Recruit';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { createPostLimiter, commentLimiter } from '../middleware/security';
import { validateObjectId, validateObjectIds } from '../middleware/validation';
import { io } from '../server';

const router = express.Router();

// 모집글 목록 조회
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { category, status, page = '1', limit = '20' } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const query: any = {};
    if (category && category !== 'all') {
      query.category = category;
    }
    if (status && status !== 'all') {
      query.status = status;
    }

    const total = await Recruit.countDocuments(query);
    const recruits = await Recruit.find(query)
      .populate('author', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.json({
      recruits,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get recruits error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== 팀 채팅 기능 ====================

// 사용자가 참가한 모든 채팅방 목록 조회 (/:id보다 먼저 정의해야 함)
router.get(
  '/my-chats',
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userIdStr = req.userId as string;

      // 사용자가 작성자이거나 멤버인 모든 모집글 조회
      const recruits = await Recruit.find({
        $or: [
          { author: userIdStr },
          { members: userIdStr },
        ],
      })
        .populate('author', 'username')
        .populate('members', 'username _id')
        .populate('teamChat.author', 'username _id')
        .select('title category status author members teamChat createdAt updatedAt')
        .sort({ updatedAt: -1 });

      // 각 채팅방의 마지막 메시지 정보 포함
      const chatRooms = recruits.map(recruit => {
        // teamChat을 createdAt 순으로 정렬하여 마지막 메시지 찾기
        const sortedChat = recruit.teamChat && recruit.teamChat.length > 0
          ? [...recruit.teamChat].sort((a: any, b: any) => {
              const dateA = new Date(a.createdAt).getTime();
              const dateB = new Date(b.createdAt).getTime();
              return dateB - dateA; // 최신순
            })
          : [];
        
        const lastMessage = sortedChat.length > 0 ? sortedChat[0] : null;

        // members 배열에는 작성자가 포함되어 있으므로 그대로 사용
        // (작성자 + 승인된 멤버들)
        return {
          _id: recruit._id,
          title: recruit.title,
          category: recruit.category,
          status: recruit.status,
          author: recruit.author,
          members: recruit.members, // 이미 작성자 포함
          lastMessage: lastMessage ? {
            _id: lastMessage._id.toString(),
            content: lastMessage.content,
            createdAt: lastMessage.createdAt,
            author: lastMessage.author ? {
              _id: (lastMessage.author as any)._id?.toString() || lastMessage.author.toString(),
              username: (lastMessage.author as any).username || 'Unknown',
            } : null,
          } : null,
          unreadCount: 0, // TODO: 읽지 않은 메시지 수 계산
          createdAt: recruit.createdAt,
          updatedAt: recruit.updatedAt,
        };
      });

      res.json({ chatRooms });
    } catch (error) {
      console.error('Get my chats error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// 모집글 상세 조회
router.get('/:id', validateObjectId('id'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const recruit = await Recruit.findById(req.params.id)
      .populate('author', 'username')
      .populate('comments.author', 'username')
      .populate('members', 'username')
      .populate('pendingMembers', 'username');

    if (!recruit) {
      res.status(404).json({ error: 'Recruit not found' });
      return;
    }

    // 조회수 증가
    recruit.views += 1;
    await recruit.save();

    res.json({ recruit });
  } catch (error) {
    console.error('Get recruit error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 모집글 작성
router.post(
  '/',
  authenticateToken,
  createPostLimiter,
  [
    body('title')
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('Title must be between 1 and 200 characters'),
    body('content').trim().notEmpty().withMessage('Content is required'),
    body('category')
      .isIn(['ctf', 'project', 'study'])
      .withMessage('Invalid category'),
    body('maxMembers')
      .isInt({ min: 1 })
      .withMessage('Max members must be at least 1'),
    body('deadline')
      .notEmpty()
      .withMessage('Deadline is required')
      .isISO8601()
      .withMessage('Deadline must be a valid date'),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { title, content, category, maxMembers, tags, images, deadline } = req.body;

      const recruit = new Recruit({
        title,
        content,
        category,
        author: req.userId,
        maxMembers,
        currentMembers: 1,
        members: [req.userId], // 작성자를 자동으로 팀원에 추가
        pendingMembers: [],
        tags: tags || [],
        images: images || [],
        deadline: new Date(deadline),
      });

      await recruit.save();
      await recruit.populate('author', 'username');
      await recruit.populate('members', 'username');

      res.status(201).json({
        message: 'Recruit created successfully',
        recruit,
      });
    } catch (error) {
      console.error('Create recruit error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// 모집글 수정
router.put(
  '/:id',
  authenticateToken,
  validateObjectId('id'),
  [
    body('title')
      .optional()
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('Title must be between 1 and 200 characters'),
    body('content')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Content cannot be empty'),
    body('maxMembers')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Max members must be at least 1'),
    body('currentMembers')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Current members must be at least 1'),
    body('deadline')
      .notEmpty()
      .withMessage('Deadline is required')
      .isISO8601()
      .withMessage('Deadline must be a valid date'),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const recruit = await Recruit.findById(req.params.id);
      if (!recruit) {
        res.status(404).json({ error: 'Recruit not found' });
        return;
      }

      // 작성자 또는 관리자만 수정 가능
      if (
        recruit.author.toString() !== req.userId &&
        req.userRole !== 'admin'
      ) {
        res.status(403).json({ error: 'Not authorized' });
        return;
      }

      const { title, content, maxMembers, currentMembers, status, tags, images, deadline } = req.body;
      
      if (title) recruit.title = title;
      if (content) recruit.content = content;
      if (maxMembers) recruit.maxMembers = maxMembers;
      if (images !== undefined) recruit.images = images;
      if (currentMembers !== undefined) {
        // currentMembers는 maxMembers를 초과할 수 없음
        if (currentMembers > recruit.maxMembers) {
          res.status(400).json({ error: 'Current members cannot exceed max members' });
          return;
        }
        recruit.currentMembers = currentMembers;
      }
      if (status) recruit.status = status;
      if (tags) recruit.tags = tags;
      if (deadline) recruit.deadline = new Date(deadline);

      await recruit.save();
      await recruit.populate('author', 'username');

      res.json({
        message: 'Recruit updated successfully',
        recruit,
      });
    } catch (error) {
      console.error('Update recruit error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// 모집글 삭제
router.delete(
  '/:id',
  authenticateToken,
  validateObjectId('id'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const recruit = await Recruit.findById(req.params.id);
      if (!recruit) {
        res.status(404).json({ error: 'Recruit not found' });
        return;
      }

      // 작성자 또는 관리자만 삭제 가능
      if (
        recruit.author.toString() !== req.userId &&
        req.userRole !== 'admin'
      ) {
        res.status(403).json({ error: 'Not authorized' });
        return;
      }

      await Recruit.findByIdAndDelete(req.params.id);
      res.json({ message: 'Recruit deleted successfully' });
    } catch (error) {
      console.error('Delete recruit error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// 모집글 좋아요
router.post(
  '/:id/like',
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const recruit = await Recruit.findById(req.params.id);
      if (!recruit) {
        res.status(404).json({ error: 'Recruit not found' });
        return;
      }

      const userIdStr = req.userId as string;
      const likeIndex = recruit.likes.findIndex(
        (id) => id.toString() === userIdStr
      );

      if (likeIndex > -1) {
        recruit.likes.splice(likeIndex, 1);
      } else {
        recruit.likes.push(userIdStr as any);
      }

      await recruit.save();
      res.json({
        message: 'Like updated',
        likes: recruit.likes.length,
        isLiked: likeIndex === -1,
      });
    } catch (error) {
      console.error('Like recruit error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// 댓글 작성
router.post(
  '/:id/comments',
  authenticateToken,
  commentLimiter,
  [body('content').trim().notEmpty().withMessage('Comment content is required')],
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const recruit = await Recruit.findById(req.params.id);
      if (!recruit) {
        res.status(404).json({ error: 'Recruit not found' });
        return;
      }

      const { content } = req.body;

      recruit.comments.push({
        author: req.userId as any,
        content,
        createdAt: new Date(),
      } as any);

      await recruit.save();
      await recruit.populate('comments.author', 'username');

      const lastComment = recruit.comments[recruit.comments.length - 1];

      res.status(201).json({
        message: 'Comment added successfully',
        comment: lastComment,
      });
    } catch (error) {
      console.error('Add comment error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// 댓글 삭제
router.delete(
  '/:recruitId/comments/:commentId',
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const recruit = await Recruit.findById(req.params.recruitId);
      if (!recruit) {
        res.status(404).json({ error: 'Recruit not found' });
        return;
      }

      const comment = recruit.comments.id(req.params.commentId);
      if (!comment) {
        res.status(404).json({ error: 'Comment not found' });
        return;
      }

      // 댓글 작성자 또는 관리자만 삭제 가능
      if (
        comment.author.toString() !== req.userId &&
        req.userRole !== 'admin'
      ) {
        res.status(403).json({ error: 'Not authorized' });
        return;
      }

      recruit.comments.pull(req.params.commentId);
      await recruit.save();

      res.json({ message: 'Comment deleted successfully' });
    } catch (error) {
      console.error('Delete comment error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// ==================== 팀 참가 기능 ====================

// 팀 참가 신청
router.post(
  '/:id/join',
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const recruit = await Recruit.findById(req.params.id);
      if (!recruit) {
        res.status(404).json({ error: 'Recruit not found' });
        return;
      }

      // 모집 완료된 경우
      if (recruit.status === 'closed') {
        res.status(400).json({ error: '모집이 마감되었습니다' });
        return;
      }

      // 이미 팀원인 경우
      const userIdStr = req.userId as string;
      if (recruit.members.some(id => id.toString() === userIdStr)) {
        res.status(400).json({ error: '이미 팀원입니다' });
        return;
      }

      // 이미 참가 신청한 경우
      if (recruit.pendingMembers.some(id => id.toString() === userIdStr)) {
        res.status(400).json({ error: '이미 참가 신청했습니다' });
        return;
      }

      // 팀원이 가득 찬 경우
      if (recruit.currentMembers >= recruit.maxMembers) {
        res.status(400).json({ error: '팀원이 가득 찼습니다' });
        return;
      }

      recruit.pendingMembers.push(userIdStr as any);
      await recruit.save();

      res.json({ message: '참가 신청이 완료되었습니다' });
    } catch (error) {
      console.error('Join team error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// 팀 참가 신청 취소
router.delete(
  '/:id/join',
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const recruit = await Recruit.findById(req.params.id);
      if (!recruit) {
        res.status(404).json({ error: 'Recruit not found' });
        return;
      }

      const userIdStr = req.userId as string;
      recruit.pendingMembers = recruit.pendingMembers.filter(
        id => id.toString() !== userIdStr
      );
      await recruit.save();

      res.json({ message: '참가 신청이 취소되었습니다' });
    } catch (error) {
      console.error('Cancel join error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// 팀 참가 승인/거부 (작성자만)
router.post(
  '/:id/approve/:userId',
  authenticateToken,
  validateObjectIds('id', 'userId'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const recruit = await Recruit.findById(req.params.id);
      if (!recruit) {
        res.status(404).json({ error: 'Recruit not found' });
        return;
      }

      // 작성자만 승인 가능
      if (recruit.author.toString() !== req.userId) {
        res.status(403).json({ error: 'Not authorized' });
        return;
      }

      const { userId } = req.params;
      const { approve } = req.body; // true: 승인, false: 거부

      // 대기 목록에 있는지 확인
      if (!recruit.pendingMembers.some(id => id.toString() === userId)) {
        res.status(400).json({ error: '참가 신청 내역이 없습니다' });
        return;
      }

      // 대기 목록에서 제거
      recruit.pendingMembers = recruit.pendingMembers.filter(
        id => id.toString() !== userId
      );

      if (approve) {
        // 팀원이 가득 찬 경우
        if (recruit.currentMembers >= recruit.maxMembers) {
          await recruit.save();
          res.status(400).json({ error: '팀원이 가득 찼습니다' });
          return;
        }

        // 팀원 추가
        recruit.members.push(userId as any);
        recruit.currentMembers += 1;
      }

      await recruit.save();
      await recruit.populate('members', 'username');
      await recruit.populate('pendingMembers', 'username');

      res.json({
        message: approve ? '팀원이 승인되었습니다' : '참가가 거부되었습니다',
        members: recruit.members,
        pendingMembers: recruit.pendingMembers,
      });
    } catch (error) {
      console.error('Approve member error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// 팀원 강제 퇴출 (작성자만)
router.delete(
  '/:id/members/:userId',
  authenticateToken,
  validateObjectIds('id', 'userId'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const recruit = await Recruit.findById(req.params.id);
      if (!recruit) {
        res.status(404).json({ error: 'Recruit not found' });
        return;
      }

      // 작성자만 퇴출 가능
      if (recruit.author.toString() !== req.userId) {
        res.status(403).json({ error: 'Not authorized' });
        return;
      }

      const { userId } = req.params;
      
      recruit.members = recruit.members.filter(id => id.toString() !== userId);
      recruit.currentMembers = Math.max(1, recruit.currentMembers - 1);
      await recruit.save();

      res.json({ message: '팀원이 퇴출되었습니다' });
    } catch (error) {
      console.error('Remove member error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// 팀 채팅 메시지 조회
router.get(
  '/:id/chat',
  authenticateToken,
  validateObjectId('id'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const recruit = await Recruit.findById(req.params.id)
        .populate('teamChat.author', 'username')
        .populate('members', 'username');

      if (!recruit) {
        res.status(404).json({ error: 'Recruit not found' });
        return;
      }

      // 팀원만 채팅 조회 가능 (작성자 또는 members 배열에 포함된 사용자)
      const userIdStr = req.userId as string;
      const isAuthor = recruit.author.toString() === userIdStr;
      // populate된 경우와 아닌 경우 모두 처리
      const isMember = recruit.members.some((member: any) => {
        const memberId = member._id ? member._id.toString() : member.toString();
        return memberId === userIdStr;
      });

      if (!isAuthor && !isMember) {
        res.status(403).json({ error: '팀원만 채팅을 볼 수 있습니다' });
        return;
      }

      // 채팅 메시지를 createdAt 순서로 정렬 (오래된 것부터 최신 순)
      const sortedMessages = [...recruit.teamChat].sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateA - dateB;
      });

      res.json({
        messages: sortedMessages,
        members: recruit.members,
      });
    } catch (error) {
      console.error('Get team chat error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// 팀 채팅 메시지 전송
router.post(
  '/:id/chat',
  authenticateToken,
  validateObjectId('id'),
  commentLimiter,
  [body('content').trim().notEmpty().withMessage('Message content is required')],
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const recruit = await Recruit.findById(req.params.id);
      if (!recruit) {
        res.status(404).json({ error: 'Recruit not found' });
        return;
      }

      // 팀원만 채팅 가능 (작성자 또는 members 배열에 포함된 사용자)
      const userIdStr = req.userId as string;
      const isAuthor = recruit.author.toString() === userIdStr;
      // populate된 경우와 아닌 경우 모두 처리
      const isMember = recruit.members.some((member: any) => {
        const memberId = member._id ? member._id.toString() : member.toString();
        return memberId === userIdStr;
      });

      if (!isAuthor && !isMember) {
        res.status(403).json({ error: '팀원만 채팅할 수 있습니다' });
        return;
      }

      const { content } = req.body;

      // 메시지 크기 제한 (1000자)
      if (content.length > 1000) {
        res.status(400).json({ error: '메시지는 1000자 이하여야 합니다.' });
        return;
      }

      // XSS 방지: HTML 태그 제거 및 이스케이프
      const sanitizedContent = content
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');

      recruit.teamChat.push({
        author: userIdStr as any,
        content: sanitizedContent,
        createdAt: new Date(),
      } as any);

      await recruit.save();
      
      // 메시지를 populate하기 위해 다시 조회
      const updatedRecruit = await Recruit.findById(req.params.id)
        .populate('teamChat.author', 'username _id');
      
      if (!updatedRecruit) {
        res.status(404).json({ error: 'Recruit not found' });
        return;
      }

      const lastMessage = updatedRecruit.teamChat[updatedRecruit.teamChat.length - 1];
      
      // 메시지 객체를 JSON으로 변환하여 author 정보 확실히 포함
      const messageData = {
        _id: lastMessage._id.toString(),
        author: {
          _id: (lastMessage.author as any)._id.toString(),
          username: (lastMessage.author as any).username,
        },
        content: lastMessage.content,
        createdAt: lastMessage.createdAt,
      };

      // Socket.io로 실시간 메시지 브로드캐스트
      io.to(`team-${req.params.id}`).emit('team-message', messageData);

      res.status(201).json({
        message: 'Message sent successfully',
        chatMessage: messageData,
      });
    } catch (error) {
      console.error('Send team chat error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// 팀 채팅 메시지 삭제
router.delete(
  '/:recruitId/chat/:messageId',
  authenticateToken,
  validateObjectIds('recruitId', 'messageId'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const recruit = await Recruit.findById(req.params.recruitId);
      if (!recruit) {
        res.status(404).json({ error: 'Recruit not found' });
        return;
      }

      const message = recruit.teamChat.id(req.params.messageId);
      if (!message) {
        res.status(404).json({ error: 'Message not found' });
        return;
      }

      // 메시지 작성자 또는 모집글 작성자만 삭제 가능
      const isAuthor = recruit.author.toString() === req.userId;
      const isMessageAuthor = message.author.toString() === req.userId;

      if (!isAuthor && !isMessageAuthor && req.userRole !== 'admin') {
        res.status(403).json({ error: 'Not authorized' });
        return;
      }

      recruit.teamChat.pull(req.params.messageId);
      await recruit.save();

      res.json({ message: 'Message deleted successfully' });
    } catch (error) {
      console.error('Delete team chat error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

export default router;

