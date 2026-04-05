/**
 * components/Webhooks.js
 * Gerenciamento de webhooks externos
 *
 * Endpoints:
 *   GET  /api/webhooks       → listar
 *   POST /api/webhooks       → criar
 *   DELETE /api/webhooks/:id → deletar
 *   POST /api/webhooks/test  → testar
 */
const PageWebhooks = (() => {

  async function render(container) {
    container.innerHTML = `
      <div class="section">
        <div class="section-header">
          <span class="section-title">${ICONS.link} Webhooks</span>
          <button class="btn btn-primary btn-sm" id="newWebhookBtn">${ICONS.plus} Novo Webhook</button>
        </div>

        <div class="alert alert-info" style="margin-bottom:16px">
          ${ICONS.info}
          <div>Webhooks recebem eventos do bot (mensagens, comandos, etc.) e enviam para uma URL externa via HTTP POST.</div>
        </div>

        <div id="webhookList"><div class="loading"><div class="spinner"></div></div></div>
      </div>

      <!-- Seção de teste -->
      <div class="section">
        <div class="card">
          <div class="card-header">
            <span class="card-title">${ICONS.zap} Testar Webhook</span>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">URL para testar</label>
              <input class="form-input" id="testWebhookUrl" placeholder="https://webhook.site/...">
            </div>
            <div class="form-group" style="flex:0 0 auto;justify-content:flex-end">
              <label class="form-label">&nbsp;</label>
              <button class="btn btn-secondary" id="testWebhookBtn">${ICONS.zap} Testar</button>
            </div>
          </div>
          <div id="testResult" style="display:none;margin-top:10px"></div>
        </div>
      </div>
    `

    await loadWebhooks()
    bindEvents()
  }

  async function loadWebhooks() {
    const el = document.getElementById('webhookList')
    if (!el) return

    try {
      const hooks = await GET('/api/webhooks')

      if (!hooks.length) {
        el.innerHTML = `
          <div class="empty-state">
            ${ICONS.link}
            <h3>Nenhum webhook cadastrado</h3>
            <p>Webhooks permitem integrar o bot com serviços externos (n8n, Make, Zapier...)</p>
          </div>
        `
        return
      }

      el.innerHTML = hooks.map(h => `
        <div class="hook-item" style="margin-bottom:8px">
          <div style="flex:1;min-width:0">
            <div class="hook-name">${escHtml(h.name)}</div>
            <div class="hook-url">${escHtml(h.url)}</div>
          </div>
          <span class="badge ${h.enabled ? 'badge-green' : 'badge-red'}">${h.enabled ? 'Ativo' : 'Inativo'}</span>
          <div class="hook-actions">
            <button class="btn-icon" data-test-hook="${escHtml(h.url)}" title="Testar">${ICONS.zap}</button>
            <button class="btn-icon" data-del-hook="${escHtml(h.id)}" title="Deletar" style="color:var(--red)">${ICONS.trash}</button>
          </div>
        </div>
      `).join('')

      // Deletar
      el.querySelectorAll('[data-del-hook]').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (!confirm('Deletar este webhook?')) return
          try {
            await DELETE(`/api/webhooks/${encodeURIComponent(btn.dataset.delHook)}`)
            toastSuccess('Webhook removido!')
            await loadWebhooks()
          } catch (e) { toastError('Erro', e.message) }
        })
      })

      // Testar específico
      el.querySelectorAll('[data-test-hook]').forEach(btn => {
        btn.addEventListener('click', () => {
          document.getElementById('testWebhookUrl').value = btn.dataset.testHook
          testWebhook(btn.dataset.testHook)
        })
      })
    } catch (e) { toastError('Erro ao carregar webhooks', e.message) }
  }

  async function testWebhook(url) {
    const resultEl = document.getElementById('testResult')
    if (!url) { url = document.getElementById('testWebhookUrl')?.value.trim() }
    if (!url) return toastWarning('Informe uma URL')

    if (resultEl) {
      resultEl.style.display = 'block'
      resultEl.innerHTML = `<div class="loading"><div class="spinner"></div> Enviando...</div>`
    }

    try {
      const r = await POST('/api/webhooks/test', { url })
      if (resultEl) {
        resultEl.innerHTML = r.ok
          ? `<div class="alert alert-success">${ICONS.check} <div>Sucesso! Status: ${r.status}</div></div>`
          : `<div class="alert alert-danger">${ICONS.warn} <div>Falha: ${escHtml(r.error || 'Erro desconhecido')} | Status: ${r.status||'—'}</div></div>`
      }
    } catch (e) {
      if (resultEl) resultEl.innerHTML = `<div class="alert alert-danger">${ICONS.x} <div>${escHtml(e.message)}</div></div>`
    }
  }

  function bindEvents() {
    document.getElementById('newWebhookBtn')?.addEventListener('click', openNewModal)
    document.getElementById('testWebhookBtn')?.addEventListener('click', () => {
      const url = document.getElementById('testWebhookUrl')?.value.trim()
      testWebhook(url)
    })
  }

  function openNewModal() {
    const { el, close } = createModal({
      title: 'Novo Webhook',
      icon: ICONS.link,
      body: `
        <div style="display:flex;flex-direction:column;gap:12px">
          <div class="form-group">
            <label class="form-label">Nome *</label>
            <input class="form-input" id="wName" placeholder="Meu webhook n8n">
          </div>
          <div class="form-group">
            <label class="form-label">URL *</label>
            <input class="form-input" id="wUrl" placeholder="https://n8n.meusite.com/webhook/abc">
            <span class="form-hint">Receberá um HTTP POST com os eventos do bot</span>
          </div>
          <label class="toggle-wrap">
            <label class="toggle"><input type="checkbox" id="wEnabled" checked><span class="toggle-track"></span></label>
            <span class="toggle-label">Ativo desde já</span>
          </label>
        </div>
      `,
      footer: `
        <button class="btn btn-secondary" id="wClose">Cancelar</button>
        <button class="btn btn-primary" id="wSave">${ICONS.save} Salvar</button>
      `
    })

    el.querySelector('#wClose')?.addEventListener('click', close)
    el.querySelector('#wSave')?.addEventListener('click', async () => {
      const name    = el.querySelector('#wName')?.value.trim()
      const url     = el.querySelector('#wUrl')?.value.trim()
      const enabled = el.querySelector('#wEnabled')?.checked

      if (!name || !url) return toastWarning('Preencha nome e URL')

      try {
        await POST('/api/webhooks', { name, url, enabled })
        toastSuccess('Webhook criado!')
        close()
        await loadWebhooks()
      } catch (e) { toastError('Erro', e.message) }
    })
  }

  return { render }
})()
