const { Client, GatewayIntentBits, EmbedBuilder, PermissionsBitField } = require('discord.js');
const samp = require('samp-query');
const fs = require('fs');
const express = require('express');

const TOKEN = 'Token';
const CONFIG_FILE = 'config.json';

let config = {};
if (fs.existsSync(CONFIG_FILE)) {
  try {
    config = JSON.parse(fs.readFileSync(CONFIG_FILE));
  } catch {
    config = {};
  }
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const app = express();
app.get('/', (req, res) => res.send('Bot is running!'));
app.listen(3000);

const sentMessages = {};

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  startStatusUpdater();
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const guildId = interaction.guildId;

  if (interaction.commandName === 'set-ip') {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({ content: '❌ Only admins can use this command.', ephemeral: true });
    }
    const ip = interaction.options.getString('ip');
    const port = interaction.options.getInteger('port');
    config[guildId] = config[guildId] || {};
    config[guildId].ip = `${ip}:${port}`;
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    await interaction.reply(`✅ IP set to \`${ip}:${port}\``);
  }

  if (interaction.commandName === 'set-channel') {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({ content: '❌ Only admins can use this command.', ephemeral: true });
    }
    config[guildId] = config[guildId] || {};
    config[guildId].channel = interaction.channelId;
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    await interaction.reply('✅ Channel set for status updates.');
  }

  if (interaction.commandName === 'set-voice') {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({ content: '❌ Only admins can use this command.', ephemeral: true });
    }
    const voiceChannel = interaction.options.getChannel('channel');
    if (!voiceChannel || voiceChannel.type !== 2) {
      return interaction.reply({ content: '❌ Please select a valid voice channel.', ephemeral: true });
    }
    config[guildId] = config[guildId] || {};
    config[guildId].voice = voiceChannel.id;
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    await interaction.reply('✅ Voice channel set for live players display.');
  }
});

function startStatusUpdater() {
  setInterval(() => {
    for (const guildId in config) {
      const { ip, channel, voice } = config[guildId];
      if (!ip) continue;
      const [host, port] = ip.split(':');
      samp({ host, port: Number(port), timeout: 1000 }, async (err, response) => {
        const guild = client.guilds.cache.get(guildId);
        if (!guild) return;

        const embed = new EmbedBuilder()
          .setTitle('🌐 SA-MP Server Status')
          .setColor(err ? 0xff0000 : 0x00ff00)
          .addFields(
            { name: 'IP', value: ip, inline: true },
            { name: 'Status', value: err ? 'Offline' : 'Online', inline: true }
          )
          .setTimestamp();

        if (!err) {
          embed.addFields(
            { name: 'Hostname', value: response.hostname || 'N/A' },
            { name: 'Players', value: `${response.online}/${response.maxplayers}`, inline: true },
            { name: 'Gamemode', value: response.gamemode || 'N/A', inline: true },
            { name: 'Player List', value: (response.players?.map(p => p.name).join(', ') || 'No players online').slice(0, 1024) }
          );
        }

        if (channel) {
          const targetChannel = guild.channels.cache.get(channel);
          if (targetChannel) {
            try {
              if (sentMessages[guildId]) {
                const msg = await targetChannel.messages.fetch(sentMessages[guildId]).catch(() => null);
                if (msg) await msg.edit({ embeds: [embed] });
                else {
                  const newMsg = await targetChannel.send({ embeds: [embed] });
                  sentMessages[guildId] = newMsg.id;
                }
              } else {
                const newMsg = await targetChannel.send({ embeds: [embed] });
                sentMessages[guildId] = newMsg.id;
              }
            } catch {}
          }
        }

        if (voice) {
          const vc = guild.channels.cache.get(voice);
          if (vc && vc.type === 2) {
            try {
              const name = err ? '🟥 Offline' : `🎮 Players: ${response.online}/${response.maxplayers}`;
              await vc.setName(name);
            } catch {}
          }
        }
      });
    }
  }, 30000);
}

client.login(TOKEN);