// Script to register slash commands to Discord API
require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

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

if (!guildId) {
	console.error('Error: GUILD_ID not found in .env file. Add GUILD_ID=YOUR_SERVER_ID to .env file');
	console.error('You can get server ID by enabling developer mode in Discord,');
	console.error('right-click on the server name and select "Copy ID"');
	process.exit(1);
}

console.log('Token detected:', token ? 'Yes (length: ' + token.length + ')' : 'No');
console.log('Client ID detected:', clientId || 'No');
console.log('Guild ID detected:', guildId || 'No');

// Array to store command data
const commands = [];

// Path to slash commands folder
const commandsPath = path.join(__dirname, 'slash-commands');

// Check if the commands directory exists
if (!fs.existsSync(commandsPath)) {
	console.error(`Error: Slash commands folder not found at ${commandsPath}`);
	process.exit(1);
}

// Read all command files
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

if (commandFiles.length === 0) {
	console.warn('Warning: No slash command files found in slash-commands folder');
}

// Add command data to commands array
for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	
	if ('data' in command && 'execute' in command) {
		commands.push(command.data.toJSON());
		console.log(`[✓] Slash command ${command.data.name} loaded successfully`);
	} else {
		console.log(`[⚠] Command in ${filePath} is missing required "data" or "execute" properties`);
	}
}

// Create REST instance
const rest = new REST({ version: '10' }).setToken(token);

// Register commands
(async () => {
	try {
		console.log(`Starting refresh of ${commands.length} slash commands to server ID: ${guildId}...`);

		// Register commands to specific server
		const data = await rest.put(
			Routes.applicationGuildCommands(clientId, guildId),
			{ body: commands },
		);

		console.log(`Successfully refreshed ${data.length} slash commands to server.`);
		console.log('Slash commands will be available in your server shortly!');
	} catch (error) {
		console.error('Error registering commands:', error);
	}
})(); 