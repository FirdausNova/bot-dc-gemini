// Command to clear conversation history with AI
const { clearUserHistory } = require('../utils/gemini');

module.exports = {
  name: 'clear',
  description: 'Clear conversation history with AI',
  async execute(message, args) {
    try {
      // Clear user conversation history
      clearUserHistory(message.author.id);
      
      await message.reply('Your conversation history with AI has been cleared.');
    } catch (error) {
      console.error('Error in clear command:', error);
      await message.reply('Sorry, an error occurred while clearing conversation history.');
    }
  }
}; 