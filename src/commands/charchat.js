// Command for talking to AI using a specific character
const { 
  getAIResponse, 
  getUserHistorySummary, 
  getUserNarrativeSummary, 
  generateNarrativeFromHistory  
} = require('../utils/gemini');
const { getCharacter } = require('../config/characters');
const { EmbedBuilder } = require('discord.js');
const { t } = require('../utils/i18n');

module.exports = {
  name: 'charchat',
  description: 'Talk to AI using a specific character',
  async execute(message, args) {
    try {
      if (args.length < 1) {
        return message.reply('Usage: `!charchat <character_name> <message>` or `!charchat memory` to see conversation summary.');
      }
      
      const userId = message.author.id;
      
      // Check if user wants to see memory summary
      if (args[0].toLowerCase() === 'memori' || 
          args[0].toLowerCase() === 'ingatan' || 
          args[0].toLowerCase() === 'riwayat' ||
          args[0].toLowerCase() === 'ingat' ||
          args[0].toLowerCase() === 'memory') {
        
        // Try to get existing narrative or create new one
        let narrative = getUserNarrativeSummary(userId);
        
        // If no narrative exists, try to create a new one
        if (!narrative) {
          await message.reply(t('chat.creatingNarrative'));
          narrative = await generateNarrativeFromHistory(userId);
        }
        
        // If still no narrative, show stats summary as fallback
        if (!narrative) {
          const summary = getUserHistorySummary(userId);
          
          if (typeof summary === 'string') {
            await message.reply(summary);
          } else {
            // Format memory summary as fallback
            const memoryReply = `**${t('memory.conversationSummary')}**\n\n` +
              `${t('memory.totalMessages')}: ${summary.totalMessages}\n` +
              `${t('memory.yourMessages')}: ${summary.userMessages}\n` +
              `${t('memory.myMessages')}: ${summary.botMessages}\n` +
              `${t('memory.firstTalked')}: ${summary.firstMessageDate}\n` +
              `${t('memory.lastTalked')}: ${summary.lastMessageDate}\n` +
              `${t('memory.duration')}: ${summary.durationDays} ${t('memory.days')}\n\n` +
              `${t('chat.noNarrative')}`;
            
            await message.reply(memoryReply);
          }
        } else {
          // Send narrative in attractive embed format
          const narrativeEmbed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(t('chat.conversationMemory'))
            .setDescription(narrative)
            .setTimestamp()
            .setFooter({ 
              text: t('chat.narrativeBased'),
              iconURL: message.client.user.displayAvatarURL()
            });
          
          await message.reply({ embeds: [narrativeEmbed] });
        }
        
        return;
      }
      
      // Normal dialog mode
      if (args.length < 2) {
        return message.reply('Usage: `!charchat <character_name> <message>`');
      }
      
      const characterName = args[0];
      const query = args.slice(1).join(' ');
      
      if (!query) {
        return message.reply(t('chat.provideMsgPrompt'));
      }
      
      // Get character information
      const character = getCharacter(characterName);
      
      if (!character) {
        return message.reply(t('chat.characterNotFound'));
      }
      
      // Send typing indicator for natural effect
      await message.channel.sendTyping();
      
      // Get answer from AI with selected character
      const response = await getAIResponse(userId, query, character.name);
      
      // Check response length and truncate if too long (Discord 2000 character limit)
      const maxMessageLength = 1900; // Keep margin for other components
      let formattedResponse = response;
      
      // If response is too long, truncate and add notification
      if (response.length > maxMessageLength) {
        formattedResponse = response.substring(0, maxMessageLength) + '\n\n' + t('chat.responseTruncated');
      }
      
      // Send response directly (without embed) to resemble normal chat
      await message.reply(formattedResponse);
    } catch (error) {
      console.error('Error in charchat command:', error);
      
      // More informative error message based on error type
      let errorMessage = t('general.error');
      
      if (error.message.includes('rate limited') || error.message.includes('coba lagi dalam')) {
        errorMessage = error.message;
      } else if (error.message.includes('quota') || error.message.includes('429')) {
        errorMessage = 'Sorry, the Gemini API quota has been reached. The bot will automatically try an alternative model or please try again later.';
      } else if (error.message.includes('Tidak bisa terhubung ke Gemini API')) {
        errorMessage = 'Currently all AI models are unavailable. Please try again in a few minutes.';
      }
      
      await message.reply(errorMessage);
    }
  }
}; 