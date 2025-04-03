// Help command to display bot usage guide
const { EmbedBuilder } = require('discord.js');
const { t } = require('../utils/i18n');
require('dotenv').config();

module.exports = {
  name: 'help',
  description: 'Display bot usage instructions',
  async execute(message, args) {
    try {
      const prefix = process.env.BOT_PREFIX || '!';
      const autoRespondChannelId = process.env.AUTO_RESPOND_CHANNEL_ID;
      
      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(t('help.title'))
        .setDescription(`${t('help.description')} \`${prefix}\``)
        .addFields(
          {
            name: `${prefix}chat <message>`,
            value: 'Talk to AI using the default character'
          },
          {
            name: `${prefix}charchat <character_name> <message>`,
            value: 'Talk to AI using a specific character'
          },
          {
            name: `${prefix}character list`,
            value: 'Display list of available characters'
          },
          {
            name: `${prefix}character add <name> <type> <description>`,
            value: 'Add a new character'
          },
          {
            name: `${prefix}character set <name>`,
            value: 'Set default character'
          },
          {
            name: `${prefix}character delete <name>`,
            value: 'Delete a character'
          },
          {
            name: `${prefix}character info [name]`,
            value: 'Show character information (if name not provided, shows default character)'
          },
          {
            name: `${prefix}setchannel <add/remove> [channel_id]`,
            value: 'Set channel for auto-response (Admin only)'
          },
          {
            name: `${prefix}language [set <code>]`,
            value: 'View or change bot language (en for English, id for Indonesian)'
          },
          {
            name: `${prefix}clear`,
            value: 'Clear conversation history with AI'
          },
          {
            name: `${prefix}help`,
            value: 'Display bot usage help'
          }
        )
        .setFooter({
          text: `Discord AI Bot | Gemini API`,
          iconURL: message.client.user.displayAvatarURL()
        })
        .setTimestamp();
      
      // Add auto-respond channel info if available
      if (autoRespondChannelId) {
        embed.addFields({
          name: '📣 Auto-Respond Channel',
          value: t('help.autoRespondChannel')
        });
      }
      
      await message.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error in help command:', error);
      await message.reply(t('general.error'));
    }
  }
}; 