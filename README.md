# Time Capsule Persona Site

一个基于 Next.js App Router 的时间胶囊网站。用户可以填写人格问卷、记录人生事件、上传头像、和“那个时间点的自己”聊天，并导出人格提示词与记忆档案。

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

复制 `.env.example` 为 `.env.local`，再填写真实值：

```bash
cp .env.example .env.local
```

当前项目使用到的环境变量：

- `COZE_WORKLOAD_IDENTITY_API_KEY`
- `COZE_INTEGRATION_BASE_URL`
- `COZE_INTEGRATION_MODEL_BASE_URL`

说明：

- 页面本身可以在缺少这些变量时完成构建和部署。
- 但依赖 Coze SDK 的 API routes 在运行时会返回清晰错误，提示缺少哪些变量。

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

建议在提交前执行：

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
   - `COZE_WORKLOAD_IDENTITY_API_KEY`
   - `COZE_INTEGRATION_BASE_URL`
   - `COZE_INTEGRATION_MODEL_BASE_URL`
6. 点击 `Deploy`。

后续每次 push 到默认分支，Vercel 会自动重新部署。

## 常见报错排查

### 1. `pnpm: command not found`

先启用 Corepack：

```bash
corepack enable
corepack pnpm --version
```

### 2. `Missing required Coze environment variables`

说明 Vercel 或本地 `.env.local` 没有配置完整。检查并补齐：

- `COZE_WORKLOAD_IDENTITY_API_KEY`
- `COZE_INTEGRATION_BASE_URL`
- `COZE_INTEGRATION_MODEL_BASE_URL`

### 3. `npm install` 被拒绝

项目配置了 `only-allow pnpm`，请改用：

```bash
pnpm install
```

### 4. Vercel 构建成功但聊天接口报错

通常是环境变量未配置，或者 Coze 侧服务不可用。先检查 Vercel 项目里的 Environment Variables，再检查外部服务状态。

## 后续扩展建议

- 头像、音频、未来的大文件能力不要直接放仓库或长期依赖 `base64`。
- 如果后续加入头像生成、语音克隆、音频上传，建议迁移到对象存储，例如 S3、R2 或 Supabase Storage。
