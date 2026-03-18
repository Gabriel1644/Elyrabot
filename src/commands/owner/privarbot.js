export default {
  name: 'privarbot',
  aliases: [],
  description: 'Privar o bot de executar comandos ou ler mensagens em um grupo.',
  usage: '!privarbot',
  cooldown: 0,
  async execute({ sock, msg, from, userId, usuario, args, argStr, reply, isAdmin, isOwner }) {
    if (!isOwner) return reply('Apenas o dono pode usar este comando.');
    const groupId = from;
    const gruposPrivados = await readGruposPrivados();
    if (gruposPrivados.includes(groupId)) {
      await removerGrupoPrivado(groupId);
      reply('O bot foi reativado neste grupo.');
    } else {
      await adicionarGrupoPrivado(groupId);
      reply('O bot foi privado neste grupo.');
    }
  }
};

async function readGruposPrivados() {
  const gruposPrivados = await read_file('grupos-privados.json');
  return JSON.parse(gruposPrivados);
}

async function adicionarGrupoPrivado(groupId) {
  const gruposPrivados = await readGruposPrivados();
  gruposPrivados.push(groupId);
  await write_file(JSON.stringify(gruposPrivados), 'grupos-privados.json');
}

async function removerGrupoPrivado(groupId) {
  const gruposPrivados = await readGruposPrivados();
  const index = gruposPrivados.indexOf(groupId);
  if (index !== -1) {
    gruposPrivados.splice(index, 1);
    await write_file(JSON.stringify(gruposPrivados), 'grupos-privados.json');
  }
}
