// Command for managing character knowledge
const { EmbedBuilder } = require('discord.js');
const { getCharacter } = require('../config/characters');
const { 
  addKnowledgeFromText, 
  addKnowledgeFromUrl, 
  listCharacterKnowledge, 
  getKnowledgeContent,
  deleteKnowledgeFile,
  getAllKnowledgeContent
} = require('../utils/knowledge');
const { t } = require('../utils/i18n');
const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'knowledge',
  description: 'Manage knowledge base for AI characters',
  async execute(message, args) {
    try {
      if (!args.length) {
        return message.reply('Please specify a subcommand: `list`, `add`, `get`, `delete`, `help`.');
      }
      
      const subCommand = args[0].toLowerCase();
      
      switch (subCommand) {
        case 'list':
          return handleListKnowledge(message, args.slice(1));
          
        case 'add':
          if (args.length < 3) {
            return message.reply('Usage: `!knowledge add <character_name> <text|url> <content>`');
          }
          
          const addCharName = args[1];
          const addType = args[2].toLowerCase();
          const addContent = args.slice(3).join(' ');
          
          return handleAddKnowledge(message, addCharName, addType, addContent);
          
        case 'get':
          if (args.length < 2) {
            return message.reply('Usage: `!knowledge get <character_name> [filename]`');
          }
          
          const getCharName = args[1];
          const getFilename = args.length > 2 ? args[2] : null;
          
          return handleGetKnowledge(message, getCharName, getFilename);
          
        case 'delete':
          if (args.length < 3) {
            return message.reply('Usage: `!knowledge delete <character_name> <filename>`');
          }
          
          const delCharName = args[1];
          const delFilename = args[2];
          
          return handleDeleteKnowledge(message, delCharName, delFilename);
          
        case 'help':
        case '?':
          return handleKnowledgeHelp(message);
          
        default:
          return message.reply('Invalid subcommand. Use: `list`, `add`, `get`, `delete`, or `help`.');
      }
    } catch (error) {
      console.error('Error in knowledge command:', error);
      return message.reply(`Error: ${error.message}`);
    }
  }
};

// List knowledge files for a character
async function handleListKnowledge(message, args) {
  if (!args.length) {
    return message.reply('Please specify a character name. Example: `!knowledge list <character_name>`');
  }
  
  const characterName = args[0];
  
  // Check if character exists
  const character = getCharacter(characterName);
  if (!character || character.name.toLowerCase() !== characterName.toLowerCase()) {
    return message.reply(`Character "${characterName}" not found.`);
  }
  
  // Get list of knowledge files
  const result = listCharacterKnowledge(character.name);
  
  if (!result.success) {
    return message.reply(`Error listing knowledge: ${result.error}`);
  }
  
  if (result.files.length === 0) {
    return message.reply(`No knowledge files found for character ${character.name}. Use \`!knowledge add ${character.name} text <content>\` to add knowledge.`);
  }
  
  // Create embed with knowledge list
  const embed = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle(`Knowledge Files for ${character.name}`)
    .setDescription(`Found ${result.files.length} knowledge files.`)
    .setTimestamp();
  
  // Add fields for each file (limit to 25 to avoid embed limits)
  const filesToShow = result.files.slice(0, 25);
  
  filesToShow.forEach(file => {
    const createdDate = new Date(file.created).toLocaleDateString();
    const sizeKB = (file.size / 1024).toFixed(2);
    
    embed.addFields({
      name: file.filename,
      value: `Size: ${sizeKB}KB | Created: ${createdDate}\nPreview: ${file.preview}`
    });
  });
  
  if (result.files.length > 25) {
    embed.setFooter({
      text: `Showing 25/${result.files.length} files. Get specific files with \`!knowledge get ${character.name} <filename>\``,
      iconURL: message.client.user.displayAvatarURL()
    });
  } else {
    embed.setFooter({
      text: `View file content with \`!knowledge get ${character.name} <filename>\``,
      iconURL: message.client.user.displayAvatarURL()
    });
  }
  
  return message.reply({ embeds: [embed] });
}

// Add knowledge to a character
async function handleAddKnowledge(message, characterName, type, content) {
  // Check if character exists
  const character = getCharacter(characterName);
  if (!character || character.name.toLowerCase() !== characterName.toLowerCase()) {
    return message.reply(`Character "${characterName}" not found.`);
  }
  
  // Check if there's content
  if (!content) {
    return message.reply('Please provide content to add as knowledge.');
  }
  
  let result;
  
  switch (type) {
    case 'text':
      // Add text knowledge
      result = addKnowledgeFromText(character.name, content, `manual_${Date.now()}`);
      break;
      
    case 'url':
      // Add URL knowledge (await since it's async)
      message.reply(`Processing URL for ${character.name}. This may take a moment...`);
      result = await addKnowledgeFromUrl(character.name, content);
      break;
      
    default:
      return message.reply('Invalid type. Use `text` or `url`.');
  }
  
  if (!result.success) {
    return message.reply(`Error adding knowledge: ${result.error}`);
  }
  
  // Create success embed
  const embed = new EmbedBuilder()
    .setColor('#00ff00')
    .setTitle('Knowledge Added')
    .setDescription(`Successfully added knowledge to ${character.name}`)
    .addFields({
      name: 'Filename',
      value: result.filename
    })
    .setTimestamp()
    .setFooter({
      text: `View with \`!knowledge get ${character.name} ${result.filename}\``,
      iconURL: message.client.user.displayAvatarURL()
    });
  
  return message.reply({ embeds: [embed] });
}

// Get knowledge content
async function handleGetKnowledge(message, characterName, filename) {
  // Check if character exists
  const character = getCharacter(characterName);
  if (!character || character.name.toLowerCase() !== characterName.toLowerCase()) {
    return message.reply(`Character "${characterName}" not found.`);
  }
  
  // If no specific filename, get all knowledge content
  if (!filename) {
    const result = getAllKnowledgeContent(character.name);
    
    if (!result.success) {
      return message.reply(`Error retrieving knowledge: ${result.error}`);
    }
    
    if (result.files === 0) {
      return message.reply(`No knowledge files found for character ${character.name}.`);
    }
    
    // If content is too long for Discord message, create a temporary file
    if (result.content.length > 1950) {
      const tempDir = path.join(__dirname, '../../temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      const tempFilePath = path.join(tempDir, `${character.name.toLowerCase().replace(/\s+/g, '_')}_knowledge.txt`);
      fs.writeFileSync(tempFilePath, result.content, 'utf8');
      
      // Create embed and attach file
      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(`Knowledge for ${character.name}`)
        .setDescription(`Found ${result.files} knowledge files. Content is attached as a file due to length.`)
        .setTimestamp()
        .setFooter({
          text: 'Knowledge content is available in the attached file',
          iconURL: message.client.user.displayAvatarURL()
        });
      
      await message.reply({ 
        embeds: [embed],
        files: [{
          attachment: tempFilePath,
          name: `${character.name}_knowledge.txt`
        }]
      });
      
      // Delete temp file after sending
      setTimeout(() => {
        try {
          if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
          }
        } catch (err) {
          console.error('Error deleting temporary file:', err);
        }
      }, 5000);
      
      return;
    }
    
    // Content fits in Discord message
    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle(`Knowledge for ${character.name}`)
      .setDescription(`Found ${result.files} knowledge files.`)
      .addFields({
        name: 'Content',
        value: result.content.substring(0, 1020) + (result.content.length > 1020 ? '...' : '')
      })
      .setTimestamp();
    
    return message.reply({ embeds: [embed] });
  }
  
  // Get specific file content
  const result = getKnowledgeContent(character.name, filename);
  
  if (!result.success) {
    return message.reply(`Error retrieving knowledge: ${result.error}`);
  }
  
  // If content is too long for Discord message, create a temporary file
  if (result.content.length > 1950) {
    const tempDir = path.join(__dirname, '../../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const tempFilePath = path.join(tempDir, filename);
    fs.writeFileSync(tempFilePath, result.content, 'utf8');
    
    // Create embed and attach file
    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle(`Knowledge File: ${filename}`)
      .setDescription(`File content for ${character.name} is attached below.`)
      .setTimestamp()
      .setFooter({
        text: 'Knowledge content is available in the attached file',
        iconURL: message.client.user.displayAvatarURL()
      });
    
    await message.reply({ 
      embeds: [embed],
      files: [{
        attachment: tempFilePath,
        name: filename
      }]
    });
    
    // Delete temp file after sending
    setTimeout(() => {
      try {
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      } catch (err) {
        console.error('Error deleting temporary file:', err);
      }
    }, 5000);
    
    return;
  }
  
  // Content fits in Discord message
  const embed = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle(`Knowledge File: ${filename}`)
    .setDescription(`File content for ${character.name}:`)
    .addFields({
      name: 'Content',
      value: result.content.substring(0, 1020) + (result.content.length > 1020 ? '...' : '')
    })
    .setTimestamp();
  
  return message.reply({ embeds: [embed] });
}

// Delete knowledge file
async function handleDeleteKnowledge(message, characterName, filename) {
  // Check if character exists
  const character = getCharacter(characterName);
  if (!character || character.name.toLowerCase() !== characterName.toLowerCase()) {
    return message.reply(`Character "${characterName}" not found.`);
  }
  
  // Delete the file
  const result = deleteKnowledgeFile(character.name, filename);
  
  if (!result.success) {
    return message.reply(`Error deleting knowledge file: ${result.error}`);
  }
  
  // Create success embed
  const embed = new EmbedBuilder()
    .setColor('#ff0000')
    .setTitle('Knowledge File Deleted')
    .setDescription(`Successfully deleted knowledge file from ${character.name}`)
    .addFields({
      name: 'Filename',
      value: filename
    })
    .setTimestamp();
  
  return message.reply({ embeds: [embed] });
}

// Show help for knowledge command
async function handleKnowledgeHelp(message) {
  const embed = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle('Knowledge Command Help')
    .setDescription('Use the knowledge command to manage character knowledge bases')
    .addFields(
      {
        name: '!knowledge list <character_name>',
        value: 'List all knowledge files for a character'
      },
      {
        name: '!knowledge add <character_name> text <content>',
        value: 'Add text knowledge to a character'
      },
      {
        name: '!knowledge add <character_name> url <url>',
        value: 'Add knowledge from a website URL'
      },
      {
        name: '!knowledge get <character_name> [filename]',
        value: 'Get knowledge content (all or specific file)'
      },
      {
        name: '!knowledge delete <character_name> <filename>',
        value: 'Delete a knowledge file'
      }
    )
    .setTimestamp()
    .setFooter({
      text: 'Character knowledge improves AI responses with specific data',
      iconURL: message.client.user.displayAvatarURL()
    });
  
  return message.reply({ embeds: [embed] });
} 