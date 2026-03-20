import { runAgent, clearAgentSession } from '../../manus.js'
import { uploadCommand, checkForUpdates, getGitStatus, initGit, pushFullBot, setToken } from '../../github.js'
import { CONFIG } from '../../config.js'

export const agente = {
  name: 'agente',
  aliases: ['manus', 'agent', 'tarefa', 'fazer'],
  description: 'Agente IA autônomo — pesquisa, shell, cria comandos, corrige erros',
  category: 'owner',
  usage: '!agente <descreva a tarefa>',
  cooldown: 15,
  async execute({ reply, sock, from, msg, argStr, isOwner, isSubdono, userId, prefix: p }) {
    if (!isOwner && !isSubdono) return reply('❌ Apenas dono ou sub-dono podem usar o agente.')
    if (!argStr) return reply(
      `🤖 *Agente Manus*\n\n` +
      `Executo tarefas de forma autônoma:\n\n` +
      `• 🔍 Pesquisar na web\n` +
      `• 🖥️ Comandos Termux\n` +
      `• 📁 Ler/escrever arquivos\n` +
      `• ⚡ Criar comandos automaticamente\n` +
      `• 🔧 Corrigir comandos com erro\n` +
      `• 🌐 Requisições HTTP\n\n` +
      `*Exemplos:*\n` +
      `${p}agente crie um comando que busca a hora de qualquer cidade\n` +
      `${p}agente corrija o erro no comando !ytmp3\n` +
      `${p}agente qual é o uso de RAM agora?`
    )

    const prog = await sock.sendMessage(from, { text: `🤖 _Iniciando agente..._`, quoted: msg })

    const steps = []
    const onStep = async (txt) => {
      steps.push(txt)
      try {
        await sock.sendMessage(from, { text: txt, quoted: msg })
      } catch {}
    }

    try {
      const result = await runAgent(argStr, userId, onStep)

      // Monta resposta final
      let resposta = `✅ *Concluído!*\n\n${result.text}`

      if (result.commandResult) {
        const cr = result.commandResult
        const tipo = cr.type === 'command_created' ? 'criado' : 'corrigido'
        resposta = `✅ *Comando !${cr.name} ${tipo}!*\n\n`
        if (cr.description) resposta += `📝 ${cr.description}\n`
        resposta += `📦 Categoria: _${cr.category}_\n`
        if (cr.reason) resposta += `🔧 Correção: _${cr.reason}_\n`
        resposta += `\n_Use: ${CONFIG.prefixo}${cr.name}_`
        if (result.text && result.text.length > 10) resposta += `\n\n${result.text}`

        // Auto-upload para GitHub
        if (CONFIG['github.repo'] && cr.code) {
          try {
            const up = await uploadCommand({
              name: cr.name, category: cr.category,
              code: cr.code, description: cr.description
            })
            if (up.ok) resposta += `\n\n🐙 _Publicado no GitHub!_`
            else resposta += `\n\n⚠️ _GitHub: ${up.reason}_`
          } catch {}
        }
      }

      await sock.sendMessage(from, { text: resposta, quoted: msg })
    } catch (e) {
      await reply(`❌ Erro no agente: ${e.message}`)
    }
  }
}

export const agenteClear = {
  name: 'agenteclear',
  aliases: ['aclear', 'manusclear'],
  description: 'Limpa histórico de sessão do agente',
  category: 'owner',
  usage: '!aclear',
  cooldown: 3,
  async execute({ reply, userId, isOwner, isSubdono }) {
    if (!isOwner && !isSubdono) return reply('❌ Apenas dono ou sub-dono.')
    clearAgentSession(userId)
    await reply('🧹 Sessão do agente limpa!')
  }
}

export const gitCmd = {
  name: 'git',
  aliases: ['github', 'gh'],
  description: 'Gerencia integração com GitHub',
  category: 'owner',
  usage: '!git status | update | upload <cmd> | config <repo>',
  cooldown: 10,
  async execute({ reply, args, argStr, isOwner, prefix: p }) {
    if (!isOwner) return reply('❌ Apenas o dono.')
    const sub = args[0]?.toLowerCase()

    if (!sub || sub === 'status') {
      const s = await getGitStatus()
      if (!s.ok) return reply(`❌ Git: ${s.reason}\n\nInstale: \`pkg install git\`\nConfigure: !git config <url_do_repo>`)
      return reply(
        `🐙 *GitHub Status*\n\n` +
        `🌿 Branch: _${s.branch}_\n` +
        `🔗 Remote: _${s.remote || 'não configurado'}_\n\n` +
        `📋 Últimos commits:\n${s.recentCommits || '(nenhum)'}\n\n` +
        `_Use ${p}git update para verificar atualizações_`
      )
    }

    if (sub === 'update' || sub === 'atualizar') {
      await reply('🔄 Verificando atualizações...')
      const r = await checkForUpdates()
      if (r.updated) {
        const { loadCommands } = await import('../../loader.js')
        await loadCommands()
        return reply(`✅ Atualizado! ${r.commits} commit(s) aplicado(s).\n\n_Comandos recarregados._`)
      }
      return reply(`✅ Já está na versão mais recente!\n_${r.reason}_`)
    }

    if (sub === 'push' || sub === 'sync' || sub === 'enviar') {
      await reply('📤 Sincronizando com GitHub...')
      const r = await pushFullBot()
      return reply(r.ok ? r.message : ('❌ ' + r.reason))
    }

    if (sub === 'config' || sub === 'configurar') {
      const repoUrl = args.slice(1).join(' ')
      if (!repoUrl) return reply('❌ Uso: !git config <https://github.com/user/repo.git>')
      CONFIG['github.repo'] = repoUrl
      await initGit({ repoUrl, userName: CONFIG.nome, userEmail: `${CONFIG.owner}@bot.local` })
      return reply(`✅ GitHub configurado!\n🔗 ${repoUrl}\n\nDica: para push automático, use URL com token:\nhttps://TOKEN@github.com/user/repo.git`)
    }

    if (sub === 'token') {
      const token = args[1]
      if (!token) return reply(
        '❌ Uso: *!git token SEU_TOKEN*\n\n' +
        'Crie um token em:\nhttps://github.com/settings/tokens/new\n\n' +
        'Permissão necessária: *repo* (Full control of private repositories)'
      )
      await reply('🔑 Configurando token...')
      const r = await setToken(token)
      if (r.ok) return reply(`✅ Token configurado!\nRemote: _${r.url}_\n\nAgora use *!git push* para sincronizar.`)
      return reply('❌ ' + r.reason)
    }

    if (sub === 'upload' || sub === 'publicar') {
      const cmdName = args[1]
      if (!cmdName) return reply('❌ Uso: !git upload <nome_do_comando>')
      const { getCommand, getCommandSource } = await import('../../loader.js')
      const cmd = getCommand(cmdName)
      if (!cmd) return reply(`❌ Comando *!${cmdName}* não encontrado.`)
      const code = getCommandSource(cmdName)
      if (!code) return reply(`❌ Código-fonte de *!${cmdName}* não encontrado.`)
      await reply('📤 Publicando no GitHub...')
      const up = await uploadCommand({ name: cmdName, category: cmd.category, code, description: cmd.description })
      return reply(up.ok ? up.message : up.reason)
    }

    return reply(
      `🐙 *GitHub*\n\n` +
      `${p}git status       — Status e últimos commits\n` +
      `${p}git push         — Envia bot para o GitHub\n` +
      `${p}git update       — Busca e aplica atualizações\n` +
      `${p}git config <url> — Configura repositório\n` +
      `${p}git token <tok>  — Define token de acesso\n` +
      `${p}git upload <cmd> — Publica um comando\n\n` +
      `_Exemplo rápido:_\n` +
      `1. ${p}git config https://github.com/voce/repo.git\n` +
      `2. ${p}git token ghp_SeuTokenAqui\n` +
      `3. ${p}git push`
    )
  }
}

export default [agente, agenteClear, gitCmd]
