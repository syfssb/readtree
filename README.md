# ReadTree

> 把微信读书的碎片化划线笔记，长成一棵有结构的知识树

<p align="center">
  <img src="docs/screenshots/readme-home.png" alt="ReadTree 首页" width="800" />
</p>

---

## 为什么做这个？

微信读书的划线功能太顺手了——读到好句子，随手一划，继续往下看。但问题是，**划了就忘**。等你想回头复习，几十条碎片化的划线堆在一起，根本不知道哪条对应哪个章节，更别说理清脉络了。

笔记碎片化是个普遍痛点：你记下了"什么"，却丢失了"为什么"和"在哪个上下文里"。单条金句很美，但没有结构，就像散落一地的拼图，拼不出全貌。

ReadTree 的想法很简单：**以书籍目录为骨架，把你的划线和笔记挂到对应章节上**，自动长成一棵知识树。每次打开，你看到的不是一堆碎片，而是一本被你读透的书。

---

## 功能亮点

- 📖 **粘贴链接，自动抓取** — 贴入微信读书书籍链接，自动解析书名、封面和完整目录
- 🌳 **可视化知识树** — 用 React Flow 渲染树形图，章节层级一目了然，支持拖拽和缩放
- ✏️ **章节笔记** — 给每个章节写总结，记录你的理解和思考
- 📌 **自动同步划线** — 一键拉取微信读书的划线和批注，自动挂载到对应章节
- 🔍 **手动添加句子** — 遇到好句子，手动添加精彩引用，随时补充
- 📤 **一键导出 Markdown** — 整本书的笔记结构化导出，方便归档或导入 Obsidian / Notion
- 🌙 **暗色模式** — 保护你的眼睛，深夜读书也舒适
- 📱 **微信扫码登录** — 扫码即登录，无需手动复制 Cookie，省心省力

---

## 截图预览

<p align="center">
  <img src="docs/screenshots/readme-tree.png" alt="树形知识图" width="800" />
  <br/>
  <em>树形图视图 — 章节层级清晰，点击节点可查看笔记</em>
</p>

<p align="center">
  <img src="docs/screenshots/readme-detail.png" alt="章节详情" width="800" />
  <br/>
  <em>章节详情 — 划线、批注、个人总结集中展示</em>
</p>

<p align="center">
  <img src="docs/screenshots/readme-settings.png" alt="设置页" width="800" />
  <br/>
  <em>设置页 — 扫码登录微信读书，授权一次即可</em>
</p>

<p align="center">
  <img src="docs/screenshots/readme-dark.png" alt="暗色模式" width="800" />
  <br/>
  <em>暗色模式 — 夜间阅读更护眼</em>
</p>

---

## 快速开始（本地开发）

```bash
# 1. 克隆项目
git clone https://github.com/syfssb/readtree.git
cd readtree

# 2. 安装依赖
npm install

# 3. 初始化本地数据库（SQLite，零配置）
npx drizzle-kit push

# 4. 启动
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 即可使用。本地开发使用 SQLite 文件数据库，数据保存在 `data/readtree.db`，无需任何外部服务。

---

## 使用方法

1. **扫码登录** — 打开设置页，用微信扫码完成微信读书授权（只需一次）
2. **添加书籍** — 回到首页，粘贴微信读书书籍链接，点击添加
3. **查看知识树** — 进入书籍页，目录会自动解析成可视化树形图
4. **同步划线** — 点击「同步笔记」按钮，划线和批注自动拉取并挂载到章节
5. **写章节总结** — 点击任意章节节点，为该章节添加你自己的总结和思考
6. **导出笔记** — 点击导出按钮，整本书的结构化笔记以 Markdown 格式下载

---

## 技术栈

| 分类 | 技术 |
|------|------|
| 前端框架 | Next.js 16 + React 19 |
| 样式 | Tailwind CSS 4 |
| 可视化 | React Flow (@xyflow/react) |
| 数据库 | SQLite (本地) / Turso (云端) + Drizzle ORM |
| 主题 | 自定义 ThemeProvider（支持暗色模式） |
| 表单校验 | Zod |
| 测试 | Vitest |

---

## 项目结构

```
src/
├── app/                  # Next.js App Router 页面和 API 路由
│   ├── page.tsx          # 首页（书架）
│   ├── book/[bookId]/    # 书籍详情页（树形图）
│   ├── settings/         # 设置页（登录 & 配置）
│   └── api/              # 后端 API 路由
│       ├── auth/         # 微信扫码登录
│       ├── books/        # 书籍 CRUD
│       └── books/[bookId]/
│           ├── sync/     # 同步划线
│           ├── export/   # 导出 Markdown
│           └── chapters/ # 章节笔记管理
├── components/           # UI 组件
│   ├── tree/             # 树形图相关组件
│   ├── chapter/          # 章节详情组件
│   ├── book/             # 书架和书籍卡片
│   └── settings/         # 设置页组件
├── repositories/         # 数据访问层（Repository 模式）
├── lib/                  # 工具函数和微信读书 API 封装
└── types/                # TypeScript 类型定义
```

---

## 部署到线上

本地开发用 SQLite 没问题，但部署到 Vercel 等 Serverless 平台时，需要用云端数据库。我们选择 [Turso](https://turso.tech)——免费的云端 SQLite，和本地开发完全兼容。

### 第一步：创建 Turso 数据库（免费）

1. 去 [turso.tech](https://turso.tech) 注册账号（GitHub 一键登录）
2. 点 **Create Database**，名称填 `readtree`，区域选离你最近的
3. 创建完成后，在数据库详情页找到：
   - **Database URL**：类似 `libsql://readtree-xxx.turso.io`
   - **Auth Token**：点 "Generate Token" 获取

### 第二步：初始化云端数据库表结构

在本地终端执行（把下面的 URL 和 Token 替换成你自己的）：

```bash
node -e "
const { createClient } = require('@libsql/client');
const client = createClient({
  url: '你的 TURSO_DATABASE_URL',
  authToken: '你的 TURSO_AUTH_TOKEN',
});

client.executeMultiple(\`
  CREATE TABLE IF NOT EXISTS books (id TEXT PRIMARY KEY, title TEXT NOT NULL, author TEXT NOT NULL, cover_url TEXT, weread_book_id TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS chapters (id TEXT PRIMARY KEY, book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE, chapter_uid INTEGER NOT NULL, title TEXT NOT NULL, level INTEGER NOT NULL, order_index INTEGER NOT NULL, summary TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS highlights (id TEXT PRIMARY KEY, chapter_id TEXT NOT NULL REFERENCES chapters(id) ON DELETE CASCADE, text TEXT NOT NULL, range TEXT, color_style INTEGER NOT NULL DEFAULT 0, weread_bookmark_id TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS notes (id TEXT PRIMARY KEY, chapter_id TEXT NOT NULL REFERENCES chapters(id) ON DELETE CASCADE, text TEXT NOT NULL, abstract TEXT, weread_review_id TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS manual_quotes (id TEXT PRIMARY KEY, chapter_id TEXT NOT NULL REFERENCES chapters(id) ON DELETE CASCADE, text TEXT NOT NULL, created_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS user_config (id TEXT PRIMARY KEY, weread_cookie TEXT NOT NULL, updated_at TEXT NOT NULL);
\`).then(() => console.log('✅ 表结构创建成功'));
"
```

### 第三步：部署到 Vercel

1. Fork 本项目到你的 GitHub
2. 去 [vercel.com](https://vercel.com) → **Add New Project** → 导入你 fork 的仓库
3. 在部署前，点 **Environment Variables** 添加两个变量：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `TURSO_DATABASE_URL` | `libsql://readtree-xxx.turso.io` | Turso 数据库地址 |
| `TURSO_AUTH_TOKEN` | `eyJhbG...` | Turso 认证令牌 |

4. 点 **Deploy**，等待部署完成
5. 访问 Vercel 分配的域名，开始使用 🎉

> **为什么需要 Turso？** Vercel 是 Serverless 架构，不支持本地文件系统（SQLite 文件会在每次冷启动后丢失）。Turso 是云端 SQLite，API 兼容、免费额度够用、国内访问速度也不错。

### 部署到 Zeabur（替代方案）

如果你更喜欢 Zeabur：

1. 在 [Zeabur](https://zeabur.com) 创建项目
2. 添加服务 → Git → 选你的仓库
3. 同样添加 `TURSO_DATABASE_URL` 和 `TURSO_AUTH_TOKEN` 环境变量
4. 部署完成

### 部署到自己的服务器（VPS / Docker）

如果你有自己的服务器，可以直接用 SQLite，不需要 Turso：

```bash
git clone https://github.com/syfssb/readtree.git
cd readtree
npm install
npx drizzle-kit push    # 初始化 SQLite 数据库
npm run build
npm start               # 默认端口 3000
```

数据保存在 `data/readtree.db` 文件中，记得定期备份。

---

## License

[MIT](./LICENSE)
