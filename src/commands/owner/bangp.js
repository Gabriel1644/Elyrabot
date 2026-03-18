import fs from 'fs';
import path from 'path';

// Defina o caminho do arquivo JSON. 
// Ajuste o "./database/dono/" se a pasta do seu bot for diferente.
const dbPath = './database/dono/bangp.json';

// Função auxiliar para garantir que o arquivo seja lido corretamente
function lerGruposBanidos() {
  try {
    // Se o arquivo não existir, cria um vazio para evitar erros
    if (!fs.existsSync(dbPath)) {
      // Cria a pasta se ela não existir
      fs.mkdirSync(path.dirname(dbPath), { recursive: true });
      fs.writeFileSync(dbPath, JSON.stringify({}));
    }
    const data = fs.readFileSync(dbPath, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    console.error('Erro ao ler o arquivo bangp.json:', e);
    return {};
  }
}

// Função auxiliar para salvar os dados
function salvarGruposBanidos(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

export default {
  name: 'bangp',
  aliases: ['unbangp', 'desbangp', 'privarbot'],
  description: 'Privar o bot de executar comandos para usuários comuns no grupo.',
  category: 'dono',
  usage: '!bangp',
  cooldown: 0,
  async execute({ sock, msg, from, reply, isOwner, isGroup }) {
    try {
      // 1. Verifica se está sendo usado em um grupo
      if (!isGroup) {
        return reply("💔 Isso só pode ser usado em grupo!");
      }

      // 2. Verifica se é o dono do bot usando (como na sua lógica original)
      if (!isOwner) {
        return reply("🚫 Este comando é apenas para o meu dono.");
      }

      // 3. Carrega a lista atual do JSON
      let banGpIds = lerGruposBanidos();

      // 4. Inverte o status atual do grupo (se não existir, vira true)
      banGpIds[from] = !banGpIds[from];

      // 5. Envia a mensagem correspondente
      if (banGpIds[from]) {
        await reply('🚫 Grupo banido, apenas usuários premium ou meu dono podem utilizar o bot aqui agora.');
      } else {
        await reply('✅ Grupo desbanido, todos podem utilizar o bot novamente.');
      }

      // 6. Salva as alterações no arquivo JSON
      salvarGruposBanidos(banGpIds);

    } catch (e) {
      console.error('Erro no comando bangp:', e);
      await reply("❌ Ocorreu um erro interno. Tente novamente em alguns minutos.");
    }
  }
};
