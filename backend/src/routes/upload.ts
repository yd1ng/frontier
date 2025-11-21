import express, { Response } from 'express';
import { uploadImages } from '../middleware/upload';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import fs from 'fs';
import path from 'path';
import FileModel from '../models/File';

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
      const savedFiles = [];

      // [추가된 부분] DB에 파일 정보와 주인을 기록합니다.
      for (const file of files) {
        const newFile = new FileModel({
          filename: file.filename,
          originalName: file.originalname,
          uploader: req.userId, // 주인을 기록하는 핵심 코드
          size: file.size,
          mimetype: file.mimetype,
        });
        await newFile.save();
        savedFiles.push(`/uploads/${file.filename}`);
      }

      res.json({
        message: 'Images uploaded successfully',
        images: savedFiles,
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

      const fileRecord = await FileModel.findOne({ filename });

      if (!fileRecord) {
        res.status(404).json({ error: 'File not found' });
        return;
      }


      if (fileRecord.uploader.toString() !== req.userId && req.userRole !== 'admin') {
        res.status(403).json({ error: 'Permission denied: You do not own this file' });
        return;
      }


      const filePath = path.join(__dirname, '../../uploads', filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      await FileModel.deleteOne({ _id: fileRecord._id });

      res.json({ message: 'Image deleted successfully' });
    } catch (error) {
      console.error('Delete image error:', error);
      res.status(500).json({ error: 'Failed to delete image' });
    }
  }
);

export default router;

