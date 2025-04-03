// Command to set dedicated channel for auto-respond
const fs = require('fs');
const path = require('path');
const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
require('dotenv').config();

module.exports = {
  name: 'setchannel',
  description: 'Set channel for auto-respond',
  async execute(message, args) {
    try {
      // Check admin permissions
      if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return message.reply('You do not have permission to use this command.');
      }
      
      if (args.length === 0) {
        return message.reply('Usage: `!setchannel <add/remove> [channel_id]`\nIf channel_id is not provided, the current channel will be used.');
      }
      
      const action = args[0].toLowerCase();
      let channelId = args[1] || message.channel.id; // Use current channel if none specified
      
      // Path to .env file
      const envPath = path.resolve(process.cwd(), '.env');
      
      // Read .env file
      let envContent = fs.readFileSync(envPath, 'utf8');
      
      switch (action) {
        case 'add':
          // Check if channel exists
          const channel = message.guild.channels.cache.get(channelId);
          if (!channel) {
            return message.reply('Channel not found.');
          }
          
          // Update or add AUTO_RESPOND_CHANNEL_ID variable
          if (envContent.includes('AUTO_RESPOND_CHANNEL_ID=')) {
            envContent = envContent.replace(/AUTO_RESPOND_CHANNEL_ID=.*/g, `AUTO_RESPOND_CHANNEL_ID=${channelId}`);
          } else {
            envContent += `\nAUTO_RESPOND_CHANNEL_ID=${channelId}`;
          }
          
          // Save changes
          fs.writeFileSync(envPath, envContent);
          
          // Update environment variable
          process.env.AUTO_RESPOND_CHANNEL_ID = channelId;
          
          // Send regular notification
          await message.reply(`Channel <#${channelId}> has been set as auto-respond channel.\nBot will now automatically respond to all messages in this channel without requiring command prefix.`);
          
          // Send introduction message in set channel if not current channel
          if (channelId !== message.channelId) {
            const targetChannel = message.guild.channels.cache.get(channelId);
            await targetChannel.send('Hello! I have been activated in this channel. From now on, I will respond to every message you send without needing to use commands. Feel free to chat with me like a regular conversation! 😊');
          } else {
            // If current channel, add welcome message
            await message.channel.send('Hello! I have been activated in this channel. From now on, I will respond to every message you send without needing to use commands. Feel free to chat with me like a regular conversation! 😊');
          }
          
          return;
          
        case 'remove':
          // Remove AUTO_RESPOND_CHANNEL_ID variable
          if (envContent.includes('AUTO_RESPOND_CHANNEL_ID=')) {
            envContent = envContent.replace(/AUTO_RESPOND_CHANNEL_ID=.*/g, '# AUTO_RESPOND_CHANNEL_ID=');
          }
          
          // Save changes
          fs.writeFileSync(envPath, envContent);
          
          // Update environment variable
          delete process.env.AUTO_RESPOND_CHANNEL_ID;
          
          await message.reply('Auto-respond feature has been disabled. Bot will no longer automatically respond to messages in any channel.');
          
          return;
          
        default:
          return message.reply('Invalid action. Use `add` or `remove`.');
      }
    } catch (error) {
      console.error('Error in setchannel command:', error);
      return message.reply('An error occurred while setting up auto-respond channel.');
    }
  }
}; 