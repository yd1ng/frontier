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
const sanitizeFilename = (input: string): string => {
  return input.replace(/\.\.\//g, '');
};


router.get('/:filename', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const { filename } = req.params;
    const safeName = sanitizeFilename(filename);
    
    const filePath = path.join(__dirname, '../../uploads', safeName);

    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({ error: 'File not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});
// 이미지 삭제 엔드포인트
router.delete(
  '/:filename',
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
try {
      let { filename } = req.params;

      // [보안 강화] Path Traversal 공격 방지를 위한 다층 검증
      
      // 0. 파일명 길이 제한 (DoS 방지)
      if (!filename || filename.length > 255) {
        res.status(400).json({ error: 'Invalid filename: length exceeded' });
        return;
      }

      // URL 디코딩 후 재검증 (이중 인코딩 공격 방지)
      try {
        const decoded = decodeURIComponent(filename);
        if (decoded !== filename) {
          // 이미 디코딩되었다면, 디코딩된 값으로도 검증
          filename = decoded;
        }
      } catch (e) {
        // 디코딩 실패는 무시 (이미 디코딩된 상태)
      }

      // 1. Null byte 공격 차단
      if (filename.includes('\0') || filename.includes('%00')) {
        console.warn(`[SECURITY] Null byte attack detected: ${filename}`);
        res.status(400).json({ error: 'Invalid filename: null byte detected' });
        return;
      }

      // 2. 상대 경로 문자열 차단 (../, ..\, 유니코드 변형 포함)
      const pathTraversalPatterns = [
        '..',           // 기본 상위 디렉토리
        '/',            // 슬래시
        '\\',           // 백슬래시
        '\u2215',       // 유니코드 슬래시 (∕)
        '\u2216',       // 유니코드 백슬래시
        '\uff0f',       // 전각 슬래시 (／)
        '\uff3c',       // 전각 백슬래시 (＼)
        '%2e',          // URL 인코딩된 점
        '%2f',          // URL 인코딩된 슬래시
        '%5c',          // URL 인코딩된 백슬래시
      ];

      for (const pattern of pathTraversalPatterns) {
        if (filename.toLowerCase().includes(pattern.toLowerCase())) {
          console.warn(`[SECURITY] Path traversal attack detected: ${filename}`);
          res.status(400).json({ error: 'Invalid filename: path traversal detected' });
          return;
        }
      }

      // 3. 시스템 중요 파일명 차단 (화이트리스트 외 파일 보호)
      const blockedPatterns = [
        /^\.env/i,                    // .env, .env.local 등
        /^package\.json$/i,           // package.json
        /^package-lock\.json$/i,      // package-lock.json
        /^docker-compose/i,           // docker-compose.yml
        /^dockerfile$/i,              // Dockerfile
        /^tsconfig/i,                 // tsconfig.json
        /^\.git/i,                    // .git, .gitignore
        /^node_modules/i,             // node_modules
        /^src\//i,                    // src 디렉토리
        /^dist\//i,                   // dist 디렉토리
        /^config/i,                   // config 파일들
        /^\.dockerignore$/i,          // .dockerignore
        /^\.npmrc$/i,                 // .npmrc
        /^yarn\.lock$/i,              // yarn.lock
        /^\.eslintrc/i,               // ESLint 설정
        /^\.prettierrc/i,             // Prettier 설정
        /^webpack\.config/i,          // Webpack 설정
        /^vite\.config/i,             // Vite 설정
        /^\.vscode/i,                 // VSCode 설정
        /^\.idea/i,                   // IntelliJ 설정
      ];

      for (const pattern of blockedPatterns) {
        if (pattern.test(filename)) {
          console.warn(`[SECURITY] System file access attempt: ${filename}`);
          res.status(400).json({ error: 'Invalid filename: system file access denied' });
          return;
        }
      }

      // 4. 안전한 파일명 패턴 검증 (타임스탬프-랜덤숫자-이름.확장자 형식)
      // 업로드 시 생성된 파일명 형식만 허용
      const safeFilenamePattern = /^[0-9]+-[0-9]+-[a-zA-Z0-9가-힣._-]+\.(jpg|jpeg|png|gif|webp)$/i;
      if (!safeFilenamePattern.test(filename)) {
        console.warn(`[SECURITY] Invalid filename format: ${filename}`);
        res.status(400).json({ error: 'Invalid filename format' });
        return;
      }

      // 5. DB에서 파일 존재 확인 (권한 검증)
      const fileRecord = await FileModel.findOne({ filename });

      if (!fileRecord) {
        res.status(404).json({ error: 'File not found' });
        return;
      }

      if (fileRecord.uploader.toString() !== req.userId && req.userRole !== 'admin') {
        res.status(403).json({ error: 'Permission denied: You do not own this file' });
        return;
      }

      // 6. 정규화된 경로 검증 (실제 경로가 uploads 디렉토리 내부인지 확인)
      const uploadsDir = path.resolve(__dirname, '../../uploads');
      const filePath = path.join(uploadsDir, filename);
      const normalizedPath = path.resolve(filePath);

      // 정규화된 경로가 uploads 디렉토리로 시작하는지 확인
      if (!normalizedPath.startsWith(uploadsDir + path.sep) && normalizedPath !== uploadsDir) {
        console.warn(`[SECURITY] Path escape attempt: ${filename} -> ${normalizedPath}`);
        res.status(400).json({ error: 'Invalid file path: access denied' });
        return;
      }

      // 7. 파일명이 정규화 과정에서 변경되지 않았는지 확인
      const expectedPath = path.join(uploadsDir, filename);
      if (normalizedPath !== expectedPath) {
        console.warn(`[SECURITY] Path normalization mismatch: ${filename}`);
        res.status(400).json({ error: 'Invalid file path: normalization failed' });
        return;
      }

      // 8. 실제 파일 삭제
      if (fs.existsSync(normalizedPath)) {
        fs.unlinkSync(normalizedPath);
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

