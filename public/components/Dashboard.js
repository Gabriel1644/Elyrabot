/**
 * components/Dashboard.js
 * Página inicial: status, stats, gráfico, top comandos, ações rápidas
 */
const PageDashboard = (() => {
  let _refreshTimer = null

  async function render(container) {
    container.innerHTML = `
      <div class="section">
        <!-- Stats row -->
        <div class="grid-4" id="statsRow">
          ${statSkeleton(4)}
        </div>
      </div>

      <div class="grid-2" style="gap:16px;margin-bottom:24px">
        <!-- Gráfico 7 dias -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">
              ${ICONS.zap} Atividade (7 dias)
            </span>
            <div class="chart-legend">
              <div class="chart-legend-item">
                <div class="chart-legend-dot" style="background:var(--blue)"></div>Mensagens
              </div>
              <div class="chart-legend-item">
                <div class="chart-legend-dot" style="background:var(--accent)"></div>Comandos
              </div>
            </div>
          </div>
          <div id="chartWrap"><div class="loading"><div class="spinner"></div></div></div>
        </div>

        <!-- Top comandos -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">${ICONS.star} Top Comandos</span>
          </div>
          <div id="topCmds"><div class="loading"><div class="spinner"></div></div></div>
        </div>
      </div>

      <div class="grid-2" style="gap:16px;margin-bottom:24px">
        <!-- Status detalhado -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">${ICONS.bot} Status do Bot</span>
            <span id="dashUptime" class="uptime-badge">—</span>
          </div>
          <div id="botDetails"><div class="loading"><div class="spinner"></div></div></div>
        </div>

        <!-- Recursos do sistema -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">${ICONS.cpu} Sistema</span>
          </div>
          <div id="sysInfo"><div class="loading"><div class="spinner"></div></div></div>
        </div>
      </div>

      <!-- Ações rápidas -->
      <div class="section">
        <div class="section-header">
          <span class="section-title">${ICONS.zap} Ações Rápidas</span>
        </div>
        <div class="grid-4" id="quickActions">
          ${quickActionBtn('Recarregar Comandos', ICONS.reload, 'reload', 'green')}
          ${quickActionBtn('Ver Logs', ICONS.zap, 'logs', 'blue')}
          ${quickActionBtn('Gerenciar Comandos', ICONS.code, 'commands', 'purple')}
          ${quickActionBtn('Configurações', ICONS.ai, 'config', 'orange')}
        </div>
      </div>

      <!-- Enviar mensagem rápida -->
      <div class="card" style="margin-bottom:24px">
        <div class="card-header">
          <span class="card-title">${ICONS.msg} Enviar Mensagem</span>
        </div>
        <div class="form-row">
          <div class="form-group" style="flex:0 0 240px">
            <label class="form-label">JID (ex: 5511999@s.whatsapp.net)</label>
            <input class="form-input" id="sendJid" placeholder="5511999999999@s.whatsapp.net">
          </div>
          <div class="form-group">
            <label class="form-label">Mensagem</label>
            <input class="form-input" id="sendMsg" placeholder="Olá!">
          </div>
          <div class="form-group" style="flex:0 0 auto;justify-content:flex-end">
            <label class="form-label">&nbsp;</label>
            <button class="btn btn-primary" id="sendMsgBtn">
              ${ICONS.msg} Enviar
            </button>
          </div>
        </div>
      </div>
    `

    await loadData()
    bindEvents()

    // Auto-refresh a cada 30s
    _refreshTimer = setInterval(loadData, 30000)
  }

  function statSkeleton(n) {
    return Array(n).fill(0).map(() => `
      <div class="stat-card" style="opacity:0.4">
        <div class="stat-icon green">${ICONS.zap}</div>
        <div class="stat-label">Carregando...</div>
        <div class="stat-value" style="font-size:1.4rem">—</div>
      </div>
    `).join('')
  }

  function quickActionBtn(label, icon, page, color) {
    return `
      <button class="stat-card" style="cursor:pointer;text-align:left;border:none;background:var(--card)"
              data-quickaction="${page}">
        <div class="stat-icon ${color}">${icon}</div>
        <div class="stat-label" style="font-size:0.82rem;color:var(--text)">${label}</div>
      </button>
    `
  }

  async function loadData() {
    try {
      const [status, chart, sys] = await Promise.all([
        GET('/api/status'),
        GET('/api/stats/chart'),
        GET('/api/system/usage'),
      ])
      renderStats(status)
      renderChart(chart)
      renderTopCmds(status.topCmds || [])
      renderBotDetails(status)
      renderSysInfo(sys)
    } catch (e) {
      if (e.message !== 'Unauthorized') toastError('Erro ao carregar dados', e.message)
    }
  }

  function renderStats(s) {
    const el = document.getElementById('statsRow')
    if (!el) return
    el.innerHTML = `
      <div class="stat-card">
        <div class="stat-icon green">${ICONS.msg}</div>
        <div class="stat-label">Mensagens</div>
        <div class="stat-value">${(s.msgs || 0).toLocaleString('pt-BR')}</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon blue">${ICONS.code}</div>
        <div class="stat-label">Comandos Usados</div>
        <div class="stat-value">${(s.cmdsTotal || 0).toLocaleString('pt-BR')}</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon purple">${ICONS.users}</div>
        <div class="stat-label">Prefixo</div>
        <div class="stat-value" style="font-size:1.4rem">${escHtml(s.prefixo || '!')}</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon orange">${ICONS.cpu}</div>
        <div class="stat-label">Modelo IA</div>
        <div class="stat-value" style="font-size:0.8rem;margin-top:6px;font-family:var(--font-mono)">${escHtml((s.modelo||'').split('-').slice(0,2).join('-') || '—')}</div>
      </div>
    `
  }

  function renderChart(dias) {
    const el = document.getElementById('chartWrap')
    if (!el || !dias?.length) return

    const maxVal = Math.max(...dias.flatMap(d => [d.msgs || 0, d.cmds || 0]), 1)

    el.innerHTML = `
      <div class="chart-bars">
        ${dias.map(d => {
          const mh = Math.max(2, ((d.msgs || 0) / maxVal) * 140)
          const ch = Math.max(2, ((d.cmds || 0) / maxVal) * 140)
          return `
            <div class="chart-bar-group" title="${fmtDate(d.date)}: ${d.msgs||0} msgs, ${d.cmds||0} cmds">
              <div class="chart-bar msgs" style="height:${mh}px"></div>
              <div class="chart-bar cmds" style="height:${ch}px"></div>
            </div>
          `
        }).join('')}
      </div>
      <div class="chart-labels">
        ${dias.map(d => `<div class="chart-label">${fmtDate(d.date)}</div>`).join('')}
      </div>
    `
  }

  function renderTopCmds(top) {
    const el = document.getElementById('topCmds')
    if (!el) return

    if (!top.length) {
      el.innerHTML = `<div class="empty-state"><p>Nenhum comando executado ainda</p></div>`
      return
    }

    const max = top[0]?.[1] || 1
    el.innerHTML = top.map(([name, count], i) => `
      <div style="margin-bottom:10px">
        <div style="display:flex;justify-content:space-between;margin-bottom:4px">
          <span style="font-family:var(--font-mono);font-size:0.82rem;color:var(--accent)">${i+1}. ${escHtml(name)}</span>
          <span style="font-size:0.78rem;color:var(--text-muted)">${count}x</span>
        </div>
        ${progressBar((count/max)*100, i===0?'':'blue')}
      </div>
    `).join('')
  }

  function renderBotDetails(s) {
    const el = document.getElementById('botDetails')
    if (!el) return

    const up = document.getElementById('dashUptime')
    if (up) up.textContent = s.uptime || '—'

    el.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:10px">
        ${infoRow('Nome', escHtml(s.nome || '—'))}
        ${infoRow('Versão', escHtml(s.versao || '—'))}
        ${infoRow('Prefixo', `<code>${escHtml(s.prefixo || '!')}</code>`)}
        ${infoRow('Modelo IA', escHtml(s.modelo || '—'))}
        ${infoRow('RAM usada', fmtBytes(s.mem?.heapUsed || 0))}
        ${infoRow('Status', `<span class="badge ${App.state.botOnline ? 'badge-green' : 'badge-red'}">${App.state.botOnline ? '🟢 Online' : '🔴 Offline'}</span>`)}
      </div>
    `
  }

  function infoRow(label, val) {
    return `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--border-soft)">
        <span style="color:var(--text-muted);font-size:0.82rem">${label}</span>
        <span style="font-size:0.85rem">${val}</span>
      </div>
    `
  }

  function renderSysInfo(sys) {
    const el = document.getElementById('sysInfo')
    if (!el || !sys) return

    const ramPct = parseFloat(sys.ram?.percent || 0)

    el.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:14px">
        <div>
          <div style="display:flex;justify-content:space-between;margin-bottom:6px">
            <span style="color:var(--text-muted);font-size:0.82rem">${ICONS.mem} RAM</span>
            <span style="font-size:0.82rem">${fmtBytes(sys.ram?.used||0)} / ${fmtBytes(sys.ram?.total||0)} <span style="color:var(--text-dim)">(${ramPct}%)</span></span>
          </div>
          ${progressBar(ramPct, ramPct > 80 ? 'red' : ramPct > 60 ? 'orange' : '')}
        </div>
        ${infoRow('CPU Load (1m)', (sys.cpu?.[0] || 0).toFixed(2))}
        ${infoRow('Plataforma', escHtml(sys.platform || '—'))}
        ${infoRow('Uptime sistema', formatUptime(sys.uptime || 0))}
      </div>
    `
  }

  function formatUptime(secs) {
    const d = Math.floor(secs / 86400)
    const h = Math.floor((secs % 86400) / 3600)
    const m = Math.floor((secs % 3600) / 60)
    return `${d}d ${h}h ${m}m`
  }

  function bindEvents() {
    // Quick actions
    document.querySelectorAll('[data-quickaction]').forEach(btn => {
      btn.addEventListener('click', () => loadPage(btn.dataset.quickaction))
    })

    // Reload
    const reloadBtnDash = document.querySelector('[data-quickaction="reload"]')
    if (reloadBtnDash) {
      // O botão do sidebar já faz o reload, este navega para logs
    }

    // Enviar mensagem
    document.getElementById('sendMsgBtn')?.addEventListener('click', async () => {
      const jid  = document.getElementById('sendJid')?.value.trim()
      const text = document.getElementById('sendMsg')?.value.trim()
      if (!jid || !text) return toastWarning('Preencha JID e mensagem')
      try {
        await POST('/api/send', { jid, text })
        toastSuccess('Mensagem enviada!')
        document.getElementById('sendMsg').value = ''
      } catch (e) {
        toastError('Erro ao enviar', e.message)
      }
    })
  }

  function onStatus(data) {
    renderBotDetails(data)
  }

  function cleanup() {
    if (_refreshTimer) clearInterval(_refreshTimer)
    _refreshTimer = null
  }

  return { render, onStatus, cleanup }
})()
