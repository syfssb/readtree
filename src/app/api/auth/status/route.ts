/**
 * GET /api/auth/status?uid={uid} — 轮询微信读书扫码登录状态
 *
 * 使用 Web 阅读器的登录 API（非 CP 平台）：
 * 1. POST weread.qq.com/web/login/getinfo → 长轮询等待扫码
 * 2. 扫码成功 → POST weread.qq.com/web/login/weblogin 完成登录
 * 3. 从 set-cookie 头提取 wr_* Cookie 并保存
 */

import { NextRequest } from 'next/server';
import { successResponse, handleError, errorResponse } from '@/lib/utils/response';
import * as configRepo from '@/repositories/config.repository';

const WEREAD_BASE = 'https://weread.qq.com';

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ' +
  'AppleWebKit/537.36 (KHTML, like Gecko) ' +
  'Chrome/120.0.0.0 Safari/537.36';

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

/**
 * 从 Response 的 set-cookie 头提取所有 wr_* cookie
 */
function extractCookieString(response: Response): string {
  const setCookieHeader = response.headers.getSetCookie?.() ?? [];

  const rawCookies: string[] =
    setCookieHeader.length > 0
      ? setCookieHeader
      : (response.headers.get('set-cookie') ?? '').split(/,(?=[^,]+=)/).map((s) => s.trim());

  const cookieMap = new Map<string, string>();

  for (const raw of rawCookies) {
    const [nameValue] = raw.split(';');
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

/**
 * 扫码成功后，调用 weblogin 完成登录并提取 Cookie
 */
async function completeLoginAndSaveCookie(data: GetInfoResponse): Promise<void> {
  // 方案 1：尝试 weblogin 获取完整 Cookie
  try {
    const res = await fetch(`${WEREAD_BASE}/web/login/weblogin`, {
      method: 'POST',
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
        Referer: 'https://weread.qq.com/web/reader/',
      },
      body: JSON.stringify({
        vid: data.vid,
        skey: data.skey,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      }),
      signal: AbortSignal.timeout(10_000),
      cache: 'no-store',
    });

    if (res.ok) {
      const cookie = extractCookieString(res);
      if (cookie) {
        await configRepo.upsertConfig(cookie);
        return;
      }
    }
  } catch {
    // weblogin 失败，尝试回退
  }

  // 方案 2：尝试 session/init
  try {
    if (data.vid && data.skey) {
      const res = await fetch(`${WEREAD_BASE}/web/login/session/init`, {
        method: 'POST',
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
          Referer: 'https://weread.qq.com/web/reader/',
        },
        body: JSON.stringify({ vid: data.vid, skey: data.skey }),
        signal: AbortSignal.timeout(10_000),
        cache: 'no-store',
      });

      if (res.ok) {
        const cookie = extractCookieString(res);
        if (cookie) {
          await configRepo.upsertConfig(cookie);
          return;
        }
      }
    }
  } catch {
    // session/init 也失败
  }

  // 方案 3：直接用 vid + skey 构建 Cookie
  if (data.vid && data.skey) {
    const cookie = `wr_vid=${data.vid}; wr_skey=${data.skey}`;
    await configRepo.upsertConfig(cookie);
    return;
  }

  throw new Error('无法获取有效的登录凭据');
}

export async function GET(req: NextRequest): Promise<Response> {
  const uid = req.nextUrl.searchParams.get('uid');

  if (!uid) {
    return errorResponse('VALIDATION_ERROR', '缺少 uid 参数', 400);
  }

  try {
    const pollRes = await fetch(`${WEREAD_BASE}/web/login/getinfo`, {
      method: 'POST',
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
        Referer: 'https://weread.qq.com/web/reader/',
      },
      body: JSON.stringify({ uid }),
      signal: AbortSignal.timeout(65_000),
      cache: 'no-store',
    });

    if (!pollRes.ok) {
      return successResponse<{ status: LoginStatus }>({ status: 'error' });
    }

    const data = (await pollRes.json()) as GetInfoResponse;

    // errcode/-2910 表示 UID 已过期
    const errCode = data.errcode ?? data.errCode;
    if (errCode) {
      return successResponse<{ status: LoginStatus }>({ status: 'expired' });
    }

    // scan === 0：未扫码
    if (data.scan === 0) {
      return successResponse<{ status: LoginStatus }>({ status: 'waiting' });
    }

    // 扫码成功：vid 必须存在
    if (!data.vid) {
      return successResponse<{ status: LoginStatus }>({ status: 'error' });
    }

    // 完成登录并保存 Cookie
    await completeLoginAndSaveCookie(data);

    return successResponse<{ status: LoginStatus }>({ status: 'success' });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return successResponse<{ status: LoginStatus }>({ status: 'waiting' });
    }
    return handleError(err);
  }
}
