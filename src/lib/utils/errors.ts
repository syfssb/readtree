/**
 * 应用错误体系
 *
 * 采用分层继承：AppError 为基类，各业务错误继承并锁定 statusCode / code。
 * 调用方通过 instanceof 判断错误类型，避免魔法字符串。
 */

/** 所有应用级错误的基类 */
export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
  }
}

/** WeRead Cookie 已过期或失效 */
export class CookieExpiredError extends AppError {
  constructor(message = 'WeRead cookie 已过期，请重新登录并更新 Cookie') {
    super(401, 'COOKIE_EXPIRED', message);
  }
}

/** 书籍不存在 */
export class BookNotFoundError extends AppError {
  constructor(bookId?: string) {
    const msg = bookId ? `书籍 ${bookId} 不存在` : '书籍不存在';
    super(404, 'BOOK_NOT_FOUND', msg);
  }
}

/** 输入验证失败 */
export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, 'VALIDATION_ERROR', message);
  }
}

/** 微信读书 API 调用失败 */
export class WeReadApiError extends AppError {
  constructor(message: string) {
    super(502, 'WEREAD_API_ERROR', message);
  }
}
