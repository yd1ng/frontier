import express, { Response } from 'express';
import { uploadImages } from '../middleware/upload';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// 이미지 업로드 엔드포인트
router.post(
  '/',
  authenticateToken,
  (req: AuthRequest, res: Response, next: Function) => {
    uploadImages(req, res, (err: any) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  },
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
        res.status(400).json({ error: 'No files uploaded' });
        return;
      }

      const files = req.files as Express.Multer.File[];
      const imageUrls = files.map((file) => `/uploads/${file.filename}`);

      res.json({
        message: 'Images uploaded successfully',
        images: imageUrls,
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: 'Failed to upload images' });
    }
  }
);

// 이미지 삭제 엔드포인트
router.delete(
  '/:filename',
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { filename } = req.params;
      const filePath = path.join(__dirname, '../../uploads', filename);

      // 파일 존재 확인
      if (!fs.existsSync(filePath)) {
        res.status(404).json({ error: 'File not found' });
        return;
      }

      // 파일 삭제
      fs.unlinkSync(filePath);

      res.json({ message: 'Image deleted successfully' });
    } catch (error) {
      console.error('Delete image error:', error);
      res.status(500).json({ error: 'Failed to delete image' });
    }
  }
);

export default router;

