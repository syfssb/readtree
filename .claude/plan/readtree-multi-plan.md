# ReadTree 并行子任务拆分方案

## 执行架构

```
Round 0 (串行，主终端)    → Sub-task 0: 项目骨架 + 配置 + Schema + 类型
                              ↓ commit + push to main
Round 1 (3路并行)        → Sub-task 1: WeRead API 客户端
                          → Sub-task 2: Repository 数据层
                          → Sub-task 3: UI 基础组件
                              ↓ 逐个 review + 按顺序 merge
Round 2 (2路并行)        → Sub-task 4: API Routes
                          → Sub-task 5: 页面 + 树组件 + 交互
                              ↓ review + merge + 部署
```

---

## Sub-task 0: 项目骨架（串行，在 main 分支完成）

### 完成标准
- [ ] Tailwind 配置含 Anthropic 设计系统色彩/阴影/字体
- [ ] globals.css 含 CSS 变量（亮/暗模式）
- [ ] Drizzle schema 定义所有 6 张表
- [ ] 数据库连接模块（SQLite/Postgres 双驱动）
- [ ] 所有业务类型定义
- [ ] Zod 验证 schema
- [ ] ThemeProvider + 根布局 + 字体加载
- [ ] vitest 配置
- [ ] .env.example

### 文件清单
```
src/app/globals.css                    (修改)
src/app/layout.tsx                     (修改)
src/lib/db/schema.ts                   (新建)
src/lib/db/index.ts                    (新建)
src/lib/validators/index.ts            (新建)
src/types/book.ts                      (新建)
src/types/chapter.ts                   (新建)
src/types/highlight.ts                 (新建)
src/types/note.ts                      (新建)
src/types/api.ts                       (新建)
src/providers/theme-provider.tsx       (新建)
tailwind.config.ts                     (新建，覆盖默认)
drizzle.config.ts                      (新建)
vitest.config.ts                       (新建)
.env.example                           (新建)
.env.local                             (新建)
next.config.ts                         (修改)
```

---

## Sub-task 1: WeRead API 客户端 (feat/weread-api)

### Prompt
```
你的任务是在 ReadTree 项目中实现微信读书 API 客户端模块。

技术栈：Next.js + TypeScript。项目已有 Drizzle schema 和类型定义，在 src/types/ 和 src/lib/db/schema.ts。

请实现以下文件：

1. src/lib/weread/types.ts — WeRead API 原始响应类型
   - WeReadChapterInfo: { chapterUid, chapterIdx, title, level, ... }
   - WeReadBookmark: { bookmarkId, chapterUid, markText, style, colorStyle, ... }
   - WeReadReview: { reviewId, chapterUid, content, abstract, ... }
   - WeReadBookInfo: { bookId, title, author, cover, isbn, ... }

2. src/lib/weread/parser.ts — URL 解析 + 数据转换
   - extractBookId(url): 从 weread.qq.com/web/reader/xxx 提取 bookId
   - mapChapterInfoToChapter(): WeRead 数据 → 应用 Chapter 类型
   - mapBookmarkToHighlight(): WeRead 数据 → 应用 Highlight 类型
   - mapReviewToNote(): WeRead 数据 → 应用 Note 类型

3. src/lib/weread/rate-limiter.ts — 令牌桶限流器
   - 每秒最多 2 个请求，桶容量 5
   - acquire() 方法，无令牌时等待

4. src/lib/weread/client.ts — WeReadClient 类
   - 基于 Cookie 认证 (wr_vid + wr_skey)
   - getBookInfo(bookId) → GET https://i.weread.qq.com/book/info
   - getChapters(bookId) → POST https://i.weread.qq.com/book/chapterInfos
   - getBookmarks(bookId) → GET https://i.weread.qq.com/book/bookmarklist
   - getReviews(bookId) → GET https://i.weread.qq.com/review/list
   - 内置 rateLimiter.acquire()
   - Cookie 过期检测（-2012/-2010 错误码）

5. src/lib/utils/errors.ts — 错误处理
   - AppError 基类 (statusCode, code, message)
   - CookieExpiredError, BookNotFoundError, ValidationError

6. tests/unit/lib/weread/parser.test.ts — URL 解析测试
7. tests/unit/lib/weread/rate-limiter.test.ts — 限流器测试
8. tests/unit/lib/weread/client.test.ts — API 客户端测试 (mock fetch)

设计原则：
- 不可变数据（所有转换返回新对象）
- 函数小于 50 行
- 完善的错误处理
- 80%+ 测试覆盖率

⚠️ 你只能修改上述文件，不要触碰其他目录的文件。
```

### 文件清单（独占）
```
src/lib/weread/types.ts
src/lib/weread/parser.ts
src/lib/weread/rate-limiter.ts
src/lib/weread/client.ts
src/lib/utils/errors.ts
tests/unit/lib/weread/parser.test.ts
tests/unit/lib/weread/rate-limiter.test.ts
tests/unit/lib/weread/client.test.ts
```

---

## Sub-task 2: Repository 数据层 (feat/repositories)

### Prompt
```
你的任务是在 ReadTree 项目中实现 Repository 数据访问层。

技术栈：Drizzle ORM + SQLite (better-sqlite3)。Schema 已定义在 src/lib/db/schema.ts，
数据库连接在 src/lib/db/index.ts，类型在 src/types/。

请用 Repository Pattern 实现以下文件：

1. src/repositories/book.repository.ts
   - findAll(): Promise<Book[]>
   - findById(id): Promise<Book | null>
   - findByWereadId(wereadBookId): Promise<Book | null>
   - create(data): Promise<Book>
   - delete(id): Promise<void>

2. src/repositories/chapter.repository.ts
   - findByBookId(bookId): Promise<Chapter[]> (按 orderIndex 排序)
   - findById(id): Promise<Chapter | null>
   - createMany(chapters): Promise<Chapter[]>
   - updateSummary(id, summary): Promise<Chapter>
   - deleteByBookId(bookId): Promise<void>

3. src/repositories/highlight.repository.ts
   - findByChapterId(chapterId): Promise<Highlight[]>
   - findByBookId(bookId): Promise<Highlight[]> (JOIN chapters)
   - upsertMany(highlights): Promise<void> (基于 wereadBookmarkId 去重)

4. src/repositories/note.repository.ts
   - findByChapterId(chapterId): Promise<Note[]>
   - upsertMany(notes): Promise<void> (基于 wereadReviewId 去重)

5. src/repositories/quote.repository.ts
   - findByChapterId(chapterId): Promise<ManualQuote[]>
   - create(data): Promise<ManualQuote>
   - delete(id): Promise<void>

6. src/repositories/config.repository.ts
   - getConfig(): Promise<UserConfig | null>
   - upsertConfig(cookie): Promise<UserConfig>

7. tests/unit/repositories/book.repository.test.ts
8. tests/unit/repositories/chapter.repository.test.ts

每个 Repository：
- 使用 Drizzle ORM 操作数据库（导入 db from '@/lib/db'）
- 使用 nanoid 生成 ID
- 所有方法纯函数风格，不可变返回
- upsert 使用 Drizzle 的 onConflictDoUpdate

⚠️ 你只能修改上述文件，不要触碰其他目录的文件。
```

### 文件清单（独占）
```
src/repositories/book.repository.ts
src/repositories/chapter.repository.ts
src/repositories/highlight.repository.ts
src/repositories/note.repository.ts
src/repositories/quote.repository.ts
src/repositories/config.repository.ts
tests/unit/repositories/book.repository.test.ts
tests/unit/repositories/chapter.repository.test.ts
```

---

## Sub-task 3: UI 基础组件 (feat/ui-components)

### Prompt
```
你的任务是在 ReadTree 项目中实现 Anthropic 设计风格的 UI 基础组件。

技术栈：React 19 + Tailwind CSS 4 + lucide-react 图标。
Anthropic 设计系统已在 tailwind.config.ts 和 globals.css 中配置。

核心设计规则（必须严格遵守）：
- 页面背景 #faf9f5（暖象牙），永远不用纯白 #fff 做页面背景
- 文字 #141413（近黑），永远不用纯黑
- 卡片：白底 #fff，三层微阴影，rounded-2xl，border-[#1414131a]
- 按钮：Primary bg-[#141413]，CTA bg-[#c6613f]（clay 橙）
- 侧边栏项：flat rows，hover:bg-[#f0eee6]，不要 card-per-item
- 选中状态：背景提亮 + 左侧 3px accent bar，不用 accent 文字色
- 字体：serif (Lora) 用于内容正文，sans (Poppins) 用于 UI 标签/按钮
- 过渡：200ms，ease
- 暗色模式：bg-[#2b2a27]，card bg-[#3d3d3a]
- 边框用透明度：border-[#1414131a]，hover 变 border-[#14141333]
- 无渐变，无霓虹，无重阴影

请实现：

1. src/components/ui/button.tsx
   - variants: primary, cta, ghost, outline
   - sizes: sm, md, lg
   - disabled 状态，active:scale-[0.98]

2. src/components/ui/input.tsx
   - label, error, placeholder 支持
   - focus 态：border-[#141413]

3. src/components/ui/card.tsx
   - 三层微阴影
   - CardHeader, CardBody, CardFooter 子组件

4. src/components/ui/textarea.tsx
   - 自动增高
   - 用于章节总结编辑

5. src/components/ui/badge.tsx
   - 用于显示计数（划线数、笔记数）
   - 半透明背景

6. src/components/ui/skeleton.tsx
   - 加载骨架屏，象牙色脉冲

7. src/components/ui/toast.tsx
   - 轻量通知（成功/错误/信息）
   - ToastProvider + useToast hook

8. src/components/ui/dialog.tsx
   - 模态对话框，overlay bg-black/40
   - 动画 fade-in + zoom-in-95

9. src/components/layout/header.tsx
   - 左侧 "ReadTree" 品牌名（serif 字体）
   - 右侧：暗色模式切换 + 设置图标

10. src/components/layout/sidebar.tsx
    - 固定宽度 320px
    - overflow-y-auto 可滚动
    - 接收 children（目录树）

11. src/components/layout/content-panel.tsx
    - flex-1 自适应
    - 内容区域容器

所有组件：
- 使用 React.forwardRef
- 支持 className 合并（cn 工具函数，用 clsx + tailwind-merge 或简单拼接）
- 支持暗色模式 (dark: 前缀)
- 'use client' 指令

⚠️ 你只能创建/修改上述文件，不要触碰其他目录的文件。
```

### 文件清单（独占）
```
src/components/ui/button.tsx
src/components/ui/input.tsx
src/components/ui/card.tsx
src/components/ui/textarea.tsx
src/components/ui/badge.tsx
src/components/ui/skeleton.tsx
src/components/ui/toast.tsx
src/components/ui/dialog.tsx
src/components/layout/header.tsx
src/components/layout/sidebar.tsx
src/components/layout/content-panel.tsx
src/lib/utils/cn.ts
```

---

## Sub-task 4: API Routes (feat/api-routes)

### 依赖
- Sub-task 1 (WeRead Client) 和 Sub-task 2 (Repositories) 必须先合并到 main

### Prompt
```
你的任务是在 ReadTree 项目中实现所有 API Route Handlers。

技术栈：Next.js 16 App Router API Routes。
WeRead 客户端在 src/lib/weread/client.ts，
Repository 层在 src/repositories/，
类型在 src/types/，
验证 schema 在 src/lib/validators/index.ts。

请实现：

1. src/app/api/books/route.ts
   - POST: 接收 { url }，解析 bookId，调用 WeReadClient 获取书籍+目录，入库
   - GET: 返回所有书籍列表

2. src/app/api/books/[bookId]/route.ts
   - GET: 返回书籍详情 + 章节树 + 各章节笔记计数
   - DELETE: 级联删除书籍及关联数据

3. src/app/api/books/[bookId]/sync/route.ts
   - POST: 同步划线+笔记，构建 chapterUid→chapterId 映射，upsert

4. src/app/api/books/[bookId]/chapters/[chapterId]/summary/route.ts
   - PUT: 更新章节总结 { summary }

5. src/app/api/books/[bookId]/chapters/[chapterId]/quotes/route.ts
   - GET: 获取手动引用
   - POST: 创建手动引用 { text }
   - DELETE: 删除手动引用 { quoteId }

6. src/app/api/books/[bookId]/export/route.ts
   - GET: 导出整本书的 Markdown

7. src/app/api/config/route.ts
   - GET: 获取配置（Cookie 脱敏）
   - PUT: 更新 Cookie

8. src/lib/utils/markdown.ts — Markdown 导出生成器

统一响应格式：
- 成功: { success: true, data: T }
- 失败: { success: false, error: { code, message } }

错误处理：使用 src/lib/utils/errors.ts 中的 AppError 体系。

⚠️ 你只能创建/修改上述文件，不要触碰 src/components/ 或 src/app/page.tsx。
```

### 文件清单（独占）
```
src/app/api/books/route.ts
src/app/api/books/[bookId]/route.ts
src/app/api/books/[bookId]/sync/route.ts
src/app/api/books/[bookId]/chapters/[chapterId]/summary/route.ts
src/app/api/books/[bookId]/chapters/[chapterId]/quotes/route.ts
src/app/api/books/[bookId]/export/route.ts
src/app/api/config/route.ts
src/lib/utils/markdown.ts
```

---

## Sub-task 5: 页面 + 树组件 + 交互 (feat/pages)

### 依赖
- Sub-task 3 (UI 组件) 和 Sub-task 4 (API Routes) 必须先合并到 main

### Prompt
```
你的任务是在 ReadTree 项目中实现所有页面和业务组件。

技术栈：Next.js 16 App Router + React 19。
UI 基础组件在 src/components/ui/，布局在 src/components/layout/，
API 路由在 src/app/api/，类型在 src/types/。

遵循 Anthropic UI 设计规范（暖象牙/微阴影/serif 正文/sans 标签）。

请实现：

=== 首页 ===
1. src/components/book/url-input.tsx — URL 输入组件
   - 大输入框居中，placeholder "粘贴微信读书链接..."
   - CTA 按钮，加载状态
   - URL 格式实时验证

2. src/app/page.tsx — 首页
   - 品牌标题 "ReadTree"（serif 字体）
   - 说明文案 + UrlInput
   - 下方已有书籍列表

=== 目录树 ===
3. src/lib/utils/tree.ts — 树形数据工具
   - buildChapterTree(chapters): 按 level 构建父子关系
   - flattenTree / findNodeById

4. src/components/tree/tree-context.tsx — 树状态 Context
   - expandedIds: Set<string>, selectedId
   - toggleNode, selectNode, expandAll, collapseAll

5. src/components/tree/tree-node.tsx — 递归树节点
   - 根据 level 缩进（pl-[level*16px]）
   - 展开/折叠箭头
   - 选中态：bg-[#f0eee6] + 左侧 3px clay accent bar
   - 有笔记章节显示 ● 标记

6. src/components/tree/chapter-tree.tsx — 目录树主组件
   - 顶部全部展开/折叠按钮
   - TreeProvider 包裹

=== 右侧内容面板 ===
7. src/components/chapter/chapter-detail.tsx — 章节详情容器
8. src/components/chapter/summary-editor.tsx — 总结编辑器
   - 自动保存（debounce 1s → PUT /api/.../summary）
   - 保存状态指示
9. src/components/chapter/highlight-list.tsx — 划线列表
   - 左侧竖线装饰
10. src/components/chapter/note-list.tsx — 笔记列表
11. src/components/chapter/quote-manager.tsx — 手动引用管理
   - 输入框 + 添加按钮 + 删除确认

=== 设置 ===
12. src/components/settings/cookie-form.tsx — Cookie 配置
13. src/app/settings/page.tsx — 设置页

=== 书籍主页 ===
14. src/app/book/[bookId]/page.tsx — 左右分栏布局
    - Server Component 加载数据
    - Sidebar(ChapterTree) + ContentPanel(ChapterDetail)
    - "同步笔记" 按钮
15. src/app/book/[bookId]/loading.tsx — 骨架屏

=== Hooks ===
16. src/hooks/use-book.ts
17. src/hooks/use-chapters.ts
18. src/hooks/use-chapter-content.ts
19. src/hooks/use-sync.ts
20. src/hooks/use-theme.ts
21. src/hooks/use-debounce.ts

=== 书籍组件 ===
22. src/components/book/book-card.tsx — 书架卡片
23. src/components/book/book-meta.tsx — 书籍元信息

⚠️ 你只能创建/修改上述文件，不要触碰 src/lib/weread/、src/repositories/、src/app/api/。
```

### 文件清单（独占）
```
src/app/page.tsx
src/app/book/[bookId]/page.tsx
src/app/book/[bookId]/loading.tsx
src/app/settings/page.tsx
src/components/book/url-input.tsx
src/components/book/book-card.tsx
src/components/book/book-meta.tsx
src/components/tree/chapter-tree.tsx
src/components/tree/tree-node.tsx
src/components/tree/tree-context.tsx
src/components/chapter/chapter-detail.tsx
src/components/chapter/summary-editor.tsx
src/components/chapter/highlight-list.tsx
src/components/chapter/note-list.tsx
src/components/chapter/quote-manager.tsx
src/components/settings/cookie-form.tsx
src/hooks/use-book.ts
src/hooks/use-chapters.ts
src/hooks/use-chapter-content.ts
src/hooks/use-sync.ts
src/hooks/use-theme.ts
src/hooks/use-debounce.ts
src/lib/utils/tree.ts
```

---

## 文件冲突检查

| 文件 | Sub-task 0 | 1 | 2 | 3 | 4 | 5 |
|------|:-:|:-:|:-:|:-:|:-:|:-:|
| src/lib/weread/* | | ✅ | | | | |
| src/lib/utils/errors.ts | | ✅ | | | | |
| src/lib/utils/cn.ts | | | | ✅ | | |
| src/lib/utils/tree.ts | | | | | | ✅ |
| src/lib/utils/markdown.ts | | | | | ✅ | |
| src/repositories/* | | | ✅ | | | |
| src/components/ui/* | | | | ✅ | | |
| src/components/layout/* | | | | ✅ | | |
| src/components/tree/* | | | | | | ✅ |
| src/components/chapter/* | | | | | | ✅ |
| src/components/book/* | | | | | | ✅ |
| src/components/settings/* | | | | | | ✅ |
| src/app/api/** | | | | | ✅ | |
| src/app/page.tsx | | | | | | ✅ |
| src/app/book/** | | | | | | ✅ |
| src/hooks/* | | | | | | ✅ |
| src/lib/db/* | ✅ | | | | | |
| src/types/* | ✅ | | | | | |
| src/providers/* | ✅ | | | | | |

**零重叠 ✅** — 每个文件只属于一个子任务。

---

## Worktree 命令

```bash
# Round 0 完成后，在 main 上 commit

# Round 1: 创建 3 个 worktree
git worktree add ../readtree-weread-api feat/weread-api
git worktree add ../readtree-repositories feat/repositories
git worktree add ../readtree-ui-components feat/ui-components

# 3 个终端分别进入对应目录，启动 claude (Sonnet)

# Round 1 合并（按顺序）
git merge feat/weread-api
git merge feat/repositories
git merge feat/ui-components

# Round 2: 创建 2 个 worktree
git worktree add ../readtree-api-routes feat/api-routes
git worktree add ../readtree-pages feat/pages

# 2 个终端并行

# Round 2 合并
git merge feat/api-routes
git merge feat/pages

# 清理
git worktree remove ../readtree-weread-api
git worktree remove ../readtree-repositories
git worktree remove ../readtree-ui-components
git worktree remove ../readtree-api-routes
git worktree remove ../readtree-pages
```
