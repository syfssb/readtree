/**
 * GET /api/config — 获取配置（Cookie 脱敏）
 * PUT /api/config — 更新 Cookie
 */

import { NextRequest } from 'next/server';
import { cookieConfigSchema } from '@/lib/validators';
import * as configRepo from '@/repositories/config.repository';
import { successResponse, handleError } from '@/lib/utils/response';

/** 对 Cookie 进行脱敏：保留前 10 位 + "..." */
function maskCookie(cookie: string): string {
  return cookie.length > 10 ? `${cookie.slice(0, 10)}...` : cookie;
}

// ---------- GET /api/config ----------

export async function GET(): Promise<Response> {
  try {
    const config = await configRepo.getConfig();

    if (!config) {
      return successResponse(null);
    }

    return successResponse({
      ...config,
      wereadCookie: maskCookie(config.wereadCookie),
    });
  } catch (err) {
    return handleError(err);
  }
}

// ---------- PUT /api/config ----------

export async function PUT(req: NextRequest): Promise<Response> {
  try {
    const body = await req.json();
    const { cookie } = cookieConfigSchema.parse(body);

    const config = await configRepo.upsertConfig(cookie);

    return successResponse({
      ...config,
      wereadCookie: maskCookie(config.wereadCookie),
    });
  } catch (err) {
    return handleError(err);
  }
}
