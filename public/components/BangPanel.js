/**
 * components/BangPanel.js — Painel Bang (⚡ Ações Rápidas)
 *
 * Funcionalidades:
 *  - Banir/desbanir usuários pelo número
 *  - Lista de usuários banidos com desbanir rápido
 *  - Banir/desbanir grupos pelo JID
 *  - Envio rápido de mensagem para qualquer JID
 *  - Execução rápida de comando via bot
 *  - Histórico de ações da sessão
 *
 * Endpoints:
 *   GET  /api/users/banned          → lista de usuários banidos
 *   POST /api/users/ban             → banir usuário
 *   DELETE /api/users/ban/:num      → desbanir usuário
 *   GET  /api/groups/banned         → lista de grupos banidos
 *   POST /api/groups/ban            → banir grupo
 *   DELETE /api/groups/ban/:jid     → desbanir grupo
 *   POST /api/send                  → enviar mensagem rápida
 *   POST /api/quick/exec            → executar comando via bot
 */
const PageBangPanel = (() => {
  const _history = []  // histórico de ações da sessão

  async function render(container) {
    container.innerHTML = `
      <!-- Barra de ação rápida tipo command palette -->
      <div class="card" style="margin-bottom:20px;border-color:var(--accent);background:var(--card)">
        <div style="display:flex;align-items:center;gap:10px">
          <span style="font-size:1.4rem;line-height:1">⚡</span>
          <div style="flex:1">
            <div style="font-size:0.72rem;color:var(--text-dim);font-family:var(--font-mono);margin-bottom:4px">
              BANG — Ação Rápida
            </div>
            <input class="form-input" id="bangInput" autocomplete="off" spellcheck="false"
              placeholder="ban 5511999 motivo | unban 5511999 | send 5511@s.whatsapp.net mensagem | exec @g.us !ping"
              style="border:none;background:transparent;padding:0;font-family:var(--font-mono);font-size:0.9rem">
          </div>
          <button class="btn btn-primary" id="bangExec">Executar ⏎</button>
        </div>
        <div style="margin-top:8px;font-size:0.72rem;color:var(--text-dim);display:flex;gap:16px;flex-wrap:wrap">
          <span><code style="color:var(--accent)">ban NÚMERO</code> — banir usuário</span>
          <span><code style="color:var(--accent)">unban NÚMERO</code> — desbanir</span>
          <span><code style="color:var(--accent)">send JID mensagem</code> — enviar msg</span>
          <span><code style="color:var(--accent)">exec JID !cmd</code> — executar cmd</span>
          <span><code style="color:var(--accent)">bangroup JID</code> — banir grupo</span>
        </div>
      </div>

      <!-- Grid principal -->
      <div class="grid-2" style="gap:16px;margin-bottom:16px">
        <!-- Banir usuário manual -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="width:15px;height:15px;color:var(--red)">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                <line x1="2" y1="2" x2="22" y2="22" stroke="var(--red)"/>
              </svg>
              Banir Usuário
            </span>
          </div>
          <div style="display:flex;flex-direction:column;gap:10px">
            <div class="form-group">
              <label class="form-label">Número (DDD + número, sem @)</label>
              <input class="form-input" id="banNum" placeholder="5511999999999" inputmode="numeric">
            </div>
            <div class="form-group">
              <label class="form-label">Motivo (opcional)</label>
              <input class="form-input" id="banMotivo" placeholder="Spam, comportamento inadequado...">
            </div>
            <button class="btn btn-danger" id="doBanUser">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              Banir usuário
            </button>
          </div>
        </div>

        <!-- Banir grupo -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="width:15px;height:15px;color:var(--orange)">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <line x1="4" y1="4" x2="20" y2="20" stroke="var(--orange)"/>
              </svg>
              Banir Grupo
            </span>
          </div>
          <div style="display:flex;flex-direction:column;gap:10px">
            <div class="form-group">
              <label class="form-label">JID do grupo</label>
              <input class="form-input" id="banGrpJid" placeholder="120363xxxxxxxx@g.us">
            </div>
            <div class="form-group">
              <label class="form-label">Nome (opcional)</label>
              <input class="form-input" id="banGrpNome" placeholder="Nome do grupo">
            </div>
            <button class="btn btn-danger" id="doBanGroup">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              Banir grupo
            </button>
          </div>
        </div>
      </div>

      <!-- Envio rápido + exec -->
      <div class="grid-2" style="gap:16px;margin-bottom:16px">
        <div class="card">
          <div class="card-header">
            <span class="card-title">${ICONS.msg} Envio Rápido</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:10px">
            <div class="form-group">
              <label class="form-label">JID destino</label>
              <input class="form-input" id="qs_jid" placeholder="5511999@s.whatsapp.net ou @g.us">
            </div>
            <div class="form-group">
              <label class="form-label">Mensagem</label>
              <textarea class="form-textarea" id="qs_msg" rows="3" placeholder="Digite a mensagem..."></textarea>
            </div>
            <button class="btn btn-primary" id="doQuickSend">${ICONS.msg} Enviar</button>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <span class="card-title">${ICONS.zap} Executar Comando</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:10px">
            <div class="form-group">
              <label class="form-label">JID onde executar</label>
              <input class="form-input" id="qe_jid" placeholder="JID do grupo ou privado">
            </div>
            <div class="form-group">
              <label class="form-label">Comando (com prefixo)</label>
              <input class="form-input mono" id="qe_cmd" placeholder="!ping | !menu | !ia olá">
            </div>
            <button class="btn btn-secondary" id="doQuickExec">${ICONS.zap} Executar</button>
          </div>
        </div>
      </div>

      <!-- Histórico de ações -->
      <div class="card" style="margin-bottom:16px">
        <div class="card-header">
          <span class="card-title">${ICONS.clock} Histórico da Sessão</span>
          <button class="btn btn-sm btn-ghost" id="clearHistory">Limpar</button>
        </div>
        <div id="bangHistory" style="font-family:var(--font-mono);font-size:0.78rem;min-height:60px;max-height:160px;overflow-y:auto">
          <div style="color:var(--text-dim);padding:12px 0">Nenhuma ação executada ainda nesta sessão.</div>
        </div>
      </div>

      <!-- Listas de banidos -->
      <div class="grid-2" style="gap:16px">
        <!-- Usuários banidos -->
        <div class="card">
          <div class="card-header">
            <span class="card-title" style="color:var(--red)">🚫 Usuários Banidos</span>
            <button class="btn btn-sm btn-secondary" id="rfBannedUsers">${ICONS.reload}</button>
          </div>
          <div id="bannedUsersList"><div class="loading"><div class="spinner"></div></div></div>
        </div>

        <!-- Grupos banidos -->
        <div class="card">
          <div class="card-header">
            <span class="card-title" style="color:var(--orange)">🔒 Grupos Banidos</span>
            <button class="btn btn-sm btn-secondary" id="rfBannedGroups">${ICONS.reload}</button>
          </div>
          <div id="bannedGroupsList"><div class="loading"><div class="spinner"></div></div></div>
        </div>
      </div>
    `

    bindEvents()
    await Promise.all([ loadBannedUsers(), loadBannedGroups() ])
  }

  /* ── Bang Input (command palette) ──────────────────────── */
  function parseBangCommand(raw) {
    const parts = raw.trim().split(/\s+/)
    const cmd   = parts[0]?.toLowerCase()
    const rest  = parts.slice(1)

    if (cmd === 'ban' && rest[0]) {
      return { action: 'ban-user', num: rest[0], motivo: rest.slice(1).join(' ') || 'via bang panel' }
    }
    if (cmd === 'unban' && rest[0]) {
      return { action: 'unban-user', num: rest[0] }
    }
    if (cmd === 'bangroup' && rest[0]) {
      return { action: 'ban-group', jid: rest[0], nome: rest.slice(1).join(' ') }
    }
    if (cmd === 'unbangroup' && rest[0]) {
      return { action: 'unban-group', jid: rest[0] }
    }
    if (cmd === 'send' && rest.length >= 2) {
      return { action: 'send', jid: rest[0], text: rest.slice(1).join(' ') }
    }
    if (cmd === 'exec' && rest.length >= 2) {
      return { action: 'exec', jid: rest[0], command: rest.slice(1).join(' ') }
    }
    return null
  }

  async function execBang(raw) {
    const parsed = parseBangCommand(raw)
    if (!parsed) {
      logHistory('❓', raw, 'Comando não reconhecido', 'warn')
      toastWarning('Comando não reconhecido', 'Use: ban NÚMERO | unban NÚMERO | send JID msg | exec JID !cmd')
      return
    }

    try {
      switch (parsed.action) {
        case 'ban-user':
          await POST('/api/users/ban', { num: parsed.num, motivo: parsed.motivo })
          logHistory('🚫', `ban ${parsed.num}`, parsed.motivo, 'ok')
          toastSuccess(`Usuário ${parsed.num} banido`)
          await loadBannedUsers()
          break

        case 'unban-user':
          await DELETE(`/api/users/ban/${encodeURIComponent(parsed.num)}`)
          logHistory('✅', `unban ${parsed.num}`, 'Desbanido', 'ok')
          toastSuccess(`Usuário ${parsed.num} desbanido`)
          await loadBannedUsers()
          break

        case 'ban-group':
          await POST('/api/groups/ban', { jid: parsed.jid, nome: parsed.nome })
          logHistory('🔒', `bangroup ${parsed.jid}`, parsed.nome||'', 'ok')
          toastSuccess('Grupo banido')
          await loadBannedGroups()
          break

        case 'unban-group':
          await DELETE(`/api/groups/ban/${encodeURIComponent(parsed.jid)}`)
          logHistory('🔓', `unbangroup ${parsed.jid}`, 'Desbanido', 'ok')
          toastSuccess('Grupo desbanido')
          await loadBannedGroups()
          break

        case 'send':
          await POST('/api/send', { jid: parsed.jid, text: parsed.text })
          logHistory('💬', `send → ${parsed.jid}`, parsed.text.slice(0, 40), 'ok')
          toastSuccess('Mensagem enviada')
          break

        case 'exec':
          const r = await POST('/api/quick/exec', { jid: parsed.jid, command: parsed.command })
          logHistory('⚡', `exec → ${parsed.jid}`, r.sent || parsed.command, 'ok')
          toastSuccess('Comando executado', r.sent)
          break
      }
    } catch (e) {
      logHistory('❌', parsed.action, e.message, 'err')
      toastError('Erro', e.message)
    }
  }

  function logHistory(icon, action, detail, type) {
    const time  = new Date().toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit', second:'2-digit' })
    const entry = { icon, action, detail, type, time }
    _history.unshift(entry)
    if (_history.length > 50) _history.pop()
    renderHistory()
  }

  function renderHistory() {
    const el = document.getElementById('bangHistory')
    if (!el) return
    if (!_history.length) {
      el.innerHTML = `<div style="color:var(--text-dim);padding:12px 0">Nenhuma ação executada ainda.</div>`
      return
    }
    el.innerHTML = _history.map(e => `
      <div style="display:flex;gap:8px;padding:4px 0;border-bottom:1px solid var(--border-soft);align-items:baseline">
        <span style="color:var(--text-dim);font-size:0.7rem;flex-shrink:0">${e.time}</span>
        <span>${e.icon}</span>
        <span style="color:${e.type==='err'?'var(--red)':e.type==='warn'?'var(--orange)':'var(--accent)'}">
          ${escHtml(e.action)}
        </span>
        <span style="color:var(--text-muted);font-size:0.72rem">${escHtml(e.detail||'')}</span>
      </div>
    `).join('')
  }

  /* ── Usuários Banidos ───────────────────────────────────── */
  async function loadBannedUsers() {
    const el = document.getElementById('bannedUsersList')
    if (!el) return
    try {
      const list = await GET('/api/users/banned')
      if (!list.length) {
        el.innerHTML = `<div class="empty-state" style="padding:24px">${ICONS.shield}<p>Nenhum usuário banido</p></div>`
        return
      }
      el.innerHTML = list.map(u => `
        <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border-soft)">
          <div class="user-avatar" style="background:var(--red-dim);color:var(--red);width:32px;height:32px;font-size:0.75rem">
            ${(u.num||'??').slice(-2)}
          </div>
          <div style="flex:1;min-width:0">
            <div style="font-family:var(--font-mono);font-size:0.82rem">${escHtml(u.num)}</div>
            <div style="font-size:0.72rem;color:var(--text-dim)">${escHtml(u.label||'sem motivo')}</div>
          </div>
          <button class="btn btn-sm btn-secondary" data-unban-u="${escHtml(u.num)}">Desbanir</button>
        </div>
      `).join('')

      el.querySelectorAll('[data-unban-u]').forEach(btn => {
        btn.addEventListener('click', async () => {
          try {
            await DELETE(`/api/users/ban/${encodeURIComponent(btn.dataset.unbanU)}`)
            logHistory('✅', `unban ${btn.dataset.unbanU}`, 'Desbanido via lista', 'ok')
            toastSuccess(`${btn.dataset.unbanU} desbanido`)
            await loadBannedUsers()
          } catch(e){ toastError('Erro', e.message) }
        })
      })
    } catch(e){ toastError('Erro', e.message) }
  }

  /* ── Grupos Banidos ─────────────────────────────────────── */
  async function loadBannedGroups() {
    const el = document.getElementById('bannedGroupsList')
    if (!el) return
    try {
      const list = await GET('/api/groups/banned')
      if (!list.length) {
        el.innerHTML = `<div class="empty-state" style="padding:24px">${ICONS.shield}<p>Nenhum grupo banido</p></div>`
        return
      }
      el.innerHTML = list.map(g => `
        <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border-soft)">
          <div style="width:32px;height:32px;border-radius:8px;background:var(--orange-dim);color:var(--orange);
                      display:flex;align-items:center;justify-content:center;font-size:0.75rem;flex-shrink:0">
            🔒
          </div>
          <div style="flex:1;min-width:0">
            <div style="font-size:0.85rem;font-weight:600">${escHtml(g.nome||g.jid)}</div>
            <div style="font-family:var(--font-mono);font-size:0.68rem;color:var(--text-dim)">
              ${escHtml(g.jid)}
            </div>
          </div>
          <button class="btn btn-sm btn-secondary" data-unban-g="${escHtml(g.jid)}">Desbanir</button>
        </div>
      `).join('')

      el.querySelectorAll('[data-unban-g]').forEach(btn => {
        btn.addEventListener('click', async () => {
          try {
            await DELETE(`/api/groups/ban/${encodeURIComponent(btn.dataset.unbanG)}`)
            logHistory('🔓', `unbangroup ${btn.dataset.unbanG}`, '', 'ok')
            toastSuccess('Grupo desbanido')
            await loadBannedGroups()
          } catch(e){ toastError('Erro', e.message) }
        })
      })
    } catch(e){ toastError('Erro', e.message) }
  }

  /* ── Bind eventos ─────────────────────────────────────── */
  function bindEvents() {
    // Bang input
    const input = document.getElementById('bangInput')
    document.getElementById('bangExec')?.addEventListener('click', async () => {
      const val = input?.value.trim()
      if (!val) return
      await execBang(val)
      if (input) input.value = ''
    })
    input?.addEventListener('keydown', e => {
      if (e.key === 'Enter') document.getElementById('bangExec')?.click()
    })

    // Banir usuário
    document.getElementById('doBanUser')?.addEventListener('click', async () => {
      const num    = document.getElementById('banNum')?.value.trim().replace(/\D/g,'')
      const motivo = document.getElementById('banMotivo')?.value.trim() || 'via painel'
      if (!num || num.length < 10) return toastWarning('Número inválido (mínimo 10 dígitos)')
      try {
        await POST('/api/users/ban', { num, motivo })
        logHistory('🚫', `ban ${num}`, motivo, 'ok')
        toastSuccess(`${num} banido!`)
        document.getElementById('banNum').value = ''
        document.getElementById('banMotivo').value = ''
        await loadBannedUsers()
      } catch(e){ toastError('Erro', e.message) }
    })

    // Banir grupo
    document.getElementById('doBanGroup')?.addEventListener('click', async () => {
      const jid  = document.getElementById('banGrpJid')?.value.trim()
      const nome = document.getElementById('banGrpNome')?.value.trim()
      if (!jid) return toastWarning('Informe o JID do grupo')
      try {
        await POST('/api/groups/ban', { jid, nome })
        logHistory('🔒', `bangroup ${jid}`, nome||'', 'ok')
        toastSuccess('Grupo banido!')
        document.getElementById('banGrpJid').value = ''
        document.getElementById('banGrpNome').value = ''
        await loadBannedGroups()
      } catch(e){ toastError('Erro', e.message) }
    })

    // Envio rápido
    document.getElementById('doQuickSend')?.addEventListener('click', async () => {
      const jid  = document.getElementById('qs_jid')?.value.trim()
      const text = document.getElementById('qs_msg')?.value.trim()
      if (!jid || !text) return toastWarning('Preencha JID e mensagem')
      try {
        await POST('/api/send', { jid, text })
        logHistory('💬', `send → ${jid}`, text.slice(0,40), 'ok')
        toastSuccess('Mensagem enviada!')
        document.getElementById('qs_msg').value = ''
      } catch(e){ toastError('Erro', e.message) }
    })

    // Executar comando
    document.getElementById('doQuickExec')?.addEventListener('click', async () => {
      const jid     = document.getElementById('qe_jid')?.value.trim()
      const command = document.getElementById('qe_cmd')?.value.trim()
      if (!jid || !command) return toastWarning('Preencha JID e comando')
      try {
        const r = await POST('/api/quick/exec', { jid, command })
        logHistory('⚡', `exec → ${jid}`, r.sent||command, 'ok')
        toastSuccess('Executado!', r.sent||command)
      } catch(e){ toastError('Erro', e.message) }
    })

    // Refresh listas
    document.getElementById('rfBannedUsers')?.addEventListener('click', loadBannedUsers)
    document.getElementById('rfBannedGroups')?.addEventListener('click', loadBannedGroups)

    // Limpar histórico
    document.getElementById('clearHistory')?.addEventListener('click', () => {
      _history.length = 0
      renderHistory()
    })
  }

  function cleanup() {}
  return { render, cleanup }
})()
