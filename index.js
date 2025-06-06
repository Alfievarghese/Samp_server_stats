const { Client, GatewayIntentBits, EmbedBuilder, PermissionsBitField } = require('discord.js');
const samp = require('samp-query');
const fs = require('fs');
const express = require('express');

const TOKEN = 'Token';
const CONFIG_FILE = 'config.json';
const MESSAGE_FILE = 'messages.json';

let config = fs.existsSync(CONFIG_FILE) ? JSON.parse(fs.readFileSync(CONFIG_FILE)) : {};
let lastMessages = fs.existsSync(MESSAGE_FILE) ? JSON.parse(fs.readFileSync(MESSAGE_FILE)) : {};

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const app = express();
app.get('/', (req, res) => res.send('Bot is running'));
app.listen(3000);

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  startStatusUpdater();
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const guildId = interaction.guildId;

  if (interaction.commandName === 'set-ip') {
    const ip = interaction.options.getString('ip');
    const port = interaction.options.getInteger('port');
    config[guildId] = config[guildId] || {};
    config[guildId].ip = `${ip}:${port}`;
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    await interaction.reply(`✅ IP set to \`${ip}:${port}\``);
  }

  if (interaction.commandName === 'set-channel') {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({ content: 'Only admins can set the channel.', ephemeral: true });
    }
    config[guildId] = config[guildId] || {};
    config[guildId].channel = interaction.channelId;
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    await interaction.reply('✅ Channel set for server status updates.');
  }
});

function startStatusUpdater() {
  setInterval(() => {
    for (const guildId in config) {
      const { ip, channel } = config[guildId];
      if (!ip || !channel) continue;
      const [host, port] = ip.split(':');
      samp({ host, port: parseInt(port), timeout: 1000 }, async (err, response) => {
        const guild = client.guilds.cache.get(guildId);
        if (!guild) return;
        const targetChannel = guild.channels.cache.get(channel);
        if (!targetChannel) return;

        const embed = new EmbedBuilder()
          .setTitle('🎮 SA-MP Server Status')
          .setColor(err ? 0xff3333 : 0x33cc33)
          .addFields(
            { name: '📡 IP', value: ip, inline: true },
            { name: '📶 Status', value: err ? '❌ Offline' : '✅ Online', inline: true }
          )
          .setTimestamp();

        if (!err) {
          embed.addFields(
            { name: '🏷️ Hostname', value: response.hostname || 'N/A', inline: false },
            { name: '🧍 Players', value: `${response.online}/${response.maxplayers}`, inline: true },
            { name: '🎮 Gamemode', value: response.gamemode || 'N/A', inline: true }
          );

          const playerList = response.players?.length
            ? response.players.map(p => `• ${p.name}`).slice(0, 20).join('\n')
            : 'No players online';

          embed.addFields({ name: '🧑‍🤝‍🧑 Player List', value: playerList });
        }

        try {
          const lastMsgId = lastMessages[guildId];
          if (lastMsgId) {
            const msg = await targetChannel.messages.fetch(lastMsgId);
            await msg.edit({ embeds: [embed] });
          } else {
            const sentMsg = await targetChannel.send({ embeds: [embed] });
            lastMessages[guildId] = sentMsg.id;
            fs.writeFileSync(MESSAGE_FILE, JSON.stringify(lastMessages, null, 2));
          }
        } catch (e) {
          const sentMsg = await targetChannel.send({ embeds: [embed] });
          lastMessages[guildId] = sentMsg.id;
          fs.writeFileSync(MESSAGE_FILE, JSON.stringify(lastMessages, null, 2));
        }
      });
    }
  }, 60000);
}

client.login(TOKEN);
