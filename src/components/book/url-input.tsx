'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

/** 微信读书 URL 格式校验 */
function isValidWereadUrl(url: string): boolean {
  return url.includes('weread.qq.com');
}

type SubmitError = 'invalid_url' | 'cookie_not_configured' | 'network_error' | null;

const errorMessages: Record<NonNullable<SubmitError>, string> = {
  invalid_url: '请输入有效的微信读书链接，格式如 https://weread.qq.com/web/reader/...',
  cookie_not_configured: 'Cookie 未配置，请前往设置页面配置微信读书 Cookie',
  network_error: '网络错误，请稍后重试',
};

/**
 * 书籍 URL 输入框
 * 提交后调用 POST /api/books，成功跳转书籍详情页
 */
export function UrlInput() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<SubmitError>(null);

  const handleSubmit = async () => {
    const trimmed = url.trim();
    if (!trimmed) return;

    if (!isValidWereadUrl(trimmed)) {
      setError('invalid_url');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      });

      const json = await res.json();

      if (!res.ok) {
        const code = json?.error?.code ?? '';
        if (code === 'COOKIE_NOT_CONFIGURED' || res.status === 401) {
          setError('cookie_not_configured');
        } else {
          setError('network_error');
        }
        return;
      }

      const bookId = json.data?.id ?? json.id;
      router.push(`/book/${bookId}`);
    } catch {
      setError('network_error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div className="w-full flex flex-col gap-3">
      <div className="flex gap-3">
        <div className="flex-1">
          <Input
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder="粘贴微信读书链接，例如 https://weread.qq.com/web/reader/..."
            disabled={isLoading}
            className="text-base py-3"
          />
        </div>
        <Button
          variant="cta"
          size="md"
          disabled={!url.trim() || isLoading}
          onClick={handleSubmit}
          className="shrink-0 min-w-[100px]"
        >
          {isLoading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            '开始阅读'
          )}
        </Button>
      </div>

      {/* 错误提示 */}
      {error && (
        <p className="font-sans text-sm text-red-600">
          {errorMessages[error]}
        </p>
      )}
    </div>
  );
}
