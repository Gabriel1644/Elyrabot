/**
 * components/Automations.js
 * Automações (trigger→resposta), auto-IA e hooks de sistema
 *
 * Endpoints:
 *   GET  /api/automations         → lista
 *   POST /api/automations         → criar
 *   PUT  /api/automations/:id     → editar
 *   DELETE /api/automations/:id   → deletar
 *   GET  /api/auto-ia             → regras auto-IA
 *   POST /api/auto-ia             → criar regra
 *   DELETE /api/auto-ia/:id       → deletar regra
 *   GET  /api/hooks               → hooks de sistema ativos
 *   POST /api/hooks/remove        → remover hook
 *   GET  /api/scheduler           → agendamentos
 *   POST /api/scheduler           → criar
 *   DELETE /api/scheduler/:id     → deletar
 */
const PageAutomations = (() => {

  async function render(container) {
    container.innerHTML = `
      <div class="tabs">
        <button class="tab-btn active" data-tab="automations">Automações</button>
        <button class="tab-btn" data-tab="autoaia">Auto-IA</button>
        <button class="tab-btn" data-tab="scheduler">Agendador</button>
        <button class="tab-btn" data-tab="hooks">Hooks</button>
      </div>

      <div class="tab-panel active" id="tab-automations"></div>
      <div class="tab-panel" id="tab-autoaia"></div>
      <div class="tab-panel" id="tab-scheduler"></div>
      <div class="tab-panel" id="tab-hooks"></div>
    `

    setupTabs(container)
    await loadTab('automations')
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

    const loaders = {
      automations: loadAutomations,
      autoaia:     loadAutoIA,
      scheduler:   loadScheduler,
      hooks:       loadHooks,
    }
    await loaders[name]?.(el)
  }

  /* ══════════════════════════════════════════════════════
     AUTOMAÇÕES
     ══════════════════════════════════════════════════════ */
  async function loadAutomations(el) {
    el.innerHTML = `
      <div class="section-header" style="margin-bottom:14px">
        <span class="section-title">${ICONS.zap} Automações (trigger → resposta)</span>
        <button class="btn btn-primary btn-sm" id="newAutoBtn">${ICONS.plus} Nova Automação</button>
      </div>
      <div id="autoList"><div class="loading"><div class="spinner"></div></div></div>
    `

    document.getElementById('newAutoBtn')?.addEventListener('click', () => openAutoModal(el))
    await refreshAutomations(el)
  }

  async function refreshAutomations(el) {
    const listEl = el?.querySelector('#autoList') || document.getElementById('autoList')
    if (!listEl) return

    try {
      const items = await GET('/api/automations')
      // Filtra apenas automações reais (não hooks internos)
      const autos = items.filter(i => !i.id?.startsWith('hooks') && !i.id?.startsWith('auto_ia'))

      if (!autos.length) {
        listEl.innerHTML = `
          <div class="empty-state">
            ${ICONS.zap}
            <h3>Nenhuma automação cadastrada</h3>
            <p>Crie uma automação para responder automaticamente a palavras-chave</p>
          </div>
        `
        return
      }

      listEl.innerHTML = `<div class="auto-list">${autos.map(a => autoItem(a)).join('')}</div>`

      // Eventos
      listEl.querySelectorAll('[data-del-auto]').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (!confirm(`Deletar automação "${btn.dataset.delAuto}"?`)) return
          try {
            await DELETE(`/api/automations/${encodeURIComponent(btn.dataset.delAuto)}`)
            toastSuccess('Deletado!')
            const tab = document.getElementById('tab-automations')
            tab.removeAttribute('data-loaded')
            await loadAutomations(tab)
          } catch (e) { toastError('Erro', e.message) }
        })
      })

      listEl.querySelectorAll('[data-edit-auto]').forEach(btn => {
        btn.addEventListener('click', () => {
          const item = autos.find(a => a.id === btn.dataset.editAuto)
          if (item) openAutoModal(el, item)
        })
      })
    } catch (e) { toastError('Erro', e.message) }
  }

  function autoItem(a) {
    const typeMap = { text: 'Texto', image: 'Imagem', audio: 'Áudio', video: 'Vídeo', sticker: 'Figurinha' }
    return `
      <div class="auto-item">
        <div style="flex-shrink:0">
          <span class="badge badge-green">${escHtml(a.trigger)}</span>
        </div>
        <div class="auto-response">${escHtml(a.response)}</div>
        <div style="display:flex;gap:6px;align-items:center;margin-left:auto;flex-shrink:0">
          <span class="badge badge-gray">${typeMap[a.type] || a.type}</span>
          <span class="badge ${a.enabled ? 'badge-green' : 'badge-red'}">${a.enabled ? 'Ativo' : 'Inativo'}</span>
          <button class="btn-icon" data-edit-auto="${escHtml(a.id)}" title="Editar">${ICONS.edit}</button>
          <button class="btn-icon" data-del-auto="${escHtml(a.id)}" title="Deletar" style="color:var(--red)">${ICONS.trash}</button>
        </div>
      </div>
    `
  }

  function openAutoModal(parentEl, existing = null) {
    const isEdit = !!existing
    const { el, close } = createModal({
      title: isEdit ? 'Editar Automação' : 'Nova Automação',
      icon: ICONS.zap,
      body: `
        <div style="display:flex;flex-direction:column;gap:12px">
          <div class="form-group">
            <label class="form-label">Trigger (palavra/frase) *</label>
            <input class="form-input" id="autoTrigger" placeholder="olá bot" value="${escHtml(existing?.trigger||'')}">
            <span class="form-hint">Pode usar regex: /padrão/flags</span>
          </div>
          <div class="form-group">
            <label class="form-label">Resposta *</label>
            <textarea class="form-textarea" id="autoResponse" rows="4" placeholder="Olá! Como posso ajudar?">${escHtml(existing?.response||'')}</textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Tipo</label>
              <select class="form-select" id="autoType">
                <option value="text" ${existing?.type==='text'?'selected':''}>Texto</option>
                <option value="image" ${existing?.type==='image'?'selected':''}>Imagem</option>
                <option value="audio" ${existing?.type==='audio'?'selected':''}>Áudio</option>
                <option value="video" ${existing?.type==='video'?'selected':''}>Vídeo</option>
                <option value="sticker" ${existing?.type==='sticker'?'selected':''}>Figurinha</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Escopo</label>
              <select class="form-select" id="autoScope">
                <option value="both"  ${existing?.scope==='both'?'selected':''}>Grupos + Privado</option>
                <option value="group" ${existing?.scope==='group'?'selected':''}>Só grupos</option>
                <option value="private" ${existing?.scope==='private'?'selected':''}>Só privado</option>
              </select>
            </div>
            <div class="form-group" style="flex:0 0 100px">
              <label class="form-label">Cooldown (s)</label>
              <input class="form-input" type="number" id="autoCooldown" value="${existing?.cooldown||0}" min="0">
            </div>
          </div>
          <div id="mediaUrlWrap" class="form-group" style="${existing?.type&&existing.type!=='text'?'':'display:none'}">
            <label class="form-label">URL da mídia</label>
            <input class="form-input" id="autoMediaUrl" value="${escHtml(existing?.mediaUrl||'')}">
          </div>
          <label class="toggle-wrap">
            <label class="toggle">
              <input type="checkbox" id="autoEnabled" ${existing?.enabled!==false?'checked':''}>
              <span class="toggle-track"></span>
            </label>
            <span class="toggle-label">Ativa</span>
          </label>
        </div>
      `,
      footer: `
        <button class="btn btn-secondary" id="autoClose">Cancelar</button>
        <button class="btn btn-primary" id="autoSave">${ICONS.save} Salvar</button>
      `
    })

    el.querySelector('#autoType')?.addEventListener('change', e => {
      const wrap = el.querySelector('#mediaUrlWrap')
      if (wrap) wrap.style.display = e.target.value !== 'text' ? 'flex' : 'none'
    })

    el.querySelector('#autoClose')?.addEventListener('click', close)
    el.querySelector('#autoSave')?.addEventListener('click', async () => {
      const trigger  = el.querySelector('#autoTrigger')?.value.trim()
      const response = el.querySelector('#autoResponse')?.value.trim()
      const type     = el.querySelector('#autoType')?.value
      const scope    = el.querySelector('#autoScope')?.value
      const cooldown = parseInt(el.querySelector('#autoCooldown')?.value)||0
      const mediaUrl = el.querySelector('#autoMediaUrl')?.value.trim()
      const enabled  = el.querySelector('#autoEnabled')?.checked

      if (!trigger || !response) return toastWarning('Preencha trigger e resposta')

      try {
        if (isEdit) {
          await PUT(`/api/automations/${encodeURIComponent(existing.id)}`,
            { trigger, response, type, scope, cooldown, mediaUrl, enabled })
        } else {
          await POST('/api/automations', { trigger, response, type, scope, cooldown, mediaUrl, enabled })
        }
        toastSuccess('Salvo!')
        close()
        const tab = document.getElementById('tab-automations')
        tab.removeAttribute('data-loaded')
        await loadAutomations(tab)
      } catch (e) { toastError('Erro', e.message) }
    })
  }

  /* ══════════════════════════════════════════════════════
     AUTO-IA
     ══════════════════════════════════════════════════════ */
  async function loadAutoIA(el) {
    el.innerHTML = `
      <div class="section-header" style="margin-bottom:14px">
        <span class="section-title">${ICONS.ai} Regras de Auto-IA</span>
        <button class="btn btn-primary btn-sm" id="newAIBtn">${ICONS.plus} Nova Regra</button>
      </div>
      <div class="alert alert-info" style="margin-bottom:14px">
        ${ICONS.info}
        <div>Quando o bot detectar a palavra-chave, responderá automaticamente com a resposta definida (sem precisar chamar um comando).</div>
      </div>
      <div id="aiList"><div class="loading"><div class="spinner"></div></div></div>
    `

    document.getElementById('newAIBtn')?.addEventListener('click', () => openAIModal(el))
    await refreshAutoIA(el)
  }

  async function refreshAutoIA(el) {
    const listEl = el?.querySelector('#aiList') || document.getElementById('aiList')
    if (!listEl) return

    try {
      const items = await GET('/api/auto-ia')

      if (!items.length) {
        listEl.innerHTML = `
          <div class="empty-state">${ICONS.ai}<h3>Nenhuma regra</h3><p>Adicione palavras-chave para respostas automáticas</p></div>
        `
        return
      }

      listEl.innerHTML = items.map(item => `
        <div class="hook-item">
          <div style="flex:1;min-width:0">
            <div class="hook-name">${escHtml(item.keyword)}</div>
            <div class="hook-url">${escHtml(item.response)}</div>
          </div>
          <span class="badge ${item.enabled ? 'badge-green' : 'badge-red'}">${item.enabled ? 'Ativo' : 'Inativo'}</span>
          <div class="hook-actions">
            <button class="btn-icon" data-del-ai="${escHtml(item.id)}" title="Deletar" style="color:var(--red)">${ICONS.trash}</button>
          </div>
        </div>
      `).join('')

      listEl.querySelectorAll('[data-del-ai]').forEach(btn => {
        btn.addEventListener('click', async () => {
          try {
            await DELETE(`/api/auto-ia/${encodeURIComponent(btn.dataset.delAi)}`)
            toastSuccess('Removida!')
            const tab = document.getElementById('tab-autoaia')
            tab.removeAttribute('data-loaded')
            await loadAutoIA(tab)
          } catch (e) { toastError('Erro', e.message) }
        })
      })
    } catch (e) { toastError('Erro', e.message) }
  }

  function openAIModal(parentEl) {
    const { el, close } = createModal({
      title: 'Nova Regra Auto-IA',
      icon: ICONS.ai,
      body: `
        <div style="display:flex;flex-direction:column;gap:12px">
          <div class="form-group">
            <label class="form-label">Palavra-chave *</label>
            <input class="form-input" id="aiKeyword" placeholder="oi bot, preciso de ajuda...">
          </div>
          <div class="form-group">
            <label class="form-label">Resposta *</label>
            <textarea class="form-textarea" id="aiResponse" rows="4" placeholder="Olá! Sou o Kaius, como posso ajudar?"></textarea>
          </div>
        </div>
      `,
      footer: `
        <button class="btn btn-secondary" id="aiClose">Cancelar</button>
        <button class="btn btn-primary" id="aiSave">${ICONS.save} Salvar</button>
      `
    })

    el.querySelector('#aiClose')?.addEventListener('click', close)
    el.querySelector('#aiSave')?.addEventListener('click', async () => {
      const keyword  = el.querySelector('#aiKeyword')?.value.trim()
      const response = el.querySelector('#aiResponse')?.value.trim()
      if (!keyword || !response) return toastWarning('Preencha todos os campos')
      try {
        await POST('/api/auto-ia', { keyword, response })
        toastSuccess('Regra criada!')
        close()
        const tab = document.getElementById('tab-autoaia')
        tab.removeAttribute('data-loaded')
        await loadAutoIA(tab)
      } catch (e) { toastError('Erro', e.message) }
    })
  }

  /* ══════════════════════════════════════════════════════
     AGENDADOR
     ══════════════════════════════════════════════════════ */
  async function loadScheduler(el) {
    el.innerHTML = `
      <div class="section-header" style="margin-bottom:14px">
        <span class="section-title">${ICONS.clock} Mensagens Agendadas</span>
        <button class="btn btn-primary btn-sm" id="newSchedBtn">${ICONS.plus} Agendar</button>
      </div>
      <div id="schedList"><div class="loading"><div class="spinner"></div></div></div>
    `
    document.getElementById('newSchedBtn')?.addEventListener('click', () => openSchedModal(el))
    await refreshScheduler(el)
  }

  async function refreshScheduler(el) {
    const listEl = el?.querySelector('#schedList') || document.getElementById('schedList')
    if (!listEl) return

    try {
      const data = await GET('/api/scheduler')
      const items = Object.values(data)

      if (!items.length) {
        listEl.innerHTML = `<div class="empty-state">${ICONS.clock}<h3>Nenhum agendamento</h3></div>`
        return
      }

      listEl.innerHTML = items.map(s => `
        <div class="hook-item">
          <div style="flex:1;min-width:0">
            <div class="hook-name">${escHtml(s.text?.slice(0,60))}${s.text?.length>60?'...':''}</div>
            <div class="hook-url">Para: ${escHtml(s.jid)} | Hora: ${escHtml(s.time)} | ${s.repeat?'Repetir':'Uma vez'}</div>
          </div>
          <span class="badge ${s.enabled ? 'badge-green' : 'badge-red'}">${s.enabled ? 'Ativo' : 'Inativo'}</span>
          <div class="hook-actions">
            <button class="btn-icon" data-del-sched="${escHtml(s.id)}" style="color:var(--red)">${ICONS.trash}</button>
          </div>
        </div>
      `).join('')

      listEl.querySelectorAll('[data-del-sched]').forEach(btn => {
        btn.addEventListener('click', async () => {
          try {
            await DELETE(`/api/scheduler/${encodeURIComponent(btn.dataset.delSched)}`)
            toastSuccess('Removido!')
            const tab = document.getElementById('tab-scheduler')
            tab.removeAttribute('data-loaded')
            await loadScheduler(tab)
          } catch (e) { toastError('Erro', e.message) }
        })
      })
    } catch (e) { toastError('Erro', e.message) }
  }

  function openSchedModal(parentEl) {
    const { el, close } = createModal({
      title: 'Agendar Mensagem',
      icon: ICONS.clock,
      body: `
        <div style="display:flex;flex-direction:column;gap:12px">
          <div class="form-group">
            <label class="form-label">JID do destinatário *</label>
            <input class="form-input" id="schedJid" placeholder="5511999999999@s.whatsapp.net ou grupo@g.us">
          </div>
          <div class="form-group">
            <label class="form-label">Mensagem *</label>
            <textarea class="form-textarea" id="schedText" rows="3"></textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Horário (HH:MM) *</label>
              <input class="form-input" type="time" id="schedTime">
            </div>
            <div class="form-group">
              <label class="form-label">Repetir diariamente</label>
              <label class="toggle-wrap" style="margin-top:6px">
                <label class="toggle"><input type="checkbox" id="schedRepeat"><span class="toggle-track"></span></label>
                <span class="toggle-label">Sim</span>
              </label>
            </div>
          </div>
        </div>
      `,
      footer: `
        <button class="btn btn-secondary" id="schedClose">Cancelar</button>
        <button class="btn btn-primary" id="schedSave">${ICONS.save} Agendar</button>
      `
    })

    el.querySelector('#schedClose')?.addEventListener('click', close)
    el.querySelector('#schedSave')?.addEventListener('click', async () => {
      const jid    = el.querySelector('#schedJid')?.value.trim()
      const text   = el.querySelector('#schedText')?.value.trim()
      const time   = el.querySelector('#schedTime')?.value
      const repeat = el.querySelector('#schedRepeat')?.checked

      if (!jid || !text || !time) return toastWarning('Preencha todos os campos obrigatórios')

      try {
        await POST('/api/scheduler', { jid, text, time, repeat })
        toastSuccess('Agendado!')
        close()
        const tab = document.getElementById('tab-scheduler')
        tab.removeAttribute('data-loaded')
        await loadScheduler(tab)
      } catch (e) { toastError('Erro', e.message) }
    })
  }

  /* ══════════════════════════════════════════════════════
     HOOKS ATIVOS
     ══════════════════════════════════════════════════════ */
  async function loadHooks(el) {
    el.innerHTML = `
      <div class="section-header" style="margin-bottom:14px">
        <span class="section-title">${ICONS.zap} Hooks de Sistema Ativos</span>
      </div>
      <div id="hooksList"><div class="loading"><div class="spinner"></div></div></div>
    `
    await refreshHooks(el)
  }

  async function refreshHooks(el) {
    const listEl = el?.querySelector('#hooksList') || document.getElementById('hooksList')
    if (!listEl) return

    try {
      const hooks = await GET('/api/hooks')

      if (!hooks.length) {
        listEl.innerHTML = `<div class="empty-state">${ICONS.zap}<h3>Nenhum hook ativo</h3><p>Hooks são interceptadores de mensagens carregados dos comandos</p></div>`
        return
      }

      listEl.innerHTML = hooks.map(h => `
        <div class="hook-item">
          <div style="flex:1">
            <div class="hook-name">${escHtml(h.name || h.id)}</div>
            <div class="hook-url">ID: ${escHtml(h.id)} | Prioridade: ${h.priority ?? '—'}</div>
          </div>
          <button class="btn btn-danger btn-sm" data-rm-hook="${escHtml(h.id)}" title="Remover hook">
            ${ICONS.trash} Remover
          </button>
        </div>
      `).join('')

      listEl.querySelectorAll('[data-rm-hook]').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (!confirm(`Remover hook "${btn.dataset.rmHook}"?`)) return
          try {
            await POST('/api/hooks/remove', { id: btn.dataset.rmHook })
            toastSuccess('Hook removido!')
            const tab = document.getElementById('tab-hooks')
            tab.removeAttribute('data-loaded')
            await loadHooks(tab)
          } catch (e) { toastError('Erro', e.message) }
        })
      })
    } catch (e) { toastError('Erro', e.message) }
  }

  function cleanup() {
    // Reseta loaded state das tabs ao sair
    document.querySelectorAll('.tab-panel').forEach(p => p.removeAttribute('data-loaded'))
  }

  return { render, cleanup }
})()
