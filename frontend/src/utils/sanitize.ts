/**
 * XSS 방지를 위한 HTML 이스케이프
 */
export const escapeHtml = (text: string): string => {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  
  return text.replace(/[&<>"'/]/g, (char) => map[char]);
};

/**
 * 위험한 URL 프로토콜 검증
 */
export const isSafeUrl = (url: string): boolean => {
  const allowedProtocols = ['http:', 'https:', 'mailto:'];
  
  try {
    const urlObj = new URL(url);
    return allowedProtocols.includes(urlObj.protocol);
  } catch {
    // 상대 URL인 경우 안전하다고 판단
    return !url.startsWith('javascript:') && !url.startsWith('data:');
  }
};

/**
 * 파일명 검증 (향후 파일 업로드 기능 추가 시 사용)
 */
export const isValidFileName = (fileName: string): boolean => {
  // 특수문자, 경로 구분자 제거
  const dangerousChars = /[<>:"/\\|?*\x00-\x1F]/g;
  return !dangerousChars.test(fileName);
};

/**
 * 입력값 길이 검증
 */
export const validateLength = (
  text: string,
  min: number,
  max: number
): boolean => {
  return text.length >= min && text.length <= max;
};

/**
 * 이메일 형식 검증
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * 사용자명 검증 (영문, 숫자, 언더스코어, 하이픈만 허용)
 */
export const isValidUsername = (username: string): boolean => {
  const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
  return usernameRegex.test(username);
};

/**
 * 비밀번호 강도 검증
 */
export const validatePasswordStrength = (password: string): {
  isValid: boolean;
  message: string;
} => {
  if (password.length < 6) {
    return {
      isValid: false,
      message: '비밀번호는 최소 6자 이상이어야 합니다.',
    };
  }

  if (password.length < 8) {
    return {
      isValid: true,
      message: '보안을 위해 8자 이상 권장합니다.',
    };
  }

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const strength = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length;

  if (strength < 2) {
    return {
      isValid: true,
      message: '대소문자, 숫자, 특수문자를 조합하면 더 안전합니다.',
    };
  }

  return {
    isValid: true,
    message: '강력한 비밀번호입니다.',
  };
};

/**
 * 콘텐츠에서 잠재적 위험 요소 제거
 */
export const sanitizeContent = (content: string): string => {
  // script 태그 제거
  let sanitized = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // iframe 제거
  sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  
  // on* 이벤트 속성 제거
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  
  return sanitized;
};

