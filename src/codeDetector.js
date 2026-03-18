// ══════════════════════════════════════════════════════════
//  codeDetector.js — Detecta código solto no chat,
//  escaneia por malware, processa via Groq/Manus
//  e instala automaticamente como comando
// ══════════════════════════════════════════════════════════
import Groq from 'groq-sdk'
import { registerForContribution, notifyNewCommand } from './contributions.js'
import { CONFIG } from './config.js'
import { createCommand, getCommand } from './loader.js'
import { runAgent } from './manus.js'
import { logInfo, logOk, logWarn } from './logger.js'

// ── Heurística: é código JS? ──────────────────────────────
const CODE_PATTERNS = [
  /export\s+default\s*\{/,
  /async\s+function\s+\w+/,
  /import\s+\w+\s+from/,
  /const\s+\w+\s*=\s*(async\s*)?\(/,
  /\bmodule\.exports\b/,
  /\bexport\s+(const|function|class|default)\b/,
  /```(?:js|javascript)[\s\S]+```/,
  /(?:sock|reply|msg|from|argStr)\s*[=({]/
]

export function isLikelyCode(text) {
  if (text.length < 40) return false
  const hits = CODE_PATTERNS.filter(p => p.test(text)).length
  return hits >= 2
}

// ── Extrai código de bloco markdown ──────────────────────
function extractCode(text) {
  const match = text.match(/```(?:js|javascript)?\n?([\s\S]+?)```/)
  return match ? match[1].trim() : text.trim()
}

// ── Scan de malware via IA ────────────────────────────────
const MALWARE_PATTERNS = [
  /process\.env\b/,            // acesso a variáveis de ambiente
  /require\(['"]child_process/,
  /exec\s*\(\s*['"`]/,         // exec com string literal direta
  /fs\.(unlink|rmdir|rm)\b/,   // deleção de arquivos
  /\beval\s*\(/,               // eval
  /\bFunction\s*\(/,           // new Function
  /crypto\.createHash.*md5/i,  // hash de senha comum
  /wget|curl\s+http/,          // download externo via shell
  /rm\s+-rf/,                  // rm -rf
  /base64.*decode.*exec/i,     // execução de base64
]

function quickMalwareScan(code) {
  const flags = MALWARE_PATTERNS.filter(p => p.test(code))
  return { clean: flags.length === 0, flags: flags.map(p => p.toString()) }
}

async function deepMalwareScan(code) {
  const key = CONFIG.groqKey || process.env.GROQ_API_KEY
  if (!key) return { clean: true, reason: 'scan IA indisponível — usando verificação rápida' }

  try {
    const groq = new Groq({ apiKey: key })
    const resp = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{
        role: 'user',
        content: `Analise este código JavaScript e determine se é seguro para executar em um bot de WhatsApp.
Responda APENAS com JSON válido, sem markdown:
{"safe": true/false, "reason": "explicação curta em português", "risks": ["risco1","risco2"]}

Código:
${code.substring(0, 3000)}`
      }],
      max_tokens: 300,
      temperature: 0.1,
    })

    let txt = resp.choices[0].message.content.trim()
    txt = txt.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()
    return JSON.parse(txt)
  } catch {
    return { safe: true, reason: 'scan IA falhou — código passou pela verificação rápida' }
  }
}

// ── Pipeline completo de processamento ───────────────────
export async function processCodeInChat({ code, userId, sock, from, msg, usuario }) {
  logInfo(`🔍 Código detectado de ${usuario} — analisando...`)

  const raw = extractCode(code)

  // 1. Scan rápido
  const quickScan = quickMalwareScan(raw)
  if (!quickScan.clean) {
    logWarn(`Código rejeitado (scan rápido): ${quickScan.flags.join(', ')}`)
    return {
      ok: false,
      reason: `❌ Código rejeitado — padrões suspeitos detectados:\n${quickScan.flags.slice(0, 3).join('\n')}`
    }
  }

  // 2. Scan profundo com IA
  const deepScan = await deepMalwareScan(raw)
  if (!deepScan.safe) {
    logWarn(`Código rejeitado (scan IA): ${deepScan.reason}`)
    return {
      ok: false,
      reason: `❌ Código rejeitado pela IA:\n${deepScan.reason}\n\nRiscos: ${(deepScan.risks || []).join(', ')}`
    }
  }

  logOk(`Código limpo — processando com IA...`)

  // 3. Tenta processar como comando diretamente
  const isCommand = /export\s+default\s*\{/.test(raw) || /export\s+const\s+\w+\s*=/.test(raw)

  if (isCommand) {
    return await installRawCommand(raw, userId, sock, from)
  }

  // 4. Não é um comando pronto → manda pro Manus completar
  logInfo('Código incompleto — enviando ao Manus para completar...')
  const objetivo = `Recebo este trecho de código de um usuário. Complete-o como um comando de bot WhatsApp válido, instale-o usando create_command e retorne o resultado.\n\nCódigo recebido:\n${raw}`

  try {
    const result = await runAgent(objetivo, userId + '_code')
    return { ok: true, text: result.text, commandResult: result.commandResult }
  } catch (e) {
    return { ok: false, reason: `❌ Manus falhou: ${e.message}` }
  }
}

// ── Instala comando direto do código bruto ────────────────
async function installRawCommand(code, userId, sock, from) {
  const key = CONFIG.groqKey || process.env.GROQ_API_KEY
  if (!key) return { ok: false, reason: '❌ GROQ_API_KEY não configurada' }

  try {
    const groq = new Groq({ apiKey: key })
    const resp = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{
        role: 'user',
        content: `Analise este comando de bot WhatsApp e retorne APENAS JSON válido (sem markdown):
{
  "valid": true/false,
  "name": "nome_do_comando",
  "category": "fun|games|media|info|tools|admin|owner|misc",
  "description": "o que faz",
  "fixed_code": "código corrigido e completo se necessário, ou o mesmo se já estiver ok"
}

Código:
${code.substring(0, 3000)}`
      }],
      max_tokens: 2500,
      temperature: 0.1,
    })

    let txt = resp.choices[0].message.content.trim()
    txt = txt.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()
    const parsed = JSON.parse(txt)

    if (!parsed.valid || !parsed.name) {
      return { ok: false, reason: `❌ Código não reconhecido como comando válido.` }
    }

    // Verifica se já existe
    if (getCommand(parsed.name)) {
      return { ok: false, reason: `⚠️ Comando *!${parsed.name}* já existe. Use !alias para criar um atalho.` }
    }

    const finalCode = parsed.fixed_code || code
    await createCommand({ name: parsed.name, code: finalCode, category: parsed.category || 'misc' })

    logOk(`Comando !${parsed.name} instalado via detecção automática`)

    // Registra para contribuição
    registerForContribution({
      name:        parsed.name,
      category:    parsed.category || 'misc',
      code:        finalCode,
      description: parsed.description || '',
      author:      'auto-detect'
    })

    return {
      ok: true,
      commandResult: {
        type: 'command_created',
        name: parsed.name,
        category: parsed.category,
        description: parsed.description,
        code: finalCode
      }
    }
  } catch (e) {
    return { ok: false, reason: `❌ Erro ao processar: ${e.message}` }
  }
}
