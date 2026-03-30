'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

/**
 * 设置页
 * Cookie 配置 + 当前配置状态
 */
export default function SettingsPage() {
  const [cookie, setCookie] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  // 加载当前 Cookie 配置状态
  useEffect(() => {
    fetch('/api/config')
      .then((r) => r.json())
      .then((json) => {
        const data = json.data ?? json;
        if (data?.wereadCookie) {
          setIsConfigured(true);
          // 不回填 Cookie 原文，保护安全
        }
      })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    const trimmed = cookie.trim();
    if (!trimmed || saveStatus === 'saving') return;

    setSaveStatus('saving');
    try {
      const res = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wereadCookie: trimmed }),
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

  const saveLabel = {
    idle: '保存',
    saving: '保存中...',
    saved: '已保存',
    error: '保存失败，重试',
  }[saveStatus];

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

          {/* Cookie 配置卡片 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="font-sans text-base font-semibold text-[var(--color-text-primary)]">
                  微信读书 Cookie
                </h2>
                {isConfigured ? (
                  <span className="inline-flex items-center gap-1 font-sans text-xs text-green-600">
                    <CheckCircle size={13} />
                    已配置
                  </span>
                ) : (
                  <span className="font-sans text-xs text-[var(--color-text-subtle)]">
                    未配置
                  </span>
                )}
              </div>
            </CardHeader>

            <CardBody>
              {/* 说明文案 */}
              <p className="font-sans text-sm text-[var(--color-text-muted)] mb-4 leading-relaxed">
                在浏览器中登录{' '}
                <a
                  href="https://weread.qq.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--color-accent)] hover:underline"
                >
                  weread.qq.com
                </a>
                ，打开开发者工具（F12），切换到 Network 标签页，
                刷新页面，找到任意请求，复制 Request Headers 中的 Cookie 值粘贴到下方。
              </p>

              {/* Cookie 输入 */}
              <Textarea
                value={cookie}
                onChange={(e) => {
                  setCookie(e.target.value);
                  if (saveStatus !== 'idle') setSaveStatus('idle');
                }}
                placeholder="wr_skey=...; wr_vid=...; ..."
                minRows={5}
                className="font-mono text-xs mb-4"
              />

              <Button
                variant="primary"
                size="md"
                disabled={!cookie.trim() || saveStatus === 'saving'}
                onClick={handleSave}
              >
                {saveLabel}
              </Button>
            </CardBody>
          </Card>
        </div>
      </main>
    </div>
  );
}
