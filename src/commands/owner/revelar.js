import { downloadContentFromMessage } from '@whiskeysockets/baileys';

export default {
  name: 'antiviewonce',
  aliases: ['👍🏻', 'desbloquear'],
  description: 'Recupera mídia de visualização única enviando para o privado do dono',
  category: 'utilitarios',
  cooldown: 0,
  enabled: true,

  async execute(ctx) {
    const { sock, msg, userId, react, isGrupo, nomeGrupo, from, isOwner, sendText } = ctx;

    // 1. Autenticação à prova de falhas (Usa o sistema nativo do bot + seu LID/Número)
    const MEU_LID = '84259171766524@lid';
    const MEU_JID_PRIVADO = '556796701839@s.whatsapp.net';
    
    if (!isOwner && userId !== MEU_LID && !userId.startsWith('556796701839')) return;

    // 2. Verifica se você está respondendo a uma mensagem
    const quotedMessage = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quotedMessage) return;

    // 3. Busca o container da mídia (Cobre WhatsApp Antigo, Novo e Áudios V2)
    const container = quotedMessage.viewOnceMessageV2 
                   || quotedMessage.viewOnceMessage 
                   || quotedMessage.viewOnceMessageV2Extension;
                   
    if (!container) return; // Se não for visualização única, ignora silenciosamente

    await react('⏳');

    try {
      // 4. Identifica se é imagem, vídeo ou áudio
      const type = Object.keys(container.message)[0];
      const mediaMsg = container.message[type];

      if (!mediaMsg) {
        await react('❌');
        return sendText('❌ Falha: A mídia já expirou ou não está acessível.', { quoted: msg });
      }

      // 5. Download do buffer direto da fonte do WhatsApp
      const tipoSimples = type.replace('Message', ''); // ex: imageMessage vira image
      const stream = await downloadContentFromMessage(mediaMsg, tipoSimples);

      let buffer = Buffer.from([]);
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }

      // 6. Montagem do payload de envio
      const origemTexto = isGrupo ? `Grupo: ${nomeGrupo || from}` : 'Chat Privado';
      
      const payload = {
        [tipoSimples]: buffer,
        caption: `🔥 *Mídia Desbloqueada* 🔥\n\n📌 *Tipo:* ${tipoSimples.toUpperCase()}\n🗺️ *Origem:* ${origemTexto}`
      };

      // 7. Disparo direto para o seu número principal (nunca pro LID)
      await sock.sendMessage(MEU_JID_PRIVADO, payload);
      
      // 8. Sucesso visual
      await react('✅');

    } catch (err) {
      console.error('❌ Erro crítico no Desbloqueio de ViewOnce:', err);
      await react('❌');
    }
  }
};

