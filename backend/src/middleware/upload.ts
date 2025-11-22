import multer from 'multer';
import path from 'path';
import { Request } from 'express';

// 업로드 디렉토리 설정
const uploadDir = path.join(__dirname, '../../uploads');

// 스토리지 설정
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    cb(null, uploadDir);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    // 파일명 sanitization: 특수문자 제거 및 Path Traversal 방지
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    const nameWithoutExt = path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9가-힣._-]/g, '_')  // 안전한 문자만 허용
      .slice(0, 50);  // 길이 제한
    cb(null, `${uniqueSuffix}-${nameWithoutExt}${ext}`);
  },
});

// 파일 필터: 이미지만 허용
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  // 확장자 검사하는 추가된 코드
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

  // 확장자 소문자로 추출
  const ext = path.extname(file.originalname).toLowerCase();

  // Mime과 확장자 둘다 화이트리스트 통과시에
  if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
    cb(null, true); // 통과
  } else {
    cb(new Error('Only image files are allowed!')); // 차단
  }
};

// Multer 설정
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB 제한
  },
});

// 최대 5개 이미지 업로드
export const uploadImages = upload.array('images', 5);

