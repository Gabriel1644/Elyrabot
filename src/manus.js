// ══════════════════════════════════════════════════════════
//  manus.js — Agente autônomo multi-step com Groq tool-calling
//
//  Resposta estruturada em JSON quando o objetivo for
//  criar/corrigir um comando:
//  {
//    "type": "command",
//    "name": "nomecmd",
//    "category": "fun",
//    "code": "export default { ... }",
//    "message": "explicação"
//  }
//  Para respostas normais retorna { "type": "text", "message": "..." }
// ══════════════════════════════════════════════════════════
import axios   from 'axios'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs   from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import Groq from 'groq-sdk'
import { CONFIG } from './config.js'

const execAsync = promisify(exec)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT      = path.resolve(__dirname, '..')

// ── Ferramentas ───────────────────────────────────────────
const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'think',
      description: 'Registra raciocínio interno — use para planejar antes de agir.',
      parameters: {
        type: 'object',
        properties: { thought: { type: 'string' } },
        required: ['thought']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'web_search',
      description: 'Busca informações na internet.',
      parameters: {
        type: 'object',
        properties: { query: { type: 'string' } },
        required: ['query']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'http_get',
      description: 'Faz GET em uma URL e retorna o conteúdo JSON ou texto.',
      parameters: {
        type: 'object',
        properties: {
          url:    { type: 'string' },
          params: { type: 'object', additionalProperties: { type: 'string' } }
        },
        required: ['url']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'exec_shell',
      description: 'Executa um comando no shell do Termux e retorna stdout/stderr.',
      parameters: {
        type: 'object',
        properties: { command: { type: 'string' } },
        required: ['command']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'read_file',
      description: 'Lê o conteúdo de um arquivo. Caminhos relativos são na pasta do bot.',
      parameters: {
        type: 'object',
        properties: { filepath: { type: 'string' } },
        required: ['filepath']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'write_file',
      description: 'Cria ou sobrescreve um arquivo com o conteúdo fornecido.',
      parameters: {
        type: 'object',
        properties: {
          filepath: { type: 'string' },
          content:  { type: 'string' }
        },
        required: ['filepath', 'content']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_command',
      description: 'Cria e instala um novo comando no bot. Use quando o objetivo for adicionar funcionalidade.',
      parameters: {
        type: 'object',
        properties: {
          name:        { type: 'string', description: 'Nome do comando (sem prefixo)' },
          category:    { type: 'string', enum: ['fun','games','media','info','tools','admin','owner','misc'] },
          code:        { type: 'string', description: 'Código JS ES Module completo do comando' },
          description: { type: 'string', description: 'O que o comando faz' }
        },
        required: ['name', 'category', 'code', 'description']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'fix_command',
      description: 'Corrige o código de um comando existente que está com erro.',
      parameters: {
        type: 'object',
        properties: {
          name:     { type: 'string', description: 'Nome do comando com erro' },
          new_code: { type: 'string', description: 'Código JS corrigido completo' },
          reason:   { type: 'string', description: 'O que foi corrigido' }
        },
        required: ['name', 'new_code', 'reason']
      }
    }
  }
]

// ── Executor de ferramentas ───────────────────────────────
async function executeTool(name, args, onStep) {
  switch (name) {

    case 'think':
      return `💭 ${args.thought}`

    case 'web_search': {
      try {
        // HTML endpoint do DuckDuckGo (resultados reais, não só instant answers)
        const r = await axios.get('https://html.duckduckgo.com/html/', {
          params: { q: args.query },
          headers: {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 11) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml',
            'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
          },
          timeout: 14000
        })
        const html = String(r.data)
        const clean = s => s.replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&#x27;/g,"'").replace(/&quot;/g,'"').replace(/\s+/g,' ').trim()
        const results = []
        const titleRe = /<a[^>]+class="result__a"[^>]*>(.*?)<\/a>/gi
        const snipRe  = /<a[^>]+class="result__snippet"[^>]*>(.*?)<\/a>/gi
        const titles = []; let tm
        while ((tm = titleRe.exec(html)) !== null && titles.length < 6) titles.push(clean(tm[1]))
        let sm, si = 0
        while ((sm = snipRe.exec(html)) !== null && si < 6) {
          const title = titles[si] ? `**${titles[si]}**` : ''
          results.push(`${title}\n${clean(sm[1])}`); si++
        }
        if (results.length > 0) return results.join('\n\n').substring(0, 2000)
        // Fallback para a API JSON (Instant Answers)
        const r2 = await axios.get('https://api.duckduckgo.com/', {
          params: { q: args.query, format: 'json', no_html: 1, no_redirect: 1 },
          headers: { 'User-Agent': 'ElyraBot/2.1' }, timeout: 10000
        })
        const d   = r2.data
        const hits = (d.RelatedTopics || []).slice(0, 6).map(t => t.Text).filter(Boolean).join('\n')
        return (`${d.AbstractText || ''}\n${hits}`).substring(0, 1500) || 'Sem resultados encontrados.'
      } catch (e) { return `Erro na busca: ${e.message}` }
    }

    case 'http_get': {
      try {
        const r = await axios.get(args.url, {
          params:  args.params || {},
          timeout: 12000,
          headers: { 'User-Agent': 'ElyraBot/2.1' }
        })
        const body = typeof r.data === 'object' ? JSON.stringify(r.data, null, 2) : String(r.data)
        return body.substring(0, 2000)
      } catch (e) { return `Erro HTTP: ${e.message}` }
    }

    case 'exec_shell': {
      try {
        const { stdout, stderr } = await execAsync(args.command, { timeout: 15000, cwd: ROOT })
        return ((stdout || '') + (stderr ? `\nSTDERR: ${stderr}` : '')).substring(0, 1000) || '(sem saída)'
      } catch (e) { return `Erro: ${e.message.substring(0, 400)}` }
    }

    case 'read_file': {
      try {
        const fp = path.isAbsolute(args.filepath) ? args.filepath : path.join(ROOT, args.filepath)
        if (!fs.existsSync(fp)) return `Arquivo não encontrado: ${args.filepath}`
        return fs.readFileSync(fp, 'utf-8').substring(0, 2000)
      } catch (e) { return `Erro ao ler: ${e.message}` }
    }

    case 'write_file': {
      try {
        const fp = path.isAbsolute(args.filepath) ? args.filepath : path.join(ROOT, args.filepath)
        fs.mkdirSync(path.dirname(fp), { recursive: true })
        fs.writeFileSync(fp, args.content, 'utf-8')
        return `✅ Arquivo salvo: ${args.filepath}`
      } catch (e) { return `Erro ao salvar: ${e.message}` }
    }

    case 'create_command': {
      try {
        const { createCommand, getCommand } = await import('./loader.js')
        if (getCommand(args.name)) {
          return JSON.stringify({ type: 'command_exists', name: args.name })
        }
        await createCommand({ name: args.name, code: args.code, category: args.category })
        // Registra para contribuição
        const { registerForContribution } = await import('./contributions.js')
        registerForContribution({ name: args.name, category: args.category, code: args.code, description: args.description || '', author: 'manus' })
        return JSON.stringify({
          type: 'command_created',
          name: args.name,
          category: args.category,
          description: args.description,
          code: args.code
        })
      } catch (e) { return `Erro ao criar: ${e.message}` }
    }

    case 'fix_command': {
      try {
        const { createCommand, getCommand } = await import('./loader.js')
        const cmd = getCommand(args.name)
        const cat = cmd?.category || 'misc'
        await createCommand({ name: args.name, code: args.new_code, category: cat })
        return JSON.stringify({
          type: 'command_fixed',
          name: args.name,
          reason: args.reason,
          code: args.new_code
        })
      } catch (e) { return `Erro ao corrigir: ${e.message}` }
    }

    default:
      return `Ferramenta desconhecida: ${name}`
  }
}

// ── Prompt do sistema ─────────────────────────────────────
const SYSTEM = `Você é Manus, agente autônomo integrado ao ElyraBot (WhatsApp bot com @whiskeysockets/baileys, Node.js ES Modules).

Você tem acesso a ferramentas reais. Use-as na ordem lógica:
1. "think" — sempre planeje antes de agir
2. Execute as ferramentas necessárias
3. Retorne a resposta final em português, clara e objetiva

QUANDO criar ou corrigir comandos:
- Use a ferramenta "create_command" ou "fix_command" — NÃO escreva JSON manual
- O código deve ser JS válido ES Module, exportando default com a estrutura correta
- Sempre adicione tratamento de erros (try/catch) nos comandos

ESTRUTURA DE COMANDO VÁLIDA:
export default {
  name: 'nomecmd',
  aliases: ['alias1'],
  description: 'Descrição',
  category: 'fun',
  usage: '!nomecmd <arg>',
  cooldown: 5,
  async execute({ sock, msg, from, userId, usuario, args, argStr, reply, isAdmin, isOwner }) {
    // código aqui
  }
}

Para respostas de texto normal, seja direto e útil.`

// ── Sessões ───────────────────────────────────────────────
const sessions = new Map()

export async function runAgent(objetivo, userId, onStep = null) {
  const key = CONFIG.groqKey || process.env.GROQ_API_KEY
  if (!key) throw new Error('GROQ_API_KEY não configurada')

  const groq = new Groq({ apiKey: key })
  const history = sessions.get(userId) || []

  const messages = [
    { role: 'system', content: SYSTEM },
    ...history,
    { role: 'user', content: objetivo }
  ]

  let passos = 0
  const MAX = 10
  let commandResult = null   // armazena resultado de create/fix

  while (passos++ < MAX) {
    const resp = await groq.chat.completions.create({
      model:       CONFIG.modelo || 'llama-3.3-70b-versatile',
      messages,
      tools:       TOOLS,
      tool_choice: 'auto',
      max_tokens:  2048,
      temperature: 0.2,
    })

    const choice  = resp.choices[0]
    const message = choice.message
    messages.push(message)

    // Sem tool calls → resposta final
    if (!message.tool_calls?.length) {
      const texto = message.content || 'Tarefa concluída.'

      // Atualiza sessão
      history.push({ role: 'user',      content: objetivo })
      history.push({ role: 'assistant', content: texto })
      sessions.set(userId, history.slice(-20))

      // Retorna junto com resultado de comando se houver
      return { text: texto, commandResult }
    }

    // Executa ferramentas
    for (const call of message.tool_calls) {
      const toolName = call.function.name
      let   toolArgs = {}
      try { toolArgs = JSON.parse(call.function.arguments) } catch {}

      if (onStep && toolName !== 'think') {
        const preview = JSON.stringify(toolArgs).replace(/\\n/g, ' ').substring(0, 70)
        await onStep(`🔧 _${toolName}_ \`${preview}\``)
      }

      const resultado = await executeTool(toolName, toolArgs, onStep)

      // Se foi create/fix, salva o resultado estruturado
      if ((toolName === 'create_command' || toolName === 'fix_command')) {
        try {
          const parsed = JSON.parse(resultado)
          if (parsed.type?.startsWith('command_')) commandResult = parsed
        } catch {}
      }

      messages.push({
        role:         'tool',
        tool_call_id: call.id,
        content:      resultado,
      })
    }
  }

  return { text: '⚠️ Limite de passos atingido. Tente ser mais específico.', commandResult }
}

export function clearAgentSession(userId) {
  sessions.delete(userId)
}

// ── Fix direto de um comando com erro ─────────────────────
export async function fixBotError(cmdName, errorMsg, sourceCode) {
  const key = CONFIG.groqKey || process.env.GROQ_API_KEY
  if (!key) throw new Error('GROQ_API_KEY não configurada')

  const groq = new Groq({ apiKey: key })
  const resp = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{
      role: 'user',
      content: `Corrija este comando de bot WhatsApp. Responda APENAS com o código JS corrigido. Sem explicações, sem markdown.\n\nComando: ${cmdName}\nErro: ${errorMsg}\n\nCódigo:\n${sourceCode}`
    }],
    max_tokens: 2000,
    temperature: 0.1,
  })

  let code = resp.choices[0].message.content.trim()
  return code.replace(/^```(?:javascript|js)?\n?/m, '').replace(/\n?```$/m, '').trim()
}
