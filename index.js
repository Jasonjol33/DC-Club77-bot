require('dotenv').config();
const {
  Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, REST, Routes,
  PermissionFlagsBits, MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  StringSelectMenuBuilder, ActivityType, Events,
} = require('discord.js');

const {
  TOKEN, CLIENT_ID, GUILD_ID,
  LOG_CHANNEL_ID, URLAUB_CHANNEL_ID, TICKET_CHANNEL_ID, EVENT_CHANNEL_ID,
  STAFF_ROLE_IDS = '', BANNER_URL, LOGO_URL,
  DM_ENABLED = 'true',
} = process.env;

const STAFF = STAFF_ROLE_IDS.split(',').map((s) => s.trim()).filter(Boolean);
const SERVER = 'Club 77';
const SEND_DMS = DM_ENABLED.toLowerCase() !== 'false';

const C = {
  purple: 0x9b59ff, green: 0x2ecc71, red: 0xe74c3c,
  orange: 0xff9f1c, blue: 0x5865f2, gold: 0xf1c40f,
};

// ───────────────────────── Events (vorgefertigte Texte) ─────────────────────────
const EVENTS = {
  halloween: {
    label: 'Halloween', emoji: '🎃', color: 0xff7518, title: 'Halloween-Event',
    desc: 'Die Nacht des Grauens naht … 👻\nSchlüpft in euer schaurigstes Kostüm und feiert mit uns die gruseligste Nacht des Jahres!',
    info: ['🦇 Gruselige Dekoration überall', '🎭 Kostümwettbewerb mit Preisen', '🍬 Süßes oder Saures', '🕸️ Überraschungen in der Dunkelheit'],
  },
  weihnachten: {
    label: 'Weihnachten', emoji: '🎄', color: 0xc0392b, title: 'Weihnachts-Event',
    desc: 'Ho ho ho! 🎅\nLasst uns gemeinsam die besinnliche Zeit des Jahres feiern – mit Geschenken, guter Laune und festlicher Stimmung.',
    info: ['🎁 Geschenke & Verlosungen', '🍷 Glühwein & Plätzchen', '❄️ Festliche Dekoration', '🎶 Weihnachtsmusik'],
  },
  ostern: {
    label: 'Ostern', emoji: '🐰', color: 0xf7b6d2, title: 'Oster-Event',
    desc: 'Der Osterhase war fleißig! 🐣\nMacht euch auf die Suche nach den versteckten Eiern und feiert mit uns ein buntes Osterfest.',
    info: ['🥚 Große Ostereiersuche', '🌷 Frühlingshafte Dekoration', '🏆 Preise für die besten Sucher', '🍫 Süße Überraschungen'],
  },
  silvester: {
    label: 'Silvester', emoji: '🎆', color: 0xf1c40f, title: 'Silvester-Party',
    desc: 'Wir verabschieden das alte Jahr und starten gemeinsam ins neue! 🥂\nFeuerwerk, Musik und gute Laune – seid dabei, wenn die Uhr Mitternacht schlägt.',
    info: ['🎇 Großes Feuerwerk', '🥂 Anstoßen um Mitternacht', '🎶 Party & Musik', '✨ Gute Vorsätze für das neue Jahr'],
  },
  valentinstag: {
    label: 'Valentinstag', emoji: '💘', color: 0xe84393, title: 'Valentinstags-Event',
    desc: 'Die Liebe liegt in der Luft! 💕\nVerbringt mit uns einen romantischen Abend – ob zu zweit oder mit Freunden.',
    info: ['🌹 Romantische Dekoration', '💌 Kleine Aufmerksamkeiten', '🍫 Süße Überraschungen', '🎶 Stimmungsvolle Musik'],
  },
  sommerfest: {
    label: 'Sommerfest', emoji: '☀️', color: 0xffc107, title: 'Sommerfest',
    desc: 'Sonne, gute Laune und jede Menge Action! 🏖️\nDas große Sommerfest steht an – bringt Freunde mit und genießt den Tag.',
    info: ['🍹 Erfrischende Getränke', '🍔 Grillen & Snacks', '🎮 Spiele & Wettbewerbe', '🎶 Musik & Chillout'],
  },
  karneval: {
    label: 'Karneval', emoji: '🎭', color: 0x9b59ff, title: 'Karnevals-Party',
    desc: 'Kostüm an und feiern! 🤡\nHelau & Alaaf – die närrische Zeit ist da und wir lassen es krachen.',
    info: ['🎭 Kostümprämierung', '🥳 Konfetti & Stimmung', '🎶 Schunkeln & Party', '🍻 Feiern bis in die Nacht'],
  },
  oktoberfest: {
    label: 'Oktoberfest', emoji: '🍺', color: 0x3498db, title: 'Oktoberfest',
    desc: 'O\'zapft is! 🥨\nDirndl, Lederhosen und ein kühles Bier – feiert mit uns das Oktoberfest.',
    info: ['🍺 Frisch gezapftes Bier', '🥨 Brezn & Spezialitäten', '👗 Tracht erwünscht', '🎶 Zünftige Musik'],
  },
  sonstiges: {
    label: 'Sonstiges', emoji: '🎉', color: C.purple, title: 'Besonderes Event',
    desc: 'Wir laden euch zu einem besonderen Event ein! 🎊\nSeid dabei und verbringt mit uns eine tolle Zeit.',
    info: ['🎁 Überraschungen', '🎮 Spiel & Spaß', '🥳 Gute Stimmung'],
  },
};

// ───────────────────────── Befehle ─────────────────────────
const userOpt = (o, desc = 'Person') => o.setName('user').setDescription(desc).setRequired(true);
const roleOpt = (o, name, desc) => o.setName(name).setDescription(desc).setRequired(true);

const commands = [
  new SlashCommandBuilder().setName('abwesend')
    .setDescription('Einen Mitarbeiter wegen Inaktivität zu einem Gespräch einladen')
    .addUserOption((o) => userOpt(o, 'Mitarbeiter')),

  new SlashCommandBuilder().setName('addjob')
    .setDescription('Einer Person direkt eine bestimmte Rolle/Job geben')
    .addUserOption((o) => userOpt(o))
    .addRoleOption((o) => roleOpt(o, 'rolle', 'Rolle/Job')),

  new SlashCommandBuilder().setName('ausgang')
    .setDescription('Einem Mitarbeiter seine Kündigung mitteilen')
    .addUserOption((o) => userOpt(o, 'Mitarbeiter'))
    .addStringOption((o) => o.setName('grund').setDescription('Optionaler Grund')),

  new SlashCommandBuilder().setName('commands')
    .setDescription('Gibt dir den genauen Commandnamen von jedem Befehl'),

  new SlashCommandBuilder().setName('degradieren')
    .setDescription('Einen Mitarbeiter degradieren')
    .addUserOption((o) => userOpt(o, 'Mitarbeiter'))
    .addRoleOption((o) => roleOpt(o, 'neue_position', 'Neue (niedrigere) Position'))
    .addRoleOption((o) => roleOpt(o, 'alte_position', 'Alte Position')),

  new SlashCommandBuilder().setName('einstellen')
    .setDescription('Einen Bewerber einstellen')
    .addUserOption((o) => userOpt(o, 'Bewerber'))
    .addRoleOption((o) => roleOpt(o, 'position', 'Position')),

  new SlashCommandBuilder().setName('event')
    .setDescription('Ein Event ankündigen (Halloween, Weihnachten, Ostern, …)')
    .addStringOption((o) => o.setName('art').setDescription('Welches Event?').setRequired(true)
      .addChoices(...Object.entries(EVENTS).map(([value, ev]) => ({ name: `${ev.emoji} ${ev.label}`, value }))))
    .addStringOption((o) => o.setName('termin').setDescription('Datum/Uhrzeit (z.B. 31.10.2026 20:00)'))
    .addStringOption((o) => o.setName('ort').setDescription('Wo findet das Event statt?'))
    .addRoleOption((o) => o.setName('ping').setDescription('Rolle, die benachrichtigt werden soll')),

  new SlashCommandBuilder().setName('gespreach')
    .setDescription('Einen Bewerber zu einem Gespräch einladen')
    .addUserOption((o) => userOpt(o, 'Bewerber'))
    .addStringOption((o) => o.setName('termin').setDescription('Optional: Datum/Uhrzeit/Ort')),

  new SlashCommandBuilder().setName('kuendigen')
    .setDescription('Einen Mitarbeiter kündigen')
    .addUserOption((o) => userOpt(o, 'Mitarbeiter'))
    .addRoleOption((o) => roleOpt(o, 'position', 'Position, die entfernt wird'))
    .addStringOption((o) => o.setName('grund').setDescription('Optionaler Grund')),

  new SlashCommandBuilder().setName('lizens')
    .setDescription('Einem Bewerber sagen, dass er keine Waffenlizenz hat')
    .addUserOption((o) => userOpt(o, 'Bewerber')),

  new SlashCommandBuilder().setName('rankup')
    .setDescription('Einen Mitarbeiter befördern')
    .addUserOption((o) => userOpt(o, 'Mitarbeiter'))
    .addRoleOption((o) => roleOpt(o, 'neue_position', 'Neue Position'))
    .addRoleOption((o) => roleOpt(o, 'alte_position', 'Alte Position')),

  new SlashCommandBuilder().setName('ticket')
    .setDescription('Ticket sehen'),

  new SlashCommandBuilder().setName('urlaub')
    .setDescription('Mit diesem Befehl könnt ihr euren Urlaub erstellen / hinterlegen')
    .addStringOption((o) => o.setName('anfang').setDescription('Anfang (TT.MM.JJJJ)').setRequired(true))
    .addStringOption((o) => o.setName('ende').setDescription('Ende (TT.MM.JJJJ)').setRequired(true))
    .addStringOption((o) => o.setName('grund').setDescription('Grund (z.B. Urlaub, Privat)').setRequired(true)),

  new SlashCommandBuilder().setName('visum')
    .setDescription('Einen Bewerber auf die zu niedrige Visumstufe aufmerksam machen')
    .addUserOption((o) => userOpt(o, 'Bewerber')),
];

const PUBLIC_COMMANDS = ['urlaub', 'ticket', 'commands'];
const NEEDS_MEMBER = ['einstellen', 'rankup', 'degradieren', 'kuendigen', 'addjob'];

// ───────────────────────── Helfer ─────────────────────────
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const parseIds = (s = '') => s.split(',').map((x) => x.trim()).filter(Boolean);

// Rechte pro Befehl:
//  1. ROLES_<NAME> in der .env gesetzt -> nur diese Rollen
//  2. sonst: öffentliche Befehle -> jeder
//  3. sonst: STAFF_ROLE_IDS
// Admins dürfen immer alles.
function canUse(name, member) {
  if (member.permissions.has(PermissionFlagsBits.Administrator)) return true;
  const specific = parseIds(process.env[`ROLES_${name.toUpperCase()}`]);
  if (specific.length) return member.roles.cache.some((r) => specific.includes(r.id));
  if (PUBLIC_COMMANDS.includes(name)) return true;
  return member.roles.cache.some((r) => STAFF.includes(r.id));
}

// Wer Urlaubsanträge genehmigen/ablehnen darf:
//  ROLES_URLAUB_VERWALTUNG (oder ROLES_URLAUB_PRUEFEN) -> nur diese Rollen
//  sonst STAFF_ROLE_IDS. Admins dürfen immer.
function canManageUrlaub(member) {
  if (member.permissions.has(PermissionFlagsBits.Administrator)) return true;
  const ids = parseIds(process.env.ROLES_URLAUB_VERWALTUNG || process.env.ROLES_URLAUB_PRUEFEN);
  const allowed = ids.length ? ids : STAFF;
  return member.roles.cache.some((r) => allowed.includes(r.id));
}

const ephemeral = (content) => ({ content, flags: MessageFlags.Ephemeral });
const F = (name, value, inline = true) => ({ name, value: String(value), inline });
const quote = (v) => `>>> ${v}`;
const when = () => {
  const t = Math.floor(Date.now() / 1000);
  return `<t:${t}:D> • <t:${t}:R>`;
};
const logo = (g) => LOGO_URL || g.iconURL() || undefined;

// Zentraler Embed-Baukasten: Autor mit Logo, Avatar als Thumbnail,
// Footer mit Avatar des Ausführenden, Zeitstempel, optionales Banner
function mk(i, { icon, title, color = C.purple, desc, target, fields = [] }) {
  const e = new EmbedBuilder()
    .setColor(color)
    .setAuthor({ name: `${SERVER} • Verwaltung`, iconURL: logo(i.guild) })
    .setTitle(`${icon}  ${title}`)
    .setFooter({
      text: `Durch ${i.member?.displayName ?? i.user.username}`,
      iconURL: i.user.displayAvatarURL(),
    })
    .setTimestamp();
  if (desc) e.setDescription(desc);
  if (fields.length) e.addFields(fields);
  if (target) e.setThumbnail(target.displayAvatarURL({ size: 256 }));
  if (BANNER_URL) e.setImage(BANNER_URL);
  return e;
}

const dm = (member, embed) => {
  if (!SEND_DMS) return;
  member.send({ embeds: [embed] }).catch(() => {});
};

// Postet in den Log-Channel (falls gesetzt), sonst im aktuellen Channel
async function postEmbed(i, payload) {
  const ch = LOG_CHANNEL_ID ? await i.guild.channels.fetch(LOG_CHANNEL_ID).catch(() => null) : null;
  if (ch && ch.isTextBased()) {
    await ch.send(payload);
    return i.reply(ephemeral(`✅ Erledigt – gepostet in <#${ch.id}>.`));
  }
  return i.reply(payload);
}

async function changeRoles(member, { add, remove }) {
  if (remove) await member.roles.remove(remove);
  if (add) await member.roles.add(add);
}

const parseDate = (s) => {
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(s.trim());
  if (!m) return null;
  const d = new Date(Date.UTC(+m[3], +m[2] - 1, +m[1]));
  return d.getUTCDate() === +m[1] && d.getUTCMonth() === +m[2] - 1 ? d : null;
};
const fmtDate = (d) => d.toLocaleDateString('de-DE', {
  weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC',
});

// ───────────────────────── Hilfe-Menü (/commands) ─────────────────────────
const CATS = {
  all: { label: 'Alle Befehle', emoji: '📚', desc: 'Komplette Übersicht', cmds: commands.map((c) => c.name) },
  personal: { label: 'Personalverwaltung', emoji: '🛡️', desc: 'Einstellen, Rank, Kündigung', cmds: ['einstellen', 'rankup', 'degradieren', 'kuendigen', 'ausgang', 'abwesend', 'addjob'] },
  bewerber: { label: 'Bewerber', emoji: '📝', desc: 'Gespräch, Lizenz, Visum', cmds: ['gespreach', 'lizens', 'visum'] },
  events: { label: 'Events', emoji: '🎉', desc: 'Halloween, Weihnachten, Ostern …', cmds: ['event'] },
  allgemein: { label: 'Allgemein', emoji: '🌐', desc: 'Urlaub, Ticket, Hilfe', cmds: ['urlaub', 'ticket', 'commands'] },
};

function helpEmbed(i, cat = 'all') {
  const c = CATS[cat];
  const lines = c.cmds.map((n) => {
    const cmd = commands.find((x) => x.name === n);
    return `**\`/${n}\`**\n┗ ${cmd.description}`;
  });
  return mk(i, {
    icon: c.emoji, title: c.label, color: C.blue,
    desc: `Wähle unten eine Kategorie aus.\n\n${lines.join('\n\n')}`,
  });
}

const helpRow = (selected = 'all') => new ActionRowBuilder().addComponents(
  new StringSelectMenuBuilder()
    .setCustomId('help')
    .setPlaceholder('Kategorie wählen …')
    .addOptions(Object.entries(CATS).map(([value, c]) => ({
      label: c.label, description: c.desc, value, emoji: c.emoji, default: value === selected,
    }))),
);

// ───────────────────────── Befehls-Handler ─────────────────────────
const handlers = {
  async abwesend(i) {
    const user = i.options.getUser('user');
    const e = mk(i, {
      icon: '⏰', title: 'Inaktivität – Gespräch erforderlich', color: C.orange, target: user,
      desc: `${user}, uns ist aufgefallen, dass du zuletzt **inaktiv** warst.\nBitte melde dich zeitnah bei der Leitung.`,
      fields: [F('👤 Mitarbeiter', `${user}`), F('👔 Gemeldet durch', `${i.user}`), F('📅 Datum', when(), false)],
    });
    return i.reply({ content: `${user}`, embeds: [e] });
  },

  async addjob(i) {
    const member = i.options.getMember('user');
    const role = i.options.getRole('rolle');
    await changeRoles(member, { add: role.id });
    const e = mk(i, {
      icon: '🧩', title: 'Rolle vergeben', color: C.blue, target: member,
      fields: [F('👤 Person', `${member}`), F('🏷️ Rolle', `${role}`), F('👔 Durch', `${i.user}`), F('📅 Datum', when(), false)],
    });
    return postEmbed(i, { embeds: [e] });
  },

  async ausgang(i) {
    const user = i.options.getUser('user');
    const grund = i.options.getString('grund');
    const e = mk(i, {
      icon: '📨', title: 'Kündigung mitgeteilt', color: C.red, target: user,
      desc: `${user}, dir wurde die **Kündigung** mitgeteilt.`,
      fields: [F('👤 Mitarbeiter', `${user}`), F('👔 Durch', `${i.user}`)],
    });
    if (grund) e.addFields(F('📝 Grund', quote(grund), false));
    e.addFields(F('📅 Datum', when(), false));
    return i.reply({ content: `${user}`, embeds: [e] });
  },

  async commands(i) {
    return i.reply({ embeds: [helpEmbed(i, 'all')], components: [helpRow('all')], flags: MessageFlags.Ephemeral });
  },

  async degradieren(i) {
    const member = i.options.getMember('user');
    const neu = i.options.getRole('neue_position');
    const alt = i.options.getRole('alte_position');
    await changeRoles(member, { add: neu.id, remove: alt.id });
    const e = mk(i, {
      icon: '📉', title: 'Mitarbeiter degradiert', color: C.red, target: member,
      desc: `${member} wurde von ${alt} auf ${neu} **degradiert**.`,
      fields: [
        F('👤 Mitarbeiter', `${member}`), F('👔 Durch', `${i.user}`),
        F('🔻 Positionswechsel', `${alt}  ➜  ${neu}`, false),
        F('📅 Datum', when(), false),
      ],
    });
    dm(member, e);
    return postEmbed(i, { embeds: [e] });
  },

  async einstellen(i) {
    const member = i.options.getMember('user');
    const pos = i.options.getRole('position');
    await changeRoles(member, { add: pos.id });
    const e = mk(i, {
      icon: '🎉', title: 'Mitarbeiter eingestellt', color: C.purple, target: member,
      desc: `Herzlich willkommen im **${SERVER} Team**, ${member}! 🥂`,
      fields: [
        F('👤 Mitarbeiter', `${member}`), F('🛡️ Position', `${pos}`),
        F('👔 Eingestellt durch', `${i.user}`),
        F('📅 Datum', when(), false),
      ],
    });
    dm(member, e);
    return postEmbed(i, { embeds: [e] });
  },

  async event(i) {
    const ev = EVENTS[i.options.getString('art')];
    const termin = i.options.getString('termin');
    const ort = i.options.getString('ort');
    const ping = i.options.getRole('ping');

    const fields = [F('👔 Veranstalter', `${i.user}`), F('🎟️ Art', `${ev.emoji} ${ev.label}`)];
    if (termin) fields.push(F('🗓️ Termin', termin, false));
    if (ort) fields.push(F('📍 Ort', ort, false));
    fields.push(F('📋 Highlights', ev.info.map((x) => `> ${x}`).join('\n'), false));
    fields.push(F('💬 Hinweis', '> Wir freuen uns auf euch – kommt vorbei und bringt gute Laune mit!', false));

    const e = mk(i, {
      icon: ev.emoji, title: ev.title, color: ev.color,
      desc: ev.desc, fields,
    });
    e.setAuthor({ name: `${SERVER} • Events`, iconURL: logo(i.guild) });
    e.setThumbnail(null);

    const payload = {
      content: ping ? `${ping}` : undefined,
      embeds: [e],
      allowedMentions: ping ? { roles: [ping.id] } : { parse: [] },
    };
    const ch = EVENT_CHANNEL_ID ? await i.guild.channels.fetch(EVENT_CHANNEL_ID).catch(() => null) : null;
    if (ch && ch.isTextBased()) {
      const msg = await ch.send(payload);
      await msg.react(ev.emoji).catch(() => {});
      return i.reply(ephemeral(`✅ Event angekündigt – <#${ch.id}>.`));
    }
    return i.reply(payload);
  },

  async gespreach(i) {
    const user = i.options.getUser('user');
    const termin = i.options.getString('termin');
    const e = mk(i, {
      icon: '💬', title: 'Einladung zum Bewerbungsgespräch', color: C.green, target: user,
      desc: `Hallo ${user}, wir haben deine Bewerbung gesehen und laden dich zu einem **Gespräch** ein!`,
      fields: [F('🙋 Bewerber', `${user}`), F('👔 Eingeladen durch', `${i.user}`)],
    });
    if (termin) e.addFields(F('🗓️ Termin', termin, false));
    e.addFields(F('📌 Status', '⏳ Wartet auf Antwort', false));
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`gesp:yes:${user.id}`).setLabel('Zusagen').setEmoji('✅').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`gesp:no:${user.id}`).setLabel('Absagen').setEmoji('❌').setStyle(ButtonStyle.Danger),
    );
    return i.reply({ content: `${user}`, embeds: [e], components: [row] });
  },

  async kuendigen(i) {
    const member = i.options.getMember('user');
    const pos = i.options.getRole('position');
    const grund = i.options.getString('grund');
    await changeRoles(member, { remove: pos.id });
    const e = mk(i, {
      icon: '🚪', title: 'Mitarbeiter gekündigt', color: C.red, target: member,
      desc: `${member} ist nicht mehr Teil des Teams.`,
      fields: [F('👤 Mitarbeiter', `${member}`), F('👔 Durch', `${i.user}`), F('🛡️ Alte Position', `${pos}`, false)],
    });
    if (grund) e.addFields(F('📝 Grund', quote(grund), false));
    e.addFields(F('📅 Datum', when(), false));
    dm(member, e);
    return postEmbed(i, { embeds: [e] });
  },

  async lizens(i) {
    const user = i.options.getUser('user');
    const e = mk(i, {
      icon: '🔫', title: 'Waffenlizenz fehlt', color: C.red, target: user,
      desc: `${user}, du besitzt aktuell **keine Waffenlizenz**.`,
      fields: [
        F('🙋 Bewerber', `${user}`), F('👔 Hinweis durch', `${i.user}`),
        F('📋 Nächster Schritt', quote('Besorge dir die Waffenlizenz und bewirb dich anschließend erneut.'), false),
      ],
    });
    return i.reply({ content: `${user}`, embeds: [e] });
  },

  async rankup(i) {
    const member = i.options.getMember('user');
    const neu = i.options.getRole('neue_position');
    const alt = i.options.getRole('alte_position');
    await changeRoles(member, { add: neu.id, remove: alt.id });
    const e = mk(i, {
      icon: '📈', title: 'Mitarbeiter befördert', color: C.green, target: member,
      desc: `Glückwunsch ${member}! 🎊 Du wurdest befördert.`,
      fields: [
        F('👤 Mitarbeiter', `${member}`), F('👔 Durch', `${i.user}`),
        F('🔺 Positionswechsel', `${alt}  ➜  ${neu}`, false),
        F('📅 Datum', when(), false),
      ],
    });
    dm(member, e);
    return postEmbed(i, { embeds: [e] });
  },

  async ticket(i) {
    if (!TICKET_CHANNEL_ID) {
      return i.reply(ephemeral('🎫 Es ist noch kein Ticket-Channel konfiguriert (TICKET_CHANNEL_ID).'));
    }
    const e = mk(i, {
      icon: '🎫', title: 'Ticket-Bereich', color: C.blue,
      desc: 'Du brauchst Hilfe oder hast ein Anliegen?\nÖffne ein Ticket – unser Team kümmert sich darum.',
    });
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel('Zum Ticket-Bereich').setEmoji('🎫').setStyle(ButtonStyle.Link)
        .setURL(`https://discord.com/channels/${i.guildId}/${TICKET_CHANNEL_ID}`),
    );
    return i.reply({ embeds: [e], components: [row], flags: MessageFlags.Ephemeral });
  },

  async urlaub(i) {
    const von = parseDate(i.options.getString('anfang'));
    const bis = parseDate(i.options.getString('ende'));
    if (!von || !bis) return i.reply(ephemeral('❌ Bitte Datum im Format **TT.MM.JJJJ** angeben.'));
    if (bis < von) return i.reply(ephemeral('❌ Das Ende liegt vor dem Anfang.'));
    const tage = Math.round((bis - von) / 86400000) + 1;

    const e = mk(i, {
      icon: '🏖️', title: 'Urlaubsantrag', color: C.orange, target: i.user,
      fields: [
        F('🙋 Wer?', `${i.user}`, false),
        F('📆 Anfang', fmtDate(von)), F('📆 Ende', fmtDate(bis)),
        F('⏳ Dauer', `${tage} ${tage === 1 ? 'Tag' : 'Tage'}`),
        F('📝 Grund', quote(i.options.getString('grund')), false),
        F('📌 Status', '⏳ Wartet auf Genehmigung', false),
      ],
    });
    e.setAuthor({ name: `${SERVER} Zeitwächter`, iconURL: logo(i.guild) });
    e.setFooter({ text: `Beantragt von ${i.member.displayName}`, iconURL: i.user.displayAvatarURL() });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('urlaub:yes').setLabel('Genehmigen').setEmoji('✅').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('urlaub:no').setLabel('Ablehnen').setEmoji('❌').setStyle(ButtonStyle.Danger),
    );
    const payload = { embeds: [e], components: [row] };

    const ch = URLAUB_CHANNEL_ID ? await i.guild.channels.fetch(URLAUB_CHANNEL_ID).catch(() => null) : null;
    if (ch && ch.isTextBased()) {
      await ch.send(payload);
      return i.reply(ephemeral(`✅ Dein Urlaub wurde eingetragen – <#${ch.id}>.`));
    }
    return i.reply(payload);
  },

  async visum(i) {
    const user = i.options.getUser('user');
    const e = mk(i, {
      icon: '🛂', title: 'Visumstufe zu niedrig', color: C.orange, target: user,
      desc: `${user}, deine **Visumstufe** ist aktuell zu niedrig für eine Einstellung.`,
      fields: [
        F('🙋 Bewerber', `${user}`), F('👔 Hinweis durch', `${i.user}`),
        F('📋 Nächster Schritt', quote('Erhöhe deine Visumstufe und bewirb dich anschließend erneut.'), false),
      ],
    });
    return i.reply({ content: `${user}`, embeds: [e] });
  },
};

// ───────────────────────── Buttons & Menüs ─────────────────────────
function setStatus(i, text, color) {
  const e = EmbedBuilder.from(i.message.embeds[0]).setColor(color);
  const fields = (e.data.fields ?? []).map((f) => (f.name.includes('Status') ? { ...f, value: text } : f));
  e.setFields(fields);
  return i.update({ embeds: [e], components: [] });
}

async function onButton(i) {
  const [kind, action, id] = i.customId.split(':');
  const yes = action === 'yes';

  if (kind === 'gesp') {
    if (i.user.id !== id) return i.reply(ephemeral('❌ Diese Einladung ist nicht für dich.'));
    return setStatus(i, yes ? `✅ Zugesagt von ${i.user}` : `❌ Abgesagt von ${i.user}`, yes ? C.green : C.red);
  }

  if (kind === 'urlaub') {
    if (!canManageUrlaub(i.member)) {
      return i.reply(ephemeral('❌ Du darfst Urlaubsanträge nicht bearbeiten.'));
    }
    return setStatus(i, yes ? `✅ Genehmigt von ${i.user}` : `❌ Abgelehnt von ${i.user}`, yes ? C.green : C.red);
  }
}

// ───────────────────────── Start ─────────────────────────
client.once(Events.ClientReady, async () => {
  const rest = new REST({ version: '10' }).setToken(TOKEN);
  await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
    body: commands.map((c) => c.toJSON()),
  });
  client.user.setPresence({
    activities: [{ name: `${SERVER} Verwaltung`, type: ActivityType.Watching }],
    status: 'online',
  });
  console.log(`✅ Eingeloggt als ${client.user.tag} – ${commands.length} Befehle registriert.`);
});

client.on('interactionCreate', async (i) => {
  try {
    if (i.isChatInputCommand()) {
      if (!canUse(i.commandName, i.member)) {
        return i.reply(ephemeral('❌ Dafür hast du keine Berechtigung.'));
      }
      if (NEEDS_MEMBER.includes(i.commandName) && !i.options.getMember('user')) {
        return i.reply(ephemeral('❌ Diese Person ist nicht auf dem Server.'));
      }
      return await handlers[i.commandName](i);
    }
    if (i.isButton()) return await onButton(i);
    if (i.isStringSelectMenu() && i.customId === 'help') {
      const cat = i.values[0];
      return await i.update({ embeds: [helpEmbed(i, cat)], components: [helpRow(cat)] });
    }
  } catch (err) {
    console.error(err);
    const msg = ephemeral('❌ Fehler – prüfe, ob die Bot-Rolle über den betroffenen Rollen steht und die nötigen Rechte hat.');
    if (i.replied || i.deferred) i.followUp(msg).catch(() => {});
    else i.reply(msg).catch(() => {});
  }
});

client.login(TOKEN);
