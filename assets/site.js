(() => {
  const root = document.documentElement
  const prefsKey = 'nalan-preferences'
  const defaults = { theme: 'system', fontSize: 14, width: 'standard', smooth: true, motion: true }
  let preferences = { ...defaults }
  try {
    preferences = { ...defaults, ...(JSON.parse(localStorage.getItem(prefsKey) || '{}')) }
  } catch {}

  const systemDark = matchMedia('(prefers-color-scheme: dark)')
  const applyPreferences = () => {
    const dark = preferences.theme === 'dark' || (preferences.theme === 'system' && systemDark.matches)
    if (dark) root.dataset.theme = 'dark'
    else delete root.dataset.theme
    root.dataset.contentWidth = preferences.width
    root.style.setProperty('--reading-font-size', `${preferences.fontSize}px`)
    root.dataset.motion = preferences.motion ? 'on' : 'off'
    root.dataset.smooth = preferences.smooth ? 'on' : 'off'
    try { localStorage.setItem(prefsKey, JSON.stringify(preferences)) } catch {}
    syncPreferenceControls()
  }

  const syncPreferenceControls = () => {
    document.querySelectorAll('[data-theme-choice]').forEach((button) => {
      button.classList.toggle('selected', button.dataset.themeChoice === preferences.theme)
      button.setAttribute('aria-pressed', String(button.dataset.themeChoice === preferences.theme))
    })
    document.querySelectorAll('[data-width-choice]').forEach((button) => {
      button.classList.toggle('selected', button.dataset.widthChoice === preferences.width)
      button.setAttribute('aria-pressed', String(button.dataset.widthChoice === preferences.width))
    })
    const range = document.querySelector('[data-font-size]')
    if (range) range.value = String(preferences.fontSize)
    document.querySelector('[data-preference="smooth"]')?.toggleAttribute('checked', preferences.smooth)
    document.querySelector('[data-preference="motion"]')?.toggleAttribute('checked', preferences.motion)
  }

  const preferencesPanel = document.querySelector('[data-preferences-panel]')
  const openPreferences = () => {
    if (!preferencesPanel) return
    preferencesPanel.setAttribute('aria-hidden', 'false')
    document.querySelector('.preferences-toggle')?.setAttribute('aria-expanded', 'true')
    document.body.classList.add('preferences-open')
    syncPreferenceControls()
  }
  const closePreferences = () => {
    if (!preferencesPanel) return
    preferencesPanel.setAttribute('aria-hidden', 'true')
    document.querySelector('.preferences-toggle')?.setAttribute('aria-expanded', 'false')
    document.body.classList.remove('preferences-open')
  }
  document.querySelector('.preferences-toggle')?.addEventListener('click', openPreferences)
  document.querySelectorAll('[data-preferences-close]').forEach((node) => node.addEventListener('click', closePreferences))
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closePreferences()
  })
  document.querySelectorAll('[data-theme-choice]').forEach((button) => {
    button.addEventListener('click', () => { preferences.theme = button.dataset.themeChoice; applyPreferences() })
  })
  document.querySelectorAll('[data-width-choice]').forEach((button) => {
    button.addEventListener('click', () => { preferences.width = button.dataset.widthChoice; applyPreferences() })
  })
  document.querySelector('[data-font-size]')?.addEventListener('input', (event) => {
    preferences.fontSize = Number(event.target.value)
    applyPreferences()
  })
  document.querySelector('[data-preference="smooth"]')?.addEventListener('change', (event) => {
    preferences.smooth = event.target.checked
    applyPreferences()
  })
  document.querySelector('[data-preference="motion"]')?.addEventListener('change', (event) => {
    preferences.motion = event.target.checked
    applyPreferences()
  })
  systemDark.addEventListener('change', () => {
    if (preferences.theme === 'system') applyPreferences()
  })
  applyPreferences()

  const progress = document.querySelector('[data-reading-progress]')
  if (progress) {
    const label = document.querySelector('[data-progress-label]')
    const article = document.querySelector('.article-column')
    const headings = [...document.querySelectorAll('.prose h2[id],.prose h3[id],.prose h4[id]')]
    const links = [...document.querySelectorAll('[data-toc-link]')]
    const tocToggle = document.querySelector('[data-toc-toggle]')
    const map = document.querySelector('.reading-map')

    const update = () => {
      if (!article) return
      const startY = article.getBoundingClientRect().top + scrollY
      const endY = startY + article.offsetHeight - innerHeight
      const amount = endY > startY ? Math.min(100, Math.max(0, (scrollY - startY) / (endY - startY) * 100)) : 100
      progress.style.width = `${amount}%`
      if (label) label.textContent = `${Math.round(amount)}%`
      let current = -1
      headings.forEach((heading, i) => { if (heading.getBoundingClientRect().top <= 150) current = i })
      links.forEach((link, i) => link.classList.toggle('active', i === current))
    }

    addEventListener('scroll', update, { passive: true })
    addEventListener('resize', update)
    update()
    document.querySelectorAll('[data-top]').forEach((button) => button.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' })))
    tocToggle?.addEventListener('click', () => {
      const open = map?.classList.toggle('is-open') ?? false
      tocToggle.setAttribute('aria-expanded', String(open))
    })
    map?.querySelectorAll('nav a').forEach((link) => link.addEventListener('click', () => {
      map.classList.remove('is-open')
      tocToggle?.setAttribute('aria-expanded', 'false')
    }))
  }

  function makeElement(tag, className, text) {
    const node = document.createElement(tag)
    if (className) node.className = className
    if (text) node.textContent = text
    return node
  }

  function enhancePhotos() {
    const grid = document.querySelector('[data-photo-grid]')
    if (!grid) return
    const tiles = [...grid.querySelectorAll('.photo-tile')]
    const pagination = document.querySelector('[data-photo-pagination]')
    const pageSize = 18
    let page = 1
    let active = -1

    const overlay = makeElement('div', 'photo-lightbox')
    overlay.setAttribute('aria-hidden', 'true')
    overlay.innerHTML = `
      <button class="photo-lightbox-close" type="button" aria-label="关闭">×</button>
      <button class="photo-lightbox-prev" type="button" aria-label="上一张">‹</button>
      <figure><img alt=""><figcaption><strong></strong><time></time></figcaption></figure>
      <button class="photo-lightbox-next" type="button" aria-label="下一张">›</button>
    `
    document.body.append(overlay)
    const image = overlay.querySelector('img')
    const caption = overlay.querySelector('figcaption strong')
    const date = overlay.querySelector('figcaption time')

    const showPage = (next) => {
      const totalPages = Math.max(1, Math.ceil(tiles.length / pageSize))
      page = Math.max(1, Math.min(totalPages, next))
      tiles.forEach((tile, index) => { tile.hidden = index < (page - 1) * pageSize || index >= page * pageSize })
      if (pagination) {
        pagination.innerHTML = ''
        for (let i = 1; i <= totalPages; i += 1) {
          const button = makeElement('button', i === page ? 'selected' : '', String(i))
          button.type = 'button'
          button.setAttribute('aria-label', `第 ${i} 页`)
          button.setAttribute('aria-current', i === page ? 'page' : 'false')
          button.addEventListener('click', () => showPage(i))
          pagination.append(button)
        }
      }
    }

    const open = (index) => {
      active = Math.max(0, Math.min(tiles.length - 1, index))
      const tile = tiles[active]
      const img = tile.querySelector('img')
      const time = tile.querySelector('time')
      image.src = img.currentSrc || img.src
      image.alt = img.alt
      caption.textContent = tile.querySelector('figcaption strong')?.textContent || img.alt
      date.textContent = time?.textContent || ''
      overlay.setAttribute('aria-hidden', 'false')
      document.body.classList.add('photo-lightbox-open')
    }
    const close = () => {
      overlay.setAttribute('aria-hidden', 'true')
      document.body.classList.remove('photo-lightbox-open')
    }
    const move = (delta) => open((active + delta + tiles.length) % tiles.length)

    tiles.forEach((tile, index) => {
      tile.addEventListener('click', () => open(index))
      tile.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(index) }
      })
    })
    overlay.querySelector('.photo-lightbox-close').addEventListener('click', close)
    overlay.querySelector('.photo-lightbox-prev').addEventListener('click', () => move(-1))
    overlay.querySelector('.photo-lightbox-next').addEventListener('click', () => move(1))
    overlay.addEventListener('click', (event) => { if (event.target === overlay) close() })
    document.addEventListener('keydown', (event) => {
      if (overlay.getAttribute('aria-hidden') === 'true') return
      if (event.key === 'Escape') close()
      if (event.key === 'ArrowLeft') move(-1)
      if (event.key === 'ArrowRight') move(1)
    })
    showPage(1)
  }

  enhancePhotos()

  function enhanceRecords(grid) {
    const cards = [...grid.querySelectorAll(':scope > .collection-item')]
    if (!cards.length) return
    const viewport = makeElement('div', 'record-viewport')
    const stack = makeElement('ul', 'record-stack')
    stack.setAttribute('aria-label', '正在播放的唱片收藏')
    const caption = makeElement('p', 'record-caption')
    caption.setAttribute('aria-live', 'polite')
    const title = makeElement('strong', 'record-caption-title')
    const artist = makeElement('span', 'record-caption-artist')
    caption.append(title, artist)
    const items = cards.map((card, index) => {
      const image = card.querySelector('img')
      const album = card.querySelector('span')?.textContent?.trim() || ''
      const performer = card.querySelector('small')?.textContent?.trim() || ''
      const item = makeElement('li', 'record-item')
      const link = makeElement('a', 'record-card')
      link.href = card.href
      link.target = '_blank'
      link.rel = 'noreferrer'
      link.setAttribute('aria-label', `${album} — ${performer}`)
      link.dataset.recordIndex = String(index)
      if (image) {
        const cover = image.cloneNode(true)
        cover.alt = ''
        cover.className = 'record-cover'
        link.append(cover)
      }
      item.append(link)
      item.dataset.recordIndex = String(index)
      item.dataset.album = album
      item.dataset.artist = performer
      stack.append(item)
      return item
    })
    viewport.append(stack)
    grid.replaceWith(viewport, caption)

    let active = Math.floor(items.length / 2)
    let dragStart = null
    let suppressClick = false
    const update = (next, animate = true) => {
      active = Math.max(0, Math.min(items.length - 1, next))
      viewport.dataset.motion = animate ? 'settled' : 'instant'
      items.forEach((item, index) => {
        const distance = index - active
        if (index === active) item.setAttribute('data-active', '')
        else item.removeAttribute('data-active')
        item.style.setProperty('--record-offset', `${distance * 37}px`)
        item.style.setProperty('--record-rise', `${Math.abs(distance) * 3}px`)
        item.style.setProperty('--record-tilt', `${distance * -2.4}deg`)
        item.style.setProperty('--record-scale', index === active ? '1' : `${Math.max(0.88, 1 - Math.abs(distance) * 0.018)}`)
        item.style.zIndex = String(items.length - Math.abs(distance))
      })
      title.textContent = items[active].dataset.album || ''
      artist.textContent = items[active].dataset.artist || ''
    }
    update(active, false)

    stack.addEventListener('click', (event) => {
      const link = event.target.closest('.record-card')
      if (!link) return
      const index = Number(link.dataset.recordIndex)
      if (suppressClick) {
        event.preventDefault()
        suppressClick = false
      } else if (index !== active) {
        event.preventDefault()
        update(index)
      }
    })
    viewport.addEventListener('pointerdown', (event) => {
      dragStart = event.clientX
    })
    document.addEventListener('pointerup', (event) => {
      if (dragStart === null) return
      const delta = event.clientX - dragStart
      if (Math.abs(delta) > 24) {
        const steps = Math.max(1, Math.round(Math.abs(delta) / 74))
        update(active + (delta < 0 ? steps : -steps))
        suppressClick = true
        setTimeout(() => { suppressClick = false }, 250)
      }
      dragStart = null
    })
    document.addEventListener('pointercancel', () => { dragStart = null })
    viewport.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') { event.preventDefault(); update(active - 1) }
      if (event.key === 'ArrowRight') { event.preventDefault(); update(active + 1) }
      if (event.key === 'Home') { event.preventDefault(); update(0) }
      if (event.key === 'End') { event.preventDefault(); update(items.length - 1) }
    })
  }

  function enhanceBooks(grid) {
    const cards = [...grid.querySelectorAll(':scope > .collection-item')]
    if (!cards.length) return
    const shelf = makeElement('ul', 'book-shelf')
    shelf.setAttribute('aria-label', '珍藏书架，选择一本书展开封面')
    const annotation = makeElement('p', 'book-annotation')
    annotation.setAttribute('aria-live', 'polite')
    const title = makeElement('strong', 'book-annotation-title')
    const author = makeElement('span', 'book-annotation-author')
    annotation.append(title, author)
    const frames = cards.map((card, index) => {
      const image = card.querySelector('img')
      const name = card.querySelector('span')?.textContent?.trim() || ''
      const writer = card.querySelector('small')?.textContent?.trim() || ''
      const frame = makeElement('li', 'book-frame')
      const link = makeElement('a', 'book-inner')
      link.href = card.href
      link.target = '_blank'
      link.rel = 'noreferrer'
      link.dataset.bookIndex = String(index)
      link.setAttribute('aria-label', `${name} — ${writer}`)
      const cover = makeElement('span', 'book-cover')
      if (image) {
        const art = image.cloneNode(true)
        art.alt = ''
        art.className = 'book-cover-art'
        cover.append(art)
      }
      const spine = makeElement('span', 'book-spine')
      spine.append(makeElement('span', 'book-spine-title', name), makeElement('span', 'book-spine-author', writer))
      link.append(cover, spine)
      frame.append(link)
      frame.dataset.bookIndex = String(index)
      frame.dataset.title = name
      frame.dataset.author = writer
      shelf.append(frame)
      return frame
    })
    const stage = makeElement('div', 'book-stage')
    stage.append(shelf)
    grid.replaceWith(stage, annotation)

    let active = 0
    const update = (next) => {
      active = (next + frames.length) % frames.length
      shelf.dataset.activeIndex = String(active)
      frames.forEach((frame, index) => {
        if (index === active) frame.setAttribute('data-active', '')
        else frame.removeAttribute('data-active')
        const link = frame.querySelector('.book-inner')
        link?.setAttribute('aria-current', index === active ? 'true' : 'false')
        if (link) link.tabIndex = index === active ? 0 : -1
      })
      title.textContent = frames[active].dataset.title || ''
      author.textContent = frames[active].dataset.author || ''
    }
    update(active)
    shelf.addEventListener('click', (event) => {
      const link = event.target.closest('.book-inner')
      if (!link) return
      const index = Number(link.dataset.bookIndex)
      if (index !== active) {
        event.preventDefault()
        update(index)
      }
    })
    shelf.addEventListener('keydown', (event) => {
      const current = event.target.closest('.book-inner')
      if (!current) return
      if (event.key === 'ArrowLeft') { event.preventDefault(); update(active - 1); shelf.querySelector(`[data-book-index="${active}"]`)?.focus() }
      if (event.key === 'ArrowRight') { event.preventDefault(); update(active + 1); shelf.querySelector(`[data-book-index="${active}"]`)?.focus() }
      if (event.key === 'Home') { event.preventDefault(); update(0); shelf.querySelector('[data-book-index="0"]')?.focus() }
      if (event.key === 'End') { event.preventDefault(); update(frames.length - 1); shelf.querySelector(`[data-book-index="${active}"]`)?.focus() }
    })
  }

  enhanceRecords(document.querySelector('.records-grid'))
  enhanceBooks(document.querySelector('.books-grid'))
})()
