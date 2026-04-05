/**
 * components/Commands.js
 * Gerenciamento de comandos: listar, ativar/desativar, editar código, criar com IA
 *
 * Endpoints usados:
 *   GET  /api/commands                    → lista todos
 *   POST /api/commands/:name/toggle       → ativar/desativar
 *   GET  /api/commands/:name/source       → código fonte
 *   POST /api/commands/:name/source       → criar/salvar
 *   DELETE /api/commands/:name            → deletar
 *   PUT  /api/commands/:name/meta         → editar desc/usage/cooldown
 *   POST /api/commands/:name/aliases      → aliases dinâmicos
 *   POST /api/reload                      → recarregar
 *   POST /api/ai/generate-command         → gerar com IA
 */
const PageCommands = (() => {
  let _cmds = []
  let _filter = ''
  let _cat = 'all'
  let _editor = null

  async function render(container) {
    container.innerHTML = `
      <div class="section">
        <div class="section-header">
          <span class="section-title">${ICONS.code} Comandos</span>
          <div style="display:flex;gap:8px">
            <button class="btn btn-secondary btn-sm" id="reloadCmdsBtn">${ICONS.reload} Recarregar</button>
            <button class="btn btn-primary btn-sm" id="newCmdBtn">${ICONS.plus} Novo Comando</button>
          </div>
        </div>

        <!-- Filtros -->
        <div class="filter-bar">
          <input class="form-input" id="cmdSearch" placeholder="🔍 Buscar comandos...">
          <select class="form-select" id="cmdCatFilter" style="width:140px">
            <option value="all">Todas categorias</option>
            <option value="core">core</option>
            <option value="fun">fun</option>
            <option value="info">info</option>
            <option value="media">media</option>
            <option value="admin">admin</option>
            <option value="owner">owner</option>
            <option value="rpg">rpg</option>
            <option value="misc">misc</option>
          </select>
          <span id="cmdTotal" style="font-size:0.8rem;color:var(--text-muted);white-space:nowrap">...</span>
        </div>

        <!-- Grid de comandos -->
        <div class="cmd-grid" id="cmdGrid">
          <div class="loading"><div class="spinner"></div></div>
        </div>
      </div>
    `

    await loadCommands()
    bindListEvents()
  }

  async function loadCommands() {
    try {
      _cmds = await GET('/api/commands')
      renderGrid()
    } catch (e) {
      toastError('Erro ao carregar comandos', e.message)
    }
  }

  function renderGrid() {
    const el = document.getElementById('cmdGrid')
    if (!el) return

    const search = _filter.toLowerCase()
    const filtered = _cmds.filter(c => {
      if (_cat !== 'all' && c.category !== _cat) return false
      if (search && !c.name.includes(search) && !(c.description || '').toLowerCase().includes(search)) return false
      return true
    })

    const total = document.getElementById('cmdTotal')
    if (total) total.textContent = `${filtered.length} de ${_cmds.length} comandos`

    if (!filtered.length) {
      el.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          ${ICONS.code}
          <h3>Nenhum comando encontrado</h3>
          <p>Tente outro filtro ou crie um novo comando</p>
        </div>
      `
      return
    }

    el.innerHTML = filtered.map(cmd => `
      <div class="cmd-card ${cmd.enabled === false ? 'disabled' : ''}" data-name="${escHtml(cmd.name)}">
        <div class="cmd-card-header">
          <span class="cmd-name">${escHtml(cmd.name)}</span>
          <label class="toggle">
            <input type="checkbox" class="cmd-toggle" data-name="${escHtml(cmd.name)}"
                   ${cmd.enabled !== false ? 'checked' : ''}>
            <span class="toggle-track"></span>
          </label>
        </div>
        <div class="cmd-desc">${escHtml(cmd.description || 'Sem descrição')}</div>
        <div class="cmd-meta">
          ${cmdCategoryBadge(cmd.category)}
          ${cmd.cooldown ? `<span class="badge badge-gray">${ICONS.clock} ${cmd.cooldown}s</span>` : ''}
          ${cmd.aliases?.length ? `<span class="badge badge-gray">${cmd.aliases.join(', ')}</span>` : ''}
        </div>
        <div class="cmd-actions">
          <button class="btn btn-ghost btn-sm cmd-edit" data-name="${escHtml(cmd.name)}" title="Editar código">
            ${ICONS.code} Editar
          </button>
          <button class="btn btn-ghost btn-sm cmd-meta-btn" data-name="${escHtml(cmd.name)}" title="Metadados">
            ${ICONS.edit}
          </button>
          <button class="btn btn-ghost btn-sm cmd-del" data-name="${escHtml(cmd.name)}" title="Deletar"
                  style="color:var(--red)" ${cmd.category === 'core' ? 'disabled' : ''}>
            ${ICONS.trash}
          </button>
        </div>
      </div>
    `).join('')

    bindCardEvents()
  }

  function bindListEvents() {
    // Busca
    let _deb
    document.getElementById('cmdSearch')?.addEventListener('input', e => {
      clearTimeout(_deb)
      _deb = setTimeout(() => { _filter = e.target.value.trim(); renderGrid() }, 200)
    })

    // Categoria
    document.getElementById('cmdCatFilter')?.addEventListener('change', e => {
      _cat = e.target.value; renderGrid()
    })

    // Reload
    document.getElementById('reloadCmdsBtn')?.addEventListener('click', async () => {
      try {
        const r = await POST('/api/reload')
        toastSuccess('Recarregado', `${r.total} comandos`)
        await loadCommands()
      } catch (e) { toastError('Erro', e.message) }
    })

    // Novo comando
    document.getElementById('newCmdBtn')?.addEventListener('click', () => openNewCmdModal())
  }

  function bindCardEvents() {
    // Toggle
    document.querySelectorAll('.cmd-toggle').forEach(chk => {
      chk.addEventListener('change', async (e) => {
        const name = e.target.dataset.name
        const enabled = e.target.checked
        try {
          await POST(`/api/commands/${encodeURIComponent(name)}/toggle`, { enabled })
          const cmd = _cmds.find(c => c.name === name)
          if (cmd) cmd.enabled = enabled
          const card = e.target.closest('.cmd-card')
          if (card) card.classList.toggle('disabled', !enabled)
        } catch (err) {
          toastError('Erro', err.message)
          e.target.checked = !enabled // reverte
        }
      })
    })

    // Editar código
    document.querySelectorAll('.cmd-edit').forEach(btn => {
      btn.addEventListener('click', () => openEditor(btn.dataset.name))
    })

    // Metadados
    document.querySelectorAll('.cmd-meta-btn').forEach(btn => {
      btn.addEventListener('click', () => openMetaModal(btn.dataset.name))
    })

    // Deletar
    document.querySelectorAll('.cmd-del').forEach(btn => {
      btn.addEventListener('click', async () => {
        const name = btn.dataset.name
        if (!confirm(`Deletar o comando "${name}"? Esta ação é irreversível.`)) return
        try {
          await DELETE(`/api/commands/${encodeURIComponent(name)}`)
          _cmds = _cmds.filter(c => c.name !== name)
          toastSuccess('Deletado', `Comando "${name}" removido`)
          renderGrid()
        } catch (e) { toastError('Erro', e.message) }
      })
    })
  }

  /* ── Editor de código ─────────────────────────────────── */
  async function openEditor(name, initialCode = null) {
    let code = initialCode
    if (!code) {
      try {
        const src = await GET(`/api/commands/${encodeURIComponent(name)}/source`)
        code = src.source || src.code || ''
      } catch {
        code = ''
      }
    }

    const cmd = _cmds.find(c => c.name === name)

    const { el, close } = createModal({
      title: name ? `Editar: ${name}` : 'Novo Comando',
      icon: ICONS.code,
      maxWidth: '800px',
      body: `
        <div style="margin-bottom:10px;display:flex;gap:8px;align-items:center">
          ${name ? '' : `
            <div class="form-group" style="flex:1">
              <input class="form-input" id="newCmdName" placeholder="nome do comando (ex: ping)">
            </div>
            <div class="form-group" style="flex:0 0 120px">
              <select class="form-select" id="newCmdCat">
                <option value="misc">misc</option>
                <option value="core">core</option>
                <option value="fun">fun</option>
                <option value="info">info</option>
                <option value="media">media</option>
                <option value="admin">admin</option>
                <option value="owner">owner</option>
              </select>
            </div>
          `}
        </div>
        <textarea id="codeEditor">${escHtml(code)}</textarea>
      `,
      footer: `
        <button class="btn btn-secondary" id="cmEdClose">Cancelar</button>
        <button class="btn btn-primary" id="cmEdSave">${ICONS.save} Salvar</button>
      `
    })

    // Inicializa CodeMirror
    const ta = el.querySelector('#codeEditor')
    ta.style.display = 'none'

    if (window.CodeMirror) {
      _editor = CodeMirror(el.querySelector('.modal-body'), {
        value: code,
        mode: 'javascript',
        theme: 'dracula',
        lineNumbers: true,
        indentUnit: 2,
        tabSize: 2,
        lineWrapping: false,
        autofocus: true,
      })
    }

    el.querySelector('#cmEdClose')?.addEventListener('click', close)

    el.querySelector('#cmEdSave')?.addEventListener('click', async () => {
      const source = _editor ? _editor.getValue() : ta.value
      const cmdName = name || el.querySelector('#newCmdName')?.value.trim()
      const category = el.querySelector('#newCmdCat')?.value || cmd?.category || 'misc'

      if (!cmdName) return toastWarning('Informe o nome do comando')
      if (!source.trim()) return toastWarning('Código não pode estar vazio')

      try {
        await POST(`/api/commands/${encodeURIComponent(cmdName)}/source`, { source, category })
        toastSuccess('Salvo!', `Comando "${cmdName}" salvo`)
        close()
        await loadCommands()
      } catch (e) { toastError('Erro ao salvar', e.message) }
    })
  }

  /* ── Modal metadados ──────────────────────────────────── */
  function openMetaModal(name) {
    const cmd = _cmds.find(c => c.name === name)
    if (!cmd) return

    const { el, close } = createModal({
      title: `Metadados: ${name}`,
      icon: ICONS.edit,
      body: `
        <div style="display:flex;flex-direction:column;gap:12px">
          <div class="form-group">
            <label class="form-label">Descrição</label>
            <input class="form-input" id="metaDesc" value="${escHtml(cmd.description || '')}">
          </div>
          <div class="form-group">
            <label class="form-label">Uso (usage)</label>
            <input class="form-input" id="metaUsage" value="${escHtml(cmd.usage || '')}">
          </div>
          <div class="form-group">
            <label class="form-label">Cooldown (segundos)</label>
            <input class="form-input" type="number" id="metaCooldown" value="${cmd.cooldown || 0}" min="0">
          </div>
          <div class="form-group">
            <label class="form-label">Aliases dinâmicos (separados por vírgula)</label>
            <input class="form-input" id="metaAliases" value="${escHtml((cmd.aliases||[]).join(', '))}">
            <span class="form-hint">Aliases dinâmicos são criados pelo painel, não substituem os do código</span>
          </div>
        </div>
      `,
      footer: `
        <button class="btn btn-secondary" id="metaClose">Cancelar</button>
        <button class="btn btn-primary" id="metaSave">${ICONS.save} Salvar</button>
      `
    })

    el.querySelector('#metaClose')?.addEventListener('click', close)
    el.querySelector('#metaSave')?.addEventListener('click', async () => {
      const description = el.querySelector('#metaDesc')?.value
      const usage       = el.querySelector('#metaUsage')?.value
      const cooldown    = parseInt(el.querySelector('#metaCooldown')?.value) || 0
      const aliasRaw    = el.querySelector('#metaAliases')?.value || ''
      const aliases     = aliasRaw.split(',').map(s => s.trim()).filter(Boolean)

      try {
        await Promise.all([
          PUT(`/api/commands/${encodeURIComponent(name)}/meta`, { description, usage, cooldown }),
          POST(`/api/commands/${encodeURIComponent(name)}/aliases`, { aliases }),
        ])
        toastSuccess('Salvo!')
        close()
        await loadCommands()
      } catch (e) { toastError('Erro', e.message) }
    })
  }

  /* ── Modal novo comando ───────────────────────────────── */
  function openNewCmdModal() {
    const { el, close } = createModal({
      title: 'Novo Comando',
      icon: ICONS.plus,
      maxWidth: '600px',
      body: `
        <div class="tabs">
          <button class="tab-btn active" data-tab="manual">Manual</button>
          <button class="tab-btn" data-tab="ai">✨ Gerar com IA</button>
        </div>

        <!-- Manual -->
        <div class="tab-panel active" id="tab-manual">
          <div style="display:flex;flex-direction:column;gap:12px">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Nome do comando*</label>
                <input class="form-input" id="manualName" placeholder="meucomando">
              </div>
              <div class="form-group" style="flex:0 0 120px">
                <label class="form-label">Categoria</label>
                <select class="form-select" id="manualCat">
                  <option value="misc">misc</option>
                  <option value="fun">fun</option>
                  <option value="info">info</option>
                  <option value="media">media</option>
                  <option value="owner">owner</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Código JS*</label>
              <textarea class="form-textarea" id="manualCode" rows="8" placeholder="export default { name: 'meucomando', ... }"></textarea>
            </div>
          </div>
        </div>

        <!-- IA -->
        <div class="tab-panel" id="tab-ai">
          <div style="display:flex;flex-direction:column;gap:12px">
            <div class="alert alert-info">
              ${ICONS.info}
              <div><strong>Gerador IA</strong><p>Descreva o comando em português. A IA irá gerar o código automaticamente.</p></div>
            </div>
            <div class="form-group">
              <label class="form-label">Descrição do que o comando deve fazer</label>
              <textarea class="form-textarea" id="aiDesc" rows="3" placeholder="Ex: Um comando que sorteia um número aleatório entre dois valores fornecidos pelo usuário"></textarea>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Nome do comando (opcional)</label>
                <input class="form-input" id="aiCmdName" placeholder="meucomando">
              </div>
              <div class="form-group" style="flex:0 0 130px">
                <label class="form-label">Categoria</label>
                <select class="form-select" id="aiCmdCat">
                  <option value="misc">misc</option>
                  <option value="fun">fun</option>
                  <option value="info">info</option>
                  <option value="media">media</option>
                </select>
              </div>
            </div>
            <button class="btn btn-primary" id="aiGenerateBtn">✨ Gerar Código</button>
            <div id="aiResult" style="display:none">
              <label class="form-label">Código gerado:</label>
              <textarea class="form-textarea" id="aiCode" rows="10"></textarea>
            </div>
          </div>
        </div>
      `,
      footer: `
        <button class="btn btn-secondary" id="newClose">Cancelar</button>
        <button class="btn btn-primary" id="newSave">${ICONS.save} Salvar</button>
      `
    })

    // Tabs
    el.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        el.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'))
        el.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'))
        btn.classList.add('active')
        el.querySelector(`#tab-${btn.dataset.tab}`)?.classList.add('active')
      })
    })

    // Gerar com IA
    el.querySelector('#aiGenerateBtn')?.addEventListener('click', async () => {
      const descricao = el.querySelector('#aiDesc')?.value.trim()
      if (!descricao) return toastWarning('Descreva o comando primeiro')

      const btn = el.querySelector('#aiGenerateBtn')
      btn.disabled = true
      btn.textContent = '⏳ Gerando...'

      try {
        const result = await POST('/api/ai/generate-command', { descricao })
        if (result.code) {
          el.querySelector('#aiResult').style.display = 'block'
          el.querySelector('#aiCode').value = result.code
          toastSuccess('Código gerado!', `via ${result.via || 'IA'}`)
        }
      } catch (e) { toastError('Erro na IA', e.message) }
      finally {
        btn.disabled = false
        btn.textContent = '✨ Gerar Código'
      }
    })

    el.querySelector('#newClose')?.addEventListener('click', close)

    el.querySelector('#newSave')?.addEventListener('click', async () => {
      // Detecta aba ativa
      const isAI = el.querySelector('#tab-ai.active')
      let name, code, category

      if (isAI) {
        name     = el.querySelector('#aiCmdName')?.value.trim()
        code     = el.querySelector('#aiCode')?.value.trim()
        category = el.querySelector('#aiCmdCat')?.value || 'misc'
        if (!code) return toastWarning('Gere o código antes de salvar')
        // Extrai name do código se não informado
        if (!name) {
          const m = code.match(/name:\s*['"]([^'"]+)['"]/)
          name = m?.[1] || 'cmd_' + Date.now()
        }
      } else {
        name     = el.querySelector('#manualName')?.value.trim()
        code     = el.querySelector('#manualCode')?.value.trim()
        category = el.querySelector('#manualCat')?.value || 'misc'
      }

      if (!name) return toastWarning('Informe o nome do comando')
      if (!code) return toastWarning('O código não pode estar vazio')

      try {
        await POST(`/api/commands/${encodeURIComponent(name)}/source`, { source: code, category })
        toastSuccess('Criado!', `Comando "${name}" salvo`)
        close()
        await loadCommands()
      } catch (e) { toastError('Erro ao salvar', e.message) }
    })
  }

  function onReload() { loadCommands() }

  function onSocketInit({ commands }) {
    if (commands?.length) {
      _cmds = commands
      renderGrid()
    }
  }

  function cleanup() {
    _editor = null
    _filter = ''
    _cat = 'all'
  }

  return { render, onReload, onSocketInit, cleanup }
})()
