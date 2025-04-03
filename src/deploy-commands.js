// Script to register slash commands to Discord API
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Get environment variables
const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID; 
const guildId = process.env.GUILD_ID;

// Check for required env vars
if (!token) {
  console.error('Error: DISCORD_TOKEN not found in .env file');
  process.exit(1);
}

if (!clientId) {
  console.error('Error: DISCORD_CLIENT_ID not found in .env file');
  process.exit(1);
}

console.log('Token detected:', token ? 'Yes (length: ' + token.length + ')' : 'No');
console.log('Client ID detected:', clientId || 'No');
console.log('Guild ID detected:', guildId || 'No');

// Array to store command data
const commands = [];

// Path to slash commands folder
const slashCommandsPath = path.join(__dirname, 'slash-commands');

// Check if directory exists
if (!fs.existsSync(slashCommandsPath)) {
  console.error(`Error: Slash commands folder not found at ${slashCommandsPath}`);
  process.exit(1);
}

// Read all command files
const commandFiles = fs.readdirSync(slashCommandsPath).filter(file => file.endsWith('.js'));

if (commandFiles.length === 0) {
  console.warn('Warning: No slash command files found in slash-commands folder');
}

// Add command data to commands array
for (const file of commandFiles) {
  const filePath = path.join(slashCommandsPath, file);
  const command = require(filePath);
  
  // Check for required properties
  if ('data' in command && 'execute' in command) {
    commands.push(command.data.toJSON());
    console.log(`[✓] Slash command ${command.data.name} loaded successfully`);
  } else {
    console.log(`[⚠] Command in ${filePath} is missing required "data" or "execute" properties`);
  }
}

// Create REST instance
const rest = new REST({ version: '10' }).setToken(token);

// Register commands function
(async () => {
  try {
    console.log(`Starting refresh of ${commands.length} slash commands...`);
    
    // Method for guild-specific commands if guildId is provided
    if (guildId) {
      const data = await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: commands }
      );
      console.log(`Successfully refreshed ${data.length} slash commands for specific server!`);
    } else {
      // Method for global commands
      const data = await rest.put(
        Routes.applicationCommands(clientId),
        { body: commands }
      );
      console.log(`Successfully refreshed ${data.length} slash commands globally!`);
    }
  } catch (error) {
    console.error('Error registering commands:', error);
  }
})(); 