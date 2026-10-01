import { readFile, readdir, mkdir, rm, copyFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(fileURLToPath(import.meta.url))
const out = path.join(root, 'dist')
const base = (process.env.SITE_BASE_PATH || '').replace(/\/$/, '')
const url = (value) => `${base}${value}`

function escapeHtml(value = '') {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;')
}

function inline(text) {
  let value = escapeHtml(text)
  value = value.replace(/`([^`]+)`/g, '<code>$1</code>')
  value = value.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\*([^*]+)\*/g, '<em>$1</em>')
  value = value.replace(/!\[([^\]]*)\]\(([^\s)]+)(?:\s+"([^"]*)")?\)/g, (_, alt, src, title = '') => `<img src="${escapeHtml(src)}" alt="${alt}"${title ? ` title="${escapeHtml(title)}"` : ''} loading="lazy">`)
  value = value.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|[^\s)]+)(?:\s+"([^"]*)")?\)/g, (_, label, href) => `<a href="${escapeHtml(href)}">${label}</a>`)
  return value
}

function markdown(source) {
  const lines = source.replaceAll('\r\n', '\n').split('\n')
  const html = []
  let paragraph = []
  let list = ''
  let code = null
  const flushParagraph = () => { if (paragraph.length) html.push(`<p>${inline(paragraph.join(' '))}</p>`); paragraph = [] }
  const flushList = () => { if (list) { html.push(`</${list}>`); list = '' } }
  for (const line of lines) {
    const fence = line.match(/^\s*```\s*([\w+-]*)/)
    if (fence && !code) { flushParagraph(); flushList(); code = fence[1] || ''; html.push(`<pre><code${code ? ` class="language-${escapeHtml(code)}"` : ''}>`); continue }
    if (/^\s*```\s*$/.test(line) && code !== null) { html.push('</code></pre>'); code = null; continue }
    if (code !== null) { html.push(`${escapeHtml(line)}\n`); continue }
    const heading = line.match(/^\s{0,3}(#{1,3})\s+(.+)$/)
    const item = line.match(/^\s*([-*] |\d+\. )(.*)$/)
    if (heading) { flushParagraph(); flushList(); const level = heading[1].length; html.push(`<h${level}>${inline(heading[2])}</h${level}>`); continue }
    if (item) { flushParagraph(); const next = item[1].trim().endsWith('.') ? 'ol' : 'ul'; if (list !== next) { flushList(); list = next; html.push(`<${list}>`) }; html.push(`<li>${inline(item[2])}</li>`); continue }
    if (/^>\s?/.test(line)) { flushParagraph(); flushList(); html.push(`<blockquote><p>${inline(line.replace(/^>\s?/, ''))}</p></blockquote>`); continue }
    if (!line.trim()) { flushParagraph(); flushList(); continue }
    paragraph.push(line.trim())
  }
  flushParagraph(); flushList()
  if (code !== null) html.push('</code></pre>')
  return html.join('\n')
}

function parsePost(raw, file) {
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/)
  if (!match) throw new Error(`${file} needs YAML front matter between --- lines`)
  const meta = Object.fromEntries([...match[1].matchAll(/^([\w-]+):\s*"?([^"\n]*)"?\s*$/gm)].map(([, key, value]) => [key, value]))
  if (!meta.title || !meta.date) throw new Error(`${file} needs title and date fields`)
  return { slug: path.basename(file, '.md'), title: meta.title, date: meta.date, description: meta.description || '', body: match[2] }
}

function shell(title, description, content, active = '') {
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="description" content="${escapeHtml(description)}"><title>${escapeHtml(title)} · 纳兰</title><link rel="stylesheet" href="${url('/assets/style.css')}"></head><body><header class="site-header"><a class="brand" href="${url('/')}">纳兰<span>的个人主页</span></a><nav><a href="${url('/')}" ${active === 'home' ? 'aria-current="page"' : ''}>主页</a><a href="${url('/posts/')}" ${active === 'posts' ? 'aria-current="page"' : ''}>写作</a></nav></header><main>${content}</main><footer>用心记录，慢慢更新 · 纳兰</footer></body></html>`
}

await rm(out, { recursive: true, force: true })
await mkdir(path.join(out, 'assets'), { recursive: true })
await mkdir(path.join(out, 'posts'), { recursive: true })
await copyFile(path.join(root, 'assets', 'style.css'), path.join(out, 'assets', 'style.css'))

const postDir = path.join(root, 'content', 'posts')
const postFiles = (await readdir(postDir)).filter((name) => name.endsWith('.md'))
const allPosts = await Promise.all(postFiles.map(async (name) => parsePost(await readFile(path.join(postDir, name), 'utf8'), name)))
allPosts.sort((a, b) => b.date.localeCompare(a.date))
const list = allPosts.length ? `<ul class="post-list">${allPosts.map((post) => `<li><time datetime="${escapeHtml(post.date)}">${escapeHtml(post.date)}</time><a href="${url(`/posts/${post.slug}/`)}">${escapeHtml(post.title)}</a>${post.description ? `<p>${escapeHtml(post.description)}</p>` : ''}</li>`).join('')}</ul>` : '<p>还没有文章，欢迎稍后再来。</p>'
const home = `<section class="hero"><p class="eyebrow">你好，欢迎来到我的小小角落</p><h1>我是纳兰。</h1><p class="bio">一个极简的辩证主义者，也是一名全栈工程师。我也是 lastwar 指挥官，热爱把细节做到刚刚好。</p><p class="bio">我兴趣很杂，什么都爱试试。和团队一起做东西，我在意好点子、好细节，也在意玩得开心。</p><a class="button" href="${url('/posts/')}">读读我的文章 <span aria-hidden="true">→</span></a></section><section class="recent"><div class="section-heading"><h2>最近写作</h2><a href="${url('/posts/')}">全部文章 →</a></div>${list}</section>`
await writeFile(path.join(out, 'index.html'), shell('主页', '纳兰的个人主页与写作', home, 'home'))
await writeFile(path.join(out, 'posts', 'index.html'), shell('写作', '纳兰的文章', `<section class="page-heading"><p class="eyebrow">NOTES & STORIES</p><h1>写作</h1><p>一些想法、记录和正在探索的事。</p></section>${list}`, 'posts'))
for (const post of allPosts) {
  const folder = path.join(out, 'posts', post.slug)
  await mkdir(folder, { recursive: true })
  const postAssets = path.join(postDir, post.slug)
  try {
    for (const asset of await readdir(postAssets, { withFileTypes: true })) {
      if (asset.isFile()) await copyFile(path.join(postAssets, asset.name), path.join(folder, asset.name))
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
  const article = `<article class="article"><a class="back-link" href="${url('/posts/')}">← 所有文章</a><header><p class="eyebrow">${escapeHtml(post.date)}</p><h1>${escapeHtml(post.title)}</h1>${post.description ? `<p class="article-description">${escapeHtml(post.description)}</p>` : ''}</header><div class="prose">${markdown(post.body)}</div></article>`
  await writeFile(path.join(folder, 'index.html'), shell(post.title, post.description || post.title, article, 'posts'))
}
await writeFile(path.join(out, '.nojekyll'), '')
console.log(`Built ${allPosts.length} article(s) in dist/`)
