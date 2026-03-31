/**
 * GET /api/auth/qrcode — 获取微信读书扫码登录二维码
 *
 * 1. 代理调用 weread.qq.com/web/login/getuid 获取一次性 UID
 * 2. 提取响应中的 set-cookie，存入模块级会话存储（按 uid 索引）
 * 3. 返回 { uid, qrUrl } 供前端生成二维码图片
 */

import { successResponse, handleError, errorResponse } from '@/lib/utils/response';
import QRCode from 'qrcode';

const WEREAD_BASE = 'https://weread.qq.com';

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ' +
  'AppleWebKit/537.36 (KHTML, like Gecko) ' +
  'Chrome/120.0.0.0 Safari/537.36';

interface GetUidResponse {
  uid?: string;
  errcode?: number;
}

// ---------- 模块级会话存储 ----------

/** 会话条目，存储 getuid 返回的上游 cookie */
interface SessionEntry {
  /** 原始 set-cookie 字符串（拼接为 Cookie 请求头格式） */
  cookies: string;
  /** 创建时间戳（毫秒） */
  createdAt: number;
}

/** uid → 会话存储（单进程内共享） */
export const sessionStore = new Map<string, SessionEntry>();

/** 会话过期时间：5 分钟 */
const SESSION_TTL_MS = 5 * 60 * 1000;

/** 清理所有过期会话 */
function cleanExpiredSessions(): void {
  const now = Date.now();
  for (const [uid, entry] of sessionStore) {
    if (now - entry.createdAt > SESSION_TTL_MS) {
      sessionStore.delete(uid);
    }
  }
}

/**
 * 从响应头的 set-cookie 中提取所有 cookie（合并为 Cookie 请求头格式）
 * 保留全部字段，不仅限于 wr_* 前缀，确保会话完整性。
 */
function extractAllCookies(response: Response): string {
  const setCookieHeaders = response.headers.getSetCookie?.() ?? [];

  const raw: string[] =
    setCookieHeaders.length > 0
      ? setCookieHeaders
      : (response.headers.get('set-cookie') ?? '').split(/,(?=[^,]+=)/).map((s) => s.trim());

  const cookieMap = new Map<string, string>();

  for (const entry of raw) {
    const [nameValue] = entry.split(';');
    if (!nameValue) continue;

    const eqIdx = nameValue.indexOf('=');
    if (eqIdx === -1) continue;

    const name = nameValue.slice(0, eqIdx).trim();
    const value = nameValue.slice(eqIdx + 1).trim();

    if (name && value) {
      cookieMap.set(name, value);
    }
  }

  return Array.from(cookieMap.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
}

// ---------- 路由处理器 ----------

export async function GET(): Promise<Response> {
  try {
    // 每次获取二维码时顺手清理过期会话
    cleanExpiredSessions();

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

    // 提取并保存上游会话 cookie，供后续 getinfo / weblogin 携带
    const cookies = extractAllCookies(res);
    sessionStore.set(data.uid, { cookies, createdAt: Date.now() });

    // 二维码内容：pf=2 表示非 iOS 平台
    const qrUrl = `https://weread.qq.com/web/confirm?pf=2&uid=${data.uid}`;

    // 服务端生成二维码 Data URL（避免依赖外部服务）
    const qrDataUrl = await QRCode.toDataURL(qrUrl, {
      width: 200,
      margin: 2,
      color: { dark: '#141413', light: '#ffffff' },
    });

    return successResponse({ uid: data.uid, qrUrl, qrDataUrl });
  } catch (err) {
    return handleError(err);
  }
}
