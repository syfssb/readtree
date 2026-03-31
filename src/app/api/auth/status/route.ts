/**
 * GET /api/auth/status?uid={uid} — 轮询微信读书扫码登录状态
 *
 * 1. GET  weread.qq.com/web/login/getinfo?uid={uid}  长轮询等待扫码（Bug 1 修复）
 * 2. 携带 getuid 阶段保存的 session cookie（Bug 2 修复）
 * 3. 扫码成功 → POST weread.qq.com/web/login/weblogin 完成登录
 * 4. 用 GET i.weread.qq.com/user/notebooks 验证 cookie 可用性（Bug 4 修复）
 * 5. 验证失败返回 error，不伪造假成功
 */

import { NextRequest } from 'next/server';
import { successResponse, handleError, errorResponse } from '@/lib/utils/response';
import * as configRepo from '@/repositories/config.repository';
import { sessionStore } from '@/app/api/auth/qrcode/route';

const WEREAD_BASE = 'https://weread.qq.com';
const WEREAD_API_BASE = 'https://i.weread.qq.com';

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ' +
  'AppleWebKit/537.36 (KHTML, like Gecko) ' +
  'Chrome/120.0.0.0 Safari/537.36';

/** 公共请求头（不含 Cookie，由调用方按需追加） */
const BASE_HEADERS: Record<string, string> = {
  'User-Agent': USER_AGENT,
  Accept: 'application/json, text/plain, */*',
  'Content-Type': 'application/json',
  Referer: 'https://weread.qq.com/web/reader/',
};

type LoginStatus = 'waiting' | 'success' | 'expired' | 'error';

interface GetInfoResponse {
  errcode?: number;
  errCode?: number;
  scan?: number;
  vid?: number;
  skey?: string;
  accessToken?: string;
  refreshToken?: string;
  [key: string]: unknown;
}

// ---------- Cookie 工具 ----------

/**
 * 从 Response 的 set-cookie 头提取 wr_* cookie，
 * 合并为 "name=value; ..." 格式
 */
function extractWrCookies(response: Response): string {
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

    if (name.startsWith('wr_') && value) {
      cookieMap.set(name, value);
    }
  }

  return Array.from(cookieMap.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
}

// ---------- 登录完成 ----------

/**
 * 验证 cookie 是否真实可用：
 * 调用 GET i.weread.qq.com/user/notebooks，200 且无 errcode 视为有效。
 */
async function verifyCookie(cookie: string): Promise<boolean> {
  try {
    const res = await fetch(`${WEREAD_API_BASE}/user/notebooks`, {
      method: 'GET',
      headers: { ...BASE_HEADERS, Cookie: cookie },
      signal: AbortSignal.timeout(10_000),
      cache: 'no-store',
    });

    if (!res.ok) return false;

    const body = (await res.json()) as { errcode?: number };
    return !body.errcode;
  } catch {
    return false;
  }
}

/**
 * 扫码成功后，直接用 getinfo 返回的 vid + skey 构建 Cookie 并验证。
 *
 * getinfo 成功时返回的 vid 就是 wr_vid，skey 就是 wr_skey，
 * 不需要再调 weblogin（那是另一个流程）。
 */
async function completeLoginAndSaveCookie(data: GetInfoResponse): Promise<void> {
  if (!data.vid || !data.skey) {
    throw new Error('getinfo 响应缺少 vid 或 skey');
  }

  const cookie = `wr_vid=${data.vid}; wr_skey=${data.skey}`;

  console.log('[auth/status] constructed cookie, verifying...');

  const isValid = await verifyCookie(cookie);
  if (!isValid) {
    throw new Error('cookie 验证失败，登录凭据不可用');
  }

  console.log('[auth/status] cookie verified, saving');
  await configRepo.upsertConfig(cookie);
}

// ---------- 路由处理器 ----------

export async function GET(req: NextRequest): Promise<Response> {
  const uid = req.nextUrl.searchParams.get('uid');

  if (!uid) {
    return errorResponse('VALIDATION_ERROR', '缺少 uid 参数', 400);
  }

  // 取出该 uid 对应的上游会话 cookie（Bug 2 修复）
  const sessionEntry = sessionStore.get(uid);
  const sessionCookie = sessionEntry?.cookies ?? '';

  try {
    // 长轮询：POST /web/login/getinfo + JSON body（实测 GET 返回 404）
    const pollRes = await fetch(`${WEREAD_BASE}/web/login/getinfo`, {
      method: 'POST',
      headers: {
        ...BASE_HEADERS,
        ...(sessionCookie ? { Cookie: sessionCookie } : {}),
      },
      body: JSON.stringify({ uid }),
      signal: AbortSignal.timeout(65_000),
      cache: 'no-store',
    });

    console.log('[auth/status] getinfo response status:', pollRes.status);

    if (!pollRes.ok) {
      console.log('[auth/status] getinfo not ok:', pollRes.status, pollRes.statusText);
      return successResponse<{ status: LoginStatus }>({ status: 'error' });
    }

    const rawText = await pollRes.text();
    console.log('[auth/status] getinfo raw response:', rawText);

    let data: GetInfoResponse;
    try {
      data = JSON.parse(rawText) as GetInfoResponse;
    } catch {
      console.log('[auth/status] Failed to parse JSON');
      return successResponse<{ status: LoginStatus }>({ status: 'error' });
    }

    // errcode 非零表示 UID 已过期或其他错误
    const errCode = data.errcode ?? data.errCode;
    if (errCode) {
      console.log('[auth/status] errcode:', errCode);
      return successResponse<{ status: LoginStatus }>({ status: 'expired' });
    }

    // scan === 0：未扫码，继续等待
    if (data.scan === 0) {
      console.log('[auth/status] scan=0, waiting');
      return successResponse<{ status: LoginStatus }>({ status: 'waiting' });
    }

    console.log('[auth/status] scan success, vid:', data.vid, 'skey:', data.skey ? '[present]' : '[missing]');

    // 扫码成功：vid 必须存在
    if (!data.vid) {
      console.log('[auth/status] no vid');
      return successResponse<{ status: LoginStatus }>({ status: 'error' });
    }

    // 完成登录、验证并保存 Cookie
    try {
      await completeLoginAndSaveCookie(data);
      // 登录成功后清理会话存储
      sessionStore.delete(uid);
    } catch (loginErr) {
      console.log('[auth/status] completeLogin failed:', loginErr instanceof Error ? loginErr.message : loginErr);
      return successResponse<{ status: LoginStatus }>({ status: 'error' });
    }

    return successResponse<{ status: LoginStatus }>({ status: 'success' });
  } catch (err) {
    console.log('[auth/status] outer catch:', err instanceof Error ? `${err.name}: ${err.message}` : err);
    if (err instanceof Error && err.name === 'AbortError') {
      return successResponse<{ status: LoginStatus }>({ status: 'waiting' });
    }
    return handleError(err);
  }
}
