# 写文章

新文章推荐使用“一文一目录”的方式。

目录：

content/posts/文章slug/index.md

例如：

content/posts/jk03/index.md
content/posts/jk03/cover.jpg
content/posts/jk03/photo-01.jpg

index.md：

---
title: "文章标题"
description: "文章简介"
publishedAt: "2026-10-02"
slug: "jk03"
category: "随笔"
tags: "生活,思考"
cover: "./cover.jpg"
---

正文从这里开始。

## 第一节

这里写正文。

## 第二节

继续写正文。

文章目录、阅读时间、字数、上一篇/下一篇、文章列表等都会由 build.mjs 自动生成。

旧格式 content/posts/文章.md 仍然兼容。
