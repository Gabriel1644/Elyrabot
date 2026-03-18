export default {
  name: 'elyra',
  aliases: ['groq', 'ia', 'gpt'],
  description: 'IA com memória, histórico e controle total do bot',
  category: 'ia',
  usage: '!elyra <pergunta | criar | editar | ler | deletar | reiniciar>',
  cooldown: 5,

  async execute(ctx) {
    const { sock, msg, from, userId, usuario, isGrupo, nomeGrupo, membros, args, argStr, texto, prefix, reply, isAdmin, isOwner, botJid, gdata, sendText, sendImage, sendSticker, sendAudio, react, mention } = ctx
    const sub = args[0]?.toLowerCase();

    if (!sub || sub === 'ajuda' || sub === 'help' || sub === 'menu') {
      const user  = db.getUser(userId);
      const grupo = isGrupo ? db.getGroup(from) : null;
      return reply(
        `╭━━━⊱ ✦ *ELYRA* ⊱━━━╮\n` +
        `│ _Entidade antiga. Sabe mais_\n` +
        `│ _do que revela._\n` +
        `│\n` +
        `│ ━━ 💬 CONVERSA ━━\n` +
        `│ !elyra <pergunta>\n` +
        `│ !elyra limpar\n` +
        `│ !elyra lembrar <info>\n` +
        `│ !elyra memoria\n` +
        `│ !elyra esquecer <nº>\n` +
        `│ !elyra stats\n` +
        `│\n` +
        (isOwner ?
        `│ ━━ 🤖 BOT (dono) ━━\n` +
        `│ !elyra criar <pedido>\n` +
        `│ !elyra editar <cmd> <pedido>\n` +
        `│ !elyra ler <cmd>\n` +
        `│ !elyra deletar <cmd>\n` +
        `│ !elyra reiniciar\n` +
        `│\n` : '') +
        (isGrupo && (isAdmin || isOwner) ?
        `│ ━━ ⚙️ GRUPO (admin) ━━\n` +
        `│ !elyra personalidade <texto>\n` +
        `│ !elyra resetpersonalidade\n` +
        `│\n` : '') +
        `│ 📌 Histórico: ${user.history?.length || 0}/20\n` +
        `│ 🧠 Memórias: ${user.memory?.length || 0}/10\n` +
        `╰━━━━━━━━━━━━━━━━━━━━╯`
      );
    }

    if (['limpar', 'clear', 'reset'].includes(sub)) {
      const user = db.getUser(userId);
      user.history = [];
      user.memory  = [];
      db.save();
      return reply('✦ *Elyra*\n\nMemória apagada. Recomeçamos do zero.');
    }

    if (sub === 'memoria' || sub === 'memória') {
      const user = db.getUser(userId);
      if (!user.memory?.length) return reply('✦ *Elyra*\n\nNada foi memorizado ainda.');
      return reply(`✦ *Elyra — Sua Memória*\n\n${user.memory.map((m, i) => `${i + 1}. ${m}`).join('\n')}`);
    }

    if (sub === 'lembrar') {
      const texto = args.slice(1).join(' ');
      if (!texto) return reply('💡 *!elyra lembrar <informação>*');
      const user = db.getUser(userId);
      user.memory = user.memory || [];
      if (user.memory.length >= 10) user.memory.shift();
      user.memory.push(texto);
      db.save();
      return reply(`✦ *Elyra*\n\nAnotado: _"${texto}"_`);
    }

    if (sub === 'esquecer') {
      const idx = parseInt(args[1]) - 1;
      const user = db.getUser(userId);
      if (isNaN(idx) || !user.memory?.[idx]) return reply('❌ Índice inválido. Use *!elyra memoria* para ver a lista.');
      const removido = user.memory.splice(idx, 1)[0];
      db.save();
      return reply(`✦ *Elyra*\n\n_"${removido}"_ foi esquecido.`);
    }

    if (sub === 'personalidade' || sub === 'personality') {
      if (!isGrupo || !(isAdmin || isOwner)) return reply('🔒 Apenas admins podem mudar a personalidade do grupo.');
      const nova = args.slice(1).join(' ');
      if (!nova) {
        const atual = isGrupo ? (db.getGroup(from).personality || DEFAULT_PERSONALITY) : DEFAULT_PERSONALITY;
        return reply(`✦ *Personalidade Atual*\n\n${atual.slice(0, 300)}...`);
      }
      if (nova.length < 20) return reply('❌ Muito curta (mín. 20 caracteres).');
      if (nova.length > 500) return reply('❌ Muito longa (máx. 500 caracteres).');
      db.getGroup(from).personality = nova;
      db.save();
      return reply(`✦ *Personalidade atualizada!*\n\n_${nova}_`);
    }

    if (sub === 'resetpersonalidade' || sub === 'resetpersonality') {
      if (!isGrupo || !(isAdmin || isOwner)) return reply('🔒 Apenas admins.');
      if (isGrupo) db.getGroup(from).personality = null;
      db.save();
      return reply('✦ *Elyra*\n\nPersonalidade resetada para o padrão.');
    }

    if (sub === 'stats' || sub === 'estatisticas') {
      const d    = db.load();
      const user = db.getUser(userId);
      const top  = Object.entries(d.stats.topUsers || {}).sort(([,a],[,b]) => b - a).slice(0, 5);
      let msg =
        `✦ *Elyra — Estatísticas*\n\n` +
        `📊 Total de mensagens: *${d.stats.totalMessages}*\n` +
        `👤 Suas mensagens: *${user.uses || 0}*\n` +
        `🧠 Suas memórias: *${user.memory?.length || 0}/10*\n` +
        `💬 Histórico atual: *${user.history?.length || 0} msgs*\n`;
      if (top.length) {
        msg += `\n🏆 *Top usuários:*\n`;
        top.forEach(([id, n], i) => { msg += `${i + 1}. ${id.split('@')[0]} — ${n} msgs\n`; });
      }
      return reply(msg);
    }

    if (sub === 'criar' || sub === 'create') {
      if (!isOwner) return reply('🔒 Apenas o dono pode criar comandos.');

      const pedido = args.slice(1).join(' ');
      if (!pedido) return reply('💡 *!elyra criar <descrição do comando>*\n\nEx: _!elyra criar um comando !sorte que manda uma frase motivacional aleatória_');

      try {
        const prompt =
          `Crie um comando para bot WhatsApp Baileys com a seguinte função:\n\n${pedido}\n\n` +
          `Retorne APENAS o código JavaScript puro, sem markdown, sem explicações. ` +
          `Use export default com a estrutura padrão do CommandLoader.`;

        const codigo = extractCodeFromResponse(await perguntar([{ role: 'user', content: prompt }], BOT_DEV_PERSONALITY));
        const cmdName = extractCommandName(codigo);

        if (!cmdName) return reply('❌ Elyra não conseguiu extrair o nome do comando. Tente descrever melhor.');

        const filePath = path.join(CMDS_DIR, `${cmdName}.js`);

        if (fs.existsSync(filePath)) {
          return reply(`⚠️ O comando *${cmdName}* já existe!\n\nUse *!elyra editar ${cmdName} <pedido>* para modificá-lo.`);
        }

        fs.writeFileSync(filePath, codigo, 'utf8');

        try {
          await loader.reloadFile(filePath);
          return reply(
            `✅ *Comando Criado e Instalado!*\n\n` +
            `📝 Nome: *${cmdName}*\n` +
            `📁 Arquivo: *${cmdName}.js*\n` +
            `🟢 Ativo e pronto para uso!\n\n` +
            `💡 Teste com *!${cmdName}*`
          );
        } catch (e) {
          fs.unlinkSync(filePath);
          return reply(`❌ Código gerado tem erro de sintaxe:\n\n_${e.message}_\n\nTente des