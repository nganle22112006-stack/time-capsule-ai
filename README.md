# Time Capsule Persona Site

一个基于 Next.js App Router 的时间胶囊网站。用户可以填写人格问卷、记录人生事件、上传头像、和“那个时间点的自己”聊天，并导出这个阶段的人格提示词与记忆档案。

## 技术栈

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- shadcn/ui
- pnpm

## 本地运行

前置要求：

- Node.js `20.9+`
- pnpm `9+`

安装依赖：

```bash
pnpm install
```

复制环境变量模板：

```bash
cp .env.example .env.local
```

启动开发环境：

```bash
pnpm dev
```

默认访问地址：

```text
http://localhost:3000
```

常用命令：

```bash
pnpm test
pnpm lint
pnpm ts-check
pnpm build
```

## 环境变量

当前项目不再依赖 Coze SDK。聊天由一个轻量 `/api/chat` 路由转发到底层模型接口，并通过环境变量切换 provider。

必须配置：

- `LLM_PROVIDER`
  可选值：`deepseek`、`minimax`

按 provider 配置：

- `DEEPSEEK_API_KEY`
- `DEEPSEEK_BASE_URL`
- `DEEPSEEK_MODEL`
- `MINIMAX_API_KEY`
- `MINIMAX_BASE_URL`
- `MINIMAX_MODEL`

说明：

- 只有当前启用的 provider 会在运行时校验对应变量。
- 构建阶段不会因为未启用 provider 的变量缺失而失败。
- 推荐把 `*_BASE_URL` 配成兼容 OpenAI Chat Completions 的接口根地址；如果你填的是完整 `/chat/completions` 地址，项目也能直接使用。

## GitHub 提交前注意事项

不要提交以下内容：

- `node_modules`
- `.next`
- `out`
- `dist`
- `coverage`
- `package-lock.json`
- `tsconfig.tsbuildinfo`
- `.env*` 真实环境文件
- 本地上传测试文件、缓存目录、日志文件

建议提交前执行：

```bash
pnpm lint
pnpm ts-check
pnpm build
```

## Vercel 部署

1. 把项目推送到 GitHub 仓库。
2. 打开 Vercel，选择 `Import Project`。
3. 选择对应的 GitHub Repository。
4. Vercel 会自动识别为 Next.js 项目。
5. 在 `Environment Variables` 中添加：
   - `LLM_PROVIDER`
   - 当前启用 provider 的 `API_KEY` / `BASE_URL` / `MODEL`
6. 点击 `Deploy`。

之后每次 push 到默认分支，Vercel 会自动重新部署。

## 常见报错排查

### 1. `pnpm: command not found`

先启用 Corepack：

```bash
corepack enable
corepack pnpm --version
```

### 2. `Missing required LLM environment variables`

说明当前启用的 provider 配置不完整。检查：

- `LLM_PROVIDER`
- 当前 provider 对应的 `API_KEY`
- 当前 provider 对应的 `BASE_URL`
- 当前 provider 对应的 `MODEL`

### 3. `npm install` 被拒绝

项目配置了 `only-allow pnpm`，请改用：

```bash
pnpm install
```

### 4. 聊天接口返回 4xx / 5xx

通常是以下原因之一：

- 模型商的 Key 无效
- `BASE_URL` 不是兼容的聊天接口根地址
- `MODEL` 名称填错
- provider 返回的错误被 `/api/chat` 原样透传

先检查 Vercel 的环境变量，再检查对应模型平台的控制台和接口文档。

## 后续扩展建议

- 头像原图、音频、未来的声音克隆不要长期放在 localStorage 或仓库里。
- 如果后续加入头像生成、语音克隆、音频上传，建议接对象存储，例如 S3、R2 或 Supabase Storage。
- 如果后续要接第三个模型商，优先在 `src/lib` 的 provider 层扩展，不要把新逻辑散落到页面和 API route 里。
