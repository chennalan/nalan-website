import { readFile, readdir, mkdir, rm, copyFile, writeFile, access } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(fileURLToPath(import.meta.url))
const out = path.join(root, 'dist')
const base = process.env.SITE_BASE_PATH || ''
const siteUrl = (process.env.SITE_URL || 'https://chennalan.cn').replace(/\/$/, '')
const url = (value) => `${base}${value}`
const absoluteUrl = (value) => `${siteUrl}${base}${value}`

function formatHtml(markup) {
  const blockTags = new Set(['html', 'head', 'body', 'header', 'nav', 'main', 'section', 'div', 'ul', 'li', 'footer'])
  const inlineBlockTags = new Set(['title', 'p', 'h1', 'h2', 'script'])
  const voidTags = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'])
  const tokens = markup.match(/<!--[\s\S]*?-->|<![^>]*>|<\/?[^>]+>|[^<]+/g) || []
  const lines = []
  let depth = 0

  for (const token of tokens) {
    const tag = token.match(/^<(\/?)([a-z][\w:-]*)\b/i)
    if (!tag) {
      if (lines.length) lines[lines.length - 1] += token
      else lines.push(token)
      continue
    }

    const [, closing, rawName] = tag
    const name = rawName.toLowerCase()
    if (blockTags.has(name)) {
      if (closing) {
        depth = Math.max(0, depth - 1)
        lines.push(`${'  '.repeat(depth)}${token}`)
      } else {
        lines.push(`${'  '.repeat(depth)}${token}`)
        if (!voidTags.has(name) && !token.endsWith('/>')) depth += 1
      }
    } else if (inlineBlockTags.has(name)) {
      if (closing) {
        if (lines.length) lines[lines.length - 1] += token
        depth = Math.max(0, depth - 1)
      } else {
        lines.push(`${'  '.repeat(depth)}${token}`)
        if (!voidTags.has(name) && !token.endsWith('/>')) depth += 1
      }
    } else if (voidTags.has(name)) {
      lines.push(`${'  '.repeat(depth)}${token}`)
    } else if (lines.length) {
      lines[lines.length - 1] += token
    } else {
      lines.push(token)
    }
  }

  return `${lines.join('\n').trimStart()}\n`
}

function escapeHtml(value = '') {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;')
}

function frontmatter(raw, file) {
  const match = raw.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?([\s\S]*)$/)
  if (!match) throw new Error(`${file} is missing YAML front matter`)
  const data = {}
  for (const line of match[1].split(/\r?\n/)) {
    const field = line.match(/^([\w-]+):\s*(.*?)\s*$/)
    if (!field) continue
    let value = field[2]
    if (value.startsWith('"') && value.endsWith('"')) {
      try { value = JSON.parse(value) } catch { value = value.slice(1, -1) }
    } else if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1)
    data[field[1]] = value
  }
  const date = data.publishedAt || data.date
  if (!data.title || !date) throw new Error(`${file} needs title and date/publishedAt fields`)
  return { ...data, date: new Date(date).toISOString().slice(0, 10), body: match[2] }
}

function slugId(text, count) {
  const ascii = text.toLowerCase().replace(/<[^>]+>/g, '').replace(/[`*_~]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return `${ascii || `section-${count}`}`
}

function inline(text) {
  let value = escapeHtml(text)
  value = value.replace(/`([^`]+)`/g, '<code>$1</code>')
  value = value.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\*([^*]+)\*/g, '<em>$1</em>').replace(/~~([^~]+)~~/g, '<del>$1</del>')
  value = value.replace(/!\[([^\]]*)\]\(([^\s)]+)(?:\s+"([^"]*)")?\)/g, (_, alt, src, title = '') => `<figure class="article-figure"><img src="${escapeHtml(src.replace(/#\d+x\d+$/, ''))}" alt="${alt}" loading="lazy">${title ? `<figcaption>${escapeHtml(title)}</figcaption>` : alt ? `<figcaption>${alt}</figcaption>` : ''}</figure>`)
  value = value.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|[^\s)]+)(?:\s+"([^"]*)")?\)/g, (_, label, href) => `<a href="${escapeHtml(href)}"${href.startsWith('http') ? ' target="_blank" rel="noreferrer"' : ''}>${label}</a>`)
  value = value.replace(/<InlineProductName product="([^"]+)"\s*\/>/g, '<span class="product-tag">$1</span>')
  value = value.replace(/\[\^([^\]]+)\]/g, '<sup>[$1]</sup>')
  return value
}

function renderMarkdown(source) {
  const body = source
    // 简化配图：@img(photo.jpg) 或 @img(photo.jpg | 图片说明)
    .replace(/@img\(([^)|]+?)(?:\|([^)]*))?\)/g, (_, src, caption = '') => {
      const file = src.trim()
      const alt = (caption.trim() || path.basename(file, path.extname(file))).trim()
      return `![${alt}](./${file})`
    })
    .replace(/<PhotoStack(?:Frames)?\s*>|<\/PhotoStack(?:Frames)?\s*>/g, '')
    .replace(/<PhotoStackCaption>([\s\S]*?)<\/PhotoStackCaption>/g, '\n> $1\n')
    .replace(/<Tweet id="(\d+)"\s*\/>/g, '[查看这条 X 帖子](https://x.com/i/status/$1)')
    .replace(/<TimeAllocationChart\s*\/>/g, '\n> 时间分配图表\n')
    .replace(/<InlineProductName product="([^"]+)"\s*\/>/g, '$1')
  const lines = body.replaceAll('\r\n', '\n').split('\n')
  const html = []
  const headings = []
  let para = []
  let list = ''
  let code = null
  const flushPara = () => { if (para.length) html.push(`<p>${inline(para.join(' '))}</p>`); para = [] }
  const flushList = () => { if (list) { html.push(`</${list}>`); list = '' } }
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]
    const fence = line.match(/^\s*```\s*([\w+-]*)/)
    if (fence && code === null) { flushPara(); flushList(); code = fence[1] || ''; html.push(`<pre><code${code ? ` class="language-${escapeHtml(code)}"` : ''}>`); continue }
    if (/^\s*```\s*$/.test(line) && code !== null) { html.push('</code></pre>'); code = null; continue }
    if (code !== null) { html.push(`${escapeHtml(line)}\n`); continue }
    const heading = line.match(/^\s{0,3}(#{1,4})\s+(.+)$/)
    if (heading) {
      flushPara(); flushList()
      const level = heading[1].length
      const text = heading[2].replace(/\s+#+\s*$/, '').trim()
      const id = slugId(text, headings.length + 1)
      headings.push({ id, text, level })
      html.push(`<h${level} id="${id}">${inline(text)}</h${level}>`)
      continue
    }
    if (/^\s*([-*_])(?:\s*\1){2,}\s*$/.test(line)) { flushPara(); flushList(); html.push('<hr>'); continue }
    const tableSep = line.match(/^\s*\|?\s*:?-{3,}/)
    if (tableSep && i > 0 && lines[i - 1].includes('|')) {
      flushPara(); flushList()
      const cells = (value) => value.trim().replace(/^\||\|$/g, '').split('|').map((cell) => cell.trim())
      const header = cells(lines[i - 1])
      const rows = []
      while (i + 1 < lines.length && lines[i + 1].includes('|')) rows.push(cells(lines[++i]))
      html.push(`<div class="table-scroll"><table><thead><tr>${header.map((c) => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>${rows.map((row) => `<tr>${header.map((_, n) => `<td>${inline(row[n] || '')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`)
      continue
    }
    const item = line.match(/^\s*(?:([-*+]\s+)|(\d+\.\s+))(.*)$/)
    if (item) {
      flushPara()
      const next = item[2] ? 'ol' : 'ul'
      if (list !== next) { flushList(); list = next; html.push(`<${list}>`) }
      html.push(`<li>${inline(item[3])}</li>`)
      continue
    }
    if (/^>\s?/.test(line)) { flushPara(); flushList(); html.push(`<blockquote><p>${inline(line.replace(/^>\s?/, ''))}</p></blockquote>`); continue }
    if (!line.trim()) { flushPara(); flushList(); continue }
    para.push(line.trim())
  }
  flushPara(); flushList()
  if (code !== null) html.push('</code></pre>')
  return { html: html.join('\n'), headings }
}

function readingStats(text) {
  const content = text.replace(/```[\s\S]*?```/g, '').replace(/[#>*_`\[\]()]/g, ' ')
  const cjk = (content.match(/[\u3400-\u9fff]/g) || []).length
  const latin = (content.replace(/[\u3400-\u9fff]/g, ' ').match(/[A-Za-z0-9]+/g) || []).length
  return { words: cjk + latin, minutes: Math.max(1, Math.round(cjk / 300 + latin / 200)) }
}

function postRow(post, format = 'full') {
  const date = post.date
  const label = format === 'short' ? date.slice(2).replaceAll('-', '.') : format === 'month-day' ? date.slice(5).replace('-', '月') + '日' : date
  const thumb = post.cover ? `<span class="post-thumb"><img src="${url(`/posts/${post.slug}/${path.basename(post.cover)}`)}" alt=""></span>` : '<span class="post-thumb blank"></span>'
  return `<a class="post-row" href="${url(`/posts/${post.slug}/`)}">${thumb}<span class="post-title">${escapeHtml(post.title)}</span><span class="post-leader"></span><time datetime="${date}">${label}</time></a>`
}

const projects = [
  ['Cali 宝宝', '宝宝的事很多，不必都靠脑子记。', '/calibaby', 'calibaby-app-icon.png', 'cali.so'],
  ['佐玩官网', '为自己的公司佐玩设计开发的官网，简约的设计结合噪点材质感。', 'https://zolplay.com', 'zolplay.png', 'zolplay.com'],
  ['Well Word', '5×5 英语拼字游戏。', 'https://wellwordgame.com/zh-CN', 'well-word.png', 'wellwordgame.com'],
  ['ChatGPT Slack 机器人', '公司内部 Slack 的雏形版 ChatGPT 机器人。', 'https://github.com/zolplay-cn/chatgpt-slack', 'chatgpt-slack.png', 'github.com'],
  ['Raycast · 苹果开发者文档', '在 Raycast 里快速搜索 Apple Developer 文档。', 'https://www.raycast.com/cali/apple-developer-docs', 'apple-developer-docs.png', 'raycast.com'],
  ['Raycast · 亮度调节', '第一款 Raycast 插件，调节屏幕亮度。', 'https://www.raycast.com/cali/brightness-control', 'brightness-control.png', 'raycast.com'],
  ['BuckBank 元钞银行', 'Slack 里的虚拟经济系统：买 emoji 股份、幸运大转盘、转账。', 'https://twitter.com/thecalicastle/status/1663601110916149251', 'buckbank.png', 'twitter.com'],
  ['PopMenu', '大学期间写的 iOS 弹出菜单开源库。', 'https://github.com/CaliCastle/PopMenu', 'popmenu.png', 'github.com'],
]
const books = [
  ['Grid Systems in Graphic Design', 'Josef Müller-Brockmann', 'grid-systems.jpg'], ['Refactoring UI', 'Adam Wathan & Steve Schoger', 'refactoring-ui.jpg'],
  ['Universal Principles of UX', 'Irene Pereyra', 'universal-principles-ux.jpg'], ['Just Enough Design', 'Taku Satoh', 'just-enough-design.jpg'],
  ['The Creative Act', 'Rick Rubin', 'creative-act.jpg'], ['Steal Like an Artist', 'Austin Kleon', 'steal-like-an-artist.jpg'],
  ['Show Your Work!', 'Austin Kleon', 'show-your-work.jpg'], ['Build', 'Tony Fadell', 'build.jpg'], ['Rework', 'Jason Fried & DHH', 'rework.png'],
  ['The Great CEO Within', 'Matt Mochary', 'great-ceo-within.jpg'], ['Make Something Wonderful', 'Steve Jobs', 'make-something-wonderful.jpg'],
  ['How to American', 'Jimmy O. Yang', 'how-to-american.jpg'], ['Sword of Destiny', 'Andrzej Sapkowski', 'sword-of-destiny.jpg'],
  ['Hustle Harder, Hustle Smarter', '50 Cent', 'hustle-harder.jpg'], ['The Subtle Art of Not Giving a F*ck', 'Mark Manson', 'subtle-art.jpg'],
]
const albums = [
  ['TIM', 'Avicii', 'tim.jpg'], ['The Fall-Off', 'J. Cole', 'the-fall-off.jpg'], ['HOPE', 'NF', 'hope.jpg'], ['Melodie', 'CRO', 'melodie.jpg'],
  ['2001', 'Dr. Dre', '2001.jpg'], ['Trench', 'twenty one pilots', 'trench.jpg'], ['Clancy', 'twenty one pilots', 'clancy.jpg'],
  ['Breach', 'twenty one pilots', 'breach.jpg'], ['Starboy', 'The Weeknd', 'starboy.jpg'], ['After Hours', 'The Weeknd', 'after-hours.jpg'],
  ['Hurry Up Tomorrow', 'The Weeknd', 'hurry-up-tomorrow.jpg'], ['The Death of Slim Shady', 'Eminem', 'death-of-slim-shady.jpg'],
  ['Random Access Memories', 'Daft Punk', 'random-access-memories.jpg'], ['Urban Flora', 'Alina Baraz & Galimatias', 'urban-flora.jpg'],
]

function shell(title, description, content, active = '', depth = 0) {
  const home = depth === 0 ? '/' : '../'.repeat(depth)
  const absolute = (target) => `${base}${target}`
  const dock = [
    ['/', '首页', 'home', 'home'],
    ['/blog/', '写作', 'writing', 'writing'],
    ['/photos/', '照片', 'photos', 'photos'],
    ['/projects/', '项目', 'projects', 'projects'],
    ['/ama/', '关于', 'about', 'about'],
  ].map(([href, label, icon, key]) => `<a class="dock-link ${active === key ? 'active' : ''}" href="${absolute(href)}" aria-label="${label}" title="${label}">${key === 'home'
    ? `<img src="${absolute('/assets/images/avatar.png')}" alt="">`
    : `<svg class="dock-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${{
      writing: '<path d="M6 4h12M6 8h12M6 12h8M6 16h12M6 20h8"/>',
      photos: '<rect x="4" y="5" width="16" height="14" rx="2"/><circle cx="9" cy="10" r="1.5"/><path d="m6 17 4-4 3 3 2-2 3 3"/>',
      projects: '<rect x="5" y="4" width="14" height="16" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
      about: '<circle cx="12" cy="12" r="8"/><path d="M12 11v5M12 8.2h.01"/>',
    }[icon]}</svg>`}<span>${label}</span></a>`).join('')
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="description" content="${escapeHtml(description)}"><title>${escapeHtml(title)} · 纳兰</title><link rel="stylesheet" href="${absolute('/assets/style.css')}"><link rel="stylesheet" href="${absolute('/assets/shelves.css')}"><script defer src="${absolute('/assets/site.js')}"></script></head><body data-home="${absolute('/')}" data-base="${base}"><main>${content}</main><nav class="dock" aria-label="主导航">${dock}<i class="dock-divider"></i><button class="dock-link preferences-toggle" type="button" aria-label="偏好设置" title="偏好设置" aria-expanded="false"><svg class="dock-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 8.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6Z"/><path d="m19.4 15 .1.1-1.8 3.1-.1-.1a7.9 7.9 0 0 1-2.1 1.2v.2h-3.6v-.2a7.9 7.9 0 0 1-2.1-1.2l-.1.1-1.8-3.1.1-.1a7.8 7.8 0 0 1-.4-2.2H7.4V9.2h.2a7.8 7.8 0 0 1 .4-2.2l-.1-.1 1.8-3.1.1.1a7.9 7.9 0 0 1 2.1-1.2v-.2h3.6v.2a7.9 7.9 0 0 1 2.1 1.2l.1-.1 1.8 3.1-.1.1a7.8 7.8 0 0 1 .4 2.2h.2v3.6h-.2a7.8 7.8 0 0 1-.4 2.2Z"/></svg><span>偏好</span></button></nav><section class="preferences-panel" data-preferences-panel aria-hidden="true" role="dialog" aria-modal="false" aria-labelledby="preferences-title"><div class="preferences-backdrop" data-preferences-close></div><div class="preferences-card"><div class="preferences-head"><div><span class="eyebrow">Preferences</span><h2 id="preferences-title">偏好设置</h2></div><button type="button" class="preferences-close" data-preferences-close aria-label="关闭">×</button></div><div class="preferences-group"><div class="preferences-label">外观</div><div class="preferences-options" role="group" aria-label="主题"><button type="button" data-theme-choice="system">跟随系统</button><button type="button" data-theme-choice="light">浅色</button><button type="button" data-theme-choice="dark">深色</button></div></div><div class="preferences-group"><div class="preferences-label">文字大小</div><div class="preferences-range-row"><span>A</span><input type="range" min="13" max="18" step="1" value="14" data-font-size aria-label="文字大小"><span class="large-a">A</span></div></div><div class="preferences-group"><div class="preferences-label">阅读宽度</div><div class="preferences-options" role="group" aria-label="阅读宽度"><button type="button" data-width-choice="narrow">窄</button><button type="button" data-width-choice="standard">标准</button><button type="button" data-width-choice="wide">宽</button></div></div><div class="preferences-group preferences-checks"><label><input type="checkbox" data-preference="smooth"> 平滑滚动</label><label><input type="checkbox" data-preference="motion"> 动画效果</label></div><p class="preferences-note">设置只保存在当前浏览器，不需要登录。</p></div></section><footer class="site-footer"><span>设计参考<a href="https://github.com/CaliCastle/cali.so" target="_blank" >Cali Castle</a></span><span><a href="${absolute('/blog/')}" >写作</a> · <a href="${absolute('/projects/')}">项目</a> · <a href="https://github.com/chennalan/nalan-website" target="_blank" rel="noreferrer">GitHub</a></span></footer></body></html>`
}

async function cpTree(source, destination) {
  try {
    await mkdir(destination, { recursive: true })
    for (const entry of await readdir(source, { withFileTypes: true })) {
      const from = path.join(source, entry.name)
      const to = path.join(destination, entry.name)
      if (entry.isDirectory()) await cpTree(from, to)
      else if (entry.isFile()) await copyFile(from, to)
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
}

async function extractLegacyAssets() {
  const marker = path.join(root, 'assets', '.legacy-assets-extracted')
  try { await access(marker); return } catch {}
  const archives = (await readdir(root)).filter((name) => /^legacy-assets-.*\.zip$/.test(name)).sort()
  if (!archives.length) return
  const command = process.platform === 'win32' ? 'tar.exe' : 'unzip'
  for (const name of archives) {
    const archive = path.join(root, name)
    const args = process.platform === 'win32'
      ? ['-xf', archive, '-C', root]
      : ['-o', archive, '-d', root]
    const result = spawnSync(command, args, { stdio: 'inherit' })
    if (result.status !== 0) throw new Error(`Could not unpack ${name} (exit ${result.status})`)
  }
  await writeFile(marker, '')
}

await extractLegacyAssets()
await rm(out, { recursive: true, force: true })
await mkdir(path.join(out, 'assets', 'images'), { recursive: true })
await mkdir(path.join(out, 'posts'), { recursive: true })
await copyFile(path.join(root, 'assets', 'style.css'), path.join(out, 'assets', 'style.css'))
await copyFile(path.join(root, 'assets', 'site.js'), path.join(out, 'assets', 'site.js'))
await copyFile(path.join(root, 'assets', 'shelves.css'), path.join(out, 'assets', 'shelves.css'))
await cpTree(path.join(root, 'assets', 'images'), path.join(out, 'assets', 'images'))

const photoDir = path.join(root, 'photo')
await mkdir(photoDir, { recursive: true })
const photoExtensions = new Set(['.avif', '.gif', '.jpeg', '.jpg', '.png', '.webp'])

function parsePhotoDateFromName(name) {
  const match = name.match(/(20\\d{2})[-_.](\\d{1,2})[-_.](\\d{1,2})/)
  if (!match) return ''
  const [, y, m, d] = match
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
}

function parseJpegExifDate(buffer) {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return ''
  let offset = 2
  while (offset + 4 < buffer.length) {
    if (buffer[offset] !== 0xff) { offset += 1; continue }
    const marker = buffer[offset + 1]
    if (marker === 0xda || marker === 0xd9) break
    const size = buffer.readUInt16BE(offset + 2)
    if (marker === 0xe1 && buffer.toString('ascii', offset + 4, offset + 10) === 'Exif\\0\\0') {
      const tiff = offset + 10
      const little = buffer.toString('ascii', tiff, tiff + 2) === 'II'
      const u16 = (p) => little ? buffer.readUInt16LE(p) : buffer.readUInt16BE(p)
      const u32 = (p) => little ? buffer.readUInt32LE(p) : buffer.readUInt32BE(p)
      const typeSize = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8 }
      const readIfd = (ifdOffset) => {
        if (ifdOffset < 0 || tiff + ifdOffset + 2 > buffer.length) return ''
        const count = u16(tiff + ifdOffset)
        for (let i = 0; i < count; i += 1) {
          const entry = tiff + ifdOffset + 2 + i * 12
          if (entry + 12 > buffer.length) break
          const tag = u16(entry)
          const type = u16(entry + 2)
          const countValue = u32(entry + 4)
          const bytes = (typeSize[type] || 0) * countValue
          const valueOffset = bytes <= 4 ? entry + 8 : tiff + u32(entry + 8)
          if (tag === 0x9003 || tag === 0x0132) {
            const raw = buffer.toString('ascii', valueOffset, Math.min(valueOffset + countValue, buffer.length)).replace(/\\0.*$/, '').trim()
            const m = raw.match(/^(\\d{4}):(\\d{2}):(\\d{2})/)
            if (m) return `${m[1]}-${m[2]}-${m[3]}`
          }
        }
        return ''
      }
      const ifd0 = u32(tiff + 4)
      const direct = readIfd(ifd0)
      if (direct) return direct
    }
    offset += 2 + size
  }
  return ''
}

async function photoDate(name) {
  const fromName = parsePhotoDateFromName(name)
  if (fromName) return fromName
  if (/\\.jpe?g$/i.test(name)) {
    try {
      const exifDate = parseJpegExifDate(await readFile(path.join(photoDir, name)))
      if (exifDate) return exifDate
    } catch {}
  }
  return ''
}

const photoCaption = (name) => {
  const baseName = path.basename(name, path.extname(name))
  const cleaned = baseName
    .replace(/^20\d{2}[-_.]\d{1,2}[-_.]\d{1,2}[-_\s]*/, '')
    .replace(/^IMG[_-]?/i, '')
    .replace(/[-_]+/g, ' ')
    .trim()
  if (!cleaned || cleaned.length > 48 || /tplv|aweme|images-v2/i.test(cleaned)) return '生活记录'
  return cleaned
}

const photoMetaPath = path.join(photoDir, 'meta.json')
let photoMeta = {}
try { photoMeta = JSON.parse(await readFile(photoMetaPath, 'utf8')) } catch {}
const photoTitle = (name) => photoMeta[name]?.title?.trim() || photoCaption(name)
const photoDescription = (name) => photoMeta[name]?.description?.trim() || ''
const photoLocation = (name) => photoMeta[name]?.location?.trim() || ''
const photoDateOverride = (name) => photoMeta[name]?.date?.trim() || ''

const photoFiles = (await readdir(photoDir, { withFileTypes: true }))
  .filter((entry) => entry.isFile() && photoExtensions.has(path.extname(entry.name).toLowerCase()))
  .map((entry) => entry.name)

const photoItems = []
for (const name of photoFiles) {
  const date = photoDateOverride(name) || await photoDate(name)
  photoItems.push({ name, date, caption: photoTitle(name), description: photoDescription(name), location: photoLocation(name) })
}
photoItems.sort((a, b) => (b.date || '').localeCompare(a.date || '') || a.name.localeCompare(b.name, 'zh-CN', { numeric: true, sensitivity: 'base' }))

await mkdir(path.join(out, 'photo'), { recursive: true })
for (const item of photoItems) await copyFile(path.join(photoDir, item.name), path.join(out, 'photo', item.name))
await writeFile(path.join(out, 'photo', 'manifest.json'), JSON.stringify(photoItems))

const photoPreviewFiles = photoItems.slice(0, 3).map((item) => url(`/photo/${encodeURIComponent(item.name)}`))
const photoPreview = photoPreviewFiles.map((src) => `<img src="${src}" alt="">`).join('')

const postsDir = path.join(root, 'content', 'posts')
const posts = []
const postEntries = await readdir(postsDir, { withFileTypes: true })

// 新写法：一篇文章一个文件夹，入口统一为 index.md。
// 例如：content/posts/jk03/index.md
// 图片、附件等直接放在同一个文件夹里，发布时会自动跟随文章复制。
for (const entry of postEntries) {
  if (entry.isDirectory()) {
    // _template、文档目录等以下划线开头的目录永远不是文章。
    if (entry.name.startsWith('_')) continue

    const articleDir = path.join(postsDir, entry.name)
    const indexPath = path.join(articleDir, 'index.md')

    try {
      // 标准格式：content/posts/slug/index.md
      const meta = frontmatter(await readFile(indexPath, 'utf8'), indexPath)
      posts.push({ ...meta, slug: meta.slug || entry.name, sourceDir: articleDir })
      continue
    } catch (error) {
      if (error.code !== 'ENOENT') throw error
    }

    // 兼容迁移中的文章：
    // content/posts/slug/slug.md
    // 这样把旧文章从单文件移动到文件夹时，不会因为文件名不是 index.md 而消失。
    const files = await readdir(articleDir, { withFileTypes: true })
    const markdownFiles = files
      .filter((item) => item.isFile() && item.name.endsWith('.md') && item.name !== 'README.md')
      .map((item) => item.name)

    if (markdownFiles.length === 1) {
      const legacyPath = path.join(articleDir, markdownFiles[0])
      const meta = frontmatter(await readFile(legacyPath, 'utf8'), legacyPath)
      posts.push({ ...meta, slug: meta.slug || entry.name, sourceDir: articleDir })
    } else if (markdownFiles.length > 1) {
      throw new Error(`${articleDir} contains multiple Markdown files. Use index.md as the article entry.`)
    }
  } else if (entry.isFile() && entry.name.endsWith('.md') && !['hello-world.md', 'README.md'].includes(entry.name)) {
    // 兼容旧文章：content/posts/2026-09-30.md
    const meta = frontmatter(await readFile(path.join(postsDir, entry.name), 'utf8'), entry.name)
    posts.push({ ...meta, slug: meta.slug || path.basename(entry.name, '.md'), sourceDir: null })
  }
}

posts.sort((a, b) => b.date.localeCompare(a.date))

// slug 是文章网址，也是输出目录名；重复 slug 会导致文章互相覆盖。
// 与其让新文章“悄悄消失”，这里直接让构建失败并明确指出冲突。
const seenSlugs = new Map()
for (const post of posts) {
  if (seenSlugs.has(post.slug)) {
    const previous = seenSlugs.get(post.slug)
    throw new Error(`Duplicate article slug "${post.slug}" in ${previous} and ${post.title}. Please give each article a unique slug.`)
  }
  seenSlugs.set(post.slug, post.title)
}

for (const post of posts) {
  const dest = path.join(out, 'posts', post.slug)
  await mkdir(dest, { recursive: true })
  if (post.sourceDir) await cpTree(post.sourceDir, dest)
}

const grouped = new Map()
for (const post of posts) {
  const year = post.date.slice(0, 4)
  if (!grouped.has(year)) grouped.set(year, [])
  grouped.get(year).push(post)
}
const homepageRows = posts.slice(0, 5).map((p) => postRow(p, 'short')).join('')
const home = `<section class="home-wrap"><div class="intro-grid"><div class="intro-copy"><div class="identity"><h1>纳兰</h1><span class="pixel-mark" aria-hidden>✳</span></div><p>你好，这里是纳兰，一个极简的辩证主义者，也是一名全栈工程师。我也是 lastwar 指挥官，热爱把细节做到刚刚好。</p>
<p>我也用 AI 辅助编程做一些小产品，把日常阅读和实践留下来。</p>
<p>我兴趣很杂，什么都爱试试。和团队一起做东西，我在意好点子、好细节，也在意玩得开心。</p>
<p class="contact-line">可以在 <a href="https://github.com/chennalan" target="_blank" rel="noreferrer">GitHub</a> 找到我。</p></div><img class="portrait" src="${url('/assets/images/headshot.jpg')}" alt="纳兰的头像"></div><div class="nav-cards"><a class="nav-card" href="${url('/blog/')}"><span class="card-illustration papers"><i></i><i></i><i></i></span><strong>写作</strong><small>${posts.length} 篇文章</small></a><a class="nav-card" href="${url('/photos/')}"><span class="card-illustration photo-fan">${photoPreview}</span><strong>照片</strong><small>生活与记录</small></a><a class="nav-card" href="${url('/projects/')}"><span class="card-illustration project-mark">✎</span><strong>项目</strong><small>${projects.length} 个项目</small></a></div><section class="home-section"><div class="section-head"><h2><span>01</span> 写作</h2><a href="${url('/blog/')}">查看全部 →</a></div><div class="post-list">${homepageRows}</div></section><section class="home-section"><div class="section-head"><h2><span>02</span> 循环播放中</h2></div><div class="collection-grid records-grid">${albums.map(([name, artist, image]) => `<a class="collection-item" href="https://music.apple.com/search?term=${encodeURIComponent(`${artist} ${name}`)}" target="_blank" rel="noreferrer"><img src="${url(`/assets/images/records/${image}`)}" alt="${escapeHtml(name)}"><span>${escapeHtml(name)}</span><small>${escapeHtml(artist)}</small></a>`).join('')}</div></section><section class="home-section"><div class="section-head"><h2><span>03</span> 珍藏书架</h2></div><div class="collection-grid books-grid">${books.map(([name, author, image]) => `<a class="collection-item" href="https://www.google.com/search?q=${encodeURIComponent(`${name} ${author} book`)}" target="_blank" rel="noreferrer"><img src="${url(`/assets/images/books/${image}`)}" alt="${escapeHtml(name)}"><span>${escapeHtml(name)}</span><small>${escapeHtml(author)}</small></a>`).join('')}</div></section></section>`
await writeFile(path.join(out, 'index.html'), formatHtml(shell('首页', '纳兰的个人主页、项目和写作', home, 'home')))

const articleList = [...grouped].map(([year, yearPosts]) => `<section class="year-section"><h2><span>${year}</span><i aria-hidden>${year.slice(-2)}</i></h2><div class="post-list">${yearPosts.map((p) => postRow(p, 'month-day')).join('')}</div></section>`).join('')
const blog = `<section class="page-wrap"><header class="page-heading"><p class="eyebrow">NOTES & STORIES</p><h1>写作</h1><p>关于设计、工程、产品，以及一路上在意的人和事。</p><span class="heading-mark">✳</span></header><div class="year-list">${articleList}</div></section>`
await mkdir(path.join(out, 'blog'), { recursive: true })
await writeFile(path.join(out, 'blog', 'index.html'), shell('写作', '纳兰的文章', blog, 'writing', 1))

const projectRows = projects.map(([name, description, href, icon, domain]) => `<a class="project-row" href="${escapeHtml(href)}" ${href.startsWith('http') ? 'target="_blank" rel="noreferrer"' : ''}><img src="${url(`/assets/images/projects/${icon}`)}" alt=""><span class="project-name">${escapeHtml(name)}<small>${escapeHtml(domain)}</small></span><span class="project-description">${escapeHtml(description)}</span><span class="external-arrow">↗</span></a>`).join('')
const projectPage = `<section class="page-wrap"><header class="page-heading"><p class="eyebrow">MADE WITH CARE</p><h1>项目</h1><p>这些年做过的产品、开源工具和小实验。有些实用，有些只是好玩，但每一个我都认真做过。</p></header><div class="project-list">${projectRows}</div></section>`
await mkdir(path.join(out, 'projects'), { recursive: true })
await writeFile(path.join(out, 'projects', 'index.html'), shell('项目', '纳兰做过的项目与小实验', projectPage, 'projects', 1))

const photoTiles = photoItems.length
  ? photoItems.map((item, index) => {
      const src = url(`/photo/${encodeURIComponent(item.name)}`)
      const meta = [item.date, item.location].filter(Boolean).join(' · ')
      return `<figure class="photo-tile" data-photo-index="${index}" data-year="${escapeHtml((item.date || '').slice(0, 4))}" data-month="${escapeHtml((item.date || '').slice(0, 7))}" tabindex="0" role="button" aria-label="查看照片：${escapeHtml(item.caption)}"><img src="${src}" alt="${escapeHtml(item.caption)}" loading="lazy"><figcaption><strong>${escapeHtml(item.caption)}</strong>${meta ? `<span>${escapeHtml(meta)}</span>` : ''}${item.description ? `<small>${escapeHtml(item.description)}</small>` : ''}</figcaption></figure>`
    }).join('')
  : '<p class="photo-empty">还没有照片。把照片上传到 photo/ 文件夹，推送后网站会自动生成照片库。</p>'
const years = [...new Set(photoItems.map((item) => (item.date || '').slice(0, 4)).filter(Boolean))].sort((a, b) => b.localeCompare(a))
const months = [...new Set(photoItems.map((item) => (item.date || '').slice(0, 7)).filter(Boolean))].sort((a, b) => b.localeCompare(a))
const yearOptions = years.map((year) => `<option value="${year}">${year} 年</option>`).join('')
const monthOptions = months.map((month) => `<option value="${month}">${month.replace('-', ' 年 ')} 月</option>`).join('')
const photos = `<section class="page-wrap"><header class="page-heading"><p class="eyebrow">LITTLE MOMENTS</p><h1>照片</h1><p>你的个人照片库：上传照片即可自动整理、筛选和浏览。</p></header><div class="photo-toolbar"><span data-photo-count>${photoItems.length} 张照片</span><span>点击查看大图 · ← → 切换</span></div><div class="photo-filters"><label>年份<select data-photo-year><option value="">全部年份</option>${yearOptions}</select></label><label>月份<select data-photo-month><option value="">全部月份</option>${monthOptions}</select></label><button type="button" data-photo-reset>重置</button></div><div class="photo-grid" data-photo-grid>${photoTiles}</div><nav class="photo-pagination" data-photo-pagination aria-label="照片分页"></nav></section>`
await mkdir(path.join(out, 'photos'), { recursive: true })
await writeFile(path.join(out, 'photos', 'index.html'), shell('照片', '生活与记录', photos, 'photos', 1))

const ama = `<section class="page-wrap"><header class="page-heading"><p class="eyebrow">LET’S TALK</p><h1>聊聊</h1><p>产品设计、工程、职业选择，或任何你正在探索的想法。</p></header><div class="ama-card"><p>我喜欢和团队一起把好点子做出来，也愿意交流过程中的判断与细节。</p><a class="button" href="https://github.com/chennalan" target="_blank" rel="noreferrer">在 GitHub 找到我 ↗</a></div></section>`
await mkdir(path.join(out, 'ama'), { recursive: true })
await writeFile(path.join(out, 'ama', 'index.html'), shell('聊聊', '联系纳兰', ama, 'ama', 1))

for (let index = 0; index < posts.length; index += 1) {
  const post = posts[index]
  const { html, headings } = renderMarkdown(post.body)
  const stats = readingStats(post.body)
  const cover = post.cover ? `<figure class="polaroid"><img src="./${escapeHtml(path.basename(post.cover))}" alt=""><figcaption>${post.coverCaption ? escapeHtml(post.coverCaption) : post.date.replaceAll('-', '.')}</figcaption></figure>` : ''
  const toc = headings.length ? `<aside class="reading-map" aria-label="文章目录"><div class="reading-map-head"><span>本文目录</span><strong>${headings.length} 节</strong></div><a class="toc-title" href="#article-title">${escapeHtml(post.title)}</a><nav>${headings.map((h) => `<a href="#${h.id}" data-toc-link><span>${escapeHtml(h.text)}</span></a>`).join('')}</nav><button class="top-button" type="button" data-top>↑ 返回顶部</button></aside>` : ''
  const related = posts.filter((p) => p.slug !== post.slug).slice(Math.max(0, index - 1), index + 2).filter(Boolean).slice(0, 3)
  const relatedHtml = related.length ? `<aside class="related"><h2>相关阅读</h2>${related.map((p) => postRow(p, 'short')).join('')}</aside>` : ''
  const readingBar = `<div class="article-reading-ui" aria-label="文章阅读工具"><div class="article-reading-inner"><a class="article-back" href="${url("/blog/")}">← 写作</a><button class="article-toc-toggle" type="button" data-toc-toggle aria-expanded="false">目录 <span>${headings.length}</span></button><div class="article-reading-state"><span data-progress-label>0%</span><button type="button" data-top aria-label="返回顶部">↑</button></div></div><div class="article-progress-line" aria-hidden="true"><i data-reading-progress></i></div></div>`
  const content = `<article class="article-wrap">${readingBar}${toc}<div class="article-column">${cover}<header class="article-heading"><div class="section-number">第 ${String(posts.length - index).padStart(3, '0')} 篇 · ${post.date.replaceAll('-', '.')}</div><h1 id="article-title">${escapeHtml(post.title)}</h1>${post.description ? `<p>${escapeHtml(post.description)}</p>` : ''}<dl class="article-meta"><div><dt>日期</dt><dd>${post.date}</dd></div><div><dt>时长</dt><dd>${stats.minutes} 分钟</dd></div><div><dt>字数</dt><dd>${stats.words.toLocaleString('zh-CN')}</dd></div></dl></header><div class="prose">${html}</div>${relatedHtml}</div></article>`
  await writeFile(path.join(out, 'posts', post.slug, 'index.html'), shell(post.title, post.description || post.title, content, 'writing', 2))
}

// Generate RSS and sitemap from the same article index used by the site.
const rssItems = posts.map((post) => {
  const link = absoluteUrl(`/posts/${post.slug}/`)
  return `<item><title>${escapeHtml(post.title)}</title><link>${escapeHtml(link)}</link><guid isPermaLink="true">${escapeHtml(link)}</guid><pubDate>${new Date(post.date + 'T00:00:00Z').toUTCString()}</pubDate><description>${escapeHtml(post.description || post.title)}</description></item>`
}).join('')
const rss = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>纳兰 · 写作</title><link>${escapeHtml(absoluteUrl('/blog/'))}</link><description>纳兰的个人写作</description><language>zh-CN</language>${rssItems}</channel></rss>`
await writeFile(path.join(out, 'feed.xml'), rss)

const sitemapPaths = ['/', '/blog/', '/projects/', '/photos/', '/ama/', ...posts.map((post) => `/posts/${post.slug}/`)]
const sitemap = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${sitemapPaths.map((p) => `<url><loc>${escapeHtml(absoluteUrl(p))}</loc></url>`).join('')}</urlset>`
await writeFile(path.join(out, 'sitemap.xml'), sitemap)

await writeFile(path.join(out, '.nojekyll'), '')
console.log(`Built home, ${posts.length} articles, projects, photos, and contact pages in dist/`)
