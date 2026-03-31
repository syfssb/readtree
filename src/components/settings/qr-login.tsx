'use client';

/**
 * QrLogin — 微信读书扫码登录组件
 *
 * 状态机：idle → loading → scanning → success | expired | error
 *
 * 流程：
 * 1. 点击「扫码登录」→ 调用 GET /api/auth/qrcode 获取 uid 和 qrUrl
 * 2. 渲染二维码图片（api.qrserver.com 免费服务，无需安装额外依赖）
 * 3. 轮询 GET /api/auth/status?uid={uid}，每次调用会在服务端挂起最多 60s
 * 4. 收到 waiting → 继续轮询；success → 调用 onSuccess；expired/error → 显示刷新提示
 * 5. 3 分钟后二维码视觉过期（实际由后端 errcode 驱动）
 *
 * Bug 3 修复：
 * - 每次 fetchQrCode 时创建新的 AbortController，abort 旧请求
 * - 用 generationRef（递增整数）标记当前会话
 * - 轮询收到响应后先校验 generation，旧会话的响应直接丢弃
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCw, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

// ---------- 类型定义 ----------

type ScanStatus = 'idle' | 'loading' | 'scanning' | 'success' | 'expired' | 'error';

interface QrLoginProps {
  /** 登录成功后的回调 */
  onSuccess: () => void;
}

interface QrcodeData {
  uid: string;
  qrUrl: string;
}

// ---------- 常量 ----------

/** 二维码视觉过期时间（毫秒），与微信读书服务端保持一致 */
const QR_EXPIRE_MS = 3 * 60 * 1000;

/** 生成 QR 图片 URL（使用免费的 qrserver.com 服务） */
function buildQrImageUrl(qrUrl: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl)}`;
}

// ---------- 组件 ----------

/**
 * 扫码登录组件
 *
 * @example
 * <QrLogin onSuccess={() => setIsConfigured(true)} />
 */
export function QrLogin({ onSuccess }: QrLoginProps) {
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [qrcodeData, setQrcodeData] = useState<QrcodeData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // 当前活跃 AbortController，用于取消旧的长轮询请求（Bug 3）
  const abortControllerRef = useRef<AbortController | null>(null);
  // 会话代数，每次 fetchQrCode 递增；旧会话响应通过比较代数来丢弃（Bug 3）
  const generationRef = useRef<number>(0);
  // 过期计时器
  const expireTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** 停止当前会话：abort 正在进行的请求、清除过期计时器 */
  const stopPolling = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;

    if (expireTimerRef.current) {
      clearTimeout(expireTimerRef.current);
      expireTimerRef.current = null;
    }
  }, []);

  // 组件卸载时停止所有异步操作
  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  /**
   * 轮询登录状态，持续到成功/过期/错误或会话被新请求取代。
   * 每次轮询调用会在服务端挂起最多 60s（长轮询），收到 waiting 后立即再次发起。
   *
   * @param uid        当前会话的微信读书 UID
   * @param controller 当前会话的 AbortController
   * @param generation 当前会话代数，用于竞态检测
   */
  const startPolling = useCallback(
    async (uid: string, controller: AbortController, generation: number) => {
      while (true) {
        // 会话已被新 fetchQrCode 调用取代，静默退出
        if (generation !== generationRef.current) return;

        try {
          const res = await fetch(`/api/auth/status?uid=${uid}`, {
            signal: controller.signal,
          });

          // 响应到达后再次确认代数，防止竞态
          if (generation !== generationRef.current) return;

          if (!res.ok) {
            setStatus('error');
            setErrorMessage('网络异常，请重试');
            return;
          }

          const json = (await res.json()) as { data?: { status: string } };

          // 解析后再校验一次（json() 也是异步操作）
          if (generation !== generationRef.current) return;

          const loginStatus = json.data?.status;

          if (loginStatus === 'success') {
            setStatus('success');
            stopPolling();
            // 延迟触发回调，让用户看到「登录成功」提示
            setTimeout(onSuccess, 1200);
            return;
          }

          if (loginStatus === 'expired') {
            setStatus('expired');
            stopPolling();
            return;
          }

          if (loginStatus === 'error') {
            setStatus('error');
            setErrorMessage('登录失败，请重试');
            stopPolling();
            return;
          }

          // waiting：立即发起下一轮长轮询
        } catch (err) {
          // AbortError 说明本会话已被主动取消，静默退出
          if (err instanceof Error && err.name === 'AbortError') return;

          if (generation !== generationRef.current) return;

          // 其他网络错误：短暂等待后重试
          await new Promise<void>((resolve) => setTimeout(resolve, 2000));
        }
      }
    },
    [onSuccess, stopPolling],
  );

  /** 获取新的二维码并开始轮询 */
  const fetchQrCode = useCallback(async () => {
    // 取消旧会话（abort 旧请求 + 清除计时器）
    stopPolling();

    // 创建新会话上下文
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const generation = ++generationRef.current;

    setStatus('loading');
    setErrorMessage('');
    setQrcodeData(null);

    try {
      const res = await fetch('/api/auth/qrcode', { signal: controller.signal });

      // 刷新二维码的请求被 abort，静默退出
      if (generation !== generationRef.current) return;

      const json = (await res.json()) as { data?: QrcodeData; error?: { message: string } };

      if (!res.ok || !json.data?.uid) {
        setStatus('error');
        setErrorMessage(json.error?.message ?? '获取二维码失败，请重试');
        return;
      }

      setQrcodeData(json.data);
      setStatus('scanning');

      // 3 分钟后标记视觉过期（用户可点击刷新）
      expireTimerRef.current = setTimeout(() => {
        if (generation === generationRef.current) setStatus('expired');
      }, QR_EXPIRE_MS);

      // 启动长轮询（传入 controller 和 generation，实现竞态隔离）
      startPolling(json.data.uid, controller, generation);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setStatus('error');
      setErrorMessage('网络异常，请检查连接后重试');
    }
  }, [startPolling, stopPolling]);

  // ---------- 渲染 ----------

  if (status === 'idle') {
    return (
      <Button variant="outline" size="md" onClick={fetchQrCode}>
        微信扫码登录
      </Button>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* 二维码区域 */}
      <div className="relative">
        {/* 二维码图片（loading 时显示骨架） */}
        <div
          className={cn(
            'w-[200px] h-[200px] rounded-xl overflow-hidden',
            'border border-[var(--color-border)]',
            'bg-[var(--color-page-bg)]',
          )}
        >
          {status === 'loading' && (
            <div className="w-full h-full flex items-center justify-center">
              <Loader2 size={32} className="animate-spin text-[var(--color-text-muted)]" />
            </div>
          )}

          {(status === 'scanning' || status === 'expired') && qrcodeData && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={buildQrImageUrl(qrcodeData.qrUrl)}
              alt="微信读书登录二维码"
              width={200}
              height={200}
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {/* 过期遮罩 */}
        {status === 'expired' && (
          <button
            onClick={fetchQrCode}
            className={cn(
              'absolute inset-0 rounded-xl',
              'bg-black/60 flex flex-col items-center justify-center gap-2',
              'cursor-pointer transition-opacity hover:bg-black/70',
            )}
          >
            <RefreshCw size={24} className="text-white" />
            <span className="font-sans text-sm text-white">点击刷新</span>
          </button>
        )}

        {/* 成功遮罩 */}
        {status === 'success' && (
          <div
            className={cn(
              'absolute inset-0 rounded-xl',
              'bg-white/90 flex flex-col items-center justify-center gap-2',
            )}
          >
            <CheckCircle size={32} className="text-green-500" />
            <span className="font-sans text-sm font-medium text-green-600">登录成功</span>
          </div>
        )}
      </div>

      {/* 状态文案 */}
      <div className="text-center">
        {status === 'loading' && (
          <p className="font-sans text-sm text-[var(--color-text-muted)]">正在获取二维码...</p>
        )}

        {status === 'scanning' && (
          <>
            <p className="font-sans text-sm text-[var(--color-text-secondary)]">
              请用<strong className="text-[var(--color-text-primary)]">微信</strong>或
              <strong className="text-[var(--color-text-primary)]">微信读书</strong>扫描
            </p>
            <p className="font-sans text-xs text-[var(--color-text-subtle)] mt-1">
              二维码 3 分钟内有效
            </p>
          </>
        )}

        {status === 'expired' && (
          <p className="font-sans text-sm text-[var(--color-text-muted)]">
            二维码已过期，请点击刷新
          </p>
        )}

        {status === 'success' && (
          <p className="font-sans text-sm text-green-600">Cookie 已自动保存，即将跳转...</p>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-1.5 text-red-500">
              <AlertCircle size={14} />
              <span className="font-sans text-sm">{errorMessage}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={fetchQrCode}>
              <RefreshCw size={13} className="mr-1.5" />
              重新获取
            </Button>
          </div>
        )}
      </div>

      {/* 非 idle 状态下提供「取消」回路 */}
      {(status === 'loading' || status === 'scanning') && (
        <button
          onClick={() => {
            stopPolling();
            setStatus('idle');
            setQrcodeData(null);
          }}
          className="font-sans text-xs text-[var(--color-text-subtle)] hover:text-[var(--color-text-muted)] transition-colors"
        >
          取消
        </button>
      )}
    </div>
  );
}
