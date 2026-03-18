import axios from 'axios';
import { generateWAMessageFromContent, prepareWAMessageMedia, proto } from '@whiskeysockets/baileys';

export default {
  name: 'pinterest',
  aliases: ['pin', 'pinterest2'],
  description: 'Busca imagens do Pinterest e exibe em um carrossel interativo.',
  category: 'media',
  usage: '!pinterest <termo>',
  example: '!pinterest gatos fofos',
  cooldown: 15, // Mantido o cooldown seguro para a API

  async execute(ctx) {
    const { sock, msg, from, args, prefix, sendText, react } = ctx;

    const query = args?.join(' ')?.trim();

    if (!query) {
      await react('⚠️');
      return sendText(`Ops… coloque um termo para buscar.\n\nExemplo:\n*${prefix}pinterest y2k style*`, { quoted: msg });
    }

    await react('⏳');

    try {
      const API_URL = `https://tedzinho.com.br/api/pesquisa/pinterest?apikey=J&query=${encodeURIComponent(query)}`;
      const { data } = await axios.get(API_URL, { timeout: 15000 });

      if (!data?.resultado || data.resultado.length === 0) {
        await react('❌');
        return sendText(`Nenhum resultado encontrado para: *${query}*`, { quoted: msg });
      }

      // Filtrar imagens válidas e limitar a 10 cards para o carrossel
      const imagens = data.resultado.filter(i => i.image).slice(0, 10);

      if (!imagens.length) {
          await react('❌');
          return sendText('As imagens encontradas não são válidas. Tente outro termo.', { quoted: msg });
      }

      const cards = [];

      for (let i = 0; i < imagens.length; i++) {
        const img = imagens[i];

        // Prepara a imagem nativamente pelo Baileys
        const media = await prepareWAMessageMedia(
          { image: { url: img.image } },
          { upload: sock.waUploadToServer }
        );

        cards.push({
          body: proto.Message.InteractiveMessage.Body.fromObject({
            text: `📌 *Pinterest* ${i + 1}/${imagens.length}\n🔎 ${query}\n👤 ${img.fullname || "Autor desconhecido"}`
          }),
          header: proto.Message.InteractiveMessage.Header.fromObject({
            title: "Resultado do Pinterest",
            hasMediaAttachment: true,
            imageMessage: media.imageMessage
          }),
          nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
            buttons: [
              {
                name: "cta_url",
                buttonParamsJson: JSON.stringify({
                  display_text: "🔗 Abrir no navegador",
                  url: img.source || img.image
                })
              },
              {
                name: "quick_reply",
                buttonParamsJson: JSON.stringify({
                  display_text: "📥 Baixar Imagem",
                  // A URL da imagem vai direto no ID. O limite do WhatsApp permite isso tranquilamente.
                  id: `dlpin|${img.image}` 
                })
              }
            ]
          })
        });
      }

      // Montagem final do carrossel
      const carouselMessage = generateWAMessageFromContent(from, {
        viewOnceMessage: {
          message: {
            interactiveMessage: {
              body: { text: `🖼️ *Resultados para:* ${query}` },
              carouselMessage: { cards },
              footer: { text: "Deslize para ver mais ➡️" }
            }
          }
        }
      }, { quoted: msg });

      await sock.relayMessage(from, carouselMessage.message, {
        messageId: carouselMessage.key.id
      });

      await react('✅');

    } catch (err) {
      console.error("Erro no comando pinterest:", err);
      await react('❌');
      
      if (err.code === 'ECONNABORTED') {
        return sendText('❌ Timeout — a API demorou demais. Tente novamente.', { quoted: msg });
      }
      
      await sendText("Não foi possível buscar as imagens agora. Tente novamente.", { quoted: msg });
    }
  }
};
