/**
 * GET /api/auth/status?uid={uid} — 轮询微信读书扫码登录状态
 *
 * 流程：
 * 1. 向 i.weread.qq.com/web/getlogininfo 发起长轮询（最多 60s）
 * 2. 未扫码（scan=0）→ 返回 { status: 'waiting' }
 * 3. 扫码成功（scan=1）→ 携带 vid+skey 调用 /wrpage/session/init 获取完整 Cookie
 * 4. 从 set-cookie 响应头提取所有 wr_* Cookie，拼接后保存到 config
 * 5. 返回 { status: 'success' }
 * 6. 二维码过期（errcode: -2910）或网络异常 → 返回 { status: 'expired' }
 */

import { NextRequest } from 'next/server';
import { successResponse, errorResponse, handleError } from '@/lib/utils/response';
import * as configRepo from '@/repositories/config.repository';

const WEREAD_I_BASE = 'https://i.weread.qq.com';
const WEREAD_WEB_BASE = 'https://weread.qq.com';

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ' +
  'AppleWebKit/537.36 (KHTML, like Gecko) ' +
  'Chrome/120.0.0.0 Safari/537.36';

/** 登录状态枚举 */
type LoginStatus = 'waiting' | 'success' | 'expired' | 'error';

/** WeRead getlogininfo 响应结构 */
interface GetLoginInfoResponse {
  errcode?: number;
  /** 0 = 未扫码；1 = 已扫码并确认 */
  scan?: number;
  vid?: number;
  skey?: string;
}

/**
 * 从 Response 的 set-cookie 头提取所有 wr_* cookie，
 * 拼接为 "name=value; name2=value2" 格式的 Cookie 字符串。
 */
function extractCookieString(response: Response): string {
  const setCookieHeader = response.headers.getSetCookie?.() ?? [];

  // Node.js 18 以下可能没有 getSetCookie，降级处理
  const rawCookies: string[] =
    setCookieHeader.length > 0
      ? setCookieHeader
      : (response.headers.get('set-cookie') ?? '').split(/,(?=[^,]+=)/).map((s) => s.trim());

  const cookieMap = new Map<string, string>();

  for (const raw of rawCookies) {
    // set-cookie 格式: "name=value; Path=/; Domain=...; ..."
    const [nameValue] = raw.split(';');
    if (!nameValue) continue;

    const eqIdx = nameValue.indexOf('=');
    if (eqIdx === -1) continue;

    const name = nameValue.slice(0, eqIdx).trim();
    const value = nameValue.slice(eqIdx + 1).trim();

    // 只保留有值的 wr_* cookie（空值意味着清除）
    if (name.startsWith('wr_') && value) {
      cookieMap.set(name, value);
    }
  }

  return Array.from(cookieMap.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
}

/**
 * 调用 /wrpage/session/init 完成 Web 会话初始化，
 * 从响应的 set-cookie 头提取完整 Cookie 并保存到配置。
 */
async function initSessionAndSaveCookie(vid: number, skey: string): Promise<string> {
  const res = await fetch(`${WEREAD_WEB_BASE}/wrpage/session/init`, {
    method: 'POST',
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'application/json, text/plain, */*',
      'Content-Type': 'application/x-www-form-urlencoded',
      Referer: 'https://weread.qq.com/wrpage/login',
    },
    body: new URLSearchParams({ vid: String(vid), skey }).toString(),
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`session/init 失败：${res.status}`);
  }

  const cookie = extractCookieString(res);

  if (!cookie) {
    throw new Error('session/init 未返回有效 Cookie');
  }

  await configRepo.upsertConfig(cookie);

  return cookie;
}

// ---------- GET /api/auth/status ----------

export async function GET(req: NextRequest): Promise<Response> {
  const uid = req.nextUrl.searchParams.get('uid');

  if (!uid) {
    return errorResponse('VALIDATION_ERROR', '缺少 uid 参数', 400);
  }

  try {
    // 长轮询：微信读书会在服务端挂起最多 60s 等待扫码
    const pollRes = await fetch(`${WEREAD_I_BASE}/web/getlogininfo`, {
      method: 'POST',
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
        Referer: 'https://weread.qq.com/wrpage/login',
      },
      body: JSON.stringify({ uid }),
      // 65 秒超时（比 WeRead 服务端的 60s 多留 5s 余量）
      signal: AbortSignal.timeout(65_000),
      cache: 'no-store',
    });

    if (!pollRes.ok) {
      return successResponse<{ status: LoginStatus }>({ status: 'error' });
    }

    const data = (await pollRes.json()) as GetLoginInfoResponse;

    // errcode: -2910 表示 UID 已过期或已被使用
    if (data.errcode) {
      return successResponse<{ status: LoginStatus }>({ status: 'expired' });
    }

    // scan=0：用户尚未扫码，仍在等待中
    if (!data.scan) {
      return successResponse<{ status: LoginStatus }>({ status: 'waiting' });
    }

    // 扫码成功：vid + skey 必须存在
    if (!data.vid || !data.skey) {
      return successResponse<{ status: LoginStatus }>({ status: 'error' });
    }

    // 完成 session 初始化并保存 Cookie
    await initSessionAndSaveCookie(data.vid, data.skey);

    return successResponse<{ status: LoginStatus }>({ status: 'success' });
  } catch (err) {
    // AbortError 说明轮询超时（60s 内用户未扫码）
    if (err instanceof Error && err.name === 'AbortError') {
      return successResponse<{ status: LoginStatus }>({ status: 'waiting' });
    }
    return handleError(err);
  }
}
