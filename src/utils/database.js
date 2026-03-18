export const CD = {
  MINE:      15 * 60 * 1000,
  WORK:      30 * 60 * 1000,
  FISH:      12 * 60 * 1000,
  EXPLORE:   15 * 60 * 1000,
  HUNT:      20 * 60 * 1000,
  CRIME:     30 * 60 * 1000,
  DUEL:      10 * 60 * 1000,
  ARENA:     30 * 60 * 1000,
  DUNGEON:   2  * 60 * 60 * 1000,
  BOSS:      4  * 60 * 60 * 1000,
  DAILY:     20 * 60 * 60 * 1000,
  STREAK:    20 * 60 * 60 * 1000,
  PLANT:     0,
  COOK:      3  * 60 * 1000,
  FORGE:     10 * 60 * 1000,
  ROB:       30 * 60 * 1000,
  PROTECT:   60 * 60 * 1000,
  PETBATTLE: 10 * 60 * 1000,
  TRAIN:     60 * 60 * 1000,
  COLLECT:   24 * 60 * 60 * 1000,
};



export const CLASSES = {
  guerreiro: { emoji:'⚔️',  name:'Guerreiro', atk:25, def:10, luck:0,  mana:0,  passiva:'Fúria — +30% dano em duelos' },
  mago:      { emoji:'🧙',  name:'Mago',      atk:15, def:5,  luck:5,  mana:30, passiva:'Arcano — +25% EXP em todas as ações' },
  arqueiro:  { emoji:'🏹',  name:'Arqueiro',  atk:20, def:8,  luck:15, mana:0,  passiva:'Precisão — +20% crítico em caça/exploração' },
  curandeiro: { emoji:'💚', name:'Curandeiro',atk:8,  def:20, luck:5,  mana:15, passiva:'Cura — Recupera 25% HP após batalhas' },
  ladino:    { emoji:'🗡️', name:'Ladino',    atk:18, def:8,  luck:20, mana:0,  passiva:'Sombra — +25% sucesso em crimes e roubos' },
  paladino:  { emoji:'🛡️', name:'Paladino',  atk:12, def:30, luck:0,  mana:10, passiva:'Proteção — -25% dano recebido em batalhas' },
  bardo:     { emoji:'🎵',  name:'Bardo',     atk:10, def:10, luck:25, mana:20, passiva:'Carisma — +20% em economia e comércio' },
  druida:    { emoji:'🌿',  name:'Druida',    atk:15, def:12, luck:10, mana:15, passiva:'Natureza — +35% em plantio, pesca e caça' },
};

export const BOSSES = [
  { id:'dragao',   name:'Dragão Ancião',    emoji:'🐉', tier:1, hp:2000, atk:120, def:60,  reward:25000,  xp:800,  loot:['espada_diamante','cristal'] },
  { id:'golem',    name:'Golem de Pedra',   emoji:'🗿', tier:1, hp:3000, atk:80,  def:120, reward:20000,  xp:600,  loot:['armadura_aco','ouro'] },
  { id:'hidra',    name:'Hidra Venenosa',   emoji:'🐍', tier:2, hp:1800, atk:150, def:40,  reward:30000,  xp:1000, loot:['arco_reforcado','cristal'] },
  { id:'fenix',    name:'Fênix Sombria',    emoji:'🔥', tier:2, hp:1500, atk:140, def:50,  reward:35000,  xp:1200, loot:['espada_aco','diamante'] },
  { id:'kraken',   name:'Kraken Abissal',   emoji:'🦑', tier:2, hp:2500, atk:110, def:80,  reward:28000,  xp:900,  loot:['armadura_ferro','ouro'] },
  { id:'lich',     name:'Lich Supremo',     emoji:'💀', tier:3, hp:4000, atk:200, def:100, reward:60000,  xp:2000, loot:['espada_diamante','cristal','diamante'] },
  { id:'titan',    name:'Titã de Ferro',    emoji:'⚙️', tier:3, hp:5000, atk:180, def:150, reward:75000,  xp:2500, loot:['armadura_aco','diamante'] },
  { id:'deus',     name:'Deus da Escuridão',emoji:'🌑', tier:4, hp:8000, atk:300, def:200, reward:150000, xp:5000, loot:['espada_diamante','cristal','diamante','ouro'] },
];


export const DUNGEONS = {
  floresta: { emoji:\'🌲\', name:\'Floresta Sombria\',  minLevel:1,  players:2, reward:6000,  xp:250,  boss:\'🐺 Lobo Alfa\',      floors:3, loot:[\'madeira\',\'couro\'] },
  caverna:  { emoji:\'🕳️\',name:\'Caverna Cristalina\', minLevel:5,  players:3, reward:18000, xp:600,  boss:\'🦇 Morcego Rei\',     floors:5, loot:[\'cristal\',\'pedra\'] },
  ruinas:   { emoji:\'🏚️\',name:\'Ruínas Antigas\',     minLevel:10, players:3, reward:40000, xp:1200, boss:\'💀 Necromante\',      floors:7, loot:[\'ouro\',\'ferro\'] },
  vulcao:   { emoji:\'🌋\', name:\'Vulcão Ardente\',     minLevel:20, players:4, reward:90000, xp:3000, boss:\'🔥 Dragão de Fogo\',  floors:10,loot:[\'diamante\',\'ouro\'] },
  abismo:   { emoji:\'🌀\', name:\'Abismo Profundo\',    minLevel:35, players:4, reward:220000,xp:7000, boss:\'👹 Demônio Ancião\',  floors:15,loot:[\'diamante\',\'cristal\'] },
};

export const SOLO_DUNGEONS = [
  { id:\'aranhas\',  name:\'Caverna das Aranhas\',   emoji:\'🕷️\', minLevel:1,  floors:3, reward:[800,1500],   xp:80,  loot:[\'seda\',\'veneno\'] },
  { id:\'cripta\',   name:\'Cripta dos Mortos-Vivos\',emoji:\'🧟\', minLevel:5,  floors:5, reward:[2000,4500],  xp:200, loot:[\'osso\',\'cristal\'] },
  { id:\'dragao\',   name:\'Covil do Dragão\',        emoji:\'🐉\', minLevel:10, floors:7, reward:[5000,10000], xp:500, loot:[\'escama\',\'ouro\'] },
  { id:\'demonios\', name:\'Fortaleza Demoníaca\',     emoji:\'👹\', minLevel:20, floors:10,reward:[12000,22000],xp:1000,loot:[\'cristal\',\'diamante\'] },
  { id:\'celestial\',name:\'Torre Celestial\',         emoji:\'☁️\', minLevel:35, floors:15,reward:[30000,55000],xp:2500,loot:[\'diamante\',\'ouro\'] },
];

export const PET_TYPES = {
  lobo:    { name:\'Lobo\',    emoji:\'🐺\', evolutions:[\'Filhote de Lobo\',\'Lobo Cinzento\',\'Lobo Alfa\'],     baseAtk:15, baseDef:8  },
  dragao:  { name:\'Dragão\',  emoji:\'🐉\', evolutions:[\'Ovo de Dragão\',\'Dragão Jovem\',\'Dragão Ancião\'],    baseAtk:25, baseDef:15 },
  fenix:   { name:\'Fênix\',   emoji:\'🔥\', evolutions:[\'Pintinho de Fênix\',\'Fênix Jovem\',\'Fênix Eterna\'], baseAtk:20, baseDef:10 },
  tigre:   { name:\'Tigre\',   emoji:\'🐯\', evolutions:[\'Filhote de Tigre\',\'Tigre\',\'Tigre Lendário\'],       baseAtk:22, baseDef:12 },
  aguia:   { name:\'Águia\',   emoji:\'🦅\', evolutions:[\'Aquilão\',\'Águia Real\',\'Águia Celestial\'],           baseAtk:18, baseDef:8  },
  unicornio:{ name:\'Unicórnio\',emoji:\'🦄\',evolutions:[\'Potro Mágico\',\'Unicórnio\',\'Unicórnio Divino\'],   baseAtk:12, baseDef:20 },
  golem:   { name:\'Golem\',   emoji:\'🗿\', evolutions:[\'Golemzinho\',\'Golem de Pedra\',\'Golem Titã\'],         baseAtk:18, baseDef:30 },
};

export const ACHIEVEMENTS = {
  primeiro_passo:  { name:\'Primeiro Passo\',    emoji:\'👣\', desc:\'Complete sua primeira ação no RPG\',        req:1,   type:\'any\' },
  minerador:       { name:\'Minerador\',          emoji:\'⛏️\', desc:\'Mine 50 vezes\',                            req:50,  type:\'mine\' },
  trabalhador:     { name:\'Trabalhador\',        emoji:\'💼\', desc:\'Trabalhe 50 vezes\',                        req:50,  type:\'work\' },
  pescador:        { name:\'Pescador\',           emoji:\'🎣\', desc:\'Pesque 50 vezes\',                          req:50,  type:\'fish\' },
  cacador:         { name:\'Caçador\',            emoji:\'🏹\', desc:\'Cace 50 vezes\',                            req:50,  type:\'hunt\' },
  explorador:      { name:\'Explorador\',         emoji:\'🧭\', desc:\'Explore 50 vezes\',                         req:50,  type:\'explore\' },
  gladiador:       { name:\'Gladiador\',          emoji:\'⚔️\', desc:\'Vença 30 batalhas\',                        req:30,  type:\'win\' },
  campeao:         { name:\'Campeão\',            emoji:\'🏆\', desc:\'Vença 100 batalhas\',                       req:100, type:\'win\' },
  milionario:      { name:\'Milionário\',         emoji:\'💰\', desc:\'Acumule 1.000.000 moedas\',                 req:1000000, type:\'wealth\' },
  veterano:        { name:\'Veterano\',           emoji:\'🎖️\', desc:\'Alcance o nível 50\',                       req:50,  type:\'level\' },
  lenda:           { name:\'Lenda\',              emoji:\'🌟\', desc:\'Alcance o nível 100\',                      req:100, type:\'level\' },
  colecionador:    { name:\'Colecionador\',       emoji:\'📦\', desc:\'Tenha 5 pets ao mesmo tempo\',              req:5,   type:\'pets\' },
  criminoso:       { name:\'Criminoso\',          emoji:\'🕵️\', desc:\'Cometa 50 crimes com sucesso\',            req:50,  type:\'crime\' },
  chefe_do_crime:  { name:\'Chefe do Crime\',     emoji:\'👑\', desc:\'Cometa 200 crimes com sucesso\',           req:200, type:\'crime\' },
  destruidor:      { name:\'Destruidor de Bosses\',emoji:\'💀\',desc:\'Derrote 20 bosses\',                       req:20,  type:\'boss\' },
  arquiteto:       { name:\'Arquiteto\',          emoji:\'🏰\', desc:\'Construa sua primeira casa\',               req:1,   type:\'house\' },
  chefe_cla:       { name:\'Chefe de Clã\',       emoji:\'🏴\', desc:\'Crie seu primeiro clã\',                   req:1,   type:\'clan\' },
  prestige1:       { name:\'Renascido\',          emoji:\'🔱\', desc:\'Faça seu primeiro Prestige\',               req:1,   type:\'prestige\' },
  cozinheiro:      { name:\'Chef de Cozinha\',    emoji:\'👨‍🍳\',desc:\'Cozinhe 30 receitas\',                  req:30,  type:\'cook\' },
  fazendeiro:      { name:\'Fazendeiro\',         emoji:\'🌾\', desc:\'Plante e colha 50 vezes\',                  req:50,  type:\'farm\' },
};

export const WEEKLY_QUESTS = [
  { id:\'w_duel_10\',    name:\'⚔️ Duelos da Semana\',     desc:\'Duelar 10 vezes\',           goal:10,  type:\'duel\',    reward:25000,  xp:1000 },
  { id:\'w_dungeon_5\',  name:\'🗺️ Explorador Semanal\',   desc:\'Completar 5 dungeons\',      goal:5,   type:\'dungeon\', reward:40000,  xp:1500 },
  { id:\'w_boss_3\',     name:\'👹 Caçador de Bosses\',     desc:\'Derrotar 3 bosses\',         goal:3,   type:\'boss\',    reward:50000,  xp:2000 },
  { id:\'w_mine_30\',    name:\'⛏️ Mineração Intensa\',     desc:\'Minerar 30 vezes\',          goal:30,  type:\'mine\',    reward:15000,  xp:600  },
  { id:\'w_crime_15\',   name:\'🕵️ Semana do Crime\',      desc:\'Cometer 15 crimes\',         goal:15,  type:\'crime\',   reward:20000,  xp:800  },
  { id:\'w_cook_20\',    name:\'👨‍🍳 Semana Culinária\',   desc:\'Cozinhar 20 receitas\',      goal:20,  type:\'cook\',    reward:18000,  xp:700  },
  { id:\'w_farm_25\',    name:\'🌾 Semana da Fazenda\',     desc:\'Colher 25 plantações\',      goal:25,  type:\'farm\',    reward:12000,  xp:500  },
];

export const MONTHLY_QUESTS = [
  { id:\'m_battles_50\', name:\'🏆 Guerreiro do Mês\',      desc:\'Vencer 50 batalhas\',        goal:50,  type:\'win\',     reward:200000, xp:8000 },
  { id:\'m_rich\',       name:\'💰 Magnata do Mês\',         desc:\'Acumular 500k moedas totais\',goal:500000,type:\'wealth\',reward:100000, xp:5000 },
  { id:\'m_boss_10\',    name:\'💀 Destruidor Mensal\',      desc:\'Derrotar 10 bosses\',        goal:10,  type:\'boss\',    reward:300000, xp:12000},
  { id:\'m_dungeon_20\', name:\'🗺️ Aventureiro do Mês\',    desc:\'Completar 20 dungeons\',     goal:20,  type:\'dungeon\', reward:250000, xp:10000},
];

export const DAILY_QUESTS_POOL = [
  { id:\'d_duel_3\',     name:\'⚔️ Duelista\',              desc:\'Duelar 3 vezes\',            goal:3,   type:\'duel\',    reward:5000,   xp:200 },
  { id:\'d_dungeon_2\',  name:\'🗺️ Aventureiro\',           desc:\'Completar 2 dungeons\',      goal:2,   type:\'dungeon\', reward:8000,   xp:300 },
  { id:\'d_mine_10\',    name:\'⛏️ Minerador\',              desc:\'Minerar 10 vezes\',          goal:10,  type:\'mine\',    reward:4000,   xp:150 },
];

export const SKILL_LIST = [
  { id:\'mining\',    name:\'Mineração\',    emoji:\'⛏️\', baseXP:100,  xpPerLevel:50,  bonusPerLevel:0.02, desc:\'Aumenta a quantidade de minérios coletados.\' },
  { id:\'woodcutting\', name:\'Corte de Lenha\',emoji:\'🌳\', baseXP:100,  xpPerLevel:50,  bonusPerLevel:0.02, desc:\'Aumenta a quantidade de madeira coletada.\' },
  { id:\'fishing\',   name:\'Pesca\',       emoji:\'🎣\', baseXP:100,  xpPerLevel:50,  bonusPerLevel:0.02, desc:\'Aumenta a chance de pescar itens raros.\' },
  { id:\'hunting\',   name:\'Caça\',        emoji:\'🏹\', baseXP:100,  xpPerLevel:50,  bonusPerLevel:0.02, desc:\'Aumenta a chance de obter itens de caça.\' },
  { id:\'cooking\',   name:\'Culinária\',   emoji:\'👨‍🍳\', baseXP:100,  xpPerLevel:50,  bonusPerLevel:0.02, desc:\'Melhora a qualidade e os bônus dos alimentos.\' },
  { id:\'forging\',   name:\'Forja\',       emoji:\'🔥\', baseXP:100,  xpPerLevel:50,  bonusPerLevel:0.02, desc:\'Aumenta a chance de criar itens de melhor qualidade.\' },
  { id:\'farming\',   name:\'Agricultura\', emoji:\'🌾\', baseXP:100,  xpPerLevel:50,  bonusPerLevel:0.02, desc:\'Aumenta a produção e a velocidade de crescimento das plantas.\' },
  { id:\'combat\',    name:\'Combate\',     emoji:\'⚔️\', baseXP:100,  xpPerLevel:50,  bonusPerLevel:0.02, desc:\'Aumenta o dano e a defesa em batalhas.\' },
  { id:\'luck\',      name:\'Sorte\',       emoji:\'🍀\', baseXP:100,  xpPerLevel:50,  bonusPerLevel:0.02, desc:\'Aumenta a chance de eventos positivos em todas as ações.\' },
  { id:\'charisma\',  name:\'Carisma\',   emoji:\'🗣️\', baseXP:100,  xpPerLevel:50,  bonusPerLevel:0.02, desc:\'Melhora preços em lojas e interações sociais.\' },
];

export const SHOP_ITEMS = {
  // Ferramentas
  picareta_madeira: { name:\'Picareta de Madeira\', emoji:\'⛏️\', type:\'pickaxe\', price:100, durability:50, bonus:1.1,  material:\'madeira\', level:1,  desc:\'Picareta básica para mineração.\' },
  picareta_pedra:  { name:\'Picareta de Pedra\',  emoji:\'⛏️\', type:\'pickaxe\', price:500, durability:100, bonus:1.25, material:\'pedra\',  level:5,  desc:\'Melhor que a de madeira, mais durável.\' },
  picareta_ferro:  { name:\'Picareta de Ferro\',  emoji:\'⛏️\', type:\'pickaxe\', price:2000, durability:200, bonus:1.5,  material:\'ferro\',  level:10, desc:\'Boa para minérios mais resistentes.\' },
  picareta_ouro:   { name:\'Picareta de Ouro\',   emoji:\'⛏️\', type:\'pickaxe\', price:5000, durability:300, bonus:1.75, material:\'ouro\',   level:15, desc:\'Coleta mais rápido e com mais sorte.\' },
  picareta_diamante:{ name:\'Picareta de Diamante\',emoji:\'⛏️\', type:\'pickaxe\', price:15000,durability:500, bonus:2.0,  material:\'diamante\',level:20, desc:\'A melhor picareta, para os minérios mais raros.\' },

  machado_madeira: { name:\'Machado de Madeira\', emoji:\'🌳\', type:\'axe\',     price:80,  durability:60, bonus:1.1,  material:\'madeira\', level:1,  desc:\'Machado básico para cortar árvores.\' },
  machado_pedra:   { name:\'Machado de Pedra\',  emoji:\'🌳\', type:\'axe\',     price:400, durability:120, bonus:1.25, material:\'pedra\',  level:5,  desc:\'Mais eficiente que o de madeira.\' },
  machado_ferro:   { name:\'Machado de Ferro\',  emoji:\'🌳\', type:\'axe\',     price:1800,durability:250, bonus:1.5,  material:\'ferro\',  level:10, desc:\'Corta árvores maiores com facilidade.\' },
  machado_ouro:    { name:\'Machado de Ouro\',   emoji:\'🌳\', type:\'axe\',     price:4500,durability:350, bonus:1.75, material:\'ouro\',   level:15, desc:\'Aumenta a chance de madeira rara.\' },
  machado_diamante:{ name:\'Machado de Diamante\',emoji:\'🌳\', type:\'axe\',     price:14000,durability:600, bonus:2.0,  material:\'diamante\',level:20, desc:\'O machado supremo para as florestas mais densas.\' },

  vara_pesca_bambu:{ name:\'Vara de Pesca de Bambu\',emoji:\'🎣\',type:\'fishing_rod\',price:70,  durability:70, bonus:1.1,  material:\'bambu\',  level:1,  desc:\'Vara simples para iniciantes.\' },
  vara_pesca_madeira:{ name:\'Vara de Pesca de Madeira\',emoji:\'🎣\',type:\'fishing_rod\',price:350, durability:150, bonus:1.25, material:\'madeira\',level:5,  desc:\'Melhor para peixes maiores.\' },
  vara_pesca_fibra:{ name:\'Vara de Pesca de Fibra\',emoji:\'🎣\',type:\'fishing_rod\',price:1600,durability:300, bonus:1.5,  material:\'fibra\',  level:10, desc:\'Resistente e eficaz.\' },
  vara_pesca_carbono:{ name:\'Vara de Pesca de Carbono\',emoji:\'🎣\',type:\'fishing_rod\',price:4000,durability:400, bonus:1.75, material:\'carbono\',level:15, desc:\'Leve e com alta sensibilidade.\' },
  vara_pesca_titanio:{ name:\'Vara de Pesca de Titânio\',emoji:\'🎣\',type:\'fishing_rod\',price:13000,durability:700, bonus:2.0,  material:\'titanio\',level:20, desc:\'A melhor vara para os peixes lendários.\' },

  // Armas
  espada_madeira: { name:\'Espada de Madeira\', emoji:\'⚔️\', type:\'weapon\',    price:120, durability:40, atk:10, def:2,  material:\'madeira\', level:1,  desc:\'Espada básica para combate.\' },
  espada_pedra:  { name:\'Espada de Pedra\',  emoji:\'⚔️\', type:\'weapon\',    price:600, durability:80, atk:15, def:3,  material:\'pedra\',  level:5,  desc:\'Mais afiada que a de madeira.\' },
  espada_ferro:  { name:\'Espada de Ferro\',  emoji:\'⚔️\', type:\'weapon\',    price:2500,durability:150,atk:25, def:5,  material:\'ferro\',  level:10, desc:\'Boa para enfrentar inimigos mais fortes.\' },
  espada_ouro:   { name:\'Espada de Ouro\',   emoji:\'⚔️\', type:\'weapon\',    price:6000,durability:200,atk:35, def:7,  material:\'ouro\',   level:15, desc:\'Brilhante e poderosa.\' },
  espada_diamante:{ name:\'Espada de Diamante\',emoji:\'⚔️\', type:\'weapon\',    price:20000,durability:300,atk:50, def:10, material:\'diamante\',level:20, desc:\'A lâmina mais letal.\' },

  arco_madeira:  { name:\'Arco de Madeira\',  emoji:\'🏹\', type:\'weapon\',    price:100, durability:50, atk:8,  def:1,  material:\'madeira\', level:1,  desc:\'Arco simples para caça.\' },
  arco_reforcado:{ name:\'Arco Reforçado\',   emoji:\'🏹\', type:\'weapon\',    price:500, durability:100,atk:12, def:2,  material:\'ferro\',  level:5,  desc:\'Mais preciso e forte.\' },
  arco_longo:    { name:\'Arco Longo\',     emoji:\'🏹\', type:\'weapon\',    price:2200,durability:180,atk:20, def:4,  material:\'fibra\',  level:10, desc:\'Alcance e dano aprimorados.\' },
  arco_composto: { name:\'Arco Composto\',  emoji:\'🏹\', type:\'weapon\',    price:5500,durability:250,atk:30, def:6,  material:\'carbono\',level:15, desc:\'Para arqueiros experientes.\' },
  arco_elfico:   { name:\'Arco Élfico\',    emoji:\'🏹\', type:\'weapon\',    price:18000,durability:400,atk:45, def:8,  material:\'elfico\', level:20, desc:\'Lendário arco dos elfos.\' },

  // Armaduras
  armadura_couro: { name:\'Armadura de Couro\',emoji:\'🛡️\', type:\'armor\',     price:150, durability:60, def:5,  material:\'couro\',  level:1,  desc:\'Proteção básica.\' },
  armadura_ferro: { name:\'Armadura de Ferro\',emoji:\'🛡️\', type:\'armor\',     price:700, durability:120,def:10, material:\'ferro\',  level:5,  desc:\'Boa defesa contra ataques.\' },
  armadura_aco:   { name:\'Armadura de Aço\',  emoji:\'🛡️\', type:\'armor\',     price:3000,durability:200,def:18, material:\'aco\',    level:10, desc:\'Proteção robusta.\' },
  armadura_placa: { name:\'Armadura de Placa\',emoji:\'🛡️\', type:\'armor\',     price:7500,durability:300,def:28, material:\'placa\',  level:15, desc:\'Para os mais corajosos.\' },
  armadura_dragao:{ name:\'Armadura de Dragão\',emoji:\'🛡️\', type:\'armor\',     price:25000,durability:500,def:40, material:\'dragao\', level:20, desc:\'Feita das escamas de dragões.\' },

  // Poções
  pocao_vida_pequena: { name:\'Poção de Vida Pequena\', emoji:\'🧪\', type:\'potion\', price:50,  heal:50,  desc:\'Restaura uma pequena quantidade de vida.\' },
  pocao_vida_media:   { name:\'Poção de Vida Média\',   emoji:\'🧪\', type:\'potion\', price:150, heal:150, desc:\'Restaura uma quantidade moderada de vida.\' },
  pocao_vida_grande:  { name:\'Poção de Vida Grande\',  emoji:\'🧪\', type:\'potion\', price:400, heal:400, desc:\'Restaura uma grande quantidade de vida.\' },
  pocao_mana_pequena: { name:\'Poção de Mana Pequena\', emoji:\'🧪\', type:\'potion\', price:60,  mana:50,  desc:\'Restaura uma pequena quantidade de mana.\' },
  pocao_mana_media:   { name:\'Poção de Mana Média\',   emoji:\'🧪\', type:\'potion\', price:180, mana:150, desc:\'Restaura uma quantidade moderada de mana.\' },
  pocao_mana_grande:  { name:\'Poção de Mana Grande\',  emoji:\'🧪\', type:\'potion\', price:450, mana:400, desc:\'Restaura uma grande quantidade de mana.\' },

  // Comida
  pao:        { name:\'Pão\',         emoji:\'🍞\', type:\'food\',   price:10,  hunger:20,  desc:\'Alimento básico para saciar a fome.\' },
  carne_assada: { name:\'Carne Assada\',  emoji:\'🍖\', type:\'food\',   price:30,  hunger:50,  desc:\'Restaura mais fome e um pouco de vida.\' },
  fruta:      { name:\'Fruta\',       emoji:\'🍎\', type:\'food\',   price:5,   hunger:10,  desc:\'Pequeno lanche.\' },
  sopa:       { name:\'Sopa\',        emoji:\'🍲\', type:\'food\',   price:25,  hunger:40,  desc:\'Quente e reconfortante.\' },
  peixe_grelhado:{ name:\'Peixe Grelhado\',emoji:\'🐟\', type:\'food\',   price:40,  hunger:60,  desc:\'Bom para restaurar energia.\' },

  // Materiais
  madeira:    { name:\'Madeira\',     emoji:\'🪵\', type:\'material\',price:5,   desc:\'Material básico de construção.\' },
  pedra:      { name:\'Pedra\',       emoji:\'🪨\', type:\'material\',price:8,   desc:\'Material resistente.\' },
  ferro:      { name:\'Ferro\',       emoji:\'⛓️\', type:\'material\',price:20,  desc:\'Metal comum para ferramentas.\' },
  ouro:       { name:\'Ouro\',        emoji:\'🪙\', type:\'material\',price:50,  desc:\'Metal precioso.\' },
  diamante:   { name:\'Diamante\',    emoji:\'💎\', type:\'material\',price:150, desc:\'Gema rara e valiosa.\' },
  cristal:    { name:\'Cristal\',     emoji:\'🔮\', type:\'material\',price:100, desc:\'Usado em magias e itens arcanos.\' },
  couro:      { name:\'Couro\',       emoji:\' kože\',type:\'material\',price:12,  desc:\'Pele de animais, para armaduras leves.\' },
  seda:       { name:\'Seda\',        emoji:\'🕸️\', type:\'material\',price:18,  desc:\'Fio fino e resistente.\' },
  veneno:     { name:\'Veneno\',      emoji:\'🧪\', type:\'material\',price:25,  desc:\'Substância tóxica.\' },
  osso:       { name:\'Osso\',        emoji:\'🦴\', type:\'material\',price:7,   desc:\'Restos de criaturas.\' },
  escama:     { name:\'Escama de Dragão\',emoji:\'🐉\',type:\'material\',price:200, desc:\'Material raro de dragões.\' },
  fibra:      { name:\'Fibra\',       emoji:\'🧵\', type:\'material\',price:10,  desc:\'Fibras vegetais.\' },
  carbono:    { name:\'Carbono\',     emoji:\'⚫\', type:\'material\',price:30,  desc:\'Material leve e forte.\' },
  titanio:    { name:\'Titânio\',     emoji:\'⚙️\', type:\'material\',price:180, desc:\'Metal ultra-resistente.\' },
  aco:        { name:\'Aço\',         emoji:\'🛡️\', type:\'material\',price:40,  desc:\'Liga metálica forte.\' },
  placa:      { name:\'Placa de Metal\',emoji:\'🪖\', type:\'material\',price:60,  desc:\'Placas para armaduras pesadas.\' },
  elfico:     { name:\'Madeira Élfica\',emoji:\'🌳\', type:\'material\',price:120, desc:\'Madeira rara e mágica.\' },
};

export const CRAFT_RECIPES = {
  // Ferramentas
  picareta_pedra:  { materials: { madeira:10, pedra:15 },  time: 30000,  xp: 50,  skill:\'forging\', level:5 },
  picareta_ferro:  { materials: { madeira:15, ferro:20 },  time: 60000,  xp: 100, skill:\'forging\', level:10 },
  picareta_ouro:   { materials: { madeira:20, ouro:15 },   time: 90000,  xp: 150, skill:\'forging\', level:15 },
  picareta_diamante:{ materials: { madeira:25, diamante:10 },time: 120000, xp: 200, skill:\'forging\', level:20 },

  machado_pedra:   { materials: { madeira:10, pedra:15 },  time: 30000,  xp: 50,  skill:\'forging\', level:5 },
  machado_ferro:   { materials: { madeira:15, ferro:20 },  time: 60000,  xp: 100, skill:\'forging\', level:10 },
  machado_ouro:    { materials: { madeira:20, ouro:15 },   time: 90000,  xp: 150, skill:\'forging\', level:15 },
  machado_diamante:{ materials: { madeira:25, diamante:10 },time: 120000, xp: 200, skill:\'forging\', level:20 },

  vara_pesca_madeira:{ materials: { madeira:10, fibra:5 },   time: 20000,  xp: 40,  skill:\'forging\', level:5 },
  vara_pesca_fibra:{ materials: { madeira:15, fibra:10 },  time: 40000,  xp: 80,  skill:\'forging\', level:10 },
  vara_pesca_carbono:{ materials: { madeira:20, carbono:5 }, time: 70000,  xp: 120, skill:\'forging\', level:15 },
  vara_pesca_titanio:{ materials: { madeira:25, titanio:5 }, time: 100000, xp: 180, skill:\'forging\', level:20 },

  // Armas
  espada_pedra:  { materials: { pedra:15, madeira:5 },   time: 40000,  xp: 60,  skill:\'forging\', level:5 },
  espada_ferro:  { materials: { ferro:20, madeira:10 },  time: 80000,  xp: 120, skill:\'forging\', level:10 },
  espada_ouro:   { materials: { ouro:15, ferro:5 },     time: 110000, xp: 180, skill:\'forging\', level:15 },
  espada_diamante:{ materials: { diamante:10, ouro:5 },  time: 150000, xp: 250, skill:\'forging\', level:20 },

  arco_reforcado:{ materials: { madeira:15, fibra:10 },  time: 35000,  xp: 55,  skill:\'forging\', level:5 },
  arco_longo:    { materials: { madeira:20, fibra:15 },  time: 70000,  xp: 110, skill:\'forging\', level:10 },
  arco_composto: { materials: { carbono:10, fibra:20 },  time: 100000, xp: 160, skill:\'forging\', level:15 },
  arco_elfico:   { materials: { elfico:10, carbono:15 },  time: 140000, xp: 220, skill:\'forging\', level:20 },

  // Armaduras
  armadura_ferro: { materials: { ferro:25, couro:10 },  time: 90000,  xp: 130, skill:\'forging\', level:10 },
  armadura_aco:   { materials: { aco:30, ferro:15 },    time: 130000, xp: 200, skill:\'forging\', level:15 },
  armadura_placa: { materials: { placa:20, aco:10 },    time: 180000, xp: 280, skill:\'forging\', level:20 },
  armadura_dragao:{ materials: { escama:15, diamante:5 },time: 240000, xp: 350, skill:\'forging\', level:25 },

  // Poções
  pocao_vida_pequena: { materials: { erva:5, agua:1 },    time: 10000,  xp: 20,  skill:\'cooking\', level:1 },
  pocao_vida_media:   { materials: { erva:10, agua:2 },   time: 20000,  xp: 40,  skill:\'cooking\', level:5 },
  pocao_vida_grande:  { materials: { erva:15, agua:3 },   time: 30000,  xp: 60,  skill:\'cooking\', level:10 },
  pocao_mana_pequena: { materials: { cogumelo:5, agua:1 },time: 12000,  xp: 25,  skill:\'cooking\', level:1 },
  pocao_mana_media:   { materials: { cogumelo:10, agua:2 },time: 25000,  xp: 50,  skill:\'cooking\', level:5 },
  pocao_mana_grande:  { materials: { cogumelo:15, agua:3 },time: 35000,  xp: 70,  skill:\'cooking\', level:10 },

  // Comida
  pao:        { materials: { trigo:10, agua:1 },    time: 15000,  xp: 30,  skill:\'cooking\', level:1 },
  carne_assada: { materials: { carne:1, fogo:1 },    time: 25000,  xp: 50,  skill:\'cooking\', level:5 },
  sopa:       { materials: { vegetais:5, agua:2 },  time: 20000,  xp: 40,  skill:\'cooking\', level:1 },
  peixe_grelhado:{ materials: { peixe:1, fogo:1 },    time: 30000,  xp: 60,  skill:\'cooking\', level:5 },
};

export const COOK_RECIPES = {
  pao:        { materials: { trigo:10, agua:1 },    time: 15000,  xp: 30,  skill:\'cooking\', level:1,  hunger:20,  desc:\'Alimento básico para saciar a fome.\' },
  carne_assada: { materials: { carne:1, fogo:1 },    time: 25000,  xp: 50,  skill:\'cooking\', level:5,  hunger:50,  desc:\'Restaura mais fome e um pouco de vida.\' },
  sopa:       { materials: { vegetais:5, agua:2 },  time: 20000,  xp: 40,  skill:\'cooking\', level:1,  hunger:40,  desc:\'Quente e reconfortante.\' },
  peixe_grelhado:{ materials: { peixe:1, fogo:1 },    time: 30000,  xp: 60,  skill:\'cooking\', level:5,  hunger:60,  desc:\'Bom para restaurar energia.\' },
};

export const PET_FOOD = {
  racao_basica: { name:\'Ração Básica\', emoji:\'🍖\', price:50,  hunger:20,  desc:\'Comida simples para pets.\' },
  racao_premium: { name:\'Ração Premium\', emoji:\'🥩\', price:150, hunger:50,  desc:\'Comida de alta qualidade para pets.\' },
  racao_especial: { name:\'Ração Especial\', emoji:\'🌟\', price:500, hunger:100, desc:\'Comida rara que aumenta o humor do pet.\' },
};

export const PET_SKILLS = {
  ataque_rapido: { name:\'Ataque Rápido\', emoji:\'💨\', type:\'attack\', power:10,  manaCost:5,  desc:\'Ataque rápido que causa dano moderado.\' },
  defesa_solida: { name:\'Defesa Sólida\', emoji:\'🛡️\', type:\'defense\', power:15, manaCost:8,  desc:\'Aumenta a defesa do pet por um turno.\' },
  cura_menor:    { name:\'Cura Menor\',    emoji:\'💚\', type:\'heal\',    power:20, manaCost:10, desc:\'Cura uma pequena quantidade de vida do pet.\' },
};

export const QUEST_TYPES = {
  daily:   { name:\'Diária\',   emoji:\'☀️\', },
  weekly:  { name:\'Semanal\',  emoji:\'📅\', },
  monthly: { name:\'Mensal\',   emoji:\'🗓️\', },
};

export const QUEST_STATUS = {
  active:    \'Ativa\',    emoji:\'📝\', 
  completed: \'Concluída\', emoji:\'✅\', 
  expired:   \'Expirada\', emoji:\'❌\', 
};

export const QUEST_REWARDS = {
  money: { name:\'Dinheiro\', emoji:\'💰\', },
  xp:    { name:\'Experiência\', emoji:\'✨\', },
  item:  { name:\'Item\', emoji:\'📦\', },
};

export const QUEST_GOALS = {
  mine:    { name:\'Mineração\',    emoji:\'⛏️\', },
  work:    { name:\'Trabalho\',     emoji:\'💼\', },
  fish:    { name:\'Pesca\',        emoji:\'🎣\', },
  hunt:    { name:\'Caça\',         emoji:\'🏹\', },
  explore: { name:\'Exploração\',   emoji:\'🧭\', },
  duel:    { name:\'Duelo\',        emoji:\'⚔️\', },
  dungeon: { name:\'Masmorra\',     emoji:\'🗺️\', },
  boss:    { name:\'Chefe\',        emoji:\'👹\', },
  crime:   { name:\'Crime\',        emoji:\'🕵️\', },
  cook:    { name:\'Culinária\',    emoji:\'👨‍🍳\', },
  farm:    { name:\'Agricultura\',  emoji:\'🌾\', },
  win:     { name:\'Vitórias\',     emoji:\'🏆\', },
  wealth:  { name:\'Riqueza\',      emoji:\'💰\', },
};

export const MATERIALS = {
  madeira:    { name:\'Madeira\',     emoji:\'🪵\', },
  pedra:      { name:\'Pedra\',       emoji:\'🪨\', },
  ferro:      { name:\'Ferro\',       emoji:\'⛓️\', },
  ouro:       { name:\'Ouro\',        emoji:\'🪙\', },
  diamante:   { name:\'Diamante\',    emoji:\'💎\', },
  cristal:    { name:\'Cristal\',     emoji:\'🔮\', },
  couro:      { name:\'Couro\',       emoji:\' kože\',}, // Corrigido o emoji
  seda:       { name:\'Seda\',        emoji:\'🕸️\', },
  veneno:     { name:\'Veneno\',      emoji:\'🧪\', },
  osso:       { name:\'Osso\',        emoji:\'🦴\', },
  escama:     { name:\'Escama de Dragão\',emoji:\'🐉\',}, 
  fibra:      { name:\'Fibra\',       emoji:\'🧵\', },
  carbono:    { name:\'Carbono\',     emoji:\'⚫\', },
  titanio:    { name:\'Titânio\',     emoji:\'⚙️\', },
  aco:        { name:\'Aço\',         emoji:\'🛡️\', },
  placa:      { name:\'Placa de Metal\',emoji:\'🪖\', },
  elfico:     { name:\'Madeira Élfica\',emoji:\'🌳\', },
  erva:       { name:\'Erva Medicinal\',emoji:\'🌿\', },
  agua:       { name:\'Água\',        emoji:\'💧\', },
  cogumelo:   { name:\'Cogumelo\',    emoji:\'🍄\', },
  trigo:      { name:\'Trigo\',       emoji:\'🌾\', },
  carne:      { name:\'Carne\',       emoji:\'🍖\', },
  fogo:       { name:\'Fogo\',        emoji:\'🔥\', },
  vegetais:   { name:\'Vegetais\',    emoji:\'🥕\', },
  peixe:      { name:\'Peixe\',       emoji:\'🐟\', },
};

// Funções utilitárias (apenas exemplos, as reais seriam mais complexas)
export function loadEconomy() { return {}; } // Placeholder
export function saveEconomy(data) { console.log(\'Saving economy\'); } // Placeholder
export function getEcoUser(userId) { return { name: \'Usuário Teste\', money: 1000, inventory: {}, skills: {}, equipment: {}, pets: [] }; } // Placeholder
export function fmt(amount) { return amount.toLocaleString(\'pt-BR\'); } // Placeholder
export function timeLeft(ms) { return `${Math.floor(ms / 1000)}s`; } // Placeholder
export function applyShopBonuses(user, item) { return item; } // Placeholder
export function getActivePickaxe(user) { return { name: \'Picareta Básica\', durability: 100, bonus: 1.0 }; } // Placeholder
export function ensureEconomyDefaults(user) { return user; } // Placeholder
export function giveMaterial(user, material, amount) { console.log(`Giving ${amount} of ${material} to ${user.name}`); } // Placeholder
export function generateDailyChallenge(user) { return { id: \'d_mine_10\', name: \'Minerador\', desc: \'Minerar 10 vezes\', goal: 10, type: \'mine\', reward: 4000, xp: 150 }; } // Placeholder
export function ensureUserChallenge(user, type) { return { progress: 0, completed: false }; } // Placeholder
export function updateChallenge(user, challengeId, progress) { console.log(`Updating challenge ${challengeId} progress to ${progress}`); } // Placeholder
export function isChallengeCompleted(user, challengeId) { return false; } // Placeholder
export function updateQuestProgress(user, questType, actionType, amount) { console.log(`Updating quest progress for ${questType}, action ${actionType} by ${amount}`); } // Placeholder
export function ensureUserSkills(user) { return user; } // Placeholder
export function skillXpForNext(level) { return level * 100; } // Placeholder
export function addSkillXP(user, skillId, xp) { console.log(`Adding ${xp} XP to skill ${skillId}`); } // Placeholder
export function getSkillBonus(user, skillId) { return 1.0; } // Placeholder
export function endOfWeekTimestamp() { return Date.now() + (7 * 24 * 60 * 60 * 1000); } // Placeholder
export function endOfMonthTimestamp() { return Date.now() + (30 * 24 * 60 * 60 * 1000); } // Placeholder
export function generateWeeklyChallenge(user) { return { id: \'w_mine_30\', name: \'Mineração Intensa\', desc: \'Minerar 30 vezes\', goal: 30, type: \'mine\', reward: 15000, xp: 600 }; } // Placeholder
export function generateMonthlyChallenge(user) { return { id: \'m_battles_50\', name: \'Guerreiro do Mês\', desc: \'Vencer 50 batalhas\', goal: 50, type: \'win\', reward: 200000, xp: 8000 }; } // Placeholder
export function ensureUserPeriodChallenges(user, type) { return { progress: 0, completed: false }; } // Placeholder
export function updatePeriodChallenge(user, challengeId, progress) { console.log(`Updating period challenge ${challengeId} progress to ${progress}`); } // Placeholder
export function isPeriodCompleted(user, challengeId) { return false; } // Placeholder
export function checkLevelUp(user) { return false; } // Placeholder
export function checkLevelDown(user) { return false; } // Placeholder
export function loadLevelingSafe() { return {}; } // Placeholder
export function saveLevelingSafe(data) { console.log(\'Saving leveling safe\'); } // Placeholder
export function getLevelingUser(userId) { return { level: 1, xp: 0 }; } // Placeholder
export function parseAmount(str) { return parseInt(str); } // Placeholder
export function findKeyIgnoringAccents(obj, key) { return key; } // Placeholder
export function matchParam(param, list) { return list[0]; } // Placeholder
export function resolveParamAlias(param) { return param; } // Placeholder
export function normalizeParam(param) { return param; } // Placeholder
export function getUserName(userId) { return \'Usuário RPG\'; } // Placeholder


export function recalcEquipmentBonuses(user) { return { attackBonus: 0, defenseBonus: 0 }; } // Placeholder
export function loadEconomy() { return {}; } // Placeholder
export function saveEconomy(data) { console.log("Saving economy"); } // Placeholder
export function getEcoUser(userId) { return { name: "Usuário Teste", money: 1000, inventory: {}, skills: {}, equipment: {}, pets: [], level: 1, xp: 0, classe: "guerreiro", battlesWon: 0, wallet: 0, bank: 0, achievements: {}, cooldowns: {}, quests: { daily: [], weekly: [], monthly: [], lastDaily: 0, lastWeekly: 0, lastMonthly: 0 }, prestige: { level: 0, totalResets: 0, bonusMultiplier: 1.0, titles: [] }, streak: { current: 0, best: 0, lastClaim: 0 }, house: { type: null, decorations: [], lastCollect: 0 }, family: { spouse: null, children: [], parents: [] }, reputation: { points: 0, upvotes: 0, downvotes: 0 }, materials: {}, ingredients: {}, cookedFood: {}, farm: { plots: [], maxPlots: 4 }, stats: { totalMine: 0, workCount: 0, fishCount: 0, huntCount: 0, exploreCount: 0, crimes: 0, bossKills: 0, cookCount: 0, farmCount: 0 } }; } // Placeholder
export function fmt(amount) { return amount.toLocaleString("pt-BR"); } // Placeholder
export function timeLeft(ms) { 
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
} // Placeholder
export function applyShopBonuses(user, item) { return item; } // Placeholder
export function getActivePickaxe(user) { return { name: "Picareta Básica", durability: 100, bonus: 1.0 }; } // Placeholder
export function ensureEconomyDefaults(user) { return user; } // Placeholder
export function giveMaterial(user, material, amount) { console.log(`Giving ${amount} of ${material} to ${user.name}`); } // Placeholder
export function generateDailyChallenge(user) { return { id: "d_mine_10", name: "Minerador", desc: "Minerar 10 vezes", goal: 10, type: "mine", reward: 4000, xp: 150 }; } // Placeholder
export function ensureUserChallenge(user, type) { return { progress: 0, completed: false }; } // Placeholder
export function updateChallenge(user, challengeId, progress) { console.log(`Updating challenge ${challengeId} progress to ${progress}`); } // Placeholder
export function isChallengeCompleted(user, challengeId) { return false; } // Placeholder
export function updateQuestProgress(user, questType, actionType, amount) { console.log(`Updating quest progress for ${questType}, action ${actionType} by ${amount}`); } // Placeholder
export function ensureUserSkills(user) { return user; } // Placeholder
export function skillXpForNext(level) { return level * 100; } // Placeholder
export function addSkillXP(user, skillId, xp) { console.log(`Adding ${xp} XP to skill ${skillId}`); } // Placeholder
export function getSkillBonus(user, skillId) { return 1.0; } // Placeholder
export function endOfWeekTimestamp() { return Date.now() + (7 * 24 * 60 * 60 * 1000); } // Placeholder
export function endOfMonthTimestamp() { return Date.now() + (30 * 24 * 60 * 60 * 1000); } // Placeholder
export function generateWeeklyChallenge(user) { return { id: "w_mine_30", name: "Mineração Intensa", desc: "Minerar 30 vezes", goal: 30, type: "mine", reward: 15000, xp: 600 }; } // Placeholder
export function generateMonthlyChallenge(user) { return { id: "m_battles_50", name: "Guerreiro do Mês", desc: "Vencer 50 batalhas", goal: 50, type: "win", reward: 200000, xp: 8000 }; } // Placeholder
export function ensureUserPeriodChallenges(user, type) { return { progress: 0, completed: false }; } // Placeholder
export function updatePeriodChallenge(user, challengeId, progress) { console.log(`Updating period challenge ${challengeId} progress to ${progress}`); } // Placeholder
export function isPeriodCompleted(user, challengeId) { return false; } // Placeholder
export function checkLevelUp(user) { return false; } // Placeholder
export function checkLevelDown(user) { return false; } // Placeholder
export function loadLevelingSafe() { return {}; } // Placeholder
export function saveLevelingSafe(data) { console.log("Saving leveling safe"); } // Placeholder
export function getLevelingUser(userId) { return { level: 1, xp: 0 }; } // Placeholder
export function parseAmount(str) { return parseInt(str); } // Placeholder
export function findKeyIgnoringAccents(obj, key) { return key; } // Placeholder
export function matchParam(param, list) { return list[0]; } // Placeholder
export function resolveParamAlias(param) { return param; } // Placeholder
export function normalizeParam(param) { return param; } // Placeholder
export function getUserName(userId) { return "Usuário RPG"; } // Placeholder

export function applyPetDegradation(pets) {
  if (!Array.isArray(pets) || !pets.length) return { changed: false };
  const now = Date.now(), H = 3600000;
  let changed = false;
  pets.forEach(pet => {
    if (!pet.lastUpdate) { pet.lastUpdate = now; changed = true; return; }
    const hrs = (now - pet.lastUpdate) / H;
    if (hrs < 1) return;
    pet.hunger = Math.max(0, (pet.hunger ?? 100) - Math.floor(hrs * 4.2));
    pet.mood   = Math.max(0, (pet.mood   ?? 100) - Math.floor(hrs * 2.1));
    if (pet.hunger < 30) pet.mood = Math.max(0, pet.mood - Math.floor(hrs * 5));
    if (pet.hunger === 0 && hrs >= 2) pet.hp = Math.max(1, (pet.hp ?? pet.maxHp) - Math.floor(hrs * pet.maxHp * 0.02));
    pet.lastUpdate = now; changed = true;
  });
  return { changed };
}

export function getEventMultiplier(type) {
  const now = new Date();
  const day = now.getDay();   // 0=dom…6=sáb
  const hour = now.getHours();
  let mult = 1.0;
  // Bônus diário por tipo
  const dailyBonus = {
    0: { all: 2.0 },                // Domingo: tudo 2x
    1: { mine: 1.5 },               // Segunda: mineração 1.5x
    2: { fish: 1.5 },               // Terça: pesca 1.5x
    3: { hunt: 1.5 },               // Quarta: caça 1.5x
    4: { work: 1.75 },              // Quinta: trabalho 1.75x
    5: { duel: 2.0, arena: 2.0 },   // Sexta: batalhas 2x
    6: { casino: 1.3 },             // Sábado: cassino 1.3x
  };
  const bonus = dailyBonus[day] || {};
  if (bonus.all)       mult *= bonus.all;
  if (bonus[type])     mult *= bonus[type];
  // Happy Hour: 18h-20h → +30% em tudo
  if (hour >= 18 && hour < 20) mult *= 1.3;
  // Hora do Almoço: 12h-14h → cooldowns reduzidos (sinalizamos com 0.5 no mult especial)
  return mult;
}

export function getClassBonus(me, type) {
  const cls = CLASSES[me.classe];
  if (!cls) return 0;
  const map = { mine:"mago", work:"bardo", fish:"druida", hunt:"druida", explore:"arqueiro", crime:"ladino", duel:"guerreiro", def:"paladino" };
  return cls.name === CLASSES[map[type]]?.name ? 0.15 : 0;
}

export function calcPlayerPower(me) {
  const base = 100 + (me.level || 1) * 12;
  const cls  = CLASSES[me.classe];
  const atk  = (me.attackBonus || 0) + (cls?.atk || 0);
  const pres = me.prestige?.bonusMultiplier || 1;
  const boost = me.activeBoost ? me.activeBoost.atkBonus || 0 : 0;
  return Math.floor((base + atk + boost) * pres);
}

export function calcPlayerDefense(me) {
  const base = 50 + (me.level || 1) * 5;
  const cls  = CLASSES[me.classe];
  const def  = (me.defenseBonus || 0) + (cls?.def || 0);
  const pres = me.prestige?.bonusMultiplier || 1;
  return Math.floor((base + def) * pres);
}

export function simulateBattle(attacker, defender, turns = 12) {
  let aHp = 200 + (attacker.level || 1) * 15;
  let dHp = 200 + (defender.level || 1) * 15;
  const aPow = calcPlayerPower(attacker);
  const dPow = calcPlayerPower(defender);
  const aDef = calcPlayerDefense(attacker);
  const dDef = calcPlayerDefense(defender);
  const log = [];
  for (let t = 0; t < turns && aHp > 0 && dHp > 0; t++) {
    const aDmg = Math.max(5, aPow - Math.floor(Math.random() * dDef * 0.5) + Math.floor(Math.random() * 20));
    const dDmg = Math.max(5, dPow - Math.floor(Math.random() * aDef * 0.5) + Math.floor(Math.random() * 20));
    dHp -= aDmg; aHp -= dDmg;
    if (t < 3) log.push({ t: t + 1, aDmg, dDmg });
  }
  return { aWin: aHp > dHp, aHpLeft: Math.max(0, aHp), dHpLeft: Math.max(0, dHp), log };
}

export function checkAchievements(me) {
  if (!me.achievements) me.achievements = {};
  const gained = [];
  const stats = me.stats || {};
  const checks = {
    primeiro_passo:  () => (stats.totalMine || 0) + (stats.workCount || 0) > 0,
    minerador:       () => (stats.totalMine   || 0) >= 50,
    trabalhador:     () => (stats.workCount   || 0) >= 50,
    pescador:        () => (stats.fishCount   || 0) >= 50,
    cacador:         () => (stats.huntCount   || 0) >= 50,
    explorador:      () => (stats.exploreCount|| 0) >= 50,
    gladiador:       () => (me.battlesWon     || 0) >= 30,
    campeao:         () => (me.battlesWon     || 0) >= 100,
    milionario:      () => (me.wallet || 0) + (me.bank || 0) >= 1000000,
    veterano:        () => (me.level          || 1) >= 50,
    lenda:           () => (me.level          || 1) >= 100,
    colecionador:    () => (me.pets           || []).length >= 5,
    criminoso:       () => (stats.crimes      || 0) >= 50,
    chefe_do_crime:  () => (stats.crimes      || 0) >= 200,
    destruidor:      () => (stats.bossKills   || 0) >= 20,
    arquiteto:       () => !!me.house?.type,
    chefe_cla:       () => !!(me.clan && me._isClanLeader),
    prestige1:       () => (me.prestige?.level || 0) >= 1,
    cozinheiro:      () => (stats.cookCount   || 0) >= 30,
    fazendeiro:      () => (stats.farmCount   || 0) >= 50,
  };
  for (const [id, fn] of Object.entries(checks)) {
    if (!me.achievements[id] && fn()) {
      me.achievements[id] = { earnedAt: Date.now() };
      gained.push(ACHIEVEMENTS[id]);
    }
  }
  return gained;
}

export function ensureUserRPG(me) {
  if (!me.stats)       me.stats       = {};
  if (!me.achievements) me.achievements = {};
  if (!me.cooldowns)   me.cooldowns   = {};
  if (!me.quests)      me.quests      = { daily: [], weekly: [], monthly: [], lastDaily: 0, lastWeekly: 0, lastMonthly: 0 };
  if (!me.prestige)    me.prestige    = { level: 0, totalResets: 0, bonusMultiplier: 1.0, titles: [] };
  if (!me.streak)      me.streak      = { current: 0, best: 0, lastClaim: 0 };
  if (!me.house)       me.house       = { type: null, decorations: [], lastCollect: 0 };
  if (!me.family)      me.family      = { spouse: null, children: [], parents: [] };
  if (!me.reputation)  me.reputation  = { points: 0, upvotes: 0, downvotes: 0 };
  if (!me.pets)        me.pets        = [];
  if (!me.inventory)   me.inventory   = {};
  if (!me.materials)   me.materials   = {};
  if (!me.ingredients) me.ingredients = {};
  if (!me.cookedFood)  me.cookedFood  = {};
  if (!me.farm)        me.farm        = { plots: [], maxPlots: 4 };
  if (me.prestige && typeof me.prestige !== "object") me.prestige = { level: 0, totalResets: 0, bonusMultiplier: 1.0, titles: [] };
  return me;
}

export function checkRegistered(user) { return user && user.name !== "Usuário Teste"; } // Placeholder
export function checkCooldown(user, action) { return user.cooldowns[action] && Date.now() < user.cooldowns[action] ? user.cooldowns[action] - Date.now() : 0; } // Placeholder
export function setCooldown(user, action, duration) { user.cooldowns[action] = Date.now() + duration; } // Placeholder
export function getInventoryDisplay(user) { return "Inventário Vazio"; } // Placeholder
export function getEquipmentDisplay(user) { return "Nenhum equipamento"; } // Placeholder
export function getSkillsDisplay(user) { return "Nenhuma habilidade"; } // Placeholder
export function getPetsDisplay(user) { return "Nenhum pet"; } // Placeholder
export function getHouseDisplay(user) { return "Nenhuma casa"; } // Placeholder
export function getFamilyDisplay(user) { return "Nenhuma família"; } // Placeholder
export function getReputationDisplay(user) { return "Nenhuma reputação"; } // Placeholder
export function getAchievementsDisplay(user) { return "Nenhum achievement"; } // Placeholder
export function getQuestsDisplay(user) { return "Nenhuma quest"; } // Placeholder
export function getPrestigeDisplay(user) { return "Nenhum prestígio"; } // Placeholder
export function getStreakDisplay(user) { return "Nenhuma sequência"; } // Placeholder
export function getShopDisplay(user) { return "Nenhum item na loja"; } // Placeholder
export function getCraftDisplay(user) { return "Nenhuma receita de craft"; } // Placeholder
export function getCookDisplay(user) { return "Nenhuma receita de cozinha"; } // Placeholder
export function getFarmDisplay(user) { return "Nenhuma fazenda"; } // Placeholder
export function getPetShopDisplay(user) { return "Nenhum pet na loja"; } // Placeholder
export function getPetFoodDisplay(user) { return "Nenhuma comida de pet"; } // Placeholder
export function getPetSkillsDisplay(user) { return "Nenhuma habilidade de pet"; } // Placeholder
export function getDungeonDisplay(user) { return "Nenhuma dungeon"; } // Placeholder
export function getBossDisplay(user) { return "Nenhum boss"; } // Placeholder
export function getArenaDisplay(user) { return "Nenhuma arena"; } // Placeholder
export function getCrimeDisplay(user) { return "Nenhum crime"; } // Placeholder
export function getRobDisplay(user) { return "Nenhum roubo"; } // Placeholder
export function getProtectDisplay(user) { return "Nenhuma proteção"; } // Placeholder
export function getPetBattleDisplay(user) { return "Nenhuma batalha de pet"; } // Placeholder
export function getTrainDisplay(user) { return "Nenhum treino"; } // Placeholder
export function getCollectDisplay(user) { return "Nenhuma coleta"; } // Placeholder
export function getLeaderboardDisplay(type) { return "Nenhum leaderboard"; } // Placeholder
export function getHelpDisplay(user) { return "Ajuda"; } // Placeholder
export function getAboutDisplay() { return "Sobre"; } // Placeholder
export function getRegisterDisplay() { return "Registrar"; } // Placeholder
export function getProfileDisplay(user) { return "Perfil"; } // Placeholder
export function getInventory(user) { return user.inventory; } // Placeholder
export function getEquipment(user) { return user.equipment; } // Placeholder
export function getSkills(user) { return user.skills; } // Placeholder
export function getPets(user) { return user.pets; } // Placeholder
export function getHouse(user) { return user.house; } // Placeholder
export function getFamily(user) { return user.family; } // Placeholder
export function getReputation(user) { return user.reputation; } // Placeholder
export function getAchievements(user) { return user.achievements; } // Placeholder
export function getQuests(user) { return user.quests; } // Placeholder
export function getPrestige(user) { return user.prestige; } // Placeholder
export function getStreak(user) { return user.streak; } // Placeholder
export function getShop(user) { return SHOP_ITEMS; } // Placeholder
export function getCraft(user) { return CRAFT_RECIPES; } // Placeholder
export function getCook(user) { return COOK_RECIPES; } // Placeholder
export function getFarm(user) { return user.farm; } // Placeholder
export function getPetShop(user) { return PET_TYPES; } // Placeholder
export function getPetFood(user) { return PET_FOOD; } // Placeholder
export function getPetSkills(user) { return PET_SKILLS; } // Placeholder
export function getDungeon(user) { return DUNGEONS; } // Placeholder
export function getBoss(user) { return BOSSES; } // Placeholder
export function getArena(user) { return "Arena"; } // Placeholder
export function getCrime(user) { return "Crime"; } // Placeholder
export function getRob(user) { return "Roubo"; } // Placeholder
export function getProtect(user) { return "Proteção"; } // Placeholder
export function getPetBattle(user) { return "Batalha de Pet"; } // Placeholder
export function getTrain(user) { return "Treino"; } // Placeholder
export function getCollect(user) { return "Coleta"; } // Placeholder
export function getLeaderboard(type) { return "Leaderboard"; } // Placeholder
export function getHelp() { return "Ajuda"; } // Placeholder
export function getAbout() { return "Sobre"; } // Placeholder
export function getRegister() { return "Registrar"; } // Placeholder
export function getProfile(user) { return "Perfil"; } // Placeholder


export const DEFAULT_JOBS = { estagiario:{name:\'Estagiário\',min:80,max:140}, designer:{name:\'Designer\',min:150,max:250}, programador:{name:\'Programador\',min:200,max:350}, gerente:{name:\'Gerente\',min:260,max:420}, medico:{name:\'Médico\',min:400,max:700}, advogado:{name:\'Advogado\',min:350,max:600}, engenheiro:{name:\'Engenheiro\',min:300,max:550}, professor:{name:\'Professor\',min:200,max:380} };


export const COOKING_RECIPES = {
  pao:        { name:\'🍞 Pão\',          requires:{trigo:3},                    gold:10,  sellPrice:50,  energy:10, buff:null },
  sopa:       { name:\'🍲 Sopa\',         requires:{cenoura:2,batata:2},         gold:15,  sellPrice:80,  energy:20, buff:null },
  salada:     { name:\'🥗 Salada\',       requires:{alface:2,tomate:2},          gold:12,  sellPrice:60,  energy:15, buff:{type:\'luck\',value:5,duration:30} },
  bolo:       { name:\'🍰 Bolo\',         requires:{trigo:5,ovo:3},              gold:25,  sellPrice:120, energy:30, buff:{type:\'xp\',value:15,duration:60} },
  pizza:      { name:\'🍕 Pizza\',        requires:{trigo:4,tomate:3,queijo:2},  gold:35,  sellPrice:150, energy:40, buff:{type:\'all\',value:10,duration:60} },
  hamburguer: { name:\'🍔 Hambúrguer\',   requires:{carne:2,trigo:3,alface:1},   gold:40,  sellPrice:180, energy:50, buff:{type:\'atk\',value:20,duration:30} },
  sushi:      { name:\'🍣 Sushi\',        requires:{peixe:4,arroz:3},            gold:50,  sellPrice:200, energy:45, buff:{type:\'def\',value:20,duration:30} },
  macarrao:   { name:\'🍝 Macarrão\',     requires:{trigo:3,tomate:2},           gold:20,  sellPrice:90,  energy:25, buff:null },
  churrasco:  { name:\'🥩 Churrasco\',    requires:{carne:4,carvao:2},           gold:60,  sellPrice:250, energy:60, buff:{type:\'atk\',value:35,duration:45} },
  poção_hp:   { name:\'🧪 Poção de HP\',  requires:{erva:3,cristal:1},           gold:80,  sellPrice:300, energy:0,  buff:{type:\'heal\',value:100,duration:0} },
  pocao_mp:   { name:\'💧 Poção de MP\',  requires:{erva:2,cristal:2},           gold:100, sellPrice:400, energy:0,  buff:{type:\'mana\',value:50,duration:0} },
  elixir:     { name:\'✨ Elixir Místico\',requires:{cristal:3,diamante:1,erva:5},gold:500,sellPrice:2000,energy:100,buff:{type:\'all\',value:30,duration:120} },
};


export const MATERIALS_PRICES = {
  madeira:    5,
  pedra:      8,
  ferro:      20,
  ouro:       50,
  diamante:   150,
  cristal:    100,
  couro:      12,
  seda:       18,
  veneno:     25,
  osso:       7,
  escama:     200,
  fibra:      10,
  carbono:    30,
  titanio:    180,
  aco:        40,
  placa:      60,
  elfico:     120,
  erva:       15,
  agua:       2,
  cogumelo:   10,
  trigo:      4,
  carne:      20,
  fogo:       0, // Fogo geralmente não é um material vendável
  vegetais:   8,
  peixe:      15,
};


export const SEEDS = {
  trigo:    { name:'🌾 Trigo',    price:50,  growTime:10*60*1000, yield:{trigo:3}, sellPrice:15 },
  cenoura:  { name:'🥕 Cenoura',  price:70,  growTime:15*60*1000, yield:{cenoura:2}, sellPrice:20 },
  batata:   { name:'🥔 Batata',   price:80,  growTime:18*60*1000, yield:{batata:2}, sellPrice:25 },
  tomate:   { name:'🍅 Tomate',   price:90,  growTime:20*60*1000, yield:{tomate:2}, sellPrice:30 },
  alface:   { name:'🥬 Alface',   price:60,  growTime:12*60*1000, yield:{alface:2}, sellPrice:18 },
  arroz:    { name:'🍚 Arroz',    price:100, growTime:25*60*1000, yield:{arroz:3}, sellPrice:35 },
  milho:    { name:'🌽 Milho',    price:110, growTime:22*60*1000, yield:{milho:2}, sellPrice:38 },
  abobora:  { name:'🎃 Abóbora',  price:150, growTime:30*60*1000, yield:{abobora:1}, sellPrice:50 },
  algodao:  { name:'☁️ Algodão',  price:120, growTime:28*60*1000, yield:{algodao:2}, sellPrice:40 },
  cana:     { name:'🎋 Cana',     price:80,  growTime:15*60*1000, yield:{cana:3}, sellPrice:22 },
};


export const SHOP_ITEMS = {
  picareta_bronze: { name: 'Picareta de Bronze', price: 500, type: 'tool', toolType: 'pickaxe', durability: 100, tier: 'bronze' },
  picareta_ferro:  { name: 'Picareta de Ferro',  price: 1500, type: 'tool', toolType: 'pickaxe', durability: 250, tier: 'ferro' },
  picareta_diamante: { name: 'Picareta de Diamante', price: 5000, type: 'tool', toolType: 'pickaxe', durability: 500, tier: 'diamante' },
  repairkit:       { name: 'Kit de Reparos',     price: 200, type: 'consumable' },
  espada_ferro:    { name: 'Espada de Ferro',    price: 1000, type: 'weapon' },
  armadura_aco:    { name: 'Armadura de Aço',    price: 2000, type: 'armor' },
  pocao_vida_pequena: { name: 'Poção de Vida Pequena', price: 150, type: 'potion', heal: 50 },
  pocao_mana_pequena: { name: 'Poção de Mana Pequena', price: 150, type: 'potion', mana: 50 },
};

export const CRAFT_RECIPES = {
  espada_ferro: {
    materials: { ferro: 5, madeira: 2 },
    gold: 200,
  },
  armadura_aco: {
    materials: { aco: 8, couro: 3 },
    gold: 500,
  },
};

export const PET_FOOD = {
  racao_basica: { name: 'Ração Básica', price: 50, hunger: 20 },
  racao_premium: { name: 'Ração Premium', price: 150, hunger: 50 },
};


export const SOLO_DUNGEONS = [
  { id:
'aranhas',  name:'Caverna das Aranhas',   emoji:'🕷️', minLevel:1,  floors:3, reward:[800,1500],   xp:80,  loot:['seda','veneno'] },
  { id:'cripta',   name:'Cripta dos Mortos-Vivos',emoji:'🧟', minLevel:5,  floors:5, reward:[2000,4500],  xp:200, loot:['osso','cristal'] },
  { id:'dragao',   name:'Covil do Dragão',        emoji:'🐉', minLevel:10, floors:7, reward:[5000,10000], xp:500, loot:['escama','ouro'] },
  { id:'demonios', name:'Fortaleza Demoníaca',     emoji:'👹', minLevel:20, floors:10,reward:[12000,22000],xp:1000,loot:['cristal','diamante'] },
  { id:'celestial',name:'Torre Celestial',         emoji:'☁️', minLevel:35, floors:15,reward:[30000,55000],xp:2500,loot:['diamante','ouro'] },
];

export const DUNGEONS = {
  floresta: { emoji:'🌲', name:'Floresta Sombria',  minLevel:1,  players:2, reward:6000,  xp:250,  boss:'🐺 Lobo Alfa',      floors:3, loot:['madeira','couro'] },
  caverna:  { emoji:'🕳️',name:'Caverna Cristalina', minLevel:5,  players:3, reward:18000, xp:600,  boss:'🦇 Morcego Rei',     floors:5, loot:['cristal','pedra'] },
  ruinas:   { emoji:'🏚️',name:'Ruínas Antigas',     minLevel:10, players:3, reward:40000, xp:1200, boss:'💀 Necromante',      floors:7, loot:['ouro','ferro'] },
  vulcao:   { emoji:'🌋', name:'Vulcão Ardente',     minLevel:20, players:4, reward:90000, xp:3000, boss:'🔥 Dragão de Fogo',  floors:10,loot:['diamante','ouro'] },
  abismo:   { emoji:'🌀', name:'Abismo Profundo',    minLevel:35, players:4, reward:220000,xp:7000, boss:'👹 Demônio Ancião',  floors:15,loot:['diamante','cristal'] },
};


export const BOSSES = [
  { id:
'dragao',   name:
'Dragão Ancião',    emoji:
'🐉', tier:1, hp:2000, atk:120, def:60,  reward:25000,  xp:800,  loot:['espada_diamante','cristal'] },
  { id:
'golem',    name:
'Golem de Pedra',   emoji:
'🗿', tier:1, hp:3000, atk:80,  def:120, reward:20000,  xp:600,  loot:['armadura_aco','ouro'] },
  { id:
'hidra',    name:
'Hidra Venenosa',   emoji:
'🐍', tier:2, hp:1800, atk:150, def:40,  reward:30000,  xp:1000, loot:['arco_reforcado','cristal'] },
  { id:
'fenix',    name:
'Fênix Sombria',    emoji:
'🔥', tier:2, hp:1500, atk:140, def:50,  reward:35000,  xp:1200, loot:['espada_aco','diamante'] },
  { id:
'kraken',   name:
'Kraken Abissal',   emoji:
'🦑', tier:2, hp:2500, atk:110, def:80,  reward:28000,  xp:900,  loot:['armadura_ferro','ouro'] },
  { id:
'lich',     name:
'Lich Supremo',     emoji:
'💀', tier:3, hp:4000, atk:200, def:100, reward:60000,  xp:2000, loot:['espada_diamante','cristal','diamante'] },
  { id:
'titan',    name:
'Titã de Ferro',    emoji:
'⚙️', tier:3, hp:5000, atk:180, def:150, reward:75000,  xp:2500, loot:['armadura_aco','diamante'] },
  { id:
'deus',     name:
'Deus da Escuridão',emoji:
'🌑', tier:4, hp:8000, atk:300, def:200, reward:150000, xp:5000, loot:['espada_diamante','cristal','diamante','ouro'] },
];

export const CLASSES = {
  guerreiro: { emoji:
'⚔️',  name:
'Guerreiro', atk:25, def:10, luck:0,  mana:0,  passiva:
'Fúria — +30% dano em duelos' },
  mago:      { emoji:
'🧙',  name:
'Mago',      atk:15, def:5,  luck:5,  mana:30, passiva:
'Arcano — +25% EXP em todas as ações' },
  arqueiro:  { emoji:
'🏹',  name:
'Arqueiro',  atk:20, def:8,  luck:15, mana:0,  passiva:
'Precisão — +20% crítico em caça/exploração' },
  curandeiro: { emoji:
'💚', name:
'Curandeiro',atk:8,  def:20, luck:5,  mana:15, passiva:
'Cura — Recupera 25% HP após batalhas' },
  ladino:    { emoji:
'🗡️', name:
'Ladino',    atk:18, def:8,  luck:20, mana:0,  passiva:
'Sombra — +25% sucesso em crimes e roubos' },
  paladino:  { emoji:
'🛡️', name:
'Paladino',  atk:12, def:30, luck:0,  mana:10, passiva:
'Proteção — -25% dano recebido em batalhas' },
  bardo:     { emoji:
'🎵',  name:
'Bardo',     atk:10, def:10, luck:25, mana:20, passiva:
'Carisma — +20% em economia e comércio' },
  druida:    { emoji:
'🌿',  name:
'Druida',    atk:15, def:12, luck:10, mana:15, passiva:
'Natureza — +35% em plantio, pesca e caça' },
};


export const PET_TYPES = {
  lobo:    { name:
'Lobo',    emoji:
'🐺', evolutions:['Filhote de Lobo','Lobo Cinzento','Lobo Alfa'],     baseAtk:15, baseDef:8  },
  dragao:  { name:
'Dragão',  emoji:
'🐉', evolutions:['Ovo de Dragão','Dragão Jovem','Dragão Ancião'],    baseAtk:25, baseDef:15 },
  fenix:   { name:
'Fênix',   emoji:
'🔥', evolutions:['Pintinho de Fênix','Fênix Jovem','Fênix Eterna'], baseAtk:20, baseDef:10 },
  tigre:   { name:
'Tigre',   emoji:
'🐯', evolutions:['Filhote de Tigre','Tigre','Tigre Lendário'],       baseAtk:22, baseDef:12 },
  aguia:   { name:
'Águia',   emoji:
'🦅', evolutions:['Aquilão','Águia Real','Águia Celestial'],           baseAtk:18, baseDef:8  },
  unicornio:{ name:
'Unicórnio',emoji:
'🦄',evolutions:['Potro Mágico','Unicórnio','Unicórnio Divino'],   baseAtk:12, baseDef:20 },
  golem:   { name:
'Golem',   emoji:
'🗿', evolutions:['Golemzinho','Golem de Pedra','Golem Titã'],         baseAtk:18, baseDef:30 },
};


export function cdFmt(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

export function hbar(current, max, size) {
  const percent = current / max;
  const numBars = Math.floor(percent * size);
  return '█'.repeat(numBars) + '░'.repeat(size - numBars);
}


export function simulateBattle(player1, player2) {
  let p1Hp = player1.maxHp || 200;
  let p2Hp = player2.maxHp || 200;
  let p1Atk = calcPlayerPower(player1);
  let p2Atk = calcPlayerPower(player2);
  let p1Def = calcPlayerDefense(player1);
  let p2Def = calcPlayerDefense(player2);

  const log = [];
  let turn = 0;
  const maxTurns = 15; // Limit turns to prevent infinite loops

  while (p1Hp > 0 && p2Hp > 0 && turn < maxTurns) {
    turn++;
    const p1Dmg = Math.max(1, p1Atk - Math.floor(Math.random() * p2Def * 0.5));
    const p2Dmg = Math.max(1, p2Atk - Math.floor(Math.random() * p1Def * 0.5));

    p2Hp -= p1Dmg;
    p1Hp -= p2Dmg;

    log.push({ t: turn, aDmg: p1Dmg, dDmg: p2Dmg });
  }

  const aWin = p1Hp >= p2Hp;
  return { aWin, p1HpLeft: Math.max(0, p1Hp), p2HpLeft: Math.max(0, p2Hp), log };
}

export function parseAmount(input, max) {
  if (input.toLowerCase() === 'all' || input.toLowerCase() === 'tudo') return max;
  const amount = parseInt(input);
  if (isNaN(amount) || amount <= 0) return 0;
  return Math.min(amount, max);
}


export const WEEKLY_QUESTS = [
  { id:
'w_duel_10',    name:
'⚔️ Duelos da Semana',     desc:
'Duelar 10 vezes',           goal:10,  type:
'duel',    reward:25000,  xp:1000 },
  { id:
'w_dungeon_5',  name:
'🗺️ Explorador Semanal',   desc:
'Completar 5 dungeons',      goal:5,   type:
'dungeon', reward:40000,  xp:1500 },
  { id:
'w_boss_3',     name:
'👹 Caçador de Bosses',     desc:
'Derrotar 3 bosses',         goal:3,   type:
'boss',    reward:50000,  xp:2000 },
  { id:
'w_mine_30',    name:
'⛏️ Mineração Intensa',     desc:
'Minerar 30 vezes',          goal:30,  type:
'mine',    reward:15000,  xp:600  },
  { id:
'w_crime_15',   name:
'🕵️ Semana do Crime',      desc:
'Cometer 15 crimes',         goal:15,  type:
'crime',   reward:20000,  xp:800  },
  { id:
'w_cook_20',    name:
'👨‍🍳 Semana Culinária',   desc:
'Cozinhar 20 receitas',      goal:20,  type:
'cook',    reward:18000,  xp:700  },
  { id:
'w_farm_25',    name:
'🌾 Semana da Fazenda',     desc:
'Colher 25 plantações',      goal:25,  type:
'farm',    reward:12000,  xp:500  },
];

export const MONTHLY_QUESTS = [
  { id:
'm_battles_50', name:
'🏆 Guerreiro do Mês',      desc:
'Vencer 50 batalhas',        goal:50,  type:
'win',     reward:200000, xp:8000 },
  { id:
'm_rich',       name:
'💰 Magnata do Mês',         desc:
'Acumular 500k moedas totais',goal:500000,type:
'wealth',reward:100000, xp:5000 },
  { id:
'm_boss_10',    name:
'💀 Destruidor Mensal',      desc:
'Derrotar 10 bosses',        goal:10,  type:
'boss',    reward:300000, xp:12000},
  { id:
'm_dungeon_20', name:
'🗺️ Aventureiro do Mês',    desc:
'Completar 20 dungeons',     goal:20,  type:
'dungeon', reward:250000, xp:10000},
];

export const DAILY_QUESTS_POOL = [
  { id:
'd_duel_3',     name:
'⚔️ Duelista',              desc:
'Duelar 3 vezes',            goal:3,   type:
'duel',    reward:5000,   xp:200 },
  { id:
'd_dungeon_2',  name:
'🗺️ Aventureiro',           desc:
'Completar 2 dungeons',      goal:2,   type:
'dungeon', reward:8000,   xp:300 },
  { id:
'd_mine_10',    name:
'⛏️ Minerador',              desc:
'Minerar 10 vezes',          goal:10,  type:
'mine',    reward:4000,   xp:150 },
  { id:
'd_work_10',    name:
'💼 Trabalhador',            desc:
'Trabalhar 10 vezes',        goal:10,  type:
'work',    reward:4000,   xp:150 },
  { id:
'd_fish_10',    name:
'🎣 Pescador',             desc:
'Pescar 10 vezes',           goal:10,  type:
'fish',    reward:4000,   xp:150 },
  { id:
'd_hunt_5',     name:
'🏹 Caçador',              desc:
'Caçar 5 vezes',             goal:5,   type:
'hunt',    reward:6000,   xp:250 },
  { id:
'd_explore_5',  name:
'🧭 Explorador',           desc:
'Explorar 5 vezes',          goal:5,   type:
'explore', reward:6000,   xp:250 },
  { id:
'd_crime_3',    name:
'🕵️ Criminoso',            desc:
'Cometer 3 crimes',          goal:3,   type:
'crime',   reward:7000,   xp:300 },
  { id:
'd_cook_5',     name:
'👨‍🍳 Cozinheiro',           desc:
'Cozinhar 5 receitas',       goal:5,   type:
'cook',    reward:5000,   xp:200 },
  { id:
'd_farm_5',     name:
'🌾 Fazendeiro',           desc:
'Colher 5 plantações',       goal:5,   type:
'farm',    reward:4000,   xp:150 },
  { id:
'd_daily_1',    name:
'🎁 Coleta Diária',          desc:
'Coletar recompensa diária', goal:1,   type:
'daily',   reward:10000,  xp:500 },
];
