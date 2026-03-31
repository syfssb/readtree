/**
 * GET /api/auth/qrcode — 获取微信读书扫码登录二维码
 *
 * 1. 代理调用 i.weread.qq.com/web/getuid 获取一次性 UID
 * 2. 返回 { uid, qrUrl } 供前端生成二维码图片
 *
 * 所有请求从 Next.js 服务端发出，绕过 CORS 限制。
 */

import { successResponse, handleError, errorResponse } from '@/lib/utils/response';

const WEREAD_BASE = 'https://i.weread.qq.com';

/** 模拟真实浏览器 User-Agent，避免被 WeRead 拦截 */
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ' +
  'AppleWebKit/537.36 (KHTML, like Gecko) ' +
  'Chrome/120.0.0.0 Safari/537.36';

/** WeRead getuid 响应 */
interface GetUidResponse {
  uid?: string;
  errcode?: number;
}

// ---------- GET /api/auth/qrcode ----------

export async function GET(): Promise<Response> {
  try {
    const res = await fetch(`${WEREAD_BASE}/web/getuid`, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json, text/plain, */*',
        'Accept-Language': 'zh-CN,zh;q=0.9',
        Referer: 'https://weread.qq.com/wrpage/login',
      },
      // Next.js 服务端请求不缓存，确保每次拿到新 UID
      cache: 'no-store',
    });

    if (!res.ok) {
      return errorResponse(
        'WEREAD_API_ERROR',
        `微信读书接口异常：${res.status}`,
        502,
      );
    }

    const data = (await res.json()) as GetUidResponse;

    if (!data.uid) {
      return errorResponse('WEREAD_API_ERROR', '获取 UID 失败，请稍后重试', 502);
    }

    // 二维码内容：用户扫描后进入微信读书确认登录页
    const qrUrl = `https://weread.qq.com/wrpage/login/confirm?uid=${data.uid}`;

    return successResponse({ uid: data.uid, qrUrl });
  } catch (err) {
    return handleError(err);
  }
}
