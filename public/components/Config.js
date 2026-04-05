/**
 * components/Config.js
 * Configurações do bot: geral, IA, mensagens, menu, permissões
 *
 * Endpoints:
 *   GET  /api/config         → ler configs
 *   POST /api/config         → salvar configs
 *   POST /api/config/menu    → salvar menu
 *   POST /api/design/apply   → aplicar tema
 *   GET  /api/cmdperms       → permissões por comando
 *   POST /api/cmdperms/:name → salvar permissão
 *   DELETE /api/cmdperms/:name → resetar permissão
 */
const PageConfig = (() => {
  let _cfg = {}

  async function render(container) {
    container.innerHTML = `
      <div class="tabs">
        <button class="tab-btn active" data-tab="cfgeral">Geral</button>
        <button class="tab-btn" data-tab="cfia">IA</button>
        <button class="tab-btn" data-tab="cfmensagens">Mensagens</button>
        <button class="tab-btn" data-tab="cfmenu">Menu</button>
        <button class="tab-btn" data-tab="cfperms">Permissões</button>
      </div>
      <div class="tab-panel active" id="tab-cfgeral"></div>
      <div class="tab-panel" id="tab-cfia"></div>
      <div class="tab-panel" id="tab-cfmensagens"></div>
      <div class="tab-panel" id="tab-cfmenu"></div>
      <div class="tab-panel" id="tab-cfperms"></div>
    `

    setupTabs(container)
    await loadConfig()
    renderGeral()
  }

  function setupTabs(container) {
    const loaders = {
      cfgeral:      renderGeral,
      cfia:         renderIA,
      cfmensagens:  renderMensagens,
      cfmenu:       renderMenu,
      cfperms:      renderPerms,
    }

    container.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'))
        container.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'))
        btn.classList.add('active')
        const panel = container.querySelector(`#tab-${btn.dataset.tab}`)
        if (panel) panel.classList.add('active')
        await loaders[btn.dataset.tab]?.()
      })
    })
  }

  async function loadConfig() {
    try {
      _cfg = await GET('/api/config')
    } catch (e) {
      toastError('Erro ao carregar configurações', e.message)
    }
  }

  async function saveConfig(body) {
    try {
      await POST('/api/config', body)
      toastSuccess('Configurações salvas!')
      await loadConfig()
    } catch (e) {
      toastError('Erro ao salvar', e.message)
    }
  }

  /* ── Geral ──────────────────────────────────────────── */
  function renderGeral() {
    const el = document.getElementById('tab-cfgeral')
    if (!el) return

    el.innerHTML = `
      <div class="card" style="margin-bottom:16px">
        <div class="card-header">
          <span class="card-title">${ICONS.bot} Identidade do Bot</span>
        </div>
        <div class="config-grid">
          <div class="form-group">
            <label class="form-label">Nome do Bot</label>
            <input class="form-input" id="cfNome" value="${escHtml(_cfg.nome||'')}">
          </div>
          <div class="form-group">
            <label class="form-label">Prefixo</label>
            <input class="form-input" id="cfPrefixo" value="${escHtml(_cfg.prefixo||'!')}" maxlength="3">
            <span class="form-hint">Definido no .env — visualização apenas</span>
          </div>
          <div class="form-group">
            <label class="form-label">Emoji do Bot</label>
            <input class="form-input" id="cfEmoji" value="${escHtml(_cfg.botEmoji||'')}" maxlength="8">
          </div>
          <div class="form-group">
            <label class="form-label">Descrição do Bot</label>
            <input class="form-input" id="cfDescricao" value="${escHtml(_cfg.botDescricao||'')}">
          </div>
        </div>
        <hr class="divider">
        <div style="display:flex;flex-wrap:wrap;gap:16px;margin-top:4px">
          <label class="toggle-wrap">
            <label class="toggle">
              <input type="checkbox" id="cfFuzzy" ${_cfg.fuzzyCommands !== false ? 'checked' : ''}>
              <span class="toggle-track"></span>
            </label>
            <span class="toggle-label">Fuzzy Matching (sugestão de comandos)</span>
          </label>
          <label class="toggle-wrap">
            <label class="toggle">
              <input type="checkbox" id="cfCodeDetect" ${_cfg.autoCodeDetect ? 'checked' : ''}>
              <span class="toggle-track"></span>
            </label>
            <span class="toggle-label">Detector de Código no Chat</span>
          </label>
          <label class="toggle-wrap">
            <label class="toggle">
              <input type="checkbox" id="cfCodeOwner" ${_cfg.codeOwnerOnly ? 'checked' : ''}>
              <span class="toggle-track"></span>
            </label>
            <span class="toggle-label">Detector só para o Dono</span>
          </label>
          <label class="toggle-wrap">
            <label class="toggle">
              <input type="checkbox" id="cfIAAtiva" ${_cfg.iaAtivaPadrao ? 'checked' : ''}>
              <span class="toggle-track"></span>
            </label>
            <span class="toggle-label">IA ativa por padrão nos grupos</span>
          </label>
        </div>
        <div style="margin-top:16px">
          <button class="btn btn-primary" id="saveGeralBtn">${ICONS.save} Salvar Configurações</button>
        </div>
      </div>
    `

    document.getElementById('saveGeralBtn')?.addEventListener('click', () => {
      saveConfig({
        nome:           document.getElementById('cfNome')?.value.trim(),
        botEmoji:       document.getElementById('cfEmoji')?.value.trim(),
        botDescricao:   document.getElementById('cfDescricao')?.value.trim(),
        fuzzyCommands:  document.getElementById('cfFuzzy')?.checked,
        autoCodeDetect: document.getElementById('cfCodeDetect')?.checked,
        codeOwnerOnly:  document.getElementById('cfCodeOwner')?.checked,
        iaAtivaPadrao:  document.getElementById('cfIAAtiva')?.checked,
      })
    })
  }

  /* ── IA ──────────────────────────────────────────────── */
  function renderIA() {
    const el = document.getElementById('tab-cfia')
    if (!el) return

    el.innerHTML = `
      <div class="card" style="margin-bottom:16px">
        <div class="card-header">
          <span class="card-title">${ICONS.ai} Configurações de IA</span>
        </div>
        <div class="config-grid">
          <div class="form-group">
            <label class="form-label">Modelo Groq</label>
            <select class="form-select" id="cfModelo">
              <option value="llama-3.3-70b-versatile" ${_cfg.modelo==='llama-3.3-70b-versatile'?'selected':''}>llama-3.3-70b-versatile</option>
              <option value="llama-3.1-8b-instant" ${_cfg.modelo==='llama-3.1-8b-instant'?'selected':''}>llama-3.1-8b-instant</option>
              <option value="mixtral-8x7b-32768" ${_cfg.modelo==='mixtral-8x7b-32768'?'selected':''}>mixtral-8x7b-32768</option>
              <option value="gemma2-9b-it" ${_cfg.modelo==='gemma2-9b-it'?'selected':''}>gemma2-9b-it</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Groq API Key</label>
            <input class="form-input" type="password" id="cfGroqKey" value="${escHtml(_cfg.groqKey||'')}" placeholder="gsk_...">
            <span class="form-hint">Armazenado apenas no .env — salvo via config</span>
          </div>
          <div class="form-group">
            <label class="form-label">Gemini API Key</label>
            <input class="form-input" type="password" id="cfGeminiKey" value="${escHtml(_cfg.geminiKey||'')}" placeholder="AIza...">
          </div>
          <div class="form-group">
            <label class="form-label">Provider de IA</label>
            <select class="form-select" id="cfProvider">
              <option value="auto" ${_cfg.aiProvider==='auto'?'selected':''}>Auto (Manus → Gemini → Groq)</option>
              <option value="groq" ${_cfg.aiProvider==='groq'?'selected':''}>Groq</option>
              <option value="gemini" ${_cfg.aiProvider==='gemini'?'selected':''}>Gemini</option>
              <option value="manus" ${_cfg.aiProvider==='manus'?'selected':''}>Manus (Agente)</option>
            </select>
          </div>
        </div>
        <div class="form-group" style="margin-top:14px">
          <label class="form-label">Personalidade / System Prompt</label>
          <textarea class="form-textarea" id="cfPersonalidade" rows="5">${escHtml(_cfg.personalidade||'')}</textarea>
          <span class="form-hint">Define o comportamento da IA em conversas</span>
        </div>
        <div style="margin-top:14px">
          <button class="btn btn-primary" id="saveIABtn">${ICONS.save} Salvar</button>
        </div>
      </div>

      <!-- Chat de teste da IA -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">${ICONS.msg} Testar IA</span>
        </div>
        <div class="form-row">
          <div class="form-group">
            <input class="form-input" id="iaTestMsg" placeholder="Digite uma mensagem para a IA...">
          </div>
          <div class="form-group" style="flex:0 0 auto;justify-content:flex-end">
            <label class="form-label">&nbsp;</label>
            <button class="btn btn-secondary" id="iaTestBtn">${ICONS.zap} Perguntar</button>
          </div>
        </div>
        <div id="iaTestResult" style="display:none;margin-top:10px"></div>
      </div>
    `

    document.getElementById('saveIABtn')?.addEventListener('click', () => {
      const groqKey   = document.getElementById('cfGroqKey')?.value.trim()
      const geminiKey = document.getElementById('cfGeminiKey')?.value.trim()
      saveConfig({
        modelo:        document.getElementById('cfModelo')?.value,
        personalidade: document.getElementById('cfPersonalidade')?.value.trim(),
        aiProvider:    document.getElementById('cfProvider')?.value,
        ...(groqKey   && !groqKey.startsWith('***')   ? { groqKey }   : {}),
        ...(geminiKey && !geminiKey.startsWith('***') ? { geminiKey } : {}),
      })
    })

    document.getElementById('iaTestBtn')?.addEventListener('click', async () => {
      const msg = document.getElementById('iaTestMsg')?.value.trim()
      if (!msg) return toastWarning('Escreva uma mensagem')
      const btn = document.getElementById('iaTestBtn')
      const res = document.getElementById('iaTestResult')
      btn.disabled = true; btn.textContent = '⏳...'
      res.style.display = 'block'
      res.innerHTML = `<div class="loading"><div class="spinner"></div></div>`
      try {
        const r = await POST('/api/ai/chat', { mensagem: msg })
        res.innerHTML = `
          <div class="card" style="background:var(--bg)">
            <div style="font-size:0.82rem;color:var(--text-muted);margin-bottom:6px">Resposta da IA:</div>
            <div style="white-space:pre-wrap;font-size:0.88rem">${escHtml(r.resposta||'')}</div>
          </div>
        `
      } catch (e) {
        res.innerHTML = `<div class="alert alert-danger">${ICONS.x} <div>${escHtml(e.message)}</div></div>`
      } finally {
        btn.disabled = false
        btn.innerHTML = `${ICONS.zap} Perguntar`
      }
    })
  }

  /* ── Mensagens ───────────────────────────────────────── */
  function renderMensagens() {
    const el = document.getElementById('tab-cfmensagens')
    if (!el) return

    const fields = [
      ['welcomeMsg',           'Mensagem de Boas-Vindas', 'Bem-vindo ao grupo, {usuario}!'],
      ['msgCmdNaoEncontrado',  'Comando não encontrado',   'Ops, esse comando não existe! Use {prefix}menu'],
      ['msgBanido',            'Mensagem para banidos',    'Você está banido de usar o bot.'],
      ['msgCooldown',          'Mensagem de cooldown',     'Calma! Aguarde {tempo}s para usar novamente.'],
      ['msgSemPerm',           'Sem permissão',            'Você não tem permissão para usar este comando.'],
    ]

    el.innerHTML = `
      <div class="card">
        <div class="card-header">
          <span class="card-title">${ICONS.msg} Mensagens do Sistema</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:14px">
          ${fields.map(([key, label, placeholder]) => `
            <div class="form-group">
              <label class="form-label">${label}</label>
              <textarea class="form-textarea" id="cfg_${key}" rows="2" placeholder="${escHtml(placeholder)}">${escHtml(_cfg[key]||'')}</textarea>
            </div>
          `).join('')}
          <button class="btn btn-primary" id="saveMsgBtn">${ICONS.save} Salvar Mensagens</button>
        </div>
      </div>
    `

    document.getElementById('saveMsgBtn')?.addEventListener('click', () => {
      const body = {}
      fields.forEach(([key]) => {
        body[key] = document.getElementById(`cfg_${key}`)?.value.trim() || ''
      })
      saveConfig(body)
    })
  }

  /* ── Menu ────────────────────────────────────────────── */
  function renderMenu() {
    const el = document.getElementById('tab-cfmenu')
    if (!el) return

    const TEMAS = ['default', 'redline', 'neon', 'minimal', 'stars', 'sakura', 'hacker', 'royal']
    const menu  = _cfg.menu || {}

    el.innerHTML = `
      <div class="card" style="margin-bottom:16px">
        <div class="card-header">
          <span class="card-title">${ICONS.star} Temas do Menu</span>
        </div>
        <p style="font-size:0.85rem;margin-bottom:14px">Clique em um tema para aplicar imediatamente.</p>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px">
          ${TEMAS.map(t => `
            <button class="btn btn-secondary" data-tema="${t}" style="justify-content:flex-start;gap:6px">
              ${ICONS.star} ${t}
            </button>
          `).join('')}
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <span class="card-title">${ICONS.edit} Personalizar Menu</span>
        </div>
        <div class="config-grid">
          ${menuField('borderTop',   'Borda Superior',  menu.borderTop   || '╭')}
          ${menuField('borderBot',   'Borda Inferior',  menu.borderBot   || '╰')}
          ${menuField('borderSide',  'Borda Lateral',   menu.borderSide  || '│')}
          ${menuField('separator',   'Separador',       menu.separator   || '─')}
          ${menuField('itemPrefix',  'Prefixo Item',    menu.itemPrefix  || '┣')}
          ${menuField('headerTexto', 'Título do Menu',  menu.headerTexto || 'MENU')}
        </div>
        <div style="display:flex;gap:16px;flex-wrap:wrap;margin-top:14px">
          <label class="toggle-wrap">
            <label class="toggle">
              <input type="checkbox" id="menuNegrito" ${menu.negrito ? 'checked' : ''}>
              <span class="toggle-track"></span>
            </label>
            <span class="toggle-label">Texto em negrito</span>
          </label>
          <label class="toggle-wrap">
            <label class="toggle">
              <input type="checkbox" id="menuItalico" ${menu.italico ? 'checked' : ''}>
              <span class="toggle-track"></span>
            </label>
            <span class="toggle-label">Texto em itálico</span>
          </label>
        </div>
        <div style="margin-top:14px">
          <button class="btn btn-primary" id="saveMenuBtn">${ICONS.save} Salvar Menu</button>
        </div>
      </div>
    `

    el.querySelectorAll('[data-tema]').forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          await POST('/api/design/apply', { tema: btn.dataset.tema })
          toastSuccess(`Tema "${btn.dataset.tema}" aplicado!`)
          await loadConfig()
          renderMenu()
        } catch (e) { toastError('Erro', e.message) }
      })
    })

    document.getElementById('saveMenuBtn')?.addEventListener('click', async () => {
      const body = {
        borderTop:   document.getElementById('menu_borderTop')?.value,
        borderBot:   document.getElementById('menu_borderBot')?.value,
        borderSide:  document.getElementById('menu_borderSide')?.value,
        separator:   document.getElementById('menu_separator')?.value,
        itemPrefix:  document.getElementById('menu_itemPrefix')?.value,
        headerTexto: document.getElementById('menu_headerTexto')?.value,
        negrito:     document.getElementById('menuNegrito')?.checked,
        italico:     document.getElementById('menuItalico')?.checked,
      }
      try {
        await POST('/api/config/menu', body)
        toastSuccess('Menu salvo!')
        await loadConfig()
      } catch (e) { toastError('Erro', e.message) }
    })
  }

  function menuField(key, label, val) {
    return `
      <div class="form-group">
        <label class="form-label">${label}</label>
        <input class="form-input mono" id="menu_${key}" value="${escHtml(val)}">
      </div>
    `
  }

  /* ── Permissões por Comando ──────────────────────────── */
  async function renderPerms() {
    const el = document.getElementById('tab-cfperms')
    if (!el) return

    el.innerHTML = `<div class="loading"><div class="spinner"></div></div>`

    try {
      const [cmds, perms] = await Promise.all([
        GET('/api/commands'),
        GET('/api/cmdperms'),
      ])

      el.innerHTML = `
        <div class="alert alert-info" style="margin-bottom:16px">
          ${ICONS.info}
          <div>Permissões por comando sobrescrevem as permissões padrão da categoria.</div>
        </div>
        <div class="filter-bar" style="margin-bottom:14px">
          <input class="form-input" id="permsSearch" placeholder="🔍 Filtrar comandos...">
        </div>
        <div class="table-wrap">
          <table id="permsTable">
            <thead>
              <tr>
                <th>Comando</th>
                <th>Categoria</th>
                <th>Nível mínimo</th>
                <th>Escopo</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              ${cmds.map(cmd => {
                const p = perms[cmd.name] || {}
                return `
                  <tr data-cmd="${escHtml(cmd.name)}">
                    <td><code>${escHtml(cmd.name)}</code></td>
                    <td>${cmdCategoryBadge(cmd.category)}</td>
                    <td>
                      <select class="form-select" style="width:130px" data-field="minRole">
                        <option value="" ${!p.minRole?'selected':''}>Padrão da categoria</option>
                        <option value="1" ${p.minRole==1?'selected':''}>1 — Dono</option>
                        <option value="2" ${p.minRole==2?'selected':''}>2 — Sub-Dono</option>
                        <option value="3" ${p.minRole==3?'selected':''}>3 — Admin Grupo</option>
                        <option value="4" ${p.minRole==4?'selected':''}>4 — VIP</option>
                        <option value="5" ${p.minRole==5?'selected':''}>5 — Todos</option>
                      </select>
                    </td>
                    <td>
                      <select class="form-select" style="width:130px" data-field="allowedIn">
                        <option value="both"    ${(p.allowedIn||'both')==='both'?'selected':''}>Grupos + Privado</option>
                        <option value="group"   ${p.allowedIn==='group'?'selected':''}>Só grupos</option>
                        <option value="private" ${p.allowedIn==='private'?'selected':''}>Só privado</option>
                      </select>
                    </td>
                    <td>
                      <button class="btn btn-sm btn-secondary save-perm" data-name="${escHtml(cmd.name)}">${ICONS.save}</button>
                      ${p.minRole||p.allowedIn ? `<button class="btn btn-sm btn-ghost reset-perm" data-name="${escHtml(cmd.name)}" style="color:var(--red)">${ICONS.trash}</button>` : ''}
                    </td>
                  </tr>
                `
              }).join('')}
            </tbody>
          </table>
        </div>
      `

      // Filtro
      document.getElementById('permsSearch')?.addEventListener('input', e => {
        const q = e.target.value.toLowerCase()
        document.querySelectorAll('#permsTable tbody tr').forEach(tr => {
          tr.style.display = tr.dataset.cmd.includes(q) ? '' : 'none'
        })
      })

      // Salvar perm individual
      el.querySelectorAll('.save-perm').forEach(btn => {
        btn.addEventListener('click', async () => {
          const name = btn.dataset.name
          const row  = btn.closest('tr')
          const minRole   = row.querySelector('[data-field="minRole"]')?.value || null
          const allowedIn = row.querySelector('[data-field="allowedIn"]')?.value || 'both'
          try {
            await POST(`/api/cmdperms/${encodeURIComponent(name)}`,
              { minRole: minRole ? parseInt(minRole) : null, allowedIn })
            toastSuccess(`Permissão de "${name}" salva!`)
          } catch (e) { toastError('Erro', e.message) }
        })
      })

      // Resetar perm
      el.querySelectorAll('.reset-perm').forEach(btn => {
        btn.addEventListener('click', async () => {
          try {
            await DELETE(`/api/cmdperms/${encodeURIComponent(btn.dataset.name)}`)
            toastSuccess('Permissão resetada!')
            await renderPerms()
          } catch (e) { toastError('Erro', e.message) }
        })
      })
    } catch (e) { toastError('Erro', e.message) }
  }

  function cleanup() {}

  return { render, cleanup }
})()
