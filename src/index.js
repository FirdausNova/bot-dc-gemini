// Main Discord bot application
const { Client, GatewayIntentBits, Collection, Events, ActivityType } = require('discord.js');
const fs = require('fs');
const path = require('path');
const gemini = require('./utils/gemini');
const characterManager = require('./config/characters');
require('dotenv').config();

// Load environment variables or set defaults
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const BOT_PREFIX = process.env.BOT_PREFIX || '!';
const AUTO_RESPOND_CHANNEL_ID = process.env.AUTO_RESPOND_CHANNEL_ID || '';

// Create a new Discord client with necessary intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ]
});

// Initialize collections for commands and slash commands
client.commands = new Collection();
client.slashCommands = new Collection();

// Flag to track loading status of commands
const isLoading = new Map();

// Path to commands directory
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

// Load all command files
for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  
  // Set command in collection with its name as key
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
    console.log(`Loaded command: ${command.data.name}`);
  } else {
    console.warn(`Command at ${filePath} is missing required "data" or "execute" property`);
  }
}

// Load slash commands if directory exists
const slashCommandsPath = path.join(__dirname, 'slash-commands');
if (fs.existsSync(slashCommandsPath)) {
  const slashCommandFiles = fs.readdirSync(slashCommandsPath).filter(file => file.endsWith('.js'));

  // Load all slash command files
  for (const file of slashCommandFiles) {
    const filePath = path.join(slashCommandsPath, file);
    const command = require(filePath);
    
    // Set slash command in collection with its name as key
    if ('data' in command && 'execute' in command) {
      client.slashCommands.set(command.data.name, command);
      console.log(`Loaded slash command: ${command.data.name}`);
    } else {
      console.warn(`Slash command at ${filePath} is missing required "data" or "execute" property`);
    }
  }
}

// When bot is ready
client.once(Events.ClientReady, () => {
  console.log(`Logged in as ${client.user.tag}`);
  
  // Set bot status/activity
  client.user.setActivity('with AI', { type: ActivityType.Playing });
  
  // Log registered commands
  console.log(`Registered commands: ${Array.from(client.commands.keys()).join(', ')}`);
  if (client.slashCommands.size > 0) {
    console.log(`Registered slash commands: ${Array.from(client.slashCommands.keys()).join(', ')}`);
  }
});

// Handle slash command interactions
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.slashCommands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`Error executing slash command ${interaction.commandName}:`, error);
    
    const errorMessage = 'There was an error while executing this command.';
    
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: errorMessage, ephemeral: true });
    } else {
      await interaction.reply({ content: errorMessage, ephemeral: true });
    }
  }
});

// Handle autocomplete interactions
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isAutocomplete()) return;
  
  const command = client.slashCommands.get(interaction.commandName);
  
  if (!command || !command.autocomplete) return;
  
  try {
    await command.autocomplete(interaction);
  } catch (error) {
    console.error(`Error handling autocomplete for ${interaction.commandName}:`, error);
  }
});

// Handle message creation events
client.on(Events.MessageCreate, async message => {
  // Ignore messages from bots or non-text channels
  if (message.author.bot || !message.channel.isTextBased()) return;
  
  // Get user ID for tracking conversation context
  const userId = message.author.id;
  
  // Process message content
  const content = message.content.trim();
  
  // Handle commands and AI responses
  if (content.startsWith(BOT_PREFIX)) {
    // Legacy command handling
    handleLegacyCommand(message, content.slice(BOT_PREFIX.length).trim());
  } 
  // Auto-respond in designated channels or direct messages
  else if (
    message.channel.id === AUTO_RESPOND_CHANNEL_ID || 
    message.channel.type === 'DM'
  ) {
    // Check for ongoing request
    if (isLoading.get(userId)) {
      try {
        await message.reply("Saya masih memproses permintaan sebelumnya. Mohon tunggu sebentar.");
      } catch (error) {
        console.error('Error sending busy message:', error);
      }
      return;
    }

    // Set loading status
    isLoading.set(userId, true);
    
    // Show typing indicator
    try {
      await message.channel.sendTyping();
    } catch (error) {
      console.error('Error showing typing indicator:', error);
    }

    try {
      // Get AI response
      const aiResponse = await gemini.getAIResponse(userId, content);
      
      // Add messages to history is now handled inside getAIResponse
      
      // Check if response is multipart
      if (aiResponse.multipart) {
        console.log(`Sending multipart response (${aiResponse.parts.length} parts)`);
        
        // Send each part as a separate message
        for (const part of aiResponse.parts) {
          // Show typing before each message
          await message.channel.sendTyping();
          
          // Send message
          await message.channel.send({
            content: part,
            reply: { messageReference: message.id }
          });
          
          // Small delay between messages to look more natural
          if (aiResponse.parts.length > 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      } else {
        // Reply with single AI response
        await message.reply(aiResponse.text);
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      try {
        await message.reply(`Maaf, saya tidak dapat memproses permintaan Anda: ${error.message}`);
      } catch (replyError) {
        console.error('Error sending error reply:', replyError);
      }
    } finally {
      // Clear loading status
      isLoading.set(userId, false);
    }
  }
});

// Function to handle legacy (prefix) commands
async function handleLegacyCommand(message, commandString) {
  const userId = message.author.id;
  
  // Check if user has an ongoing request
  if (isLoading.get(userId)) {
    try {
      await message.reply("I'm still processing your previous request. Please wait a moment.");
    } catch (error) {
      console.error('Error sending busy message:', error);
    }
    return;
  }
  
  // Parse command and arguments
  const args = commandString.split(/\s+/);
  const commandName = args.shift().toLowerCase();
  
  // Get command from collection
  const command = client.commands.get(commandName);
  
  // If command doesn't exist, return
  if (!command) return;
  
  // Set loading status
  isLoading.set(userId, true);
  
  try {
    // Execute command
    await command.execute(message, args);
  } catch (error) {
    console.error(`Error executing command ${commandName}:`, error);
    try {
      await message.reply('There was an error trying to execute that command.');
    } catch (replyError) {
      console.error('Error sending error reply:', replyError);
    }
  } finally {
    // Clear loading status
    isLoading.set(userId, false);
  }
}

// Login to Discord with token
client.login(BOT_TOKEN); 