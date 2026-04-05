/**
 * components/Groups.js
 * Gerenciamento de grupos: dados, allowlist, bannedlist, broadcast
 *
 * Endpoints:
 *   GET  /api/groups                  → todos os grupos com dados
 *   GET  /api/groups/banned           → grupos banidos
 *   POST /api/groups/ban              → banir grupo
 *   DELETE /api/groups/ban/:jid       → desbanir
 *   GET  /api/allowedgroups           → whitelist
 *   POST /api/allowedgroups/toggle    → toggle groupRestriction
 *   POST /api/allowedgroups           → adicionar à whitelist
 *   DELETE /api/allowedgroups/:jid    → remover da whitelist
 *   POST /api/groups/broadcast        → broadcast
 *   GET  /api/stats/groups            → stats por grupo
 */
const PageGroups = (() => {

  async function render(container) {
    container.innerHTML = `
      <div class="tabs">
        <button class="tab-btn active" data-tab="gall">Todos os Grupos</button>
        <button class="tab-btn" data-tab="gallow">Whitelist</button>
        <button class="tab-btn" data-tab="gbanned">Banidos</button>
        <button class="tab-btn" data-tab="gbroadcast">Broadcast</button>
      </div>
      <div class="tab-panel active" id="tab-gall"></div>
      <div class="tab-panel" id="tab-gallow"></div>
      <div class="tab-panel" id="tab-gbanned"></div>
      <div class="tab-panel" id="tab-gbroadcast"></div>
    `

    setupTabs(container)
    await loadTab('gall')
  }

  function setupTabs(container) {
    container.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'))
        container.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'))
        btn.classList.add('active')
        container.querySelector(`#tab-${btn.dataset.tab}`)?.classList.add('active')
        await loadTab(btn.dataset.tab)
      })
    })
  }

  async function loadTab(name) {
    const el = document.getElementById(`tab-${name}`)
    if (!el || el.dataset.loaded) return
    el.dataset.loaded = '1'
    const loaders = { gall: loadAll, gallow: loadAllow, gbanned: loadBanned, gbroadcast: loadBroadcast }
    await loaders[name]?.(el)
  }

  /* ── Todos os grupos ─────────────────────────────────── */
  async function loadAll(el) {
    el.innerHTML = `<div class="loading"><div class="spinner"></div></div>`
    try {
      const [groups, stats] = await Promise.all([
        GET('/api/groups'),
        GET('/api/stats/groups').catch(() => []),
      ])

      const statsMap = {}
      ;(Array.isArray(stats) ? stats : []).forEach(g => { statsMap[g.jid] = g })

      const entries = Object.entries(groups)

      if (!entries.length) {
        el.innerHTML = `<div class="empty-state">${ICONS.users}<h3>Nenhum grupo registrado</h3><p>O bot ainda não foi adicionado a nenhum grupo</p></div>`
        return
      }

      el.innerHTML = `
        <div class="filter-bar">
          <input class="form-input" id="groupSearch" placeholder="🔍 Buscar grupos...">
          <span style="font-size:0.8rem;color:var(--text-muted)">${entries.length} grupos</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px" id="groupsList">
          ${entries.map(([jid, data]) => groupItem(jid, data, statsMap[jid])).join('')}
        </div>
      `

      // Busca
      document.getElementById('groupSearch')?.addEventListener('input', e => {
        const q = e.target.value.toLowerCase()
        document.querySelectorAll('#groupsList .group-item').forEach(row => {
          row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none'
        })
      })

      // Banir grupos
      el.querySelectorAll('[data-ban-group]').forEach(btn => {
        btn.addEventListener('click', async () => {
          const jid = btn.dataset.banGroup
          if (!confirm(`Banir grupo ${jid}?\nO bot irá ignorar mensagens deste grupo.`)) return
          try {
            await POST('/api/groups/ban', { jid })
            toastSuccess('Grupo banido!')
            const tab = document.getElementById('tab-gall')
            tab.removeAttribute('data-loaded')
            await loadAll(tab)
          } catch (e) { toastError('Erro', e.message) }
        })
      })
    } catch (e) { toastError('Erro', e.message) }
  }

  function groupItem(jid, data, stats) {
    const nome = data.nome || data.subject || jid.split('@')[0]
    const memberCount = data.members || stats?.members || '—'
    return `
      <div class="group-item">
        <div class="group-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg></div>
        <div style="flex:1;min-width:0">
          <div class="group-name">${escHtml(nome)}</div>
          <div class="group-jid">${jid}</div>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          ${data.antilink ? `<span class="badge badge-orange">anti-link</span>` : ''}
          ${stats?.msgs ? `<span style="font-size:0.75rem;color:var(--text-muted)">${stats.msgs} msgs</span>` : ''}
        </div>
        <div class="group-actions">
          <button class="btn-icon" data-ban-group="${escHtml(jid)}" title="Banir grupo" style="color:var(--red)">${ICONS.shield}</button>
        </div>
      </div>
    `
  }

  /* ── Whitelist (groupRestriction) ────────────────────── */
  async function loadAllow(el) {
    el.innerHTML = `<div class="loading"><div class="spinner"></div></div>`
    try {
      const { enabled, groups } = await GET('/api/allowedgroups')

      el.innerHTML = `
        <div class="card" style="margin-bottom:16px">
          <div class="card-header">
            <span class="card-title">${ICONS.shield} Restrição de Grupos</span>
          </div>
          <p style="margin-bottom:12px;font-size:0.85rem">Quando ativado, o bot só responde nos grupos da whitelist abaixo.</p>
          <label class="toggle-wrap">
            <label class="toggle">
              <input type="checkbox" id="restrictToggle" ${enabled ? 'checked' : ''}>
              <span class="toggle-track"></span>
            </label>
            <span class="toggle-label" id="restrictLabel">${enabled ? 'Restrição ATIVA' : 'Restrição desativada'}</span>
          </label>
        </div>

        <div class="section-header" style="margin-bottom:12px">
          <span class="section-title">Grupos na whitelist (${groups.length})</span>
          <button class="btn btn-primary btn-sm" id="addAllowBtn">${ICONS.plus} Adicionar</button>
        </div>

        <div id="allowList" style="display:flex;flex-direction:column;gap:8px">
          ${groups.length ? groups.map(g => `
            <div class="group-item">
              <div class="group-icon">${ICONS.users}</div>
              <div style="flex:1">
                <div class="group-name">${escHtml(g.nome || g.jid)}</div>
                <div class="group-jid">${g.jid}</div>
              </div>
              <button class="btn-icon" data-rm-allow="${escHtml(g.jid)}" style="color:var(--red)">${ICONS.trash}</button>
            </div>
          `).join('') : `<div class="empty-state">${ICONS.shield}<p>Nenhum grupo na whitelist</p></div>`}
        </div>
      `

      document.getElementById('restrictToggle')?.addEventListener('change', async e => {
        try {
          await POST('/api/allowedgroups/toggle', { enabled: e.target.checked })
          document.getElementById('restrictLabel').textContent = e.target.checked ? 'Restrição ATIVA' : 'Restrição desativada'
          toastSuccess(`Restrição ${e.target.checked ? 'ativada' : 'desativada'}`)
        } catch (err) { toastError('Erro', err.message) }
      })

      el.querySelectorAll('[data-rm-allow]').forEach(btn => {
        btn.addEventListener('click', async () => {
          try {
            await DELETE(`/api/allowedgroups/${encodeURIComponent(btn.dataset.rmAllow)}`)
            toastSuccess('Removido!')
            const tab = document.getElementById('tab-gallow')
            tab.removeAttribute('data-loaded')
            await loadAllow(tab)
          } catch (e) { toastError('Erro', e.message) }
        })
      })

      document.getElementById('addAllowBtn')?.addEventListener('click', () => {
        const { el: mel, close } = createModal({
          title: 'Adicionar à Whitelist',
          icon: ICONS.shield,
          body: `
            <div style="display:flex;flex-direction:column;gap:12px">
              <div class="form-group">
                <label class="form-label">JID do grupo *</label>
                <input class="form-input" id="allowJid" placeholder="120363xxx@g.us">
              </div>
              <div class="form-group">
                <label class="form-label">Nome (opcional)</label>
                <input class="form-input" id="allowNome" placeholder="Grupo dos Amigos">
              </div>
            </div>
          `,
          footer: `<button class="btn btn-secondary" id="alClose">Cancelar</button><button class="btn btn-primary" id="alSave">${ICONS.save} Salvar</button>`
        })
        mel.querySelector('#alClose')?.addEventListener('click', close)
        mel.querySelector('#alSave')?.addEventListener('click', async () => {
          const jid  = mel.querySelector('#allowJid')?.value.trim()
          const nome = mel.querySelector('#allowNome')?.value.trim()
          if (!jid) return toastWarning('Informe o JID')
          try {
            await POST('/api/allowedgroups', { jid, nome })
            toastSuccess('Adicionado!')
            close()
            const tab = document.getElementById('tab-gallow')
            tab.removeAttribute('data-loaded')
            await loadAllow(tab)
          } catch (e) { toastError('Erro', e.message) }
        })
      })
    } catch (e) { toastError('Erro', e.message) }
  }

  /* ── Banidos ────────────────────────────────────────── */
  async function loadBanned(el) {
    el.innerHTML = `<div class="loading"><div class="spinner"></div></div>`
    try {
      const list = await GET('/api/groups/banned')

      if (!list.length) {
        el.innerHTML = `<div class="empty-state">${ICONS.shield}<h3>Nenhum grupo banido</h3></div>`
        return
      }

      el.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:8px">
          ${list.map(g => `
            <div class="group-item">
              <div class="group-icon" style="background:var(--red-dim);color:var(--red)">${ICONS.shield}</div>
              <div style="flex:1">
                <div class="group-name">${escHtml(g.nome || g.jid)}</div>
                <div class="group-jid">${g.jid}</div>
              </div>
              <span style="font-size:0.75rem;color:var(--text-muted)">${g.bannedAt ? fmtDate(g.bannedAt) : '—'}</span>
              <button class="btn btn-sm btn-secondary" data-unban="${escHtml(g.jid)}">Desbanir</button>
            </div>
          `).join('')}
        </div>
      `

      el.querySelectorAll('[data-unban]').forEach(btn => {
        btn.addEventListener('click', async () => {
          try {
            await DELETE(`/api/groups/ban/${encodeURIComponent(btn.dataset.unban)}`)
            toastSuccess('Grupo desbanido!')
            const tab = document.getElementById('tab-gbanned')
            tab.removeAttribute('data-loaded')
            await loadBanned(tab)
          } catch (e) { toastError('Erro', e.message) }
        })
      })
    } catch (e) { toastError('Erro', e.message) }
  }

  /* ── Broadcast ──────────────────────────────────────── */
  async function loadBroadcast(el) {
    el.innerHTML = `
      <div class="card">
        <div class="card-header">
          <span class="card-title">${ICONS.msg} Broadcast para Todos os Grupos</span>
        </div>
        <div class="alert alert-warning" style="margin-bottom:14px">
          ${ICONS.warn}
          <div>Isso enviará uma mensagem para <strong>todos os grupos</strong> onde o bot está. Use com cuidado.</div>
        </div>
        <div class="form-group" style="margin-bottom:12px">
          <label class="form-label">Mensagem</label>
          <textarea class="form-textarea" id="broadcastText" rows="4" placeholder="Digite a mensagem..."></textarea>
        </div>
        <button class="btn btn-danger" id="broadcastSend">${ICONS.msg} Enviar para todos os grupos</button>
        <div id="broadcastResult" style="margin-top:12px"></div>
      </div>
    `

    document.getElementById('broadcastSend')?.addEventListener('click', async () => {
      const text = document.getElementById('broadcastText')?.value.trim()
      if (!text) return toastWarning('Escreva uma mensagem')
      if (!confirm(`Confirma o envio para TODOS os grupos?`)) return

      const btn = document.getElementById('broadcastSend')
      btn.disabled = true
      btn.textContent = 'Enviando...'

      try {
        const r = await POST('/api/groups/broadcast', { text })
        document.getElementById('broadcastResult').innerHTML =
          `<div class="alert alert-success">${ICONS.check} <div>Enviado para ${r.sent} grupos!</div></div>`
        document.getElementById('broadcastText').value = ''
      } catch (e) {
        document.getElementById('broadcastResult').innerHTML =
          `<div class="alert alert-danger">${ICONS.x} <div>${escHtml(e.message)}</div></div>`
      } finally {
        btn.disabled = false
        btn.innerHTML = `${ICONS.msg} Enviar para todos os grupos`
      }
    })
  }

  function cleanup() {
    document.querySelectorAll('.tab-panel').forEach(p => p.removeAttribute('data-loaded'))
  }

  return { render, cleanup }
})()
