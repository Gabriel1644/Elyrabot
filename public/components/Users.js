/**
 * components/Users.js
 * Usuários: minions (todos que interagiram) e sub-donos
 *
 * Endpoints:
 *   GET  /api/minions              → lista paginada
 *   GET  /api/minions/stats        → stats gerais
 *   POST /api/minions/:num/ban     → banir
 *   POST /api/minions/:num/unban   → desbanir
 *   POST /api/minions/:num/promote → promover
 *   GET  /api/subdons              → sub-donos
 *   POST /api/subdons              → adicionar
 *   DELETE /api/subdons/:num       → remover
 */
const PageUsers = (() => {

  async function render(container) {
    container.innerHTML = `
      <div class="tabs">
        <button class="tab-btn active" data-tab="uminions">Usuários</button>
        <button class="tab-btn" data-tab="usubdons">Sub-Donos</button>
      </div>
      <div class="tab-panel active" id="tab-uminions"></div>
      <div class="tab-panel" id="tab-usubdons"></div>
    `

    setupTabs(container)
    await loadMinions()
  }

  function setupTabs(container) {
    container.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'))
        container.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'))
        btn.classList.add('active')
        container.querySelector(`#tab-${btn.dataset.tab}`)?.classList.add('active')
        if (btn.dataset.tab === 'uminions') await loadMinions()
        else await loadSubdons()
      })
    })
  }

  /* ── Minions ─────────────────────────────────────────── */
  let _minionFilter = 'all'
  let _minionPage   = 0

  async function loadMinions() {
    const el = document.getElementById('tab-uminions')
    if (!el) return

    el.innerHTML = `
      <div id="minionStats" style="margin-bottom:16px">
        <div class="loading"><div class="spinner"></div></div>
      </div>
      <div class="filter-bar">
        <select class="form-select" id="minionFilter" style="width:150px">
          <option value="all">Todos</option>
          <option value="active">Ativos</option>
          <option value="banned">Banidos</option>
          <option value="vip">VIP</option>
          <option value="subdono">Sub-Dono</option>
        </select>
        <span id="minionCount" style="font-size:0.8rem;color:var(--text-muted)">...</span>
      </div>
      <div id="minionGrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px">
        <div class="loading"><div class="spinner"></div></div>
      </div>
      <div id="minionPag" style="display:flex;gap:8px;justify-content:center;margin-top:16px"></div>
    `

    document.getElementById('minionFilter')?.addEventListener('change', e => {
      _minionFilter = e.target.value
      _minionPage   = 0
      refreshMinions()
    })

    try {
      const stats = await GET('/api/minions/stats')
      renderMinionStats(stats)
    } catch {}

    await refreshMinions()
  }

  function renderMinionStats(s) {
    const el = document.getElementById('minionStats')
    if (!el || !s) return
    el.innerHTML = `
      <div class="grid-4">
        <div class="stat-card">
          <div class="stat-icon blue">${ICONS.users}</div>
          <div class="stat-label">Total</div>
          <div class="stat-value">${s.total || 0}</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon green">${ICONS.zap}</div>
          <div class="stat-label">Ativos (7d)</div>
          <div class="stat-value">${s.active || 0}</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon red">${ICONS.shield}</div>
          <div class="stat-label">Banidos</div>
          <div class="stat-value">${s.banned || 0}</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon purple">${ICONS.star}</div>
          <div class="stat-label">VIP</div>
          <div class="stat-value">${s.vip || 0}</div>
        </div>
      </div>
    `
  }

  async function refreshMinions() {
    const grid = document.getElementById('minionGrid')
    const pag  = document.getElementById('minionPag')
    const cnt  = document.getElementById('minionCount')
    if (!grid) return

    grid.innerHTML = `<div class="loading" style="grid-column:1/-1"><div class="spinner"></div></div>`

    try {
      const data = await GET(`/api/minions?filter=${_minionFilter}&page=${_minionPage}`)
      const { minions = [], total = 0, pages = 1 } = data

      if (cnt) cnt.textContent = `${total} usuários`

      if (!minions.length) {
        grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">${ICONS.users}<h3>Nenhum usuário encontrado</h3></div>`
        return
      }

      grid.innerHTML = minions.map(m => minionCard(m)).join('')

      grid.querySelectorAll('[data-ban-minion]').forEach(btn => {
        btn.addEventListener('click', async () => {
          const num = btn.dataset.banMinion
          if (!confirm(`Banir usuário ${num}?`)) return
          try {
            await POST(`/api/minions/${encodeURIComponent(num)}/ban`, {})
            toastSuccess('Banido!')
            await refreshMinions()
          } catch (e) { toastError('Erro', e.message) }
        })
      })

      grid.querySelectorAll('[data-unban-minion]').forEach(btn => {
        btn.addEventListener('click', async () => {
          try {
            await POST(`/api/minions/${encodeURIComponent(btn.dataset.unbanMinion)}/unban`, {})
            toastSuccess('Desbanido!')
            await refreshMinions()
          } catch (e) { toastError('Erro', e.message) }
        })
      })

      grid.querySelectorAll('[data-promote-minion]').forEach(btn => {
        btn.addEventListener('click', () => openPromoteModal(btn.dataset.promoteMinion))
      })

      // Paginação
      if (pag) {
        pag.innerHTML = ''
        if (pages > 1) {
          for (let i = 0; i < pages; i++) {
            const b = document.createElement('button')
            b.className = `btn btn-sm ${i === _minionPage ? 'btn-primary' : 'btn-secondary'}`
            b.textContent = i + 1
            b.addEventListener('click', () => { _minionPage = i; refreshMinions() })
            pag.appendChild(b)
          }
        }
      }
    } catch (e) { toastError('Erro', e.message) }
  }

  function minionCard(m) {
    const num = m.num || m.id || '?'
    const banned = m.bloqueado || m.role === 99
    const isVip = m.role === 4
    const isSub = m.role === 2 || m.role === 3

    return `
      <div class="user-card">
        <div class="user-avatar">${num.slice(-2)}</div>
        <div class="user-info">
          <div class="user-name">${escHtml(m.nome || m.pushName || num)}</div>
          <div class="user-num">${num}</div>
          <div style="margin-top:4px">
            ${banned ? `<span class="badge badge-red">Banido</span>` : ''}
            ${isVip  ? `<span class="badge badge-purple">VIP</span>` : ''}
            ${isSub  ? `<span class="badge badge-blue">Sub-Dono</span>` : ''}
            ${m.msgs  ? `<span style="font-size:0.72rem;color:var(--text-muted)">${m.msgs} msgs</span>` : ''}
          </div>
        </div>
        <div class="user-actions">
          <button class="btn-icon" data-promote-minion="${escHtml(num)}" title="Promover">${ICONS.star}</button>
          ${banned
            ? `<button class="btn-icon" data-unban-minion="${escHtml(num)}" title="Desbanir" style="color:var(--accent)">${ICONS.check}</button>`
            : `<button class="btn-icon" data-ban-minion="${escHtml(num)}" title="Banir" style="color:var(--red)">${ICONS.shield}</button>`
          }
        </div>
      </div>
    `
  }

  function openPromoteModal(num) {
    const { el, close } = createModal({
      title: `Promover: ${num}`,
      icon: ICONS.star,
      body: `
        <div class="form-group">
          <label class="form-label">Nível</label>
          <select class="form-select" id="promoteRole">
            <option value="2">Sub-Dono (nível 2)</option>
            <option value="3">Admin Global (nível 3)</option>
            <option value="4">VIP (nível 4)</option>
            <option value="5">Usuário normal (nível 5)</option>
          </select>
        </div>
        <div class="form-group" style="margin-top:12px">
          <label class="form-label">Label (opcional)</label>
          <input class="form-input" id="promoteLabel" placeholder="Ex: Moderador">
        </div>
      `,
      footer: `
        <button class="btn btn-secondary" id="proClose">Cancelar</button>
        <button class="btn btn-primary" id="proSave">${ICONS.star} Aplicar</button>
      `
    })
    el.querySelector('#proClose')?.addEventListener('click', close)
    el.querySelector('#proSave')?.addEventListener('click', async () => {
      const role  = parseInt(el.querySelector('#promoteRole')?.value)
      const label = el.querySelector('#promoteLabel')?.value.trim()
      try {
        await POST(`/api/minions/${encodeURIComponent(num)}/promote`, { role, label })
        toastSuccess('Nível atualizado!')
        close()
        await refreshMinions()
      } catch (e) { toastError('Erro', e.message) }
    })
  }

  /* ── Sub-donos ───────────────────────────────────────── */
  async function loadSubdons() {
    const el = document.getElementById('tab-usubdons')
    if (!el || el.dataset.loaded) return
    el.dataset.loaded = '1'

    el.innerHTML = `
      <div class="section-header" style="margin-bottom:14px">
        <span class="section-title">${ICONS.shield} Sub-Donos e VIPs</span>
        <button class="btn btn-primary btn-sm" id="addSubdonBtn">${ICONS.plus} Adicionar</button>
      </div>
      <div id="subdonList"><div class="loading"><div class="spinner"></div></div></div>
    `

    document.getElementById('addSubdonBtn')?.addEventListener('click', openAddSubdonModal)
    await refreshSubdons()
  }

  async function refreshSubdons() {
    const el = document.getElementById('subdonList')
    if (!el) return

    try {
      const { items, roles } = await GET('/api/subdons')

      if (!items?.length) {
        el.innerHTML = `<div class="empty-state">${ICONS.shield}<h3>Nenhum sub-dono</h3></div>`
        return
      }

      el.innerHTML = items.map(s => `
        <div class="user-card" style="margin-bottom:8px">
          <div class="user-avatar" style="background:var(--purple-dim);color:var(--purple)">
            ${(s.num || '??').slice(-2)}
          </div>
          <div class="user-info">
            <div class="user-name">${escHtml(s.label || s.num)}</div>
            <div class="user-num">${s.num}</div>
          </div>
          <span class="badge badge-purple">${roles?.[s.role] || `Nível ${s.role}`}</span>
          <div class="user-actions">
            <button class="btn-icon" data-rm-sub="${escHtml(s.num)}" style="color:var(--red)">${ICONS.trash}</button>
          </div>
        </div>
      `).join('')

      el.querySelectorAll('[data-rm-sub]').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (!confirm(`Remover sub-dono ${btn.dataset.rmSub}?`)) return
          try {
            await DELETE(`/api/subdons/${encodeURIComponent(btn.dataset.rmSub)}`)
            toastSuccess('Removido!')
            await refreshSubdons()
          } catch (e) { toastError('Erro', e.message) }
        })
      })
    } catch (e) { toastError('Erro', e.message) }
  }

  function openAddSubdonModal() {
    const { el, close } = createModal({
      title: 'Adicionar Sub-Dono',
      icon: ICONS.shield,
      body: `
        <div style="display:flex;flex-direction:column;gap:12px">
          <div class="form-group">
            <label class="form-label">Número (sem @s.whatsapp.net) *</label>
            <input class="form-input" id="subNum" placeholder="5511999999999">
          </div>
          <div class="form-group">
            <label class="form-label">Nível</label>
            <select class="form-select" id="subRole">
              <option value="2">Sub-Dono (nível 2)</option>
              <option value="3">Admin Global (nível 3)</option>
              <option value="4">VIP (nível 4)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Label (opcional)</label>
            <input class="form-input" id="subLabel" placeholder="Ex: Moderador">
          </div>
        </div>
      `,
      footer: `
        <button class="btn btn-secondary" id="sdClose">Cancelar</button>
        <button class="btn btn-primary" id="sdSave">${ICONS.save} Adicionar</button>
      `
    })
    el.querySelector('#sdClose')?.addEventListener('click', close)
    el.querySelector('#sdSave')?.addEventListener('click', async () => {
      const num   = el.querySelector('#subNum')?.value.trim()
      const role  = parseInt(el.querySelector('#subRole')?.value)
      const label = el.querySelector('#subLabel')?.value.trim()
      if (!num) return toastWarning('Informe o número')
      try {
        await POST('/api/subdons', { num, role, label })
        toastSuccess('Sub-Dono adicionado!')
        close()
        await refreshSubdons()
      } catch (e) { toastError('Erro', e.message) }
    })
  }

  function cleanup() {
    document.querySelectorAll('.tab-panel').forEach(p => p.removeAttribute('data-loaded'))
    _minionFilter = 'all'
    _minionPage   = 0
  }

  return { render, cleanup }
})()
