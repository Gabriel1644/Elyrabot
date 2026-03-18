export const tagall = {
  name: 'tagall',
  aliases: ['marcarall', 'todos'],
  description: 'Marca todos do grupo (admin)',
  category: 'admin',
  usage: '!tagall [mensagem]',
  cooldown: 30,
  async execute({ sock, from, msg, membros, isGrupo, isAdmin, isOwner, argStr, reply }) {
    if (!isGrupo) return reply('❌ Use em grupos!')
    if (!isAdmin && !isOwner) return reply('❌ Apenas admins!')
    const jids = membros.map(m => m.id)
    const mentions = jids.map(j => `@${j.split('@')[0]}`).join(' ')
    const texto = argStr || '📢 Atenção a todos!'
    await sock.sendMessage(from, {
      text: `*${texto}*\n\n${mentions}`,
      mentions: jids
    }, { quoted: msg })
  }
}

export const fechargrupo = {
  name: 'fechar',
  aliases: ['lockgroup', 'lock'],
  description: 'Fecha o grupo para mensagens (admin)',
  category: 'admin',
  usage: '!fechar',
  cooldown: 5,
  async execute({ sock, from, reply, isGrupo, isAdmin, isOwner }) {
    if (!isGrupo) return reply('❌ Use em grupos!')
    if (!isAdmin && !isOwner) return reply('❌ Apenas admins!')
    try {
      await sock.groupSettingUpdate(from, 'announcement')
      await reply('🔒 Grupo fechado! Apenas admins podem enviar mensagens.')
    } catch { await reply('❌ Não tenho permissão para fechar o grupo.') }
  }
}

export const abrirgrupo = {
  name: 'abrir',
  aliases: ['unlockgroup', 'unlock'],
  description: 'Abre o grupo para todos enviarem (admin)',
  category: 'admin',
  usage: '!abrir',
  cooldown: 5,
  async execute({ sock, from, reply, isGrupo, isAdmin, isOwner }) {
    if (!isGrupo) return reply('❌ Use em grupos!')
    if (!isAdmin && !isOwner) return reply('❌ Apenas admins!')
    try {
      await sock.groupSettingUpdate(from, 'not_announcement')
      await reply('🔓 Grupo aberto! Todos podem enviar mensagens.')
    } catch { await reply('❌ Não tenho permissão.') }
  }
}

export const kick = {
  name: 'kick',
  aliases: ['expulsar', 'remover'],
  description: 'Expulsa um membro (admin)',
  category: 'admin',
  usage: '!kick @membro',
  cooldown: 5,
  async execute({ sock, from, msg, reply, isGrupo, isAdmin, isOwner, membros }) {
    if (!isGrupo) return reply('❌ Use em grupos!')
    if (!isAdmin && !isOwner) return reply('❌ Apenas admins!')
    const mencionados = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid ||
                        (msg.message?.extendedTextMessage?.contextInfo?.participant ? [msg.message.extendedTextMessage.contextInfo.participant] : [])
    if (!mencionados.length) return reply('❌ Mencione alguém para expulsar!')
    try {
      await sock.groupParticipantsUpdate(from, mencionados, 'remove')
      await reply(`✅ ${mencionados.map(j => `@${j.split('@')[0]}`).join(', ')} foi expulso!`)
    } catch { await reply('❌ Não consigo expulsar esse membro.') }
  }
}

export const promover = {
  name: 'promover',
  aliases: ['promote', 'admin'],
  description: 'Promove membro a admin (admin)',
  category: 'admin',
  usage: '!promover @membro',
  cooldown: 5,
  async execute({ sock, from, msg, reply, isGrupo, isAdmin, isOwner }) {
    if (!isGrupo) return reply('❌ Use em grupos!')
    if (!isAdmin && !isOwner) return reply('❌ Apenas admins!')
    const mencionados = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
    if (!mencionados.length) return reply('❌ Mencione alguém!')
    try {
      await sock.groupParticipantsUpdate(from, mencionados, 'promote')
      await reply(`⬆️ ${mencionados.map(j => `@${j.split('@')[0]}`).join(', ')} promovido a admin!`)
    } catch { await reply('❌ Erro ao promover membro.') }
  }
}

export const rebaixar = {
  name: 'rebaixar',
  aliases: ['demote'],
  description: 'Remove admin de um membro',
  category: 'admin',
  usage: '!rebaixar @membro',
  cooldown: 5,
  async execute({ sock, from, msg, reply, isGrupo, isAdmin, isOwner }) {
    if (!isGrupo) return reply('❌ Use em grupos!')
    if (!isAdmin && !isOwner) return reply('❌ Apenas admins!')
    const mencionados = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
    if (!mencionados.length) return reply('❌ Mencione alguém!')
    try {
      await sock.groupParticipantsUpdate(from, mencionados, 'demote')
      await reply(`⬇️ Admin removido de ${mencionados.map(j => `@${j.split('@')[0]}`).join(', ')}`)
    } catch { await reply('❌ Erro.') }
  }
}

export const nomegrupo = {
  name: 'nomegrupo',
  aliases: ['setname', 'renomear'],
  description: 'Renomeia o grupo (admin)',
  category: 'admin',
  usage: '!nomegrupo <novo nome>',
  cooldown: 10,
  async execute({ sock, from, reply, isGrupo, isAdmin, isOwner, argStr }) {
    if (!isGrupo) return reply('❌ Use em grupos!')
    if (!isAdmin && !isOwner) return reply('❌ Apenas admins!')
    if (!argStr) return reply('❌ Informe o novo nome!')
    try {
      await sock.groupUpdateSubject(from, argStr)
      await reply(`✅ Grupo renomeado para: *${argStr}*`)
    } catch { await reply('❌ Erro ao renomear grupo.') }
  }
}

export const descgrupo = {
  name: 'descgrupo',
  aliases: ['setdesc', 'descricao'],
  description: 'Altera descrição do grupo (admin)',
  category: 'admin',
  usage: '!descgrupo <texto>',
  cooldown: 10,
  async execute({ sock, from, reply, isGrupo, isAdmin, isOwner, argStr }) {
    if (!isGrupo) return reply('❌ Use em grupos!')
    if (!isAdmin && !isOwner) return reply('❌ Apenas admins!')
    if (!argStr) return reply('❌ Informe a nova descrição!')
    try {
      await sock.groupUpdateDescription(from, argStr)
      await reply(`✅ Descrição do grupo atualizada!`)
    } catch { await reply('❌ Erro ao atualizar descrição.') }
  }
}

export const listaradmins = {
  name: 'admins',
  aliases: ['listaradmins'],
  description: 'Lista os admins do grupo',
  category: 'admin',
  usage: '!admins',
  cooldown: 10,
  async execute({ reply, membros, isGrupo, mention, from }) {
    if (!isGrupo) return reply('❌ Use em grupos!')
    const admins = membros.filter(m => m.admin)
    if (!admins.length) return reply('Nenhum admin encontrado.')
    const jids = admins.map(m => m.id)
    await mention(jids, `🛡️ *Admins do grupo:*\n\n${jids.map(j => `• @${j.split('@')[0]}`).join('\n')}`)
  }
}

export const linkgrupo = {
  name: 'link',
  aliases: ['linkgrupo', 'convite'],
  description: 'Gera o link de convite do grupo',
  category: 'admin',
  usage: '!link',
  cooldown: 10,
  async execute({ sock, from, reply, isGrupo, isAdmin, isOwner }) {
    if (!isGrupo) return reply('❌ Use em grupos!')
    if (!isAdmin && !isOwner) return reply('❌ Apenas admins!')
    try {
      const code = await sock.groupInviteCode(from)
      await reply(`🔗 *Link do Grupo:*\nhttps://chat.whatsapp.com/${code}`)
    } catch { await reply('❌ Não tenho permissão para gerar o link.') }
  }
}

export const revogarlink = {
  name: 'revogar',
  aliases: ['resetlink', 'revogarlink'],
  description: 'Revoga o link de convite atual',
  category: 'admin',
  usage: '!revogar',
  cooldown: 10,
  async execute({ sock, from, reply, isGrupo, isAdmin, isOwner }) {
    if (!isGrupo) return reply('❌ Use em grupos!')
    if (!isAdmin && !isOwner) return reply('❌ Apenas admins!')
    try {
      await sock.groupRevokeInvite(from)
      await reply('✅ Link de convite revogado com sucesso!')
    } catch { await reply('❌ Erro ao revogar link.') }
  }
}

export const antifake = {
  name: 'antifake',
  description: 'Ativa/Desativa o bloqueio de números estrangeiros',
  category: 'admin',
  usage: '!antifake [on/off]',
  cooldown: 5,
  async execute({ reply, isGrupo, isAdmin, isOwner, args, from }) {
    if (!isGrupo) return reply('❌ Use em grupos!')
    if (!isAdmin && !isOwner) return reply('❌ Apenas admins!')
    
    const { groupsDB } = await import('../../database.js')
    const gd = groupsDB.get(from, {})
    const mode = args[0]?.toLowerCase()
    
    if (mode === 'on') {
      gd.antifake = true
      groupsDB.set(from, gd)
      return reply('✅ *Anti-Fake ativado!* Números de fora do Brasil (+55) serão removidos ao entrar.')
    } else if (mode === 'off') {
      gd.antifake = false
      groupsDB.set(from, gd)
      return reply('❌ *Anti-Fake desativado!*')
    }
    
    reply(`❓ *Anti-Fake:* ${gd.antifake ? 'Ativado' : 'Desativado'}\nUse: *!antifake on* ou *!antifake off*`)
  }
}

export const antilink = {
  name: 'antilink',
  description: 'Ativa/Desativa o bloqueio de links',
  category: 'admin',
  usage: '!antilink [on/off]',
  cooldown: 5,
  async execute({ reply, isGrupo, isAdmin, isOwner, args, from }) {
    if (!isGrupo) return reply('❌ Use em grupos!')
    if (!isAdmin && !isOwner) return reply('❌ Apenas admins!')
    
    const { groupsDB } = await import('../../database.js')
    const gd = groupsDB.get(from, {})
    const mode = args[0]?.toLowerCase()
    
    if (mode === 'on') {
      gd.antilink = true
      groupsDB.set(from, gd)
      return reply('✅ *Anti-Link ativado!* Links serão removidos automaticamente.')
    } else if (mode === 'off') {
      gd.antilink = false
      groupsDB.set(from, gd)
      return reply('❌ *Anti-Link desativado!*')
    }
    
    reply(`❓ *Anti-Link:* ${gd.antilink ? 'Ativado' : 'Desativado'}\nUse: *!antilink on* ou *!antilink off*`)
  }
}

export const bemvindo = {
  name: 'bemvindo',
  aliases: ['welcome'],
  description: 'Ativa/Desativa mensagens de boas-vindas',
  category: 'admin',
  usage: '!bemvindo [on/off]',
  cooldown: 5,
  async execute({ reply, isGrupo, isAdmin, isOwner, args, from }) {
    if (!isGrupo) return reply('❌ Use em grupos!')
    if (!isAdmin && !isOwner) return reply('❌ Apenas admins!')
    
    const { groupsDB } = await import('../../database.js')
    const gd = groupsDB.get(from, {})
    const mode = args[0]?.toLowerCase()
    
    if (mode === 'on') {
      gd.bemvindo = true
      groupsDB.set(from, gd)
      return reply('✅ *Boas-vindas ativado!*')
    } else if (mode === 'off') {
      gd.bemvindo = false
      groupsDB.set(from, gd)
      return reply('❌ *Boas-vindas desativado!*')
    }
    
    reply(`❓ *Boas-vindas:* ${gd.bemvindo ? 'Ativado' : 'Desativado'}\nUse: *!bemvindo on* ou *!bemvindo off*`)
  }
}

export const setwelcome = {
  name: 'setwelcome',
  description: 'Define a mensagem de boas-vindas',
  category: 'admin',
  usage: '!setwelcome <texto>',
  cooldown: 10,
  async execute({ reply, isGrupo, isAdmin, isOwner, argStr, from }) {
    if (!isGrupo) return reply('❌ Use em grupos!')
    if (!isAdmin && !isOwner) return reply('❌ Apenas admins!')
    if (!argStr) return reply('❌ Informe o texto! Use {nome} para marcar o usuário.')
    
    const { groupsDB } = await import('../../database.js')
    const gd = groupsDB.get(from, {})
    gd.welcomeMsg = argStr
    groupsDB.set(from, gd)
    
    reply(`✅ *Mensagem de boas-vindas definida:* \n\n${argStr}`)
  }
}

export const infogrupo = {
  name: 'infogrupo',
  aliases: ['groupinfo', 'dados'],
  description: 'Mostra informações do grupo',
  category: 'info',
  usage: '!infogrupo',
  cooldown: 10,
  async execute({ sock, from, reply, isGrupo, nomeGrupo, membros }) {
    if (!isGrupo) return reply('❌ Use em grupos!')
    const admins = membros.filter(m => m.admin).length
    const gd = (await import('../../database.js')).groupsDB.get(from, {})
    
    const info = `📊 *INFORMAÇÕES DO GRUPO* 📊
    
    *Nome:* ${nomeGrupo}
    *Membros:* ${membros.length}
    *Admins:* ${admins}
    
    🛡️ *Configurações do Bot:*
    • Anti-Link: ${gd.antilink ? '✅' : '❌'}
    • Anti-Fake: ${gd.antifake ? '✅' : '❌'}
    • Boas-Vindas: ${gd.bemvindo ? '✅' : '❌'}
    
    *ID:* ${from}`
    
    reply(info)
  }
}

export default [tagall, fechargrupo, abrirgrupo, kick, promover, rebaixar, nomegrupo, descgrupo, listaradmins, linkgrupo, revogarlink, antifake, antilink, bemvindo, setwelcome, infogrupo]
