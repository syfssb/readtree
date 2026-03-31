/**
 * GET /api/auth/qrcode — 获取微信读书扫码登录二维码
 *
 * 1. 代理调用 weread.qq.com/web/login/getuid 获取一次性 UID
 * 2. 返回 { uid, qrUrl } 供前端生成二维码图片
 */

import { successResponse, handleError, errorResponse } from '@/lib/utils/response';

const WEREAD_BASE = 'https://weread.qq.com';

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ' +
  'AppleWebKit/537.36 (KHTML, like Gecko) ' +
  'Chrome/120.0.0.0 Safari/537.36';

interface GetUidResponse {
  uid?: string;
  errcode?: number;
}

export async function GET(): Promise<Response> {
  try {
    const res = await fetch(`${WEREAD_BASE}/web/login/getuid`, {
      method: 'POST',
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
        Referer: 'https://weread.qq.com/web/reader/',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      return errorResponse('WEREAD_API_ERROR', `微信读书接口异常：${res.status}`, 502);
    }

    const data = (await res.json()) as GetUidResponse;

    if (!data.uid) {
      return errorResponse('WEREAD_API_ERROR', '获取 UID 失败，请稍后重试', 502);
    }

    // 二维码内容：pf=2 表示非 iOS 平台
    const qrUrl = `https://weread.qq.com/web/confirm?pf=2&uid=${data.uid}`;

    return successResponse({ uid: data.uid, qrUrl });
  } catch (err) {
    return handleError(err);
  }
}
