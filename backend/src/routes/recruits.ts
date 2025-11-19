import express, { Response } from 'express';
import { body, validationResult } from 'express-validator';
import Recruit from '../models/Recruit';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { createPostLimiter, commentLimiter } from '../middleware/security';

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

// 모집글 상세 조회
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const recruit = await Recruit.findById(req.params.id)
      .populate('author', 'username')
      .populate('comments.author', 'username');

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
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { title, content, category, maxMembers, tags, deadline } = req.body;

      const recruit = new Recruit({
        title,
        content,
        category,
        author: req.userId,
        maxMembers,
        currentMembers: 1,
        tags: tags || [],
        deadline: deadline ? new Date(deadline) : undefined,
      });

      await recruit.save();
      await recruit.populate('author', 'username');

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

      const { title, content, maxMembers, currentMembers, status, tags, deadline } = req.body;
      
      if (title) recruit.title = title;
      if (content) recruit.content = content;
      if (maxMembers) recruit.maxMembers = maxMembers;
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

export default router;

