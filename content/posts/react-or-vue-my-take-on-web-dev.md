---
title: "React 还是 Vue？我对 Web 前端现状的看法"
description: "我做了多年 Web 前端。这篇文章从框架、工具和社区出发，聊聊我眼中的 React 和 Vue。"
publishedAt: "2023-07-03T04:00:38.871Z"
cover: ./cover.png
coverWidth: 1200
coverHeight: 675
---

## 前言

Web 前端可谓是目前最卷的一个领域，没有之一。这个领域的更新与变化速度也是快的惊人，现代框架与新工具玲琅满目，多到让许多讲中文的开发者学到了无数的新英语词汇 😅。

接下来让我们来一段绕口令：

React，Vue，Svelte，Angular，Preact，Solid，Qwik，Lit，Ember，Alpine。。。

Webpack，Vite，Rollup，esbuild，Parcel，Babel，Vitest，Jest，Playwright，Cypress，ESLint，Prettier，Husky，rspack，Rust everything。。。

我这也只是列出了一些常见的前端框架和工具，可怜可怜前端开发者吧，我们其实挺不容易的。

但是，本篇文章想借此机会来聊聊目前前端最火的俩框架，同时也是我遇到的前端开发初学者问的最多的问题：我该用 React 还是 Vue。

在我正式探讨这两个框架之前，可能有人会问：“你不是一直用的框架都是 React 吗？你哪来的资格谈对比？”

那么我们就不妨先从我跟 Vue.js 的经历说起吧。

## Vue/Nuxt 对我的影响

早在2015年的时候，我当时在用 Laravel/PHP 开发国内的 Abletive 音乐社区旗下的各种站点，接触到了 Vue.js，我记得那时侯 [Taylor Otwell](https://twitter.com/taylorotwell) （Laravel 作者）大力推行 Vue.js 作为各种 Laravel 新项目的脚手架，让我产生了很大的共鸣。

当时还在用 jQuery 的我学了一些 Vue.js 0.1 的功能以后感叹到：原来前端可以这么简单？

从那时起，一切前端我都开始用 Vue.js 去写了。

时间快进2年，我来到了美国西雅图，当时给西雅图城市大学做了个校内图片分享平台（类似校内 Instagram）毕设项目，也是基于 Laravel + Vue.js 的。

因此我也获得了一些认可，然后便有了一次在校内 workshop 演讲的机会，所以我当时就来尝试布道一下我最喜欢的两个框架。

![](./image-1.jpg#1597x1355 "我在西雅图城市大学的演讲现场")

再快进2年，2019年，我当时在 very very spaceship 这家西雅图的本地游戏工作室工作的时候，因为当时我们在开发「[Transformers: Heavy Metal](https://tfwiki.net/wiki/Transformers:_Heavy_Metal)」游戏（一款类似 Pokemon GO 的 AR 地理手游），我专门花了一个星期用 Nuxt.js 来重写了游戏管理后台的所有界面和架构。（因为现有的后台实在是太丑了，想象一下页面都是纯 HTML 毫无 CSS 那种。。。）

这里因为保密关系没有任何可展示的内容，但是我当时成功地推进了整个游戏后台的易用性和美观性，如果没有 Vue 和 Nuxt 的开发体验我应该也是做不到这么效率的。

同时我也成功地把 Vue.js 安利给公司里所有的后端工程师，因为接下来要维护以及添加新功能的会是他们 🤣，从此以后 Vue 变成了我们后端必须掌握的技能之一。

后来我还用自己的设计技能稍微尝试做了一套视觉升级改版：

![](./image-2.jpg#2880x2048)

说了这么多，其实我想表达的就是：我爱 Vue.js，我也很爱 Nuxt.js。

他们给我在我早期“上道”前端的时候的帮助无可厚非，所以到现在我也还在给 [Evan You](https://evanyou.me) 和 [Anthony Fu](https://antfu.me) 每月 Sponsor 赞助，最近也刚好开始给 [Daniel Roe](https://roe.dev) 和 patak 支持赞助，以表我的谢意。

所以在这里我也呼吁有能力的开发者/公司，特别是因为这些伟大无私的开源项目而获得很多业务与商业成功的，在力所能及范围内尽可能地回报一下他们，因为做开源库是真的非常不容易。

## 正式接触 React

我其实在2018年的时候就已经接触 React 了，当时用的是 Preact 给 Microsoft Mixer 开发直播室即连的前端操控绑定，以达到可以做到玩家只需进入直播间即可加入游戏并且在 Web 中操控游戏里的某个角色。

整体给我的初感受就是，React 好难用，写的代码量也厚重。（当时还没有 React Hooks，全是 Class Component，`this.setState` 什么的也是很难用的感觉）

有的时候就是，如果你没用过难用的东西可能很难理解到为什么另一个东西更好用，去感谢另一个东西的美好。

而我真正第一次被惊艳到的是随着 React Hooks 的推出，整个 React 社区开始一窝蜂地往这个“新”的函数式编程不断靠拢，的确会比之前的 Class Component 好不少。

随后我看到 Vue 3 的一些理念虽有类似，但最后也还是走出了 Vue 自己的风格，我也比较喜欢其新的 Composition API 以及新的范式，而不是旧的那套 Options API。

再后来我接触到了 Next.js，再结合当时 Vercel 还是叫 ZEIT（德语的 Now）的 PaaS 平台来一键部署网站的体验简直不能更好，让我从此爱不释手。（其实这个时候 Vue 3 已经出了，然而 Nuxt 3 迟迟不出，等到我花儿都谢了，然后我就正式跳转到 React.js/Next.js 的拥抱中去了 😅）

## 没有完美的框架

在我们正式对比 React 和 Vue 之前，需要明确的是，框架只是完成目标的一种手段/方法，要合理看待每个框架的优缺点，自己尝试去使用它们，这样才能更加清楚哪些框架才是更适合你自己的。

在使用各种不同的框架的时候，不要只学在框架中的知识和技能，要尽可能地掌握 framework agnostic （框架无知性）的通用知识技能，比如总结出设计模式，解决方案最佳实践等等。

这样子的好处是，你不仅仅是掌握了“某某”框架，而是掌握了前端的核心技能，这样就算你在需要切换框架的时候，也能得心应手。

让我想起 Tony Stark 在《Spider-Man: Homecoming》电影里中的台词：

![](./image-3.gif#640x412 "If you’re nothing without the suit, then you shouldn’t have it. ")

这在工程师领域也是一样的，如果没了框架你就不会做前端了，那你就不应该用框架。

## 聊聊市场产品现状

我发现了一个比较神奇的现象，那就是国际化的产品普遍使用 React 的概率非常的高。

> 注意这里列举的主要是国际化产品或 SaaS

我在这里稍微列举一下：

[Twitter](https://twitter.com)，[Discord](https://discord.com)，[Slack](https://slack.com)，[Figma](https://figma.com)，[Framer](https://framer.com)，[ChatGPT](https://chat.openai.com)，[Medium](https://medium.com)，[Notion](https://notion.so)，[Sentry](https://sentry.io)，[Vercel](https://vercel.com)，[CodeSandbox](https://codesandbox.io)，[Linear](https://linear.app)，[Raycast](https://raycast.com)，[Fey](https://feyapp.com)，[Liveblocks](https://liveblocks.io)，[Clerk](https://clerk.dev)，[Resend](https://resend.com)，Diagram，[Evervault](https://evervault.com/)…

等等等等还有好多我相信我无法在这个页面里列举完。。。

用 React 去构建产品的前端仿佛在2023已经成为了默认的选择，随着最新的 React Server Component 也重新推动了纯服务端渲染的范式，让前端与后端的分界线越来越模糊。

在 Vue 这边的话：

[OpenAI 首页](https://openai.com)，[TikTok For Business](https://www.tiktok.com/business/en)，[Google Careers](https://careers.google.com/)，[Ecosia](https://www.ecosia.org/)，[GitLab](https://gitlab.com)，[Apple 的 SwiftUI 教学/文档](https://developer.apple.com/tutorials/swiftui)，[Icons8](https://icons8.com)，[Upwork](https://upwork.com)，[Volta](https://volta.net/)，PornHub…

在这个对比的局势里 Vue 的**出色产品，**还是少了一些，也正是我不解的地方。当然这里跟我所接触到的产品局限性也有一定的关系，欢迎在评论中补充。

因为框架本身是很好的，却为什么激发不了让更多的公司去用 Vue 来打造产品/SaaS 呢？

### 设计工程师

因为我这个人在开发和技术之外，也非常注重美学。所以我会非常向往在开发的同时不失好看又好用的界面设计与用户交互逻辑，我在使用产品的时候也自然会带有很高的标准去评判他们，最后才能决定让我是否能长期使用下去。

而我所了解并且非常崇拜的 Design Engineer（设计工程师）们基本上都是清一色用 React 作为他们的工具来写网站或者应用的，这也是我所观察到的一个很神奇的现象，这也许也跟上面的产品现状有着异曲同工之处。

比如有：[Rauno](https://rauno.me)，[Paco](https://paco.me)，[Shu](https://shud.in)，[Joe](https://joebell.co.uk/)，[Emil](https://emilkowal.ski/)，[Jordan](https://twitter.com/jsngr)，Brotzky，[Marc](https://twitter.com/marcbouchenoire) 等等。

然而在 Vue 这边，设计不错的在我的认知里目前就只有 [Anthony Fu](https://antfu.me) 了。

所以如果你很看重产品以及设计这一方面的话，**目前的胜者是 React**。

## 聊聊多用性

我们接下来看一看两个框架在 Web 以外的领域表现的如何。

首先是 React：

- 写统一代码的 iOS 和安卓应用？可以用 [React Native](https://reactnative.dev/)。

- 写邮件模板？可以用 [React Email](https://react.email)。

- 写命令行应用？可以用 [Ink](https://github.com/vadimdemedes/ink)。

然而如果说用 Vue 写移动端应用的话，目前就只有 [NativeScript](https://nativescript.org/) 支持的最好，但是目前市场上也没有 NativeScript 所开发出来的优秀应用，所以这方面在 Vue 社区的表现就略显尴尬。

而用 React Native 写的移动端作品集就比较丰富了，比如：Instagram，Facebook，Pinterest，Tesla，Uber，Discord 等 app 都是用的 React Native 开发的。

那么在一学多用性而言，**胜者是 React**。

## 聊聊开发者体验（DX）

众所周知，React 和 Vue 都分别有对应的 dev tools 浏览器插件。

然而最近的 [Nuxt DevTools](https://nuxt.com/blog/introducing-nuxt-devtools) 实在是太强大了，每个功能都看得我垂涎欲滴，让我不得不说 React 这边对本地开发工具真的是太不重视了，或者说是时隔这么多年还是一模一样的工具体验。

其次的话就是 React 对初学者来说可能有比较陡峭的学习曲线，特别是对 JavaScript 和 JSX 还不是很熟悉的开发者而言。在这块 Vue 就相对而言初次学习曲线比较平滑，能更加轻松地上手（起码我自己早期学习的时候就是这种感觉）。

在 React 项目中，经常会需要写更多行的代码，以及承受一些 `useEffect`，`useMemo`，`useCallback` 等等的心智负担，你需要自己管理 dependencies 依赖，从而达到“最佳的优化”。 那么在学习的路上自然的也会变得相对而言更加复杂一点，不过一旦你 master 了这些 React 中的奥秘，那你才能真正掌握用 React 写出高效应用的核心。

另外一个挺重要的方面就是文档。

React Hooks 在出了以后的五年内都没有很清晰的出官方系统化的文档和教学，导致了很多开发者在学习的过程中产生困惑和无头绪，最新的 [React 官方文档](https://react.dev/)也才是在2022年开始重写了一遍，2023年才正式发布，并且优先地推荐了 Hooks 而不是 Class Component。

而 [Vue 这边的文档](https://vuejs.org/)一直都是很被核心团队所重视的，无论是最新的概念，还是解释 Vue 的核心响应式基础，Vue 的官方文档都解释的比较清晰也比较全面。

所以如果你非常看重开发者体验的话，**胜者是 Vue**。

## 聊聊生态

React 的生态非常的丰富，开发者基数第一也必然地导致了更多的开发者为这个框架建立起了各种大大小小的工具库。

往大了说有 [Vercel](https://vercel.com) 投入 [Next.js](https://nextjs.org) 的开发，到有 [Poimandres](https://github.com/pmndrs) 出的一系列的工具链（`jotai`，`zustand`，`react-three-fiber` 等等），还有像 [WorkOS](https://workos.com/) 精心打造的无障碍无样式 UI 库：[Radix UI](https://www.radix-ui.com/)，最后还有像 [shadcn](https://shadcn.com/) 一样的独立开发者出的[复制粘贴 UI 最佳实践](https://ui.shadcn.com)。

不过在 React Server Component 推出以后，很多写库的开发者也陷入了窘境，'use client' 门事件也是蛮尴尬的，感觉跟 Vue 2 迁移 Vue 3 那会儿有一点点类似，我觉得很多大改动还是应该使用渐进式支持（Progressive adoption）会更好。

Vue 这边的话，虽然没有特别大的公司在做优秀开源库的创建与维护，但是有 Vue、Vite、Nuxt 核心团队成员和社区一起共建的开源军火库，虽然不是最大的生态，但一定都是 Vue 开发者们最满意的。Nuxt Labs 所做的每个模块和插件，也都是非常高质量的，比如说 [NuxtLabs UI](https://ui.nuxtlabs.com/getting-started)，[Nuxt Studio](https://nuxt.studio/) 都是鲜明的例子。

所以其实在我看来，**React 和 Vue 在生态都是胜者**。

## 结尾

如果这么看下来的话，目前前端框架的赢家很明显是 React，但这不代表着 Vue 就输了，因为 Vue 的未来还是很可期的，只不过需要更多的开发者来丰富这个社区，更多的大企业来信任地使用 Vue 构建大型应用并且推崇出去。

我希望 Vue 的明天更美好，我也希望能够看到更多优秀的产品扎根于 Vue/Nuxt 中，也更加希望能看到有更多的设计大牛们出现在 Vue 的生态圈中。

但起码目前为止，因为 React 的生态现状，优秀产品的影响力，以及非常多的设计大牛的驱动，会让我暂时继续呆在 React 圈中。

无论如何，我希望框架之间最后能带来更多的良性竞争，互相驱使对方变得更好，要求更高，这样才能受众绝大多数的 web 开发者们，让我们的开发更加轻松和容易。
