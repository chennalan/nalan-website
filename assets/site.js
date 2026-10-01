(() => {
  const root = document.documentElement
  const savedTheme = localStorage.getItem('nalan-theme')
  if (savedTheme === 'dark') root.dataset.theme = 'dark'
  document.querySelector('.theme-toggle')?.addEventListener('click', () => {
    const dark = root.dataset.theme !== 'dark'
    if (dark) root.dataset.theme = 'dark'
    else delete root.dataset.theme
    localStorage.setItem('nalan-theme', dark ? 'dark' : 'light')
  })

  const progress = document.querySelector('[data-reading-progress]')
  if (progress) {
    const label = document.querySelector('[data-progress-label]')
    const headings = [...document.querySelectorAll('.prose h2[id],.prose h3[id],.prose h4[id]')]
    const links = [...document.querySelectorAll('[data-toc-link]')]
    const update = () => {
      const max = document.documentElement.scrollHeight - innerHeight
      const amount = max > 0 ? Math.min(100, Math.max(0, scrollY / max * 100)) : 100
      progress.style.width = `${amount}%`
      if (label) label.textContent = `${Math.round(amount)}%`
      let current = -1
      headings.forEach((heading, i) => { if (heading.getBoundingClientRect().top <= 140) current = i })
      links.forEach((link, i) => link.classList.toggle('active', i === current))
    }
    addEventListener('scroll', update, { passive: true })
    addEventListener('resize', update)
    update()
    document.querySelector('[data-top]')?.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }))
  }

  function makeElement(tag, className, text) {
    const node = document.createElement(tag)
    if (className) node.className = className
    if (text) node.textContent = text
    return node
  }

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
