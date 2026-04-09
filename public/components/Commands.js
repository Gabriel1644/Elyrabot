/**
 * components/Commands.js — v31
 * Gerenciamento de comandos + sistema de prioridade
 *
 * Endpoints:
 *   GET  /api/commands                   → lista ordenada por prioridade
 *   POST /api/commands/:name/toggle      → ativar/desativar
 *   GET  /api/commands/:name/source      → código fonte
 *   POST /api/commands/:name/source      → criar/salvar
 *   DELETE /api/commands/:name           → deletar
 *   PUT  /api/commands/:name/meta        → desc/usage/cooldown
 *   POST /api/commands/:name/aliases     → aliases dinâmicos
 *   POST /api/commands/:name/priority    → prioridade
 *   GET  /api/hooks                      → hooks com prioridade
 *   POST /api/hooks/priority             → alterar prioridade do hook
 *   POST /api/hooks/remove               → remover hook
 *   POST /api/reload                     → recarregar tudo
 *   POST /api/ai/generate-command        → gerar código com IA
 */
const PageCommands = (() => {
  let _cmds   = []
  let _filter = ''
  let _cat    = 'all'
  let _editor = null

  async function render(container) {
    container.innerHTML = `
      <div class="tabs">
        <button class="tab-btn active" data-tab="cmd-list">Comandos</button>
        <button class="tab-btn" data-tab="cmd-hooks">Hooks &amp; Prioridade</button>
      </div>
      <div class="tab-panel active" id="tab-cmd-list"></div>
      <div class="tab-panel" id="tab-cmd-hooks"></div>
    `
    setupTabs(container)
    await loadCommandsTab(document.getElementById('tab-cmd-list'))
  }

  function setupTabs(container) {
    container.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'))
        container.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'))
        btn.classList.add('active')
        const panel = container.querySelector(`#tab-${btn.dataset.tab}`)
        if (panel) panel.classList.add('active')
        if (btn.dataset.tab === 'cmd-list') await loadCommandsTab(panel)
        else await loadHooksTab(panel)
      })
    })
  }

  /* ── Aba Comandos ─────────────────────────────────────── */
  async function loadCommandsTab(el) {
    el.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:8px">
        <div class="filter-bar" style="flex:1;margin-bottom:0">
          <input class="form-input" id="cmdSearch" placeholder="🔍 Buscar..." style="max-width:260px">
          <select class="form-select" id="cmdCatFilter" style="width:130px">
            <option value="all">Todas</option>
            <option value="core">core</option>
            <option value="fun">fun</option>
            <option value="info">info</option>
            <option value="media">media</option>
            <option value="admin">admin</option>
            <option value="owner">owner</option>
            <option value="rpg">rpg</option>
            <option value="misc">misc</option>
          </select>
          <span id="cmdTotal" style="font-size:0.78rem;color:var(--text-muted);white-space:nowrap"></span>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-secondary btn-sm" id="reloadCmdsBtn">${ICONS.reload} Recarregar</button>
          <button class="btn btn-primary btn-sm" id="newCmdBtn">${ICONS.plus} Novo</button>
        </div>
      </div>
      <div class="cmd-grid" id="cmdGrid">
        <div class="loading" style="grid-column:1/-1"><div class="spinner"></div></div>
      </div>
    `
    await loadCommands()
    bindListEvents()
  }

  async function loadCommands() {
    try {
      _cmds = await GET('/api/commands')
      renderGrid()
    } catch (e) { toastError('Erro', e.message) }
  }

  function renderGrid() {
    const el = document.getElementById('cmdGrid')
    if (!el) return

    const q = _filter.toLowerCase()
    const filtered = _cmds.filter(c => {
      if (_cat !== 'all' && c.category !== _cat) return false
      if (q && !c.name.includes(q) && !(c.description||'').toLowerCase().includes(q)) return false
      return true
    })

    const tot = document.getElementById('cmdTotal')
    if (tot) tot.textContent = `${filtered.length}/${_cmds.length}`

    if (!filtered.length) {
      el.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
        ${ICONS.code}<h3>Nenhum comando</h3></div>`
      return
    }

    el.innerHTML = filtered.map(cmd => `
      <div class="cmd-card ${cmd.enabled===false?'disabled':''}" data-name="${escHtml(cmd.name)}">
        <div class="cmd-card-header">
          <span class="cmd-name">${escHtml(cmd.name)}</span>
          <label class="toggle" title="Ativar/Desativar">
            <input type="checkbox" class="cmd-toggle" data-name="${escHtml(cmd.name)}"
                   ${cmd.enabled!==false?'checked':''}>
            <span class="toggle-track"></span>
          </label>
        </div>
        <div class="cmd-desc">${escHtml(cmd.description||'Sem descrição')}</div>
        <div class="cmd-meta">
          ${cmdCategoryBadge(cmd.category)}
          ${cmd.cooldown?`<span class="badge badge-gray">${ICONS.clock} ${cmd.cooldown}s</span>`:''}
          ${(cmd.priority||0)>0?`<span class="badge badge-purple" title="Prioridade alta">⬆ P${cmd.priority}</span>`:''}
        </div>

        <!-- Controle de prioridade -->
        <div style="display:flex;align-items:center;gap:4px;margin-top:8px;padding-top:6px;border-top:1px solid var(--border-soft)">
          <span style="font-size:0.7rem;color:var(--text-dim);flex:1">Prioridade</span>
          <button class="btn-icon" data-pd="${escHtml(cmd.name)}" style="font-size:1rem;padding:2px 5px">−</button>
          <span class="pv" data-name="${escHtml(cmd.name)}"
            style="font-family:var(--font-mono);font-size:0.82rem;min-width:26px;text-align:center">
            ${cmd.priority||0}
          </span>
          <button class="btn-icon" data-pi="${escHtml(cmd.name)}" style="font-size:1rem;padding:2px 5px">+</button>
        </div>

        <div class="cmd-actions">
          <button class="btn btn-ghost btn-sm ce" data-name="${escHtml(cmd.name)}">${ICONS.code} Editar</button>
          <button class="btn btn-ghost btn-sm cm" data-name="${escHtml(cmd.name)}" title="Metadados">${ICONS.edit}</button>
          <button class="btn btn-ghost btn-sm cd" data-name="${escHtml(cmd.name)}"
                  style="color:var(--red)" title="Deletar"
                  ${['ping','menu','ia','reload'].includes(cmd.name)?'disabled':''}>${ICONS.trash}</button>
        </div>
      </div>
    `).join('')

    bindCardEvents()
  }

  function bindListEvents() {
    let _deb
    document.getElementById('cmdSearch')?.addEventListener('input', e => {
      clearTimeout(_deb)
      _deb = setTimeout(()=>{ _filter = e.target.value.trim(); renderGrid() }, 220)
    })
    document.getElementById('cmdCatFilter')?.addEventListener('change', e => {
      _cat = e.target.value; renderGrid()
    })
    document.getElementById('reloadCmdsBtn')?.addEventListener('click', async () => {
      const b = document.getElementById('reloadCmdsBtn')
      b.disabled = true
      try {
        const r = await POST('/api/reload')
        toastSuccess('Recarregado', `${r.total} comandos`)
        await loadCommands()
      } catch(e){ toastError('Erro',e.message) }
      finally { b.disabled = false }
    })
    document.getElementById('newCmdBtn')?.addEventListener('click', openNewCmdModal)
  }

  function bindCardEvents() {
    // Toggle
    document.querySelectorAll('.cmd-toggle').forEach(chk => {
      chk.addEventListener('change', async e => {
        const name = e.target.dataset.name
        const enabled = e.target.checked
        try {
          await POST(`/api/commands/${encodeURIComponent(name)}/toggle`, { enabled })
          const c = _cmds.find(x=>x.name===name); if(c) c.enabled=enabled
          e.target.closest('.cmd-card')?.classList.toggle('disabled', !enabled)
        } catch(err){ toastError('Erro',err.message); e.target.checked=!enabled }
      })
    })

    // Prioridade −
    document.querySelectorAll('[data-pd]').forEach(btn => {
      btn.addEventListener('click', () => changePriority(btn.dataset.pd, -1))
    })
    // Prioridade +
    document.querySelectorAll('[data-pi]').forEach(btn => {
      btn.addEventListener('click', () => changePriority(btn.dataset.pi, +1))
    })

    // Editar código
    document.querySelectorAll('.ce').forEach(btn => {
      btn.addEventListener('click', () => openEditor(btn.dataset.name))
    })
    // Metadados
    document.querySelectorAll('.cm').forEach(btn => {
      btn.addEventListener('click', () => openMetaModal(btn.dataset.name))
    })
    // Deletar
    document.querySelectorAll('.cd:not([disabled])').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!window.confirm(`Deletar "${btn.dataset.name}"? Irreversível.`)) return
        try {
          await DELETE(`/api/commands/${encodeURIComponent(btn.dataset.name)}`)
          _cmds = _cmds.filter(c=>c.name!==btn.dataset.name)
          toastSuccess('Deletado')
          renderGrid()
        } catch(e){ toastError('Erro',e.message) }
      })
    })
  }

  async function changePriority(name, delta) {
    const cmd = _cmds.find(c=>c.name===name)
    if (!cmd) return
    const newP = Math.max(0, (cmd.priority||0) + delta)
    try {
      await POST(`/api/commands/${encodeURIComponent(name)}/priority`, { priority: newP })
      cmd.priority = newP
      // Atualiza display inline
      document.querySelector(`.pv[data-name="${name}"]`).textContent = newP
      const meta = document.querySelector(`.cmd-card[data-name="${name}"] .cmd-meta`)
      const badge = meta?.querySelector('.badge-purple')
      if (newP > 0) {
        if (badge) badge.textContent = `⬆ P${newP}`
        else meta?.insertAdjacentHTML('beforeend', `<span class="badge badge-purple">⬆ P${newP}</span>`)
      } else { badge?.remove() }
    } catch(e){ toastError('Erro prioridade', e.message) }
  }

  /* ── Aba Hooks & Prioridade ─────────────────────────── */
  async function loadHooksTab(el) {
    if (!el || el.dataset.loaded) return
    el.dataset.loaded = '1'

    el.innerHTML = `
      <div class="alert alert-info" style="margin-bottom:16px">
        ${ICONS.info}
        <div>
          <strong>Sistema de Prioridade</strong> —
          Hooks: número <strong>menor</strong> = executa <strong>primeiro</strong>.
          Comandos: número <strong>maior</strong> = <strong>vence conflitos</strong> de nome/alias.
          Nenhum arquivo precisa ser editado.
        </div>
      </div>

      <div class="card" style="margin-bottom:16px">
        <div class="card-header">
          <span class="card-title">${ICONS.zap} Hooks — Ordem de Execução</span>
          <button class="btn btn-sm btn-secondary" id="rfHooks">${ICONS.reload} Atualizar</button>
        </div>
        <div id="hooksOrd"><div class="loading"><div class="spinner"></div></div></div>
      </div>

      <div class="card">
        <div class="card-header">
          <span class="card-title">${ICONS.code} Comandos com Prioridade Definida</span>
        </div>
        <div id="cmdPrioList"><div class="loading"><div class="spinner"></div></div></div>
      </div>
    `

    document.getElementById('rfHooks')?.addEventListener('click', () => {
      el.removeAttribute('data-loaded'); loadHooksTab(el)
    })

    await Promise.all([ renderHooksOrder(), renderCmdPriorities() ])
  }

  async function renderHooksOrder() {
    const el = document.getElementById('hooksOrd')
    if (!el) return
    try {
      const hooks = (await GET('/api/hooks')).sort((a,b)=>(a.priority||50)-(b.priority||50))
      if (!hooks.length) {
        el.innerHTML = `<div class="empty-state">${ICONS.zap}<p>Nenhum hook registrado</p></div>`
        return
      }
      el.innerHTML = `
        <div class="table-wrap">
          <table>
            <thead><tr>
              <th>Ordem</th><th>Nome</th><th>ID</th>
              <th style="width:180px">Prioridade (menor = 1º)</th><th>Ação</th>
            </tr></thead>
            <tbody>
              ${hooks.map((h,i) => `
                <tr>
                  <td style="font-family:var(--font-mono);color:var(--text-dim)">${i+1}</td>
                  <td><strong>${escHtml(h.name||h.id)}</strong></td>
                  <td><code style="font-size:0.72rem;color:var(--text-muted)">${escHtml(h.id)}</code></td>
                  <td>
                    <div style="display:flex;align-items:center;gap:6px">
                      <button class="btn-icon" style="font-size:0.95rem" data-hd="${escHtml(h.id)}" data-hv="${h.priority??50}">−</button>
                      <span id="hpv_${escHtml(h.id.replace(/[^a-z0-9]/gi,'_'))}"
                            style="font-family:var(--font-mono);min-width:32px;text-align:center;font-size:0.85rem">${h.priority??50}</span>
                      <button class="btn-icon" style="font-size:0.95rem" data-hi="${escHtml(h.id)}" data-hv="${h.priority??50}">+</button>
                    </div>
                  </td>
                  <td>
                    <button class="btn btn-danger btn-sm" data-rmh="${escHtml(h.id)}">${ICONS.trash} Remover</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `
      el.querySelectorAll('[data-hd],[data-hi]').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id    = btn.dataset.hd || btn.dataset.hi
          const delta = btn.dataset.hi ? +5 : -5
          const cur   = parseInt(btn.dataset.hv)||50
          const newP  = Math.max(1, cur+delta)
          try {
            await POST('/api/hooks/priority', { id, priority: newP })
            btn.dataset.hv = newP
            const key = id.replace(/[^a-z0-9]/gi,'_')
            const span = document.getElementById(`hpv_${key}`)
            if (span) span.textContent = newP
            // Atualiza irmão
            const sib = btn.parentElement?.querySelector(btn.dataset.hd?'[data-hi]':'[data-hd]')
            if (sib) sib.dataset.hv = newP
            toastSuccess('Prioridade atualizada', `P${newP}`)
          } catch(e){ toastError('Erro',e.message) }
        })
      })
      el.querySelectorAll('[data-rmh]').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (!window.confirm(`Remover hook "${btn.dataset.rmh}"?`)) return
          try {
            await POST('/api/hooks/remove', { id: btn.dataset.rmh })
            toastSuccess('Removido!')
            const tab = document.getElementById('tab-cmd-hooks')
            tab?.removeAttribute('data-loaded')
            await loadHooksTab(tab)
          } catch(e){ toastError('Erro',e.message) }
        })
      })
    } catch(e){ toastError('Erro hooks',e.message) }
  }

  async function renderCmdPriorities() {
    const el = document.getElementById('cmdPrioList')
    if (!el) return

    const cmds = _cmds.length ? _cmds : await GET('/api/commands').catch(()=>[])
    const withPrio = cmds.filter(c=>(c.priority||0)>0).sort((a,b)=>b.priority-a.priority)

    if (!withPrio.length) {
      el.innerHTML = `
        <div class="empty-state">
          ${ICONS.code}
          <h3>Nenhum comando com prioridade personalizada</h3>
          <p>Use os botões + e − em cada card para definir prioridade sem editar arquivos.</p>
        </div>`
      return
    }

    el.innerHTML = withPrio.map((c,i) => `
      <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border-soft)">
        <span style="font-family:var(--font-mono);color:var(--text-dim);width:20px">${i+1}</span>
        <code style="color:var(--accent);flex:1">${escHtml(c.name)}</code>
        ${cmdCategoryBadge(c.category)}
        <div style="display:flex;align-items:center;gap:4px">
          <button class="btn-icon" style="font-size:0.95rem" data-pd="${escHtml(c.name)}">−</button>
          <span class="pv" data-name="${escHtml(c.name)}"
                style="font-family:var(--font-mono);min-width:30px;text-align:center;color:var(--accent)">
            ${c.priority}
          </span>
          <button class="btn-icon" style="font-size:0.95rem" data-pi="${escHtml(c.name)}">+</button>
        </div>
      </div>
    `).join('')

    el.querySelectorAll('[data-pd],[data-pi]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const name = btn.dataset.pd || btn.dataset.pi
        await changePriority(name, btn.dataset.pi ? +1 : -1)
        const cmd = _cmds.find(c=>c.name===name)
        const span = el.querySelector(`.pv[data-name="${name}"]`)
        if (span && cmd) span.textContent = cmd.priority||0
        if (cmd && !(cmd.priority > 0)) await renderCmdPriorities()
      })
    })
  }

  /* ── Editor de Código ─────────────────────────────────── */
  async function openEditor(name) {
    let code = ''
    try {
      const src = await GET(`/api/commands/${encodeURIComponent(name)}/source`)
      code = src.source || src.code || ''
    } catch{}

    const cmd = _cmds.find(c=>c.name===name)||{}
    const { el, close } = createModal({
      title: `Editar: ${name}`, icon: ICONS.code, maxWidth: '820px',
      body: `<div id="cmEWrap"></div>`,
      footer: `
        <button class="btn btn-secondary" id="cmEClose">Cancelar</button>
        <button class="btn btn-primary" id="cmESave">${ICONS.save} Salvar</button>
      `
    })

    const wrap = el.querySelector('#cmEWrap')
    _editor = null
    if (window.CodeMirror) {
      _editor = CodeMirror(wrap, {
        value: code, mode: 'javascript', theme: 'dracula',
        lineNumbers: true, indentUnit: 2, tabSize: 2, autofocus: true,
      })
    } else {
      wrap.innerHTML = `<textarea id="fallTA"
        style="width:100%;height:360px;font-family:var(--font-mono);font-size:0.82rem;
               background:var(--bg);border:1px solid var(--border);color:var(--text);
               padding:10px;border-radius:6px">${escHtml(code)}</textarea>`
    }

    el.querySelector('#cmEClose')?.addEventListener('click', close)
    el.querySelector('#cmESave')?.addEventListener('click', async () => {
      const source = _editor ? _editor.getValue() : document.getElementById('fallTA')?.value
      if (!source?.trim()) return toastWarning('Código vazio')
      try {
        await POST(`/api/commands/${encodeURIComponent(name)}/source`,
          { source, category: cmd.category||'misc' })
        toastSuccess('Salvo!', `"${name}" atualizado`)
        close(); await loadCommands()
      } catch(e){ toastError('Erro',e.message) }
    })
  }

  /* ── Modal Metadados ──────────────────────────────────── */
  function openMetaModal(name) {
    const cmd = _cmds.find(c=>c.name===name); if(!cmd) return
    const { el, close } = createModal({
      title: `Metadados: ${name}`, icon: ICONS.edit,
      body: `
        <div style="display:flex;flex-direction:column;gap:12px">
          <div class="form-group">
            <label class="form-label">Descrição</label>
            <input class="form-input" id="mDesc" value="${escHtml(cmd.description||'')}">
          </div>
          <div class="form-group">
            <label class="form-label">Usage</label>
            <input class="form-input" id="mUsage" value="${escHtml(cmd.usage||'')}">
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Cooldown (s)</label>
              <input class="form-input" type="number" id="mCD" value="${cmd.cooldown||0}" min="0">
            </div>
            <div class="form-group">
              <label class="form-label">Prioridade</label>
              <input class="form-input" type="number" id="mPrio" value="${cmd.priority||0}" min="0">
              <span class="form-hint">0 = padrão | maior = vence conflitos</span>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Aliases dinâmicos (vírgula)</label>
            <input class="form-input" id="mAlias" value="${escHtml((cmd.aliases||[]).join(', '))}">
          </div>
        </div>
      `,
      footer: `
        <button class="btn btn-secondary" id="mClose">Cancelar</button>
        <button class="btn btn-primary" id="mSave">${ICONS.save} Salvar</button>
      `
    })
    el.querySelector('#mClose')?.addEventListener('click', close)
    el.querySelector('#mSave')?.addEventListener('click', async () => {
      const description = el.querySelector('#mDesc')?.value.trim()
      const usage       = el.querySelector('#mUsage')?.value.trim()
      const cooldown    = parseInt(el.querySelector('#mCD')?.value)||0
      const priority    = parseInt(el.querySelector('#mPrio')?.value)||0
      const aliases     = (el.querySelector('#mAlias')?.value||'').split(',').map(s=>s.trim()).filter(Boolean)
      try {
        await Promise.all([
          PUT(`/api/commands/${encodeURIComponent(name)}/meta`,  { description, usage, cooldown }),
          POST(`/api/commands/${encodeURIComponent(name)}/aliases`, { aliases }),
          POST(`/api/commands/${encodeURIComponent(name)}/priority`, { priority }),
        ])
        toastSuccess('Salvo!')
        close(); await loadCommands()
      } catch(e){ toastError('Erro',e.message) }
    })
  }

  /* ── Modal Novo Comando ───────────────────────────────── */
  function openNewCmdModal() {
    const { el, close } = createModal({
      title: 'Novo Comando', icon: ICONS.plus, maxWidth: '640px',
      body: `
        <div class="tabs">
          <button class="tab-btn active" data-tab="nm-man">Manual</button>
          <button class="tab-btn" data-tab="nm-ai">✨ Gerar com IA</button>
        </div>
        <div class="tab-panel active" id="tab-nm-man" style="padding-top:12px">
          <div style="display:flex;flex-direction:column;gap:12px">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Nome *</label>
                <input class="form-input" id="nmName" placeholder="meucomando">
              </div>
              <div class="form-group" style="flex:0 0 130px">
                <label class="form-label">Categoria</label>
                <select class="form-select" id="nmCat">
                  <option value="misc">misc</option>
                  <option value="fun">fun</option>
                  <option value="info">info</option>
                  <option value="media">media</option>
                  <option value="owner">owner</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Código JS *</label>
              <textarea class="form-textarea" id="nmCode" rows="9"
                placeholder="export default {\n  name: 'meucomando',\n  description: 'Descrição',\n  category: 'misc',\n  cooldown: 5,\n  async execute({ reply, argStr }) {\n    await reply('Olá!')\n  }\n}"></textarea>
            </div>
          </div>
        </div>
        <div class="tab-panel" id="tab-nm-ai" style="padding-top:12px">
          <div style="display:flex;flex-direction:column;gap:12px">
            <div class="alert alert-info">${ICONS.ai}<div>Descreva o que o comando deve fazer em português.</div></div>
            <div class="form-group">
              <label class="form-label">Descrição *</label>
              <textarea class="form-textarea" id="aiDesc" rows="3"
                placeholder="Ex: Busca a cotação do dólar e responde com um gráfico ASCII"></textarea>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Nome (opcional)</label>
                <input class="form-input" id="aiName" placeholder="detecta do código">
              </div>
              <div class="form-group" style="flex:0 0 130px">
                <label class="form-label">Categoria</label>
                <select class="form-select" id="aiCat">
                  <option value="misc">misc</option>
                  <option value="fun">fun</option>
                  <option value="info">info</option>
                </select>
              </div>
            </div>
            <button class="btn btn-secondary" id="aiGenBtn">✨ Gerar Código</button>
            <div id="aiGenRes" style="display:none">
              <label class="form-label">Código gerado:</label>
              <textarea class="form-textarea" id="aiGenCode" rows="9"></textarea>
            </div>
          </div>
        </div>
      `,
      footer: `
        <button class="btn btn-secondary" id="nmClose">Cancelar</button>
        <button class="btn btn-primary" id="nmSave">${ICONS.save} Salvar Comando</button>
      `
    })

    el.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        el.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'))
        el.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'))
        btn.classList.add('active')
        el.querySelector(`#tab-${btn.dataset.tab}`)?.classList.add('active')
      })
    })

    el.querySelector('#aiGenBtn')?.addEventListener('click', async () => {
      const desc = el.querySelector('#aiDesc')?.value.trim()
      if (!desc) return toastWarning('Descreva o comando')
      const btn = el.querySelector('#aiGenBtn')
      btn.disabled=true; btn.textContent='⏳ Gerando...'
      try {
        const r = await POST('/api/ai/generate-command', { descricao: desc })
        if (r.code) {
          el.querySelector('#aiGenRes').style.display='block'
          el.querySelector('#aiGenCode').value=r.code
          toastSuccess('Código gerado!', `via ${r.via||'IA'}`)
        }
      } catch(e){ toastError('Erro IA',e.message) }
      finally { btn.disabled=false; btn.textContent='✨ Gerar Código' }
    })

    el.querySelector('#nmClose')?.addEventListener('click', close)
    el.querySelector('#nmSave')?.addEventListener('click', async () => {
      const isAI = el.querySelector('#tab-nm-ai.active')
      let name, code, category
      if (isAI) {
        code     = el.querySelector('#aiGenCode')?.value.trim()
        category = el.querySelector('#aiCat')?.value||'misc'
        name     = el.querySelector('#aiName')?.value.trim()
        if (!code) return toastWarning('Gere o código antes de salvar')
        if (!name) { const m=code.match(/name:\s*['"]([^'"]+)['"]/); name=m?.[1]||`cmd_${Date.now()}` }
      } else {
        name     = el.querySelector('#nmName')?.value.trim()
        code     = el.querySelector('#nmCode')?.value.trim()
        category = el.querySelector('#nmCat')?.value||'misc'
      }
      if (!name) return toastWarning('Nome obrigatório')
      if (!code) return toastWarning('Código obrigatório')
      try {
        await POST(`/api/commands/${encodeURIComponent(name)}/source`, { source: code, category })
        toastSuccess('Criado!', `"${name}" em ${category}`)
        close(); await loadCommands()
      } catch(e){ toastError('Erro',e.message) }
    })
  }

  function onReload() { loadCommands() }
  function onSocketInit({ commands }) { if(commands?.length){ _cmds=commands; renderGrid() } }
  function cleanup() {
    _editor=null; _filter=''; _cat='all'
    document.querySelectorAll('.tab-panel').forEach(p=>p.removeAttribute('data-loaded'))
  }

  return { render, onReload, onSocketInit, cleanup }
})()
