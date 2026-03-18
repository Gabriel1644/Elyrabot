import Groq from 'groq-sdk'
import { CONFIG } from './config.js'

// Histórico por chat (máximo 20 mensagens)
const historico = new Map()

// ── Lazy init: instancia o cliente só quando necessário ──
// Isso evita crash no boot caso a GROQ_API_KEY ainda não esteja no env
let _groq = null
function getGroq() {
  const key = CONFIG.groqKey || process.env.GROQ_API_KEY
  if (!key) throw new Error('GROQ_API_KEY não configurada. Execute "npm run config" ou adicione no .env')
  // Recria o cliente se a chave mudou (ex: via painel)
  if (!_groq || _groq._options?.apiKey !== key) {
    _groq = new Groq({ apiKey: key })
  }
  return _groq
}

export async function handleAIResponse(pergunta, chatId = null, clearHistory = false) {
  if (clearHistory && chatId) { historico.delete(chatId); return '🧹 Histórico limpo!' }

  const hist = chatId ? (historico.get(chatId) || []) : []

  try {
    const groq = getGroq()
    const msgs = [
      { role: 'system', content: CONFIG.personalidade },
      ...hist,
      { role: 'user', content: pergunta }
    ]

    const res = await groq.chat.completions.create({
      model:      CONFIG.modelo || 'llama-3.3-70b-versatile',
      messages:   msgs,
      max_tokens: 1024
    })

    const resposta = res.choices[0].message.content

    if (chatId) {
      hist.push({ role: 'user',      content: pergunta })
      hist.push({ role: 'assistant', content: resposta })
      historico.set(chatId, hist.slice(-20))
    }

    return resposta
  } catch (e) {
    if (e.message?.includes('API key') || e.message?.includes('GROQ_API_KEY'))
      return '❌ Chave Groq inválida ou ausente. Configure no .env ou no painel.'
    if (e.message?.includes('model'))
      return `❌ Modelo inválido: ${CONFIG.modelo}. Tente llama-3.3-70b-versatile`
    return `❌ Erro na IA: ${e.message}`
  }
}

export function clearHistory(chatId) {
  historico.delete(chatId)
}

export function getHistorySize(chatId) {
  return historico.get(chatId)?.length || 0
}
