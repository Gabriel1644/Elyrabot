/**
 * components/Logs.js
 * Logs em tempo real via Socket.io com filtros e auto-scroll
 */
const PageLogs = (() => {
  let _autoScroll = true
  let _filterType = 'ALL'
  let _filterText = ''
  let _stream = null

  async function render(container) {
    container.innerHTML = `
      <div class="section">
        <div class="card">
          <div class="card-header">
            <span class="card-title">${ICONS.zap} Stream ao Vivo</span>
            <div style="display:flex;gap:8px;align-items:center">
              <span id="logCount" style="font-family:var(--font-mono);font-size:0.75rem;color:var(--text-muted)">0 logs</span>
              <button class="btn btn-sm btn-secondary" id="clearLogsBtn">${ICONS.trash} Limpar</button>
              <button class="btn btn-sm btn-secondary" id="scrollToggle">📌 Auto-scroll: ON</button>
              <button class="btn btn-sm btn-secondary" id="copyLogsBtn">${ICONS.copy} Copiar</button>
            </div>
          </div>

          <!-- Filtros -->
          <div class="filter-bar">
            <input class="form-input" id="logSearch" placeholder="🔍 Filtrar logs...">
            <select class="form-select" id="logTypeFilter" style="width:120px">
              <option value="ALL">Todos</option>
              <option value="INFO">INFO</option>
              <option value="CMD">CMD</option>
              <option value="WARN">WARN</option>
              <option value="ERROR">ERROR</option>
              <option value="BOT">BOT</option>
              <option value="DEBUG">DEBUG</option>
            </select>
          </div>

          <!-- Stream -->
          <div class="log-stream" id="logStream">
            <div class="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              <p>Aguardando logs...</p>
            </div>
          </div>
        </div>
      </div>
    `

    _stream = document.getElementById('logStream')

    // Carrega logs históricos
    const existing = App.state.logs || []
    if (existing.length) {
      _stream.innerHTML = ''
      existing.forEach(addLogEntry)
      scrollBottom()
    }

    bindEvents()
  }

  function buildEntry(entry) {
    const type = (entry.type || 'INFO').toUpperCase()
    const time = fmtTime(entry.time || entry.timestamp || Date.now())
    const msg  = escHtml(entry.msg || entry.message || '')

    return `
      <div class="log-entry" data-type="${type}">
        <span class="log-time">${time}</span>
        <span class="log-type ${type}">${type}</span>
        <span class="log-msg">${msg}</span>
      </div>
    `
  }

  function addLogEntry(entry) {
    if (!_stream) return

    // Remove empty state se presente
    const empty = _stream.querySelector('.empty-state')
    if (empty) empty.remove()

    const type = (entry.type || 'INFO').toUpperCase()
    const msg  = (entry.msg || entry.message || '').toLowerCase()

    // Filtro ativo
    if (_filterType !== 'ALL' && type !== _filterType) return
    if (_filterText && !msg.includes(_filterText.toLowerCase())) return

    const div = document.createElement('div')
    div.className = 'log-entry'
    div.dataset.type = type
    div.innerHTML = `
      <span class="log-time">${fmtTime(entry.time || entry.timestamp || Date.now())}</span>
      <span class="log-type ${type}">${type}</span>
      <span class="log-msg">${escHtml(entry.msg || entry.message || '')}</span>
    `
    _stream.appendChild(div)

    // Limita a 500 entradas no DOM
    const entries = _stream.querySelectorAll('.log-entry')
    if (entries.length > 500) entries[0].remove()

    if (_autoScroll) scrollBottom()

    // Atualiza contador
    updateCount()
  }

  function scrollBottom() {
    if (_stream) _stream.scrollTop = _stream.scrollHeight
  }

  function updateCount() {
    const el = document.getElementById('logCount')
    if (el) {
      const count = _stream?.querySelectorAll('.log-entry').length || 0
      el.textContent = `${count} ${count === 1 ? 'log' : 'logs'}`
    }
  }

  function applyFilter() {
    if (!_stream) return

    const all = App.state.logs || []
    _stream.innerHTML = ''

    const filtered = all.filter(entry => {
      const type = (entry.type || 'INFO').toUpperCase()
      const msg  = (entry.msg || entry.message || '').toLowerCase()
      if (_filterType !== 'ALL' && type !== _filterType) return false
      if (_filterText && !msg.includes(_filterText.toLowerCase())) return false
      return true
    })

    if (!filtered.length) {
      _stream.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <p>Nenhum log corresponde ao filtro</p>
        </div>
      `
      return
    }

    filtered.slice(-300).forEach(entry => {
      const type = (entry.type || 'INFO').toUpperCase()
      const div = document.createElement('div')
      div.className = 'log-entry'
      div.dataset.type = type
      div.innerHTML = `
        <span class="log-time">${fmtTime(entry.time || entry.timestamp || Date.now())}</span>
        <span class="log-type ${type}">${type}</span>
        <span class="log-msg">${escHtml(entry.msg || entry.message || '')}</span>
      `
      _stream.appendChild(div)
    })

    if (_autoScroll) scrollBottom()
    updateCount()
  }

  function bindEvents() {
    // Auto-scroll toggle
    document.getElementById('scrollToggle')?.addEventListener('click', (e) => {
      _autoScroll = !_autoScroll
      e.target.textContent = `📌 Auto-scroll: ${_autoScroll ? 'ON' : 'OFF'}`
      if (_autoScroll) scrollBottom()
    })

    // Limpar
    document.getElementById('clearLogsBtn')?.addEventListener('click', () => {
      if (!_stream) return
      App.state.logs = []
      _stream.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          <p>Log limpo</p>
        </div>
      `
      updateCount()
    })

    // Copiar logs
    document.getElementById('copyLogsBtn')?.addEventListener('click', () => {
      const lines = Array.from(_stream?.querySelectorAll('.log-entry') || [])
        .map(el => el.textContent.trim())
        .join('\n')
      navigator.clipboard?.writeText(lines).then(() => toastSuccess('Copiado!', 'Logs copiados para a área de transferência'))
    })

    // Filtro de texto
    let _debounce
    document.getElementById('logSearch')?.addEventListener('input', (e) => {
      clearTimeout(_debounce)
      _debounce = setTimeout(() => {
        _filterText = e.target.value.trim()
        applyFilter()
      }, 200)
    })

    // Filtro de tipo
    document.getElementById('logTypeFilter')?.addEventListener('change', (e) => {
      _filterType = e.target.value
      applyFilter()
    })

    // Scroll manual desativa auto-scroll
    _stream?.addEventListener('scroll', () => {
      const nearBottom = _stream.scrollHeight - _stream.scrollTop - _stream.clientHeight < 40
      _autoScroll = nearBottom
      const btn = document.getElementById('scrollToggle')
      if (btn) btn.textContent = `📌 Auto-scroll: ${_autoScroll ? 'ON' : 'OFF'}`
    })
  }

  function onLog(entry) {
    App.state.logs.push(entry)
    addLogEntry(entry)
  }

  function onSocketInit({ logs }) {
    if (!_stream || !logs?.length) return
    _stream.innerHTML = ''
    logs.forEach(addLogEntry)
    scrollBottom()
  }

  function cleanup() {
    _stream = null
    _filterType = 'ALL'
    _filterText = ''
    _autoScroll = true
  }

  return { render, onLog, onSocketInit, cleanup }
})()
