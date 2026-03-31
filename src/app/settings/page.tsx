'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { QrLogin } from '@/components/settings/qr-login';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

/**
 * 设置页
 *
 * 登录方式：
 * 1. 主要方式：微信扫码登录（自动获取并保存 Cookie）
 * 2. 备用方式：手动粘贴 Cookie（折叠隐藏，点击展开）
 */
export default function SettingsPage() {
  const [isConfigured, setIsConfigured] = useState(false);

  // 手动 Cookie 输入相关状态
  const [showManualInput, setShowManualInput] = useState(false);
  const [cookie, setCookie] = useState('');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  // 加载当前 Cookie 配置状态
  useEffect(() => {
    fetch('/api/config')
      .then((r) => r.json())
      .then((json) => {
        const data = json.data ?? json;
        if (data?.wereadCookie) {
          setIsConfigured(true);
        }
      })
      .catch(() => {});
  }, []);

  const handleManualSave = async () => {
    const trimmed = cookie.trim();
    if (!trimmed || saveStatus === 'saving') return;

    setSaveStatus('saving');
    try {
      const res = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cookie: trimmed }),
      });

      if (res.ok) {
        setSaveStatus('saved');
        setIsConfigured(true);
        setCookie('');
      } else {
        setSaveStatus('error');
      }
    } catch {
      setSaveStatus('error');
    }
  };

  const saveLabel: Record<SaveStatus, string> = {
    idle: '保存',
    saving: '保存中...',
    saved: '已保存',
    error: '保存失败，重试',
  };

  return (
    <div className="min-h-screen bg-[var(--color-page-bg)]">
      <Header />

      <main className="pt-14">
        <div className="max-w-2xl mx-auto px-6 py-10">
          {/* 返回链接 */}
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 font-sans text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors duration-200 mb-6"
          >
            <ArrowLeft size={14} />
            返回首页
          </Link>

          {/* 页面标题 */}
          <h1 className="font-serif text-2xl font-bold text-[var(--color-text-primary)] mb-6">
            设置
          </h1>

          {/* 登录卡片 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="font-sans text-base font-semibold text-[var(--color-text-primary)]">
                  微信读书账号
                </h2>
                {isConfigured ? (
                  <span className="inline-flex items-center gap-1 font-sans text-xs text-green-600">
                    <CheckCircle size={13} />
                    已登录
                  </span>
                ) : (
                  <span className="font-sans text-xs text-[var(--color-text-subtle)]">
                    未登录
                  </span>
                )}
              </div>
            </CardHeader>

            <CardBody>
              {/* 扫码登录区域（主要方式） */}
              <div className="flex flex-col items-center py-4">
                <QrLogin
                  onSuccess={() => {
                    setIsConfigured(true);
                    setSaveStatus('idle');
                  }}
                />
              </div>

              {/* 分隔线 */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[var(--color-border)]" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-[var(--color-card)] px-3 font-sans text-xs text-[var(--color-text-subtle)]">
                    或
                  </span>
                </div>
              </div>

              {/* 手动 Cookie 输入（折叠，作为备用方案） */}
              <div>
                <button
                  onClick={() => setShowManualInput((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 font-sans text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors duration-200"
                >
                  {showManualInput ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  手动粘贴 Cookie（高级）
                </button>

                {showManualInput && (
                  <div className="mt-4 space-y-3">
                    <p className="font-sans text-sm text-[var(--color-text-muted)] leading-relaxed">
                      在浏览器中登录{' '}
                      <a
                        href="https://weread.qq.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--color-accent)] hover:underline"
                      >
                        weread.qq.com
                      </a>
                      ，打开开发者工具（F12），切换到 Network 标签，
                      刷新页面，找到任意请求，复制 Request Headers 中的 Cookie 值粘贴到下方。
                    </p>

                    <Textarea
                      value={cookie}
                      onChange={(e) => {
                        setCookie(e.target.value);
                        if (saveStatus !== 'idle') setSaveStatus('idle');
                      }}
                      placeholder="wr_skey=...; wr_vid=...; ..."
                      minRows={4}
                      className="font-mono text-xs"
                    />

                    <Button
                      variant="primary"
                      size="md"
                      disabled={!cookie.trim() || saveStatus === 'saving'}
                      onClick={handleManualSave}
                    >
                      {saveLabel[saveStatus]}
                    </Button>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      </main>
    </div>
  );
}
