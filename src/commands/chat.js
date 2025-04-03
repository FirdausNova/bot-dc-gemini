// Chat command for communicating with AI
const { 
  getAIResponse, 
  getUserHistorySummary, 
  getUserNarrativeSummary, 
  generateNarrativeFromHistory
} = require('../utils/gemini');
const { EmbedBuilder } = require('discord.js');
const { t } = require('../utils/i18n');

module.exports = {
  name: 'chat',
  description: 'Talk with AI using the selected character',
  async execute(message, args) {
    try {
      // Get message from user
      const query = args.join(' ');
      const userId = message.author.id;
      
      // Check if user wants to see memory summary
      if (query.toLowerCase() === 'memori' || 
          query.toLowerCase() === 'ingatan' || 
          query.toLowerCase() === 'riwayat' ||
          query.toLowerCase() === 'ingat aku' ||
          query.toLowerCase() === 'memory') {
        
        // Try to get existing narrative or create a new one
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
      
      if (!query) {
        await message.reply(t('chat.provideMsgPrompt'));
        return;
      }
      
      // Show typing indicator for natural effect
      await message.channel.sendTyping();
      
      // Get response from AI
      const response = await getAIResponse(userId, query);
      
      // Send response directly (without embed) to resemble normal chat
      await message.reply(response);
    } catch (error) {
      console.error('Error in chat command:', error);
      
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