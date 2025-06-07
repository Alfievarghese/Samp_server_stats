const { REST, Routes, SlashCommandBuilder, ChannelType } = require('discord.js');
require('dotenv').config();

const commands = [
  new SlashCommandBuilder()
    .setName('set-ip')
    .setDescription('Set the SA-MP server IP and port')
    .addStringOption(option =>
      option.setName('ip')
        .setDescription('Server IP')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('port')
        .setDescription('Server port')
        .setRequired(true)),
  new SlashCommandBuilder()
    .setName('set-channel')
    .setDescription('Set the text channel for status updates'),
  new SlashCommandBuilder()
    .setName('set-voice')
    .setDescription('Set the voice channel to show live player count')
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('Voice channel')
        .addChannelTypes(ChannelType.GuildVoice)
        .setRequired(true))
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('Registering slash commands...');
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );
    console.log('✅ Slash commands registered.');
  } catch (error) {
    console.error('❌ Failed to register commands:', error);
  }
})();