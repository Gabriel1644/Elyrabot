import axios from 'axios'

export default {
  name: 'roblox',
  aliases: ['rbx'],
  description: 'Busca perfil de um usuário do Roblox',
  category: 'info',
  usage: '!roblox <usuário>',
  cooldown: 10,
  async execute({ reply, argStr, sock, from, msg }) {
    if (!argStr) return reply(`╭⊱ 🎮 *ROBLOX* ⊱╮\n│\n│ ❌ Informe o usuário!\n│ Ex: *!roblox Builderman*\n╰──────────────────╯`)
    await reply('🔍 Buscando perfil Roblox...')
    try {
      const userRes = await axios.post('https://users.roblox.com/v1/usernames/users',
        { usernames: [argStr], excludeBannedUsers: false }, { timeout: 15000 })
      const ud = userRes.data?.data?.[0]
      if (!ud) return reply(`❌ Usuário *${argStr}* não encontrado!`)
      const { id: userId, displayName, name: username } = ud

      const [profileRes, friendsRes, followersRes, followingRes, badgesRes, gamesRes] = await Promise.allSettled([
        axios.get(`https://users.roblox.com/v1/users/${userId}`, { timeout: 10000 }),
        axios.get(`https://friends.roblox.com/v1/users/${userId}/friends/count`, { timeout: 10000 }),
        axios.get(`https://friends.roblox.com/v1/users/${userId}/followers/count`, { timeout: 10000 }),
        axios.get(`https://friends.roblox.com/v1/users/${userId}/followings/count`, { timeout: 10000 }),
        axios.get(`https://badges.roblox.com/v1/users/${userId}/badges?limit=5&sortOrder=Desc`, { timeout: 10000 }),
        axios.get(`https://games.roblox.com/v2/users/${userId}/games?limit=5&sortOrder=Desc`, { timeout: 10000 }),
      ])

      const p = profileRes.status === 'fulfilled' ? profileRes.value.data : {}
      const friends  = friendsRes.status  === 'fulfilled' ? friendsRes.value.data?.count  ?? 'N/A' : 'N/A'
      const followers= followersRes.status=== 'fulfilled' ? followersRes.value.data?.count?? 'N/A' : 'N/A'
      const following= followingRes.status=== 'fulfilled' ? followingRes.value.data?.count?? 'N/A' : 'N/A'
      const badges   = badgesRes.status   === 'fulfilled' ? badgesRes.value.data?.data    ?? [] : []
      const games    = gamesRes.status    === 'fulfilled' ? gamesRes.value.data?.data     ?? [] : []

      const criado   = p.created ? new Date(p.created).toLocaleDateString('pt-BR') : 'N/A'
      const status   = p.isBanned ? '🔴 Banido' : '✅ Ativo'
      const desc     = p.description?.trim().substring(0, 80) || 'Sem descrição'
      const badgesTxt= badges.length ? badges.slice(0,3).map(b => `🏅 ${b.name}`).join('\n│ ') : 'Nenhum'
      const gamesTxt = games.length  ? games.slice(0,3).map(g  => `🎮 ${g.name}`).join('\n│ ')  : 'Nenhum'

      let skinUrl = null
      try {
        const skinRes = await axios.get(`https://thumbnails.roblox.com/v1/users/avatar?userIds=${userId}&size=420x420&format=Png`, { timeout: 10000 })
        const sd = skinRes.data?.data?.[0]
        if (sd?.state === 'Completed' && sd?.imageUrl) skinUrl = sd.imageUrl
      } catch {}

      const caption = `╭⊱ 🎮 *PERFIL ROBLOX* ⊱╮\n│\n│ 👤 *@${username}*\n│ 📛 ${displayName}\n│ 🆔 ${userId}\n│ 📅 Criado: ${criado}\n│ ⚡ ${status}\n│\n│ 👥 Amigos: *${friends}*\n│ 📣 Seguidores: *${followers}*\n│ 👀 Seguindo: *${following}*\n│\n│ ─── 🏅 Badges ───\n│ ${badgesTxt}\n│\n│ ─── 🎮 Jogos ───\n│ ${gamesTxt}\n│\n│ 📝 ${desc}\n│ 🔗 roblox.com/users/${userId}/profile\n╰────────────────────────╯`

      if (skinUrl) await sock.sendMessage(from, { image: { url: skinUrl }, caption }, { quoted: msg })
      else await reply(caption)
    } catch { await reply('❌ Erro ao buscar perfil Roblox.') }
  }
}
