/**
 * ReadTree Service Worker
 * 策略：网络优先，离线回退到缓存
 */

const CACHE_NAME = 'readtree-v1';

// 应用 shell：预缓存的核心路由
const PRECACHE_URLS = ['/', '/settings'];

// ─── Install：预缓存核心资源 ────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ─── Activate：清理旧版本缓存 ───────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ─── Fetch：网络优先，失败回退缓存 ─────────────────────────
self.addEventListener('fetch', (event) => {
  // 只处理 GET 请求，跳过 API 调用（Next.js 内部路由）
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // 跳过 Next.js 内部路由 (_next/*) 和外部资源
  if (url.pathname.startsWith('/_next/') || url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        // 成功时更新缓存（仅缓存同源正常响应）
        if (response.ok) {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned));
        }
        return response;
      })
      .catch(() =>
        // 网络失败时从缓存回退
        caches.match(request)
      )
  );
});
