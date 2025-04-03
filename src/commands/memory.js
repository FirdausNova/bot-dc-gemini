// Command for managing conversation memory with AI
const { 
  getUserHistorySummary, 
  clearUserHistory, 
  getUserHistory, 
  getUserNarrativeSummary, 
  getAllUserNarratives,
  generateNarrativeFromHistory,
  setAutoNarrativeConfig
} = require('../utils/gemini');
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'memory',
  description: 'Manage conversation history/memory with AI',
  async execute(message, args) {
    try {
      const userId = message.author.id;
      const subCommand = args[0]?.toLowerCase() || 'narrative';
      
      switch (subCommand) {
        case 'summary':
        case 'ringkasan':
          await showMemorySummary(message, userId);
          break;
          
        case 'narrative':
        case 'narasi':
          await showNarrativeMemory(message, userId);
          break;
          
        case 'generate':
        case 'buat':
          await generateNewNarrative(message, userId);
          break;
          
        case 'all':
        case 'semua':
          await showAllNarratives(message, userId);
          break;
          
        case 'clear':
        case 'hapus':
        case 'reset':
          await clearMemory(message, userId);
          break;
          
        case 'export':
        case 'ekspor':
          await exportMemory(message, userId);
          break;
          
        case 'auto':
        case 'otomatis':
          await configureAutoNarrative(message, args.slice(1));
          break;
          
        case 'help':
        case 'bantuan':
          await showHelp(message);
          break;
          
        default:
          await showNarrativeMemory(message, userId);
      }
    } catch (error) {
      console.error('Error in memory command:', error);
      await message.reply('Sorry, an error occurred while managing conversation memory.');
    }
  }
};

// Function to display memory summary
async function showMemorySummary(message, userId) {
  const summary = getUserHistorySummary(userId);
  
  if (typeof summary === 'string') {
    await message.reply(summary);
    return;
  }
  
  // Format memory summary
  const memoryReply = `**Conversation Summary**\n\n` +
    `Total messages: ${summary.totalMessages}\n` +
    `Your messages: ${summary.userMessages}\n` +
    `My messages: ${summary.botMessages}\n` +
    `First talked: ${summary.firstMessageDate}\n` +
    `Last talked: ${summary.lastMessageDate}\n` +
    `Conversation duration: ${summary.durationDays} days\n\n` +
    `I remember all our conversations and use this memory to respond better! 😊\n\n` +
    `Use \`!memory narrative\` to see a narrative version of our conversation.`;
  
  await message.reply(memoryReply);
}

// Function to display conversation narrative
async function showNarrativeMemory(message, userId) {
  // Try to get existing narrative
  let narrative = getUserNarrativeSummary(userId);
  
  // If no narrative exists, try to create a new one
  if (!narrative) {
    await message.reply('Creating narrative from our conversation...');
    narrative = await generateNarrativeFromHistory(userId);
  }
  
  // If still no narrative, show error message
  if (!narrative) {
    await message.reply('Not enough conversation to create a narrative. Please chat more first.');
    return;
  }
  
  // Format narrative
  const narrativeEmbed = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle('Our Conversation Memory')
    .setDescription(narrative)
    .setTimestamp()
    .setFooter({ 
      text: 'Narrative based on our recent conversation',
      iconURL: message.client.user.displayAvatarURL()
    });
  
  await message.reply({ embeds: [narrativeEmbed] });
}

// Function to create a new narrative
async function generateNewNarrative(message, userId) {
  await message.reply('Creating new narrative from our conversation...');
  
  // Try to create a new narrative
  const narrative = await generateNarrativeFromHistory(userId);
  
  if (!narrative) {
    await message.reply('Not enough conversation to create a narrative. Please chat more first.');
    return;
  }
  
  // Format narrative
  const narrativeEmbed = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle('New Narrative')
    .setDescription(narrative)
    .setTimestamp()
    .setFooter({ 
      text: 'Narrative created for our recent conversation',
      iconURL: message.client.user.displayAvatarURL()
    });
  
  await message.reply({ embeds: [narrativeEmbed] });
}

// Function to configure auto narrative
async function configureAutoNarrative(message, args) {
  // If no arguments, show current configuration
  if (!args || args.length === 0) {
    const currentConfig = setAutoNarrativeConfig(); // Calling without parameters to get current configuration
    
    const autoNarrativeInfo = `**Auto Narrative Configuration**\n\n` +
      `Auto narrative created every time user reaches ${currentConfig.threshold} messages in conversation.\n` +
      `Auto narrative created once every ${currentConfig.cooldown / (60 * 1000)} minutes to save API usage.\n\n` +
      `*Shapes.inc style:* Bot automatically creates narrative from conversation without needing to be asked.\n\n` +
      `**Commands:**\n` +
      `\`!memory auto threshold <number>\` - Set the number of messages required to trigger auto narrative\n` +
      `\`!memory auto cooldown <minutes>\` - Set the minimum interval (in minutes) between auto narrative creation`;
    
    await message.reply(autoNarrativeInfo);
    return;
  }
  
  // If arguments, try to configure
  if (args[0] === 'threshold' && args.length >= 2) {
    const threshold = parseInt(args[1]);
    
    if (isNaN(threshold) || threshold < 2) {
      await message.reply('Threshold must be a number and at least 2 messages.');
      return;
    }
    
    const config = setAutoNarrativeConfig(threshold, null);
    await message.reply(`Successfully set auto narrative threshold to ${config.threshold} messages.`);
    return;
  }
  
  if (args[0] === 'cooldown' && args.length >= 2) {
    const cooldownMinutes = parseInt(args[1]);
    
    if (isNaN(cooldownMinutes) || cooldownMinutes < 1) {
      await message.reply('Cooldown must be a number and at least 1 minute.');
      return;
    }
    
    const cooldownMs = cooldownMinutes * 60 * 1000;
    const config = setAutoNarrativeConfig(null, cooldownMs);
    await message.reply(`Successfully set auto narrative cooldown to ${cooldownMinutes} minutes.`);
    return;
  }
  
  // If arguments are invalid
  await message.reply('Invalid command. Use `!memory auto` to see current configuration and usage instructions.');
}

// Function to display all narratives
async function showAllNarratives(message, userId) {
  const narratives = getAllUserNarratives(userId);
  
  if (!narratives || narratives.length === 0) {
    await message.reply('No narratives saved. Use `!memory generate` to create a new narrative.');
    return;
  }
  
  // If there's only one narrative
  if (narratives.length === 1) {
    const narrativeEmbed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('Our Conversation Memory')
      .setDescription(narratives[0].narrative)
      .setTimestamp(new Date(narratives[0].timestamp))
      .setFooter({ 
        text: 'Only saved narrative',
        iconURL: message.client.user.displayAvatarURL()
      });
    
    await message.reply({ embeds: [narrativeEmbed] });
    return;
  }
  
  // If there are multiple narratives, send the last few
  const maxNarratives = Math.min(3, narratives.length);
  const recentNarratives = narratives.slice(-maxNarratives);
  
  for (let i = 0; i < recentNarratives.length; i++) {
    const narrative = recentNarratives[i];
    const date = new Date(narrative.timestamp);
    
    const narrativeEmbed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle(`Memory #${narratives.length - maxNarratives + i + 1}`)
      .setDescription(narrative.narrative)
      .setTimestamp(date)
      .setFooter({ 
        text: `Narrative ${i + 1} of ${maxNarratives}${narrative.isAutoGenerated ? ' (Auto-generated)' : ''}`,
        iconURL: message.client.user.displayAvatarURL()
      });
    
    await message.reply({ embeds: [narrativeEmbed] });
    
    // Wait between sending narratives to avoid rate limiting
    if (i < recentNarratives.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // If there are more narratives than displayed
  if (narratives.length > maxNarratives) {
    await message.reply(`Only showing ${maxNarratives} recent narratives out of total ${narratives.length} narratives.`);
  }
}

// Function to clear memory
async function clearMemory(message, userId) {
  const success = clearUserHistory(userId);
  
  if (success) {
    await message.reply('Memory cleared. I will not remember our previous conversation.');
  } else {
    await message.reply('Failed to clear memory. Maybe no memory saved.');
  }
}

// Function to export memory
async function exportMemory(message, userId) {
  const history = getUserHistory(userId);
  
  if (!history || history.length === 0) {
    await message.reply('No memory saved to export.');
    return;
  }
  
  // Format for better display
  const formattedHistory = history.map(item => {
    const timestamp = new Date(item.timestamp).toLocaleString();
    return `[${timestamp}] ${item.role === 'user' ? 'You' : 'AI'}: ${item.message}`;
  }).join('\n\n');
  
  // Create temporary text file
  const tempDir = path.join(__dirname, '../../temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  const filePath = path.join(tempDir, `memory_${userId}.txt`);
  fs.writeFileSync(filePath, formattedHistory, 'utf8');
  
  // Send file
  await message.reply({
    content: 'Here is the export from our conversation memory:',
    files: [{
      attachment: filePath,
      name: 'memory_export.txt'
    }]
  });
  
  // Try to export narrative if there is one
  const narratives = getAllUserNarratives(userId);
  if (narratives && narratives.length > 0) {
    const formattedNarratives = narratives.map((item, index) => {
      const timestamp = new Date(item.timestamp).toLocaleString();
      return `=== NARRATIVE #${index + 1} (${timestamp})${item.isAutoGenerated ? ' (AUTO-GENERATED)' : ''} ===\n\n${item.narrative}\n\n`;
    }).join('\n' + '='.repeat(50) + '\n\n');
    
    const narrativeFilePath = path.join(tempDir, `narrative_${userId}.txt`);
    fs.writeFileSync(narrativeFilePath, formattedNarratives, 'utf8');
    
    await message.reply({
      content: 'Here is the narrative from our conversation:',
      files: [{
        attachment: narrativeFilePath,
        name: 'narrative_export.txt'
      }]
    });
    
    // Delete temporary file after sending
    setTimeout(() => {
      try {
        fs.unlinkSync(narrativeFilePath);
      } catch (error) {
        console.error('Error deleting temp narrative file:', error);
      }
    }, 5000);
  }
  
  // Delete temporary file after sending
  setTimeout(() => {
    try {
      fs.unlinkSync(filePath);
    } catch (error) {
      console.error('Error deleting temp file:', error);
    }
  }, 5000);
}

// Function to display help
async function showHelp(message) {
  const helpText = `**Memory/Conversation History Commands (Shapes.inc style)**\n\n` +
    `\`!memory\` - Show conversation narrative (Shapes.inc style)\n` +
    `\`!memory narrative\` - Show conversation narrative (Shapes.inc style)\n` +
    `\`!memory summary\` - Show conversation statistics summary\n` +
    `\`!memory generate\` - Create a new narrative from recent conversation\n` +
    `\`!memory all\` - Show several recent narratives\n` +
    `\`!memory auto\` - Show/configure auto narrative settings\n` +
    `\`!memory clear\` - Clear all conversation memory\n` +
    `\`!memory export\` - Export conversation memory as text file\n` +
    `\`!memory help\` - Show this help\n\n` +
    `**Shapes.inc:**\n` +
    `Bot automatically creates narrative from conversation without needing to be asked. Narrative created after several messages from user and AI.\n\n` +
    `Alternative:\n` +
    `\`!chat memori\` - Show conversation narrative\n` +
    `\`!charchat memori\` - Show conversation narrative\n` +
    `Type \`ingatan\` in auto-respond channel`;
  
  await message.reply(helpText);
} 