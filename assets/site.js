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
  if (!progress) return
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
})()
