// Slash command for managing bot language settings
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { t, getCurrentLanguage, setLanguage, getSupportedLanguages } = require('../utils/i18n');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('language')
    .setDescription('View or change bot language')
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('View current language and available options')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('set')
        .setDescription('Change bot language')
        .addStringOption(option =>
          option.setName('code')
            .setDescription('Language code (e.g., en, id)')
            .setRequired(true)
            .addChoices(
              { name: 'English', value: 'en' },
              { name: 'Indonesian (Bahasa Indonesia)', value: 'id' }
            )
        )
    ),
  async execute(interaction) {
    try {
      const subcommand = interaction.options.getSubcommand();
      
      // Get current language and supported languages
      const currentLang = getCurrentLanguage();
      const supportedLanguages = getSupportedLanguages();
      
      if (subcommand === 'view') {
        // Create language list for display
        const languageList = Object.entries(supportedLanguages)
          .map(([code, name]) => `• \`${code}\` - ${name}${code === currentLang ? ' (current)' : ''}`)
          .join('\n');
        
        const embed = new EmbedBuilder()
          .setColor('#0099ff')
          .setTitle('Bot Language Settings')
          .setDescription(`Current language: **${supportedLanguages[currentLang] || currentLang}**\n\nAvailable languages:\n${languageList}\n\nUse \`/language set\` to change language.`)
          .setTimestamp();
        
        await interaction.reply({ embeds: [embed], ephemeral: true });
        return;
      }
      
      if (subcommand === 'set') {
        const langCode = interaction.options.getString('code');
        
        // Try to set the language
        const success = setLanguage(langCode);
        
        if (success) {
          // Use new language for response
          const successMessage = t('general.success', langCode);
          await interaction.reply({
            content: `${successMessage} Language changed to **${supportedLanguages[langCode]}**.`,
            ephemeral: true
          });
        } else {
          await interaction.reply({
            content: 'Failed to update language setting. Please check bot permissions.',
            ephemeral: true
          });
        }
        return;
      }
    } catch (error) {
      console.error('Error in language command:', error);
      await interaction.reply({
        content: 'An error occurred while managing language settings.',
        ephemeral: true
      });
    }
  },
}; 