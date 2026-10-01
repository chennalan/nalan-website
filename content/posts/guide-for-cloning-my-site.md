---
title: "如何复刻本网站，零氪快速建博客"
description: "【历史教程】本教程只适用于 2024 年的 v2 技术栈，不适用于当前 v3 网站。"
publishedAt: "2023-07-15T05:13:38.575Z"
cover: ./cover.png
coverWidth: 1200
coverHeight: 675
---

> **历史教程：**本文只适用于 2024 年发布的旧版 v2 技术栈，其中的 Sanity、Clerk、评论、留言簿和 Studio 架构都不属于当前 v3。请勿把本文当作 v3 的部署或维护文档。

> 2024-03-13：文章更新了内容，优化去掉了部分不必要的冗余步骤，并将[PlanetScale](https://planetscale.com/) 数据库被 [Neon](https://neon.tech) 代替（因为 PlanetScale [官方宣布不再提供免费版数据库](https://planetscale.com/blog/planetscale-forever)）。

**本教程提供手把手视频版：**[哔哩哔哩链接](https://www.bilibili.com/video/BV1kH4y157xg/) [YouTube 链接](https://youtu.be/Ctr-kHrBHeU?si=NJfSrdI0BwOSsw18)

已经2023了，大家在建自己的博客的时候我猜依然还是存在选择困难症，我其实也一样，不太喜欢很多现有的模板或者方案，所以我就利用了 TailwindUI 提供的模板作为自己的脚手架和基底，快速搭建了现在你正看到的个人博客网站。

我发现有越来越多的人喜欢我实现的这套网站方案，也经常有人遇到部署难题，所以我就借此机会来正式写一篇教程，来教你如何克隆我的个人博客，部署成你自己的版本。

## 其他方案

开头就介绍其他方案可能有点反人类，但其实现在市面上有好多不同的博客建站方案，选择很多，你不一定非要用我的 😊，在这里我先推荐一些我个人比较看好的完整博客方案：

- xLog（偏向零编程或有前端基础的人，可自定义度高，区块链博客）

- [Hashnode](https://hashnode.com)（偏向零编程基础的人，也不涉及编程，编辑体验良好，自带 Newsletter）

- [Nextra](https://nextra.site/)（偏向有前端基础的人，Next.js，Shu Ding 作品，Markdown 支持等，一流的，不用多说了）

- [Astro](https://astro.build/)（Content 优先的建站方式，挺优雅的，感谢 [@egoist](https://twitter.com/localhost_4173) 提醒）

- [Hexo](https://hexo.io/zh-cn/)（老牌了，偏微开发基础的人，Node.js, Markdown）

Honorable mentions：

- [Cusdis](https://cusdis.com/)（免费给你现有的 Hexo、React、Vue、Svelte 网站加评论系统，[Randy](https://lutaonan.com/) 出品的 Disqus 开源替代品）

- [Umami](https://umami.is/)（给网站加统计，开源免费的 Google Analytics/Vercel Analytics 替代品）

- Wordpress 永远的王，对吧？

我没有接受以上任何形式的赞助，咱就是发自内心的推荐。

## 功能一览

本站包括以下可完全免费部署的功能：

- 主页（`/`）

- 博客（`/blog`，附带评论系统）

- 项目列表（`/projects`）

- 留言墙（`/guestbook`）

- 后台 CMS（`/studio`，发布管理文章，编辑项目列表等）

- Admin 后台（`/admin`，查看评论数据，发送 Newsletter 等）

以下是网站必需的第三方服务：

- Vercel（部署服务平台，可白嫖）

- Sanity（后台 CMS，可白嫖）

- Neon（PostgreSQL 数据库，用来承载评论系统、Newsletter 系统与留言墙，可白嫖）

- Resend（Email 发送服务，可白嫖）

- Upstash（Redis 服务，涉及文章阅读量，文章表情回复和网站访问量，可白嫖）

以下是可选的第三方服务：

- [urlbox](https://www.urlbox.io/) （用来生成链接预览快照图，$9/月）

## 项目克隆与本地配置

好，接下来我们正片开始。

首先将我的 [GitHub repo](https://github.com/CaliCastle/cali.so) 通过 fork 的形式，克隆到你自己的 GitHub 账号里。

然后将此 repo 通过 git clone 的形式拷贝到你的电脑本地文件夹中。

这个时候，确保你本地已经安装了 [pnpm](https://pnpm.io/installation)。

首先我们需要 `cd` 到你克隆好的本地目录下运行命令行：

```sh
pnpm i
```

来安装依赖 node_modules 依赖库。

### Sanity 内容管理

安装完成以后我们需要先配置一下我们的 Sanity 来做我们的后台 CMS（内容管理系统）。

1. 前往 [sanity.io/manage](https://sanity.io/manage) 登录

1. 回到命令行，运行 `npm create sanity@latest -- --template clean --create-project "Cali Demo" --dataset production`，记得把「Cali Demo」替换成你的项目名称

1. 按 **Ctrl + C** 退出命令即可

回到 [Sanity Dashboard](https://sanity.io/manage) 刷新一下页面，如果你看到了：

![](./image-1.png#1302x422)

就说明成功创建了我们的 Sanity project 🎉

点进去查看 project 详情，我们需要复制 Project ID，如下图所示：

![](./image-2.png#1310x422)

在本地项目目录下运行：

```sh
cp .env.example .env
```

下面我们打开编辑器，开始编辑我们的 `.env` 环境变量文件。

将 Sanity CMS 区域变量填入你自己真实的数值：

```text title=".env"
NEXT_PUBLIC_SANITY_DATASET="production"
NEXT_PUBLIC_SANITY_PROJECT_ID="你的 project ID"
```

### Clerk 用户鉴权

为了实现网站的用户登录功能，我们需要使用 [Clerk](https://clerk.com/) 的帮助。

我们只需：

1. 前往 [clerk.com](https://clerk.com/)

1. 点击右上角** Sign up** 注册

1. 在 Dashboard 页面点击 **Add application**

1. 填入你的项目名字，选择你想打开的鉴权机制（邮箱，Google，GitHub 等）

就完成了 Clerk 的应用注册，非常简单！

然后我们只需点击拷贝按钮，复制一下这个环境变量，如图：

![](./image-3.png#2130x1236)

回到我们本地项目的 `.env` 文件，替换掉 Clerk 区域的两行即可 🎉。

### Neon（PostgreSQL 数据库）

为了实现网站的评论、留言和 Newsletter 等功能，我们需要 [Neon](https://neon.tech) 的数据库帮助。

步骤如下：

1. 前往 [Neon 官网](https://neon.tech/)

1. 登录

1. 根据后台步骤提示创建一个 database

1. 输入数据库名称

1. 选择 **region** 的时候需要注意，你现在选择的区域要在等会配置 Vercel 的时候选择对应的 region，个人推荐「新加坡」

示例：

![](./image-4.png#1112x1302)

点击底下的 Create project 就创建完成 🎉

这个时候，我们需要获取数据库的信息才能让项目正确连接（确保勾上了 Pooled Connection）：

![](./image-5.png#1814x1258)

拷贝 `DATABASE_URL` 到我们本地项目的环境变量即可。

为了部署我们的数据库，我们需要在命令行中运行：

```sh
pnpm db:push
```

看到 Changes applied 就说明成功了 👍。

数据库就大功告成啦 🎉

### Resend 邮件发送

为了发送邮件，我们需要借助 [Resend](https://resend.com) 的力量。

以下情况会发送邮件：

- 当有人订阅 Newsletter 时，我们发送订阅确认的邮件

- 当有人回复他人评论时，我们发送邮件给被回复者

- 当有人在留言墙留言时，我们发送邮件给`SITE_NOTIFICATION_EMAIL_TO`

所以我们需要配置一下 `SITE_NOTIFICATION_EMAIL_TO` 为你想接收新留言提醒的邮箱地址，在 `.env` 里：

```text title=".env"
SITE_NOTIFICATION_EMAIL_TO="yourname@example.com"
NEXT_PUBLIC_SITE_EMAIL_FROM="hi@youremail.com"
NEXT_PUBLIC_SITE_URL="https://example.com"
```

我们接下来前往 Resend 后台创建获取我们的 API key 吧：

1. 前往 [Resend 官网](https://resend.com/)

1. 注册/登录

1. 点击 Add an API Key

![](./image-6.png#2034x896)

就这么简单，我们复制一下 API key 到 `.env` 中去替代 `RESEND_API_KEY` 即可。

### Upstash 访问统计& API 限流

为了给网站添加总访问量和文章的浏览量，我们需要注册一个 Upstash 账号。

步骤：

1. 前往 [Upstash 官网](https://upstash.com/)

1. 登录

1. 点击 **Create database**

1. 填入名称，Type 选 **Global**，Primary region 选「PlanetScale 选择的区域」，依然推荐新加坡

1. 找到 **REST API** 区域

如图：

![](./image-7.png#2418x1184)

复制这两个值，然后我们需要回到 `.env` 中填入：

```text title=".env"
UPSTASH_REDIS_REST_TOKEN="****"
UPSTASH_REDIS_REST_URL="https://***.upstash.io"
```

## Vercel 部署

最后一步至关重要，我们需要前往 Vercel 进行部署我们的项目，步骤：

1. 前往 [Vercel 官网](https://vercel.com)

1. 登录/注册

1. 在 Dashboard 里选择 **Add new project**

1. 从 GitHub 导入你 fork 后的仓库

如下图所示

![](./image-8.png#2566x1518)

我们展开 Environment variables 区域，并回到我们本地的 `.env` 文件中，复制全部内容（除了最后的 Vercel 的两个变量），回到网页中，点击输入框，按粘贴。

> ⚠️ 如果你遇到了部署问题（比如 `Error: Invalid environment variables`，请检查上一步「链接快照图」中的步骤，是不是没有更改代码）

最后在设置左侧侧边栏的 Functions 配置，选择上述相同的 region，还是推荐新加坡。

## 发布和管理文章

为了发布管理文章，我们只需要访问 `/studio` 即可前往到我们项目内的 Sanity Studio

第一次访问的话，Sanity 会跳出提示：

![](./image-9.png#1482x758)

我们点击 Continue 即可。

然后根据提示，点击 Add CORS origin。

用一开始登录 Sanity 的账号登录即可。

现在就应该可以看到我们的 Studio 页面了：

![](./image-10.png#3544x2586)

### 发布文章

（见上图）我们只需点击 1，然后 2，即可发布一篇新文章。

编辑的顺序从上到下，给文章的名字（Title），url 的 slug（英文句子，连字符代替空格），填入类别，发布时间，一张文章图片，和文章描述。

Body 就是我们编辑的文章正文，在我们编辑完以后记得点击下面的 Reading time 可以一键生成阅读时间。

最后全部编辑完成以后就可以点右下角的 **Publish** 了。

文章发布就是这么简单 👏

### 管理文章

其实管理文章跟上述发布的流程差不多，只不过在文章列表里选中你想编辑的文章，然后在右侧编辑以后再次点击 Publish 按钮即可。

### 配置生产环境域名

记得前往 [Sanity 后台](https://sanity.io/manage)的项目设置中，填入你的最终部署的域名，如图：

![](./image-11.png#3544x2586)

在 3 填入你的完整域名 URL，比如 `https://cali.so`，最后位置 4 记得打上勾即可。

## 后台 Admin

为了访问到我们的后台 Admin 页面，我们首先需要回到 Clerk 的后台界面中：

![](./image-12.png#1520x842)

（如果你还没有登录的话，在本地页面记得点击右上角登录一下，或者直接访问本地的 `/admin` 会重定向到登录页面）

选中我们自己登录的账号详情，我们需要滚动到下面的 Metadata 区域：

![](./image-13.png#2050x860)

点击 Public 旁边的 Edit：

![](./image-14.png#1426x1284)

替换内部的 json 变成：

```json
{
  "siteOwner": true
}
```

这样就可以标示这名用户可以进入我们的 admin 后台了，保存即可。

现在在本地项目访问 `/admin` 就可以看到正常的访问了：

![](./image-15.png#3544x2586)

## 发布 Newsletter

要想发布新的 Newsletter 也可以在 admin 里操作，只需点击左侧的 Newsletters 然后点击 New 即可进入创建页面。

Body 输入 markdown 即可。

## 结尾

其实一开始我只是为了给自己的网站去写的每一个功能，用的每一个第三方服务。

写到这里，的确会感觉前置步骤也蛮多的，而且我也是没想到有这么多的人希望用我的仓库来做自己的个人网站，所以最后还是决定写一篇详细的教程手把手教一下如何部署成自己的。

如果还遇到什么问题，欢迎在本篇文章中定位评论或者发送邮件给我到 cali@zolplay.com

后续有时间的话我会加更多功能的，敬请期待！
