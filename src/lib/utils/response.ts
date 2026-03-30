/**
 * API 响应工具函数
 *
 * 统一封装成功/失败响应格式，避免 route handler 中重复构建 NextResponse。
 */

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AppError } from '@/lib/utils/errors';

/** 成功响应：{ success: true, data: T } */
export function successResponse<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ success: true, data }, { status });
}

/** 失败响应：{ success: false, error: { code, message } } */
export function errorResponse(code: string, message: string, status = 500): NextResponse {
  return NextResponse.json({ success: false, error: { code, message } }, { status });
}

/**
 * 统一错误处理：将各类错误映射到标准 HTTP 响应
 *
 * 处理顺序：ZodError → AppError → 未知错误
 */
export function handleError(err: unknown): NextResponse {
  if (err instanceof ZodError) {
    const message = err.issues.map((e) => e.message).join('; ');
    return errorResponse('VALIDATION_ERROR', message, 400);
  }

  if (err instanceof AppError) {
    return errorResponse(err.code, err.message, err.statusCode);
  }

  return errorResponse('INTERNAL_SERVER_ERROR', '服务器内部错误', 500);
}
