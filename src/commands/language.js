// Command to manage bot language settings
const { EmbedBuilder } = require('discord.js');
const { t, getCurrentLanguage, setLanguage, getSupportedLanguages } = require('../utils/i18n');

module.exports = {
  name: 'language',
  description: 'Set or view bot language',
  async execute(message, args) {
    try {
      // Get current language
      const currentLang = getCurrentLanguage();
      const supportedLanguages = getSupportedLanguages();
      
      // If no args, show current language and available options
      if (!args.length) {
        const languageList = Object.entries(supportedLanguages)
          .map(([code, name]) => `• \`${code}\` - ${name}${code === currentLang ? ' (current)' : ''}`)
          .join('\n');
        
        const embed = new EmbedBuilder()
          .setColor('#0099ff')
          .setTitle('Bot Language Settings')
          .setDescription(`Current language: **${supportedLanguages[currentLang] || currentLang}**\n\nAvailable languages:\n${languageList}\n\nTo change language use: \`!language set <language_code>\``)
          .setTimestamp()
          .setFooter({
            text: 'Use !language set <code> to change language',
            iconURL: message.client.user.displayAvatarURL()
          });
        
        return message.reply({ embeds: [embed] });
      }
      
      // Process commands
      const subCommand = args[0].toLowerCase();
      
      switch (subCommand) {
        case 'set':
          // Check if language code is provided
          if (args.length < 2) {
            return message.reply('Please specify a language code. Example: `!language set en` for English or `!language set id` for Indonesian.');
          }
          
          const langCode = args[1].toLowerCase();
          
          // Check if language is supported
          if (!supportedLanguages[langCode]) {
            return message.reply(`Language code "${langCode}" is not supported. Use \`!language\` to see available languages.`);
          }
          
          // Set the language
          const success = setLanguage(langCode);
          
          if (success) {
            // Special case: we immediately use the new language for the success message
            const successMessage = t('general.success', langCode);
            return message.reply(`${successMessage} Language changed to **${supportedLanguages[langCode]}**.`);
          } else {
            return message.reply('Failed to update language setting. Please check bot permissions.');
          }
          
        default:
          return message.reply(`Unknown subcommand: ${subCommand}. Use \`!language\` or \`!language set <code>\`.`);
      }
    } catch (error) {
      console.error('Error in language command:', error);
      return message.reply('An error occurred while managing language settings.');
    }
  }
}; 