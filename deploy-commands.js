const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const TOKEN = 'ODU4MzY3NjM3MDUwNjIxOTcy.GSAKJJ.mHsMYKkhgNkN4sNoZJZaunKkDnvtWr3a3wycUc';
const CLIENT_ID = '858367637050621972';

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