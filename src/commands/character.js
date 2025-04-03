// Command for managing AI characters
const { EmbedBuilder } = require('discord.js');
const { 
  getAllCharacters, 
  getCharacter, 
  setCharacter, 
  setDefaultCharacter, 
  deleteCharacter,
  updateCharacterAttributes,
  exportCharacterToFile,
  importCharacterFromFile
} = require('../config/characters');
const {
  getAllTemplates,
  getTemplate,
  saveTemplate,
  deleteTemplate,
  createCharacterFromTemplate
} = require('../config/character_templates');
const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'character',
  description: 'Manage AI characters for the bot',
  async execute(message, args) {
    if (!args.length) {
      return message.reply('Please specify a subcommand: `list`, `add`, `set`, `delete`, `info`, `appearance`, `message`, `export`, `import`, `template`.');
    }
    
    const subCommand = args[0].toLowerCase();
    
    try {
      switch (subCommand) {
        case 'list':
          return handleListCharacters(message);
        
        case 'add':
          if (args.length < 3) {
            return message.reply('Usage: `!character add <name> <type> <description>`');
          }
          
          const name = args[1];
          const type = args[2];
          const description = args.slice(3).join(' ');
          
          return handleAddCharacter(message, name, type, description);
        
        case 'set':
          if (args.length < 2) {
            return message.reply('Usage: `!character set <name>`');
          }
          
          return handleSetDefaultCharacter(message, args[1]);
        
        case 'delete':
          if (args.length < 2) {
            return message.reply('Usage: `!character delete <name>`');
          }
          
          return handleDeleteCharacter(message, args[1]);
        
        case 'appearance':
        case 'penampilan':
          if (args.length < 3) {
            return message.reply('Usage: `!character appearance <name> <appearance_description>`');
          }
          
          const charName = args[1];
          const appearance = args.slice(2).join(' ');
          
          return handleUpdateAppearance(message, charName, appearance);
          
        case 'message':
        case 'pesan':
          if (args.length < 3) {
            return message.reply('Usage: `!character message <name> <initial_message>`');
          }
          
          const charNameForMsg = args[1];
          const initialMessage = args.slice(2).join(' ');
          
          return handleUpdateInitialMessage(message, charNameForMsg, initialMessage);
          
        case 'export':
        case 'ekspor':
          if (args.length < 2) {
            return message.reply('Usage: `!character export <name>` - Export character configuration to file.');
          }
          
          return handleExportCharacter(message, args[1]);
          
        case 'import':
        case 'impor':
          if (message.attachments.size === 0) {
            return message.reply('Please attach a character configuration file when running this command. Example: `!character import` with attached file.');
          }
          
          return handleImportCharacter(message);
        
        case 'template':
        case 'templates':
          if (args.length === 1) {
            return handleListTemplates(message);
          }
          
          const templateAction = args[1].toLowerCase();
          
          switch (templateAction) {
            case 'list':
              return handleListTemplates(message);
              
            case 'info':
              if (args.length < 3) {
                return message.reply('Usage: `!character template info <template_name>` - Show detailed template info.');
              }
              return handleTemplateInfo(message, args[2]);
              
            case 'use':
              if (args.length < 4) {
                return message.reply('Usage: `!character template use <template_name> <character_name>` - Create new character from template.');
              }
              return handleUseTemplate(message, args[2], args[3]);
              
            case 'add':
              if (args.length < 3) {
                return message.reply('Usage: `!character template add <template_name> <character_name>` - Add existing character as a new template.');
              }
              return handleAddTemplate(message, args[2], args[3]);
              
            case 'delete':
            case 'remove':
              if (args.length < 3) {
                return message.reply('Usage: `!character template delete <template_name>` - Delete character template.');
              }
              return handleDeleteTemplate(message, args[2]);
              
            case 'blank':
            case 'kosong':
              return handleExportBlankTemplate(message);
              
            default:
              return message.reply('Invalid template subcommand. Use: `list`, `info`, `use`, `add`, `delete`, or `blank`.');
          }
        
        case 'info':
          const targetName = args.length > 1 ? args[1] : null;
          return handleCharacterInfo(message, targetName);
        
        default:
          return message.reply('Invalid subcommand. Use: `list`, `add`, `set`, `delete`, `appearance`, `message`, `export`, `import`, `template`, or `info`.');
      }
    } catch (error) {
      console.error('Error in character command:', error);
      return message.reply(`Error: ${error.message}`);
    }
  }
};

// Display character list
async function handleListCharacters(message) {
  const charactersData = getAllCharacters();
  const defaultCharacter = charactersData.default;
  const characters = Object.values(charactersData.characters);
  
  if (!characters.length) {
    return message.reply('No characters available.');
  }
  
  const embed = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle('AI Character List')
    .setDescription(`Default Character: **${defaultCharacter.name}** (${defaultCharacter.type})`)
    .addFields(
      characters.map(char => {
        return {
          name: `${char.name} (${char.type})`,
          value: char.description.length > 100 ? char.description.substring(0, 97) + '...' : char.description
        };
      })
    )
    .setFooter({
      text: `Total: ${characters.length} characters`,
      iconURL: message.client.user.displayAvatarURL()
    })
    .setTimestamp();
  
  return message.reply({ embeds: [embed] });
}

// Display character information
async function handleCharacterInfo(message, name) {
  const character = getCharacter(name);
  
  const embed = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle(`Character: ${character.name}`)
    .addFields([
      {
        name: 'Type',
        value: character.type,
        inline: true
      },
      {
        name: 'Status',
        value: !name || (name && getCharacter().name.toLowerCase() === character.name.toLowerCase()) ? 'Default' : 'Custom',
        inline: true
      },
      {
        name: 'Description',
        value: character.description
      }
    ])
    .setTimestamp()
    .setFooter({
      text: `AI Character`,
      iconURL: message.client.user.displayAvatarURL()
    });
  
  // Add appearance information if available
  if (character.appearance && character.appearance.trim() !== '') {
    embed.addFields({
      name: 'Appearance',
      value: character.appearance
    });
  }
  
  // Add initial message if available
  if (character.initialMessage && character.initialMessage.trim() !== '') {
    embed.addFields({
      name: 'Initial Message',
      value: character.initialMessage
    });
  }
  
  return message.reply({ embeds: [embed] });
}

// Add a new character
async function handleAddCharacter(message, name, type, description) {
  try {
    const character = setCharacter(name, type, description);
    
    const embed = new EmbedBuilder()
      .setColor('#00ff00')
      .setTitle('Character Added')
      .setDescription(`New character has been added!`)
      .addFields([
        {
          name: 'Name',
          value: character.name,
          inline: true
        },
        {
          name: 'Type',
          value: character.type,
          inline: true
        },
        {
          name: 'Description',
          value: character.description
        }
      ])
      .setFooter({
        text: 'Use !character appearance and !character message to add appearance and initial message',
        iconURL: message.client.user.displayAvatarURL()
      })
      .setTimestamp();
    
    return message.reply({ embeds: [embed] });
  } catch (error) {
    return message.reply(`Error: ${error.message}`);
  }
}

// Update character appearance
async function handleUpdateAppearance(message, name, appearance) {
  try {
    // Check if character exists
    const originalCharacter = getCharacter(name);
    if (!originalCharacter || originalCharacter.name.toLowerCase() !== name.toLowerCase()) {
      return message.reply(`Character "${name}" not found.`);
    }
    
    // Update character appearance
    const updatedCharacter = updateCharacterAttributes(name, { appearance });
    
    const embed = new EmbedBuilder()
      .setColor('#00ff00')
      .setTitle('Character Appearance Updated')
      .setDescription(`Appearance for **${updatedCharacter.name}** has been updated!`)
      .addFields([
        {
          name: 'New Appearance',
          value: updatedCharacter.appearance
        }
      ])
      .setTimestamp();
    
    return message.reply({ embeds: [embed] });
  } catch (error) {
    return message.reply(`Error: ${error.message}`);
  }
}

// Update character initial message
async function handleUpdateInitialMessage(message, name, initialMessage) {
  try {
    // Check if character exists
    const originalCharacter = getCharacter(name);
    if (!originalCharacter || originalCharacter.name.toLowerCase() !== name.toLowerCase()) {
      return message.reply(`Character "${name}" not found.`);
    }
    
    // Update character initial message
    const updatedCharacter = updateCharacterAttributes(name, { initialMessage });
    
    const embed = new EmbedBuilder()
      .setColor('#00ff00')
      .setTitle('Character Initial Message Updated')
      .setDescription(`Initial message for **${updatedCharacter.name}** has been updated!`)
      .addFields([
        {
          name: 'New Initial Message',
          value: updatedCharacter.initialMessage
        }
      ])
      .setTimestamp();
    
    return message.reply({ embeds: [embed] });
  } catch (error) {
    return message.reply(`Error: ${error.message}`);
  }
}

// Export character to file
async function handleExportCharacter(message, name) {
  try {
    // Export character to file
    const filePath = await exportCharacterToFile(name);
    
    // Send file to user
    await message.reply({
      content: `Character configuration for **${name}** has been exported!`,
      files: [{
        attachment: filePath,
        name: `${name.toLowerCase().replace(/\s+/g, '_')}_config.json`
      }]
    });
    
    // Delete file after sending
    setTimeout(() => {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (err) {
        console.error('Error deleting temporary file:', err);
      }
    }, 5000);
    
  } catch (error) {
    return message.reply(`Error: ${error.message}`);
  }
}

// Import character from file
async function handleImportCharacter(message) {
  try {
    // Check if file is available from message attachment
    const attachment = message.attachments.first();
    
    if (!attachment) {
      return message.reply('Please attach a character configuration file when running this command.');
    }
    
    // Create temp directory if it doesn't exist
    const tempDir = path.join(__dirname, '../../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Create temporary filename
    const tempFilePath = path.join(tempDir, `temp_${Date.now()}.json`);
    
    // Download attachment file
    const response = await fetch(attachment.url);
    const fileContent = await response.text();
    
    fs.writeFileSync(tempFilePath, fileContent);
    
    // Import character from file
    const character = await importCharacterFromFile(tempFilePath);
    
    // Delete temporary file
    try {
      fs.unlinkSync(tempFilePath);
    } catch (err) {
      console.error('Error deleting temporary file:', err);
    }
    
    const embed = new EmbedBuilder()
      .setColor('#00ff00')
      .setTitle('Character Imported')
      .setDescription(`Character **${character.name}** has been successfully imported!`)
      .addFields([
        {
          name: 'Type',
          value: character.type,
          inline: true
        },
        {
          name: 'Description',
          value: character.description
        }
      ])
      .setTimestamp();
    
    // Add appearance information if available
    if (character.appearance && character.appearance.trim() !== '') {
      embed.addFields({
        name: 'Appearance',
        value: character.appearance
      });
    }
    
    // Add initial message if available
    if (character.initialMessage && character.initialMessage.trim() !== '') {
      embed.addFields({
        name: 'Initial Message',
        value: character.initialMessage
      });
    }
    
    return message.reply({ embeds: [embed] });
  } catch (error) {
    console.error('Error importing character:', error);
    return message.reply(`Error: ${error.message}`);
  }
}

// Set default character
async function handleSetDefaultCharacter(message, name) {
  try {
    const character = setDefaultCharacter(name);
    
    const embed = new EmbedBuilder()
      .setColor('#00ff00')
      .setTitle('Default Character Changed')
      .setDescription(`Default character has been changed to **${character.name}**!`)
      .addFields([
        {
          name: 'Type',
          value: character.type,
          inline: true
        },
        {
          name: 'Description',
          value: character.description
        }
      ])
      .setTimestamp();
    
    return message.reply({ embeds: [embed] });
  } catch (error) {
    return message.reply(`Error: ${error.message}`);
  }
}

// Delete character
async function handleDeleteCharacter(message, name) {
  try {
    const success = deleteCharacter(name);
    
    if (success) {
      const newDefault = getCharacter();
      
      const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('Character Deleted')
        .setDescription(`Character **${name}** has been deleted!`)
        .addFields([
          {
            name: 'Current Default Character',
            value: `${newDefault.name} (${newDefault.type})`
          }
        ])
        .setTimestamp();
      
      return message.reply({ embeds: [embed] });
    } else {
      return message.reply(`Failed to delete character "${name}".`);
    }
  } catch (error) {
    return message.reply(`Error: ${error.message}`);
  }
}

// Display character template list
async function handleListTemplates(message) {
  const templates = getAllTemplates();
  const templateNames = Object.keys(templates);
  
  if (!templateNames.length) {
    return message.reply('No character templates available.');
  }
  
  const embed = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle('AI Character Template List')
    .setDescription('These templates can be used to quickly create new characters.')
    .addFields(
      templateNames.map(name => {
        const template = templates[name];
        return {
          name: `${name} (${template.type})`,
          value: template.name
        };
      })
    )
    .setFooter({
      text: `Total: ${templateNames.length} templates | Use !character template info <name> for details`,
      iconURL: message.client.user.displayAvatarURL()
    })
    .setTimestamp();
  
  return message.reply({ embeds: [embed] });
}

// Display detailed template information
async function handleTemplateInfo(message, templateName) {
  const template = getTemplate(templateName);
  
  if (!template) {
    return message.reply(`Template "${templateName}" not found.`);
  }
  
  const embed = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle(`Character Template: ${templateName}`)
    .addFields([
      {
        name: 'Character Name',
        value: template.name,
        inline: true
      },
      {
        name: 'Type',
        value: template.type,
        inline: true
      },
      {
        name: 'Description',
        value: template.description
      }
    ])
    .setTimestamp()
    .setFooter({
      text: `Use !character template use ${templateName} <new_name> to create character`,
      iconURL: message.client.user.displayAvatarURL()
    });
  
  // Add appearance information if available
  if (template.appearance && template.appearance.trim() !== '') {
    embed.addFields({
      name: 'Appearance',
      value: template.appearance
    });
  }
  
  // Add initial message if available
  if (template.initialMessage && template.initialMessage.trim() !== '') {
    embed.addFields({
      name: 'Initial Message',
      value: template.initialMessage
    });
  }
  
  return message.reply({ embeds: [embed] });
}

// Use template to create a new character
async function handleUseTemplate(message, templateName, characterName) {
  try {
    const character = createCharacterFromTemplate(templateName, characterName);
    
    const embed = new EmbedBuilder()
      .setColor('#00ff00')
      .setTitle('Character Created from Template')
      .setDescription(`Character **${character.name}** has been created from template **${templateName}**!`)
      .addFields([
        {
          name: 'Type',
          value: character.type,
          inline: true
        },
        {
          name: 'Description',
          value: character.description
        }
      ])
      .setTimestamp();
    
    // Add appearance information if available
    if (character.appearance && character.appearance.trim() !== '') {
      embed.addFields({
        name: 'Appearance',
        value: character.appearance
      });
    }
    
    // Add initial message if available
    if (character.initialMessage && character.initialMessage.trim() !== '') {
      embed.addFields({
        name: 'Initial Message',
        value: character.initialMessage
      });
    }
    
    return message.reply({ embeds: [embed] });
  } catch (error) {
    return message.reply(`Error: ${error.message}`);
  }
}

// Add existing character as a new template
async function handleAddTemplate(message, templateName, characterName) {
  try {
    // Check if character exists
    const character = getCharacter(characterName);
    if (!character || character.name.toLowerCase() !== characterName.toLowerCase()) {
      return message.reply(`Character "${characterName}" not found.`);
    }
    
    // Create new template
    const template = {
      name: character.name,
      type: character.type,
      description: character.description,
      appearance: character.appearance || '',
      initialMessage: character.initialMessage || ''
    };
    
    // Save template
    saveTemplate(templateName, template);
    
    const embed = new EmbedBuilder()
      .setColor('#00ff00')
      .setTitle('New Template Added')
      .setDescription(`Template **${templateName}** has been created from character **${character.name}**!`)
      .addFields([
        {
          name: 'Type',
          value: template.type,
          inline: true
        },
        {
          name: 'Description',
          value: template.description
        }
      ])
      .setTimestamp()
      .setFooter({
        text: `Use !character template use ${templateName} <new_name> to create character from this template`,
        iconURL: message.client.user.displayAvatarURL()
      });
    
    return message.reply({ embeds: [embed] });
  } catch (error) {
    return message.reply(`Error: ${error.message}`);
  }
}

// Delete template
async function handleDeleteTemplate(message, templateName) {
  try {
    // Delete template
    deleteTemplate(templateName);
    
    const embed = new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle('Template Deleted')
      .setDescription(`Template **${templateName}** has been deleted!`)
      .setTimestamp();
    
    return message.reply({ embeds: [embed] });
  } catch (error) {
    return message.reply(`Error: ${error.message}`);
  }
}

// Export blank template
async function handleExportBlankTemplate(message) {
  try {
    const blankTemplatePath = path.join(__dirname, '../../src/data/blank_template.json');
    
    if (!fs.existsSync(blankTemplatePath)) {
      // If file doesn't exist, create a blank template file
      const blankTemplate = {
        "name": "Character Name",
        "type": "anime/movie/game/custom",
        "description": "Brief description about the character, including personality, background, and main characteristics.",
        "appearance": "Detailed description of the character's physical appearance, such as hair, eyes, clothing, and other special features.",
        "initialMessage": "Message that the character will say when first talking to the user."
      };
      
      // Ensure directory exists
      const dirPath = path.dirname(blankTemplatePath);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      
      fs.writeFileSync(blankTemplatePath, JSON.stringify(blankTemplate, null, 2));
    }
    
    // Send blank template file to user
    await message.reply({
      content: "Here is a blank template for creating a new character. You can edit this file as desired and then import it with the `!character import` command.",
      files: [{
        attachment: blankTemplatePath,
        name: "blank_character_template.json"
      }]
    });
    
  } catch (error) {
    console.error('Error exporting blank template:', error);
    return message.reply(`Error: ${error.message}`);
  }
} 