---
title: "测试"
description: "一句话简介，可留空"
publishedAt: "2026-10-02"
slug: "your-slug"
category: "随笔"
tags: "生活,思考"
cover: "./cover.png"
---

这里开始写正文。

## 第一节

正文内容。

@img(01.jpg)

## 第二节

继续写正文。

@img(02.jpg | 图片说明)

## 结尾

写下你的结尾。

---

# 配图写法

把图片直接放在这个文件夹里：

- cover.jpg：文章封面
- 01.jpg：正文图片
- 02.jpg：正文图片

正文里直接写：

@img(01.jpg)

需要图片说明：

@img(02.jpg | 这是图片说明)

不需要手动写 Markdown 图片语法。

# 最简单的文章信息

真正写文章时，最少只需要改：

- title：文章标题
- publishedAt：发布日期
- slug：文章网址名称
- 正文内容

如果有 cover.jpg，可以保留 cover 字段；如果没有封面，可以删除 cover 这一行。
