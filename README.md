# 纳兰的个人主页

这是一个独立的静态个人主页和文章站，保留主页介绍、照片入口、项目列表、音乐与书架、文章列表、文章阅读进度、底部悬浮导航等内容。无需账号系统、服务器或数据库；文章以 Markdown 文件保存，推送到 GitHub 后由 GitHub Actions 自动构建并部署到 GitHub Pages。主页的经历区已按需求移除。

## 本地预览

安装 Node.js 后，在项目文件夹运行：

```sh
npm run build
```

构建结果在 `dist/`。可以用任意静态文件服务器预览这个文件夹。

## 发布新文章

1. 在 `content/posts/` 新建 `.md` 文件，例如 `my-thoughts.md`。
2. 在文件顶部填写标题、日期和简介：

   ```md
   ---
   title: "我的新文章"
   publishedAt: "2026-10-02T09:00:00.000Z"
   description: "一句话介绍文章"
   ---

   正文从这里开始。支持常用 Markdown 格式。
   ```

3. 提交并推送到 `main` 分支。GitHub Actions 会自动更新网页。

这里的“发布文章”是把 Markdown 文件提交到 GitHub；网站没有在线后台编辑器或登录账号。

图片可放在 `content/posts/my-thoughts/` 文件夹中，并在正文使用 `![图片说明](./图片名.jpg)` 引用。旧文章配图会从 `legacy-assets-a.zip`、`legacy-assets-b.zip` 和 `legacy-assets-c.zip` 在构建时展开。

## 发布到 GitHub Pages

把本项目推送到一个**新建的独立 GitHub 仓库**，默认分支使用 `main`。在仓库的 **Settings → Pages → Build and deployment** 中将来源设置为 **GitHub Actions**。之后每次推送到 `main` 都会自动部署。

项目名仓库会自动使用 `/仓库名/` 路径；如果仓库名是 `你的用户名.github.io`，GitHub Pages 会把它作为个人站点域名提供。

原始项目目录与原仓库无需改动。
