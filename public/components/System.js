/**
 * components/System.js
 * Sistema: terminal, npm, GitHub, recursos, pairing, limpeza auth
 *
 * Endpoints:
 *   POST /api/exec              → executar shell
 *   POST /api/npm               → instalar pacote npm
 *   GET  /api/github/status     → status do git
 *   POST /api/github/pull       → git pull
 *   POST /api/github/push       → git push
 *   GET  /api/system/usage      → CPU/RAM
 *   POST /api/pairing           → solicitar pairing code
 *   POST /api/clean-auth        → limpar auth
 *   POST /api/plugins/install   → instalar plugin via URL
 */
const PageSystem = (() => {
  let _refreshTimer = null

  async function render(container) {
    container.innerHTML = `
      <div class="tabs">
        <button class="tab-btn active" data-tab="sys-monitor">Monitor</button>
        <button class="tab-btn" data-tab="sys-terminal">Terminal</button>
        <button class="tab-btn" data-tab="sys-github">GitHub</button>
        <button class="tab-btn" data-tab="sys-connect">Conexão</button>
        <button class="tab-btn" data-tab="sys-plugins">Plugins</button>
      </div>
      <div class="tab-panel active" id="tab-sys-monitor"></div>
      <div class="tab-panel" id="tab-sys-terminal"></div>
      <div class="tab-panel" id="tab-sys-github"></div>
      <div class="tab-panel" id="tab-sys-connect"></div>
      <div class="tab-panel" id="tab-sys-plugins"></div>
    `

    setupTabs(container)
    await loadMonitor()
  }

  function setupTabs(container) {
    const loaders = {
      'sys-monitor':  loadMonitor,
      'sys-terminal': loadTerminal,
      'sys-github':   loadGithub,
      'sys-connect':  loadConnect,
      'sys-plugins':  loadPlugins,
    }

    container.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'))
        container.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'))
        btn.classList.add('active')
        container.querySelector(`#tab-${btn.dataset.tab}`)?.classList.add('active')

        if (_refreshTimer) { clearInterval(_refreshTimer); _refreshTimer = null }

        await loaders[btn.dataset.tab]?.()
      })
    })
  }

  /* ══════════════════════════════════════════════════════
     MONITOR
     ══════════════════════════════════════════════════════ */
  async function loadMonitor() {
    const el = document.getElementById('tab-sys-monitor')
    if (!el) return

    el.innerHTML = `
      <div class="grid-2" style="gap:16px;margin-bottom:16px" id="sysCards">
        <div class="loading"><div class="spinner"></div></div>
      </div>
      <div class="card">
        <div class="card-header">
          <span class="card-title">${ICONS.cpu} Histórico (atualiza a cada 10s)</span>
          <button class="btn btn-sm btn-secondary" id="refreshSysBtn">${ICONS.reload} Atualizar</button>
        </div>
        <div id="sysDetails"><div class="loading"><div class="spinner"></div></div></div>
      </div>
    `

    document.getElementById('refreshSysBtn')?.addEventListener('click', refreshMonitor)
    await refreshMonitor()
    _refreshTimer = setInterval(refreshMonitor, 10000)
  }

  async function refreshMonitor() {
    try {
      const [sys, status] = await Promise.all([
        GET('/api/system/usage'),
        GET('/api/status'),
      ])
      renderSysCards(sys, status)
      renderSysDetails(sys, status)
    } catch (e) {
      if (e.message !== 'Unauthorized') toastError('Erro', e.message)
    }
  }

  function renderSysCards(sys, status) {
    const el = document.getElementById('sysCards')
    if (!el) return

    const ram = sys.ram || {}
    const ramPct = parseFloat(ram.percent || 0)
    const heapUsed = status.mem?.heapUsed || 0
    const heapTotal = status.mem?.heapTotal || 1

    el.innerHTML = `
      <div class="card">
        <div class="card-header">
          <span class="card-title">${ICONS.mem} RAM do Sistema</span>
          <span class="badge ${ramPct > 80 ? 'badge-red' : ramPct > 60 ? 'badge-orange' : 'badge-green'}">${ramPct}%</span>
        </div>
        <div style="margin-bottom:8px">
          ${progressBar(ramPct, ramPct>80?'red':ramPct>60?'orange':'')}
        </div>
        <div style="display:flex;justify-content:space-between;font-size:0.8rem;color:var(--text-muted)">
          <span>Usado: ${fmtBytes(ram.used||0)}</span>
          <span>Total: ${fmtBytes(ram.total||0)}</span>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <span class="card-title">${ICONS.cpu} Heap Node.js</span>
          <span class="badge badge-blue">${fmtBytes(heapUsed)}</span>
        </div>
        <div style="margin-bottom:8px">
          ${progressBar((heapUsed/heapTotal)*100, 'blue')}
        </div>
        <div style="display:flex;justify-content:space-between;font-size:0.8rem;color:var(--text-muted)">
          <span>Heap usado: ${fmtBytes(heapUsed)}</span>
          <span>Heap total: ${fmtBytes(heapTotal)}</span>
        </div>
      </div>
    `
  }

  function renderSysDetails(sys, status) {
    const el = document.getElementById('sysDetails')
    if (!el) return

    const cpu   = sys.cpu || [0,0,0]
    const upBot = status.uptime || '—'
    const upSys = formatUptime(sys.uptime || 0)

    el.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px">
        ${sysRow('CPU Load 1m',  cpu[0].toFixed(3))}
        ${sysRow('CPU Load 5m',  cpu[1].toFixed(3))}
        ${sysRow('CPU Load 15m', cpu[2].toFixed(3))}
        ${sysRow('Uptime Bot',   upBot)}
        ${sysRow('Uptime Sistema', upSys)}
        ${sysRow('Plataforma',   sys.platform || '—')}
        ${sysRow('RSS Processo', fmtBytes(status.mem?.rss || 0))}
        ${sysRow('Memória Externa', fmtBytes(status.mem?.external || 0))}
      </div>
    `
  }

  function sysRow(label, val) {
    return `
      <div style="display:flex;flex-direction:column;padding:10px;background:var(--bg);border-radius:var(--radius-sm);border:1px solid var(--border-soft)">
        <span style="font-size:0.72rem;color:var(--text-dim);margin-bottom:4px">${label}</span>
        <span style="font-family:var(--font-mono);font-size:0.9rem">${val}</span>
      </div>
    `
  }

  function formatUptime(secs) {
    const d = Math.floor(secs / 86400)
    const h = Math.floor((secs % 86400) / 3600)
    const m = Math.floor((secs % 3600) / 60)
    return `${d}d ${h}h ${m}m`
  }

  /* ══════════════════════════════════════════════════════
     TERMINAL
     ══════════════════════════════════════════════════════ */
  function loadTerminal() {
    const el = document.getElementById('tab-sys-terminal')
    if (!el || el.dataset.loaded) return
    el.dataset.loaded = '1'

    el.innerHTML = `
      <div class="card" style="margin-bottom:16px">
        <div class="card-header">
          <span class="card-title">${ICONS.term} Terminal do Servidor</span>
          <span class="badge badge-orange">Cuidado</span>
        </div>
        <div class="alert alert-warning" style="margin-bottom:12px">
          ${ICONS.warn}
          <div>Os comandos são executados no servidor com as permissões do processo Node.js.</div>
        </div>
        <div class="terminal" id="termOutput">
          <div class="terminal-line">
            <span class="terminal-prompt">kaius@server:~$</span>
            <span class="terminal-output">Terminal pronto.</span>
          </div>
        </div>
        <div class="form-row" style="margin-top:12px">
          <div class="form-group">
            <input class="form-input mono" id="termInput" placeholder="ls -la / git status / node --version" autocomplete="off" spellcheck="false">
          </div>
          <div class="form-group" style="flex:0 0 auto;justify-content:flex-end">
            <label class="form-label">&nbsp;</label>
            <button class="btn btn-secondary" id="termRun">${ICONS.term} Executar</button>
          </div>
        </div>
      </div>

      <!-- NPM -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">${ICONS.pkg} Instalar Pacote npm</span>
        </div>
        <div class="form-row">
          <div class="form-group">
            <input class="form-input" id="npmPkg" placeholder="axios, lodash, node-fetch...">
          </div>
          <div class="form-group" style="flex:0 0 auto;justify-content:flex-end">
            <label class="form-label">&nbsp;</label>
            <button class="btn btn-secondary" id="npmInstall">${ICONS.pkg} Instalar</button>
          </div>
        </div>
        <div id="npmResult" style="display:none;margin-top:10px"></div>
      </div>
    `

    const term    = document.getElementById('termOutput')
    const input   = document.getElementById('termInput')
    const history = []
    let histIdx   = -1

    function appendLine(text, isErr = false) {
      const line = document.createElement('div')
      line.className = 'terminal-line'
      line.innerHTML = `<span class="terminal-output ${isErr ? 'error' : ''}">${escHtml(text)}</span>`
      term.appendChild(line)
      term.scrollTop = term.scrollHeight
    }

    async function runCmd() {
      const cmd = input.value.trim()
      if (!cmd) return

      history.unshift(cmd)
      histIdx = -1

      const promptLine = document.createElement('div')
      promptLine.className = 'terminal-line'
      promptLine.innerHTML = `<span class="terminal-prompt">kaius@server:~$</span><span class="terminal-output"> ${escHtml(cmd)}</span>`
      term.appendChild(promptLine)
      term.scrollTop = term.scrollHeight

      input.value = ''

      try {
        const r = await POST('/api/exec', { cmd })
        if (r.stdout) r.stdout.split('\n').forEach(l => l && appendLine(l))
        if (r.stderr) r.stderr.split('\n').forEach(l => l && appendLine(l, true))
        if (!r.ok && r.error) appendLine(`Erro: ${r.error}`, true)
      } catch (e) { appendLine(`Erro: ${e.message}`, true) }
    }

    document.getElementById('termRun')?.addEventListener('click', runCmd)
    input?.addEventListener('keydown', e => {
      if (e.key === 'Enter') { runCmd(); return }
      if (e.key === 'ArrowUp') {
        histIdx = Math.min(histIdx+1, history.length-1)
        input.value = history[histIdx] || ''
      }
      if (e.key === 'ArrowDown') {
        histIdx = Math.max(histIdx-1, -1)
        input.value = histIdx >= 0 ? history[histIdx] : ''
      }
    })

    // NPM
    document.getElementById('npmInstall')?.addEventListener('click', async () => {
      const pkg = document.getElementById('npmPkg')?.value.trim()
      if (!pkg) return toastWarning('Informe o nome do pacote')
      const res = document.getElementById('npmResult')
      res.style.display = 'block'
      res.innerHTML = `<div class="loading"><div class="spinner"></div> Instalando ${escHtml(pkg)}...</div>`
      try {
        const r = await POST('/api/npm', { pkg })
        res.innerHTML = `<div class="alert alert-success">${ICONS.check} <div>Instalado com sucesso!<br><code>${escHtml(r.stdout?.slice(0,300)||'')}</code></div></div>`
        toastSuccess(`${pkg} instalado!`)
      } catch (e) {
        res.innerHTML = `<div class="alert alert-danger">${ICONS.x} <div>${escHtml(e.message)}</div></div>`
      }
    })
  }

  /* ══════════════════════════════════════════════════════
     GITHUB
     ══════════════════════════════════════════════════════ */
  async function loadGithub() {
    const el = document.getElementById('tab-sys-github')
    if (!el || el.dataset.loaded) return
    el.dataset.loaded = '1'

    el.innerHTML = `
      <div class="card" style="margin-bottom:16px">
        <div class="card-header">
          <span class="card-title">${ICONS.git} Status do Git</span>
          <button class="btn btn-sm btn-secondary" id="refreshGitBtn">${ICONS.reload} Atualizar</button>
        </div>
        <div id="gitStatus"><div class="loading"><div class="spinner"></div></div></div>
      </div>

      <div class="grid-2" style="gap:16px">
        <div class="card">
          <div class="card-header"><span class="card-title">${ICONS.git} Git Pull</span></div>
          <p style="font-size:0.85rem;margin-bottom:12px">Baixa atualizações do repositório remoto e recarrega os comandos.</p>
          <button class="btn btn-primary" id="gitPullBtn">${ICONS.git} Pull</button>
          <div id="pullResult" style="margin-top:10px"></div>
        </div>

        <div class="card">
          <div class="card-header"><span class="card-title">${ICONS.git} Git Push</span></div>
          <p style="font-size:0.85rem;margin-bottom:12px">Envia as alterações locais para o repositório remoto.</p>
          <button class="btn btn-secondary" id="gitPushBtn">${ICONS.git} Push</button>
          <div id="pushResult" style="margin-top:10px"></div>
        </div>
      </div>
    `

    await loadGitStatus()

    document.getElementById('refreshGitBtn')?.addEventListener('click', loadGitStatus)

    document.getElementById('gitPullBtn')?.addEventListener('click', async () => {
      const btn = document.getElementById('gitPullBtn')
      const res = document.getElementById('pullResult')
      btn.disabled = true; btn.textContent = '⏳ Fazendo pull...'
      res.innerHTML = ''
      try {
        const r = await POST('/api/github/pull')
        res.innerHTML = r.ok
          ? `<div class="alert alert-success">${ICONS.check} <div>${escHtml(r.message || 'Pull realizado!')}</div></div>`
          : `<div class="alert alert-warning">${ICONS.warn} <div>${escHtml(r.reason||'Sem alterações')}</div></div>`
        toastSuccess('Pull concluído!')
        await loadGitStatus()
      } catch (e) {
        res.innerHTML = `<div class="alert alert-danger">${ICONS.x} <div>${escHtml(e.message)}</div></div>`
      } finally { btn.disabled = false; btn.innerHTML = `${ICONS.git} Pull` }
    })

    document.getElementById('gitPushBtn')?.addEventListener('click', async () => {
      const btn = document.getElementById('gitPushBtn')
      const res = document.getElementById('pushResult')
      if (!confirm('Confirma o push para o repositório remoto?')) return
      btn.disabled = true; btn.textContent = '⏳ Fazendo push...'
      try {
        const r = await POST('/api/github/push')
        res.innerHTML = r.ok
          ? `<div class="alert alert-success">${ICONS.check} <div>Push realizado!</div></div>`
          : `<div class="alert alert-danger">${ICONS.x} <div>${escHtml(r.error||r.reason||'Falhou')}</div></div>`
        toastSuccess('Push concluído!')
      } catch (e) {
        res.innerHTML = `<div class="alert alert-danger">${ICONS.x} <div>${escHtml(e.message)}</div></div>`
      } finally { btn.disabled = false; btn.innerHTML = `${ICONS.git} Push` }
    })
  }

  async function loadGitStatus() {
    const el = document.getElementById('gitStatus')
    if (!el) return
    try {
      const r = await GET('/api/github/status')
      el.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:8px;font-family:var(--font-mono);font-size:0.82rem">
          ${r.branch    ? `<div><span style="color:var(--text-muted)">Branch:</span> <span style="color:var(--accent)">${escHtml(r.branch)}</span></div>` : ''}
          ${r.ahead     ? `<div><span style="color:var(--text-muted)">Commits à frente:</span> ${r.ahead}</div>` : ''}
          ${r.behind    ? `<div><span style="color:var(--text-muted)">Commits atrás:</span> ${r.behind}</div>` : ''}
          ${r.status    ? `<div style="white-space:pre-wrap;color:var(--text-muted)">${escHtml(r.status)}</div>` : ''}
          ${r.error     ? `<div style="color:var(--red)">${escHtml(r.error)}</div>` : ''}
          ${!r.branch && !r.error ? `<div style="color:var(--text-dim)">Git não configurado ou sem repositório remoto</div>` : ''}
        </div>
      `
    } catch (e) {
      el.innerHTML = `<div style="color:var(--text-muted);font-size:0.85rem">Não foi possível obter status do git</div>`
    }
  }

  /* ══════════════════════════════════════════════════════
     CONEXÃO (Pairing + Auth)
     ══════════════════════════════════════════════════════ */
  function loadConnect() {
    const el = document.getElementById('tab-sys-connect')
    if (!el || el.dataset.loaded) return
    el.dataset.loaded = '1'

    el.innerHTML = `
      <div class="grid-2" style="gap:16px;margin-bottom:16px">
        <!-- Pairing Code -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">${ICONS.power} Pairing Code</span>
          </div>
          <p style="font-size:0.85rem;margin-bottom:14px">Conectar o bot ao WhatsApp via código de pareamento (sem QR code).</p>
          <div class="form-group" style="margin-bottom:12px">
            <label class="form-label">Número de telefone</label>
            <input class="form-input" id="pairingPhone" placeholder="5511999999999">
            <span class="form-hint">Sem + ou espaços. Apenas números.</span>
          </div>
          <button class="btn btn-primary" id="pairingBtn">${ICONS.power} Gerar Código</button>
          <div id="pairingResult" style="margin-top:12px"></div>
        </div>

        <!-- Limpar auth -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">${ICONS.trash} Limpeza de Sessão</span>
          </div>
          <p style="font-size:0.85rem;margin-bottom:14px">Remove arquivos de cache da sessão sem desconectar (ou reseta completamente).</p>
          <div style="display:flex;flex-direction:column;gap:8px">
            <button class="btn btn-secondary" id="cleanCacheBtn">${ICONS.trash} Limpeza Inteligente (mantém sessão)</button>
            <button class="btn btn-danger" id="cleanFullBtn">${ICONS.x} Reset Completo (perde sessão)</button>
          </div>
          <div id="cleanResult" style="margin-top:12px"></div>
        </div>
      </div>

      <!-- Status da conexão -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">${ICONS.bot} Status da Conexão</span>
        </div>
        <div id="connStatus">
          <div style="display:flex;align-items:center;gap:10px">
            <span class="status-dot ${App.state.botOnline ? 'online' : 'offline'}"></span>
            <span>${App.state.botOnline ? `Online — ${App.state.botNome}` : 'Offline / Desconectado'}</span>
          </div>
          ${App.state.botNumero ? `<div style="font-family:var(--font-mono);font-size:0.8rem;color:var(--text-muted);margin-top:6px">${App.state.botNumero}</div>` : ''}
        </div>
      </div>
    `

    // Pairing
    document.getElementById('pairingBtn')?.addEventListener('click', async () => {
      const phone = document.getElementById('pairingPhone')?.value.trim().replace(/\D/g,'')
      if (!phone || phone.length < 10) return toastWarning('Número inválido')
      const btn = document.getElementById('pairingBtn')
      const res = document.getElementById('pairingResult')
      btn.disabled = true
      try {
        await POST('/api/pairing', { phone })
        res.innerHTML = `
          <div class="alert alert-info">${ICONS.info}
            <div>Solicitação enviada! Aguarde o código aparecer no terminal ou aqui em breve...</div>
          </div>
        `
        toastInfo('Código solicitado', 'Veja o terminal do servidor')
      } catch (e) {
        res.innerHTML = `<div class="alert alert-danger">${ICONS.x} <div>${escHtml(e.message)}</div></div>`
      } finally { btn.disabled = false }
    })

    // Limpeza
    const cleanBtn = async (mode) => {
      if (mode === 'full' && !confirm('ATENÇÃO: Isso apagará a sessão inteira. O bot precisará de um novo pareamento!')) return
      const res = document.getElementById('cleanResult')
      res.innerHTML = `<div class="loading"><div class="spinner"></div> Limpando...</div>`
      try {
        const r = await POST('/api/clean-auth', { mode })
        res.innerHTML = r.ok
          ? `<div class="alert alert-success">${ICONS.check} <div>${escHtml(r.message)}</div></div>`
          : `<div class="alert alert-danger">${ICONS.x} <div>${escHtml(r.error||'Erro')}</div></div>`
        if (r.ok) toastSuccess('Limpeza concluída!')
      } catch (e) {
        res.innerHTML = `<div class="alert alert-danger">${ICONS.x} <div>${escHtml(e.message)}</div></div>`
      }
    }

    document.getElementById('cleanCacheBtn')?.addEventListener('click', () => cleanBtn('cache'))
    document.getElementById('cleanFullBtn')?.addEventListener('click',  () => cleanBtn('full'))
  }

  /* ══════════════════════════════════════════════════════
     PLUGINS
     ══════════════════════════════════════════════════════ */
  function loadPlugins() {
    const el = document.getElementById('tab-sys-plugins')
    if (!el || el.dataset.loaded) return
    el.dataset.loaded = '1'

    el.innerHTML = `
      <div class="card">
        <div class="card-header">
          <span class="card-title">${ICONS.pkg} Instalar Plugin via URL</span>
        </div>
        <div class="alert alert-warning" style="margin-bottom:14px">
          ${ICONS.warn}
          <div>Instale apenas plugins de fontes confiáveis. O código será executado no servidor.</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:12px">
          <div class="form-group">
            <label class="form-label">Nome do Comando *</label>
            <input class="form-input" id="plugName" placeholder="meucomando">
          </div>
          <div class="form-group">
            <label class="form-label">URL do Código (raw) *</label>
            <input class="form-input" id="plugUrl" placeholder="https://raw.githubusercontent.com/usuario/repo/main/meucomando.js">
          </div>
          <button class="btn btn-primary" id="plugInstall">${ICONS.pkg} Instalar Plugin</button>
          <div id="plugResult" style="display:none"></div>
        </div>
      </div>
    `

    document.getElementById('plugInstall')?.addEventListener('click', async () => {
      const name = document.getElementById('plugName')?.value.trim()
      const url  = document.getElementById('plugUrl')?.value.trim()
      if (!name || !url) return toastWarning('Preencha nome e URL')

      const btn = document.getElementById('plugInstall')
      const res = document.getElementById('plugResult')
      btn.disabled = true
      res.style.display = 'block'
      res.innerHTML = `<div class="loading"><div class="spinner"></div> Baixando e instalando...</div>`

      try {
        const r = await POST('/api/plugins/install', { name, url })
        if (r.ok) {
          res.innerHTML = `<div class="alert alert-success">${ICONS.check} <div>Plugin "${escHtml(name)}" instalado! Recarregue os comandos.</div></div>`
          toastSuccess('Plugin instalado!', 'Use o botão Reload no menu lateral')
        }
      } catch (e) {
        res.innerHTML = `<div class="alert alert-danger">${ICONS.x} <div>${escHtml(e.message)}</div></div>`
      } finally {
        btn.disabled = false
        btn.innerHTML = `${ICONS.pkg} Instalar Plugin`
      }
    })
  }

  function onPairingCode(data) {
    const res = document.getElementById('pairingResult')
    if (res) {
      res.innerHTML = `
        <div class="alert alert-success">${ICONS.check}
          <div>
            <strong>Código de Pareamento:</strong>
            <div style="font-family:var(--font-mono);font-size:1.4rem;letter-spacing:4px;margin-top:6px;color:var(--accent)">${escHtml(data.code || data)}</div>
            <p style="margin-top:4px;font-size:0.78rem">Vá em WhatsApp → Aparelhos Conectados → Conectar → Código de 8 dígitos</p>
          </div>
        </div>
      `
    }
  }

  function cleanup() {
    if (_refreshTimer) clearInterval(_refreshTimer)
    _refreshTimer = null
    document.querySelectorAll('.tab-panel').forEach(p => p.removeAttribute('data-loaded'))
  }

  return { render, onPairingCode, cleanup }
})()
