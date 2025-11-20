import express, { Response } from 'express';
import { body, validationResult } from 'express-validator';
import Board from '../models/Board';
import { authenticateToken, isAdmin, AuthRequest } from '../middleware/auth';
import { createPostLimiter, commentLimiter } from '../middleware/security';

const router = express.Router();

// 게시글 목록 조회 (카테고리별, 페이지네이션)
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { category, page = '1', limit = '20' } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const query: any = {};
    if (category && category !== 'all') {
      query.category = category;
    }

    const total = await Board.countDocuments(query);
    const boards = await Board.find(query)
      .populate('author', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // 익명 게시글의 경우 작성자 username만 '익명'으로 변경 (_id는 유지)
    const boardsWithAnonymous = boards.map((board) => {
      const boardObj = board.toObject();
      if (board.isAnonymous && boardObj.author) {
        boardObj.author = {
          ...boardObj.author,
          username: '익명'
        };
      }
      return boardObj;
    });

    res.json({
      boards: boardsWithAnonymous,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get boards error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 게시글 상세 조회
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const board = await Board.findById(req.params.id)
      .populate('author', 'username')
      .populate('comments.author', 'username');

    if (!board) {
      res.status(404).json({ error: 'Board not found' });
      return;
    }

    // 조회수 증가
    board.views += 1;
    await board.save();

    const boardObj = board.toObject();
    
    // 익명 게시글 처리 - _id는 유지하되 username만 변경
    if (board.isAnonymous && boardObj.author) {
      boardObj.author = {
        ...boardObj.author,
        username: '익명'
      };
    }

    // 익명 댓글 처리 - 각 댓글마다 독립적인 author 객체 생성
    boardObj.comments = boardObj.comments.map((comment: any) => {
      if (comment.isAnonymous && comment.author) {
        return {
          ...comment,
          author: {
            ...comment.author,
            username: '익명'
          }
        };
      }
      return comment;
    });

    res.json({ board: boardObj });
  } catch (error) {
    console.error('Get board error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 게시글 작성
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
      .isIn(['notice', 'anonymous', 'wargame-ctf'])
      .withMessage('Invalid category'),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { title, content, category, isAnonymous } = req.body;

      // 공지사항은 관리자만 작성 가능
      if (category === 'notice' && req.userRole !== 'admin') {
        res.status(403).json({ error: 'Only admins can create notices' });
        return;
      }

      const board = new Board({
        title,
        content,
        category,
        author: req.userId,
        isAnonymous: (isAnonymous === true),
      });

      await board.save();
      await board.populate('author', 'username');

      const boardObj = board.toObject();
      if (board.isAnonymous && boardObj.author) {
        boardObj.author = {
          ...boardObj.author,
          username: '익명'
        };
      }

      res.status(201).json({
        message: 'Board created successfully',
        board: boardObj,
      });
    } catch (error) {
      console.error('Create board error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// 게시글 수정
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
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const board = await Board.findById(req.params.id);
      if (!board) {
        res.status(404).json({ error: 'Board not found' });
        return;
      }

      // 작성자 또는 관리자만 수정 가능
      if (
        board.author.toString() !== req.userId &&
        req.userRole !== 'admin'
      ) {
        res.status(403).json({ error: 'Not authorized' });
        return;
      }

      const { title, content } = req.body;
      if (title) board.title = title;
      if (content) board.content = content;

      await board.save();
      await board.populate('author', 'username');

      const boardObj = board.toObject();
      if (board.isAnonymous) {
        boardObj.author = { username: '익명' };
      }

      res.json({
        message: 'Board updated successfully',
        board: boardObj,
      });
    } catch (error) {
      console.error('Update board error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// 게시글 삭제
router.delete(
  '/:id',
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const board = await Board.findById(req.params.id);
      if (!board) {
        res.status(404).json({ error: 'Board not found' });
        return;
      }

      // 작성자 또는 관리자만 삭제 가능
      if (
        board.author.toString() !== req.userId &&
        req.userRole !== 'admin'
      ) {
        res.status(403).json({ error: 'Not authorized' });
        return;
      }

      await Board.findByIdAndDelete(req.params.id);
      res.json({ message: 'Board deleted successfully' });
    } catch (error) {
      console.error('Delete board error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// 게시글 좋아요
router.post(
  '/:id/like',
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const board = await Board.findById(req.params.id);
      if (!board) {
        res.status(404).json({ error: 'Board not found' });
        return;
      }

      const userIdStr = req.userId as string;
      const likeIndex = board.likes.findIndex(
        (id) => id.toString() === userIdStr
      );

      if (likeIndex > -1) {
        // 이미 좋아요를 눌렀다면 취소
        board.likes.splice(likeIndex, 1);
      } else {
        // 좋아요 추가
        board.likes.push(userIdStr as any);
      }

      await board.save();
      res.json({
        message: 'Like updated',
        likes: board.likes.length,
        isLiked: likeIndex === -1,
      });
    } catch (error) {
      console.error('Like board error:', error);
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

      const board = await Board.findById(req.params.id);
      if (!board) {
        res.status(404).json({ error: 'Board not found' });
        return;
      }

      const { content, isAnonymous } = req.body;

      board.comments.push({
        author: req.userId as any,
        content,
        isAnonymous: (isAnonymous === true),
        createdAt: new Date(),
      } as any);

      await board.save();
      await board.populate('comments.author', 'username');

      const lastComment = board.comments[board.comments.length - 1];
      const commentObj = lastComment.toObject();
      
      if ((lastComment as any).isAnonymous && commentObj.author) {
        commentObj.author = {
          ...commentObj.author,
          username: '익명'
        };
      }

      res.status(201).json({
        message: 'Comment added successfully',
        comment: commentObj,
      });
    } catch (error) {
      console.error('Add comment error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// 댓글 삭제
router.delete(
  '/:boardId/comments/:commentId',
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const board = await Board.findById(req.params.boardId);
      if (!board) {
        res.status(404).json({ error: 'Board not found' });
        return;
      }

      const comment = board.comments.id(req.params.commentId);
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

      board.comments.pull(req.params.commentId);
      await board.save();

      res.json({ message: 'Comment deleted successfully' });
    } catch (error) {
      console.error('Delete comment error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

export default router;

