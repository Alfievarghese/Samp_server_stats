const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const TOKEN = 'Token';
const CLIENT_ID = 'client';

const commands = [
  new SlashCommandBuilder()
    .setName('set-ip')
    .setDescription('Set the SA-MP server IP and port')
    .addStringOption(option => option.setName('ip').setDescription('Server IP').setRequired(true))
    .addIntegerOption(option => option.setName('port').setDescription('Server port').setRequired(true)),
  new SlashCommandBuilder()
    .setName('set-channel')
    .setDescription('Set this channel for server status updates'),
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log('Slash commands registered');
  } catch (error) {
    console.error(error);
  }
})();
