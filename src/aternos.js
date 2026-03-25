// ══════════════════════════════════════════════════════════
//  aternos.js — Cliente Aternos (ES Module)
//  Coloque em: bot/src/aternos.js
// ══════════════════════════════════════════════════════════
import axios from 'axios'
import * as cheerio from 'cheerio'

export class AternosClient {
  constructor() {
    this.cookieString  = ''
    this.baseURL       = 'https://aternos.org'
    this._secCache     = null
    this._secCacheTime = 0
    this.SEC_CACHE_TTL = 60 * 1000 // 60 segundos
  }

  // ─── Cookies ───────────────────────────────────────────
  setCookies(cookieString) {
    this.cookieString = cookieString.trim()
    this._secCache    = null
    console.log('[Aternos] Cookies atualizados.')
  }

  hasCookies() {
    return this.cookieString.length > 0
  }

  // ─── Headers ───────────────────────────────────────────
  _headers(extra = {}) {
    return {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      Cookie:          this.cookieString,
      Referer:         'https://aternos.org/server/',
      Origin:          'https://aternos.org',
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      ...extra,
    }
  }

  // ─── Token SEC ─────────────────────────────────────────
  async _getSEC() {
    const now = Date.now()
    if (this._secCache && now - this._secCacheTime < this.SEC_CACHE_TTL) {
      return this._secCache
    }

    console.log('[Aternos] Buscando token SEC...')
    const { data: html } = await axios.get(`${this.baseURL}/server/`, {
      headers: this._headers(),
      timeout: 20000,
    })

    const patterns = [
      /(?:var\s+)?SEC\s*=\s*["']([a-zA-Z0-9]+)["']/,
      /["']SEC["']\s*:\s*["']([a-zA-Z0-9]+)["']/,
      /atPage\.SEC\s*=\s*["']([a-zA-Z0-9]+)["']/,
      /window\.SEC\s*=\s*["']([a-zA-Z0-9]+)["']/,
    ]

    let sec = null
    for (const p of patterns) {
      const m = html.match(p)
      if (m) { sec = m[1]; break }
    }

    if (!sec) {
      const $ = cheerio.load(html)
      sec = $('meta[name="SEC"]').attr('content') || null
    }

    if (!sec) {
      throw new Error('Token SEC não encontrado. Verifique se os cookies estão corretos.')
    }

    this._secCache     = sec
    this._secCacheTime = now
    console.log(`[Aternos] SEC obtido: ${sec.substring(0, 6)}...`)
    return sec
  }

  _randomToken() {
    return Math.random().toString(36).substring(2, 12)
  }

  // ─── Requisição AJAX ───────────────────────────────────
  async _ajax(endpoint) {
    if (!this.hasCookies()) {
      throw new Error('Cookies não configurados! Use !mccookie para configurar.')
    }

    const sec = await this._getSEC()
    const url = `${this.baseURL}/panel/ajax/${endpoint}.php`

    const { data } = await axios.get(url, {
      params:  { SEC: sec, TOKEN: this._randomToken() },
      headers: this._headers({ 'X-Requested-With': 'XMLHttpRequest' }),
      timeout: 15000,
    })

    return data
  }

  // ─── Ações públicas ────────────────────────────────────
  async getStatus() {
    const data = await this._ajax('status')
    return this._parseStatus(data)
  }

  async start() {
    const data = await this._ajax('start')
    this._secCache = null
    return data
  }

  async stop() {
    const data = await this._ajax('stop')
    this._secCache = null
    return data
  }

  async restart() {
    const data = await this._ajax('restart')
    this._secCache = null
    return data
  }

  // ─── Parser de status ──────────────────────────────────
  _parseStatus(raw) {
    if (typeof raw === 'string') {
      try { raw = JSON.parse(raw) } catch { /* mantém */ }
    }

    return {
      status:   raw?.class || raw?.status || raw?.info?.class || 'unknown',
      players: {
        now:  raw?.players?.now  ?? raw?.online ?? 0,
        max:  raw?.players?.max  ?? raw?.slots  ?? 0,
        list: raw?.playerlist    ?? raw?.players?.list ?? [],
      },
      ip:       raw?.ip       || raw?.address || '',
      software: raw?.software ?? '',
      version:  raw?.version  ?? '',
      raw,
    }
  }
}

// Instância global compartilhada entre os comandos
export const aternos = new AternosClient()
