const { SlashCommandBuilder, EmbedBuilder, AutocompleteInteraction } = require('discord.js');
const { getCharacter, getAllCharacters } = require('../config/characters');
const { 
  addKnowledgeFromText, 
  addKnowledgeFromUrl, 
  listCharacterKnowledge, 
  getKnowledgeContent,
  deleteKnowledgeFile,
  getAllKnowledgeContent
} = require('../utils/knowledge');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('knowledge')
    .setDescription('Mengelola basis pengetahuan untuk karakter AI')
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('Melihat daftar file pengetahuan karakter')
        .addStringOption(option =>
          option
            .setName('character')
            .setDescription('Nama karakter')
            .setRequired(true)
            .setAutocomplete(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Menambahkan pengetahuan ke karakter')
        .addStringOption(option =>
          option
            .setName('character')
            .setDescription('Nama karakter')
            .setRequired(true)
            .setAutocomplete(true)
        )
        .addStringOption(option =>
          option
            .setName('type')
            .setDescription('Jenis sumber pengetahuan')
            .setRequired(true)
            .addChoices(
              { name: 'Text', value: 'text' },
              { name: 'URL', value: 'url' }
            )
        )
        .addStringOption(option =>
          option
            .setName('content')
            .setDescription('Konten teks atau URL untuk ditambahkan')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('get')
        .setDescription('Melihat isi file pengetahuan')
        .addStringOption(option =>
          option
            .setName('character')
            .setDescription('Nama karakter')
            .setRequired(true)
            .setAutocomplete(true)
        )
        .addStringOption(option =>
          option
            .setName('filename')
            .setDescription('Nama file pengetahuan (kosongkan untuk melihat semua)')
            .setRequired(false)
            .setAutocomplete(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('delete')
        .setDescription('Menghapus file pengetahuan')
        .addStringOption(option =>
          option
            .setName('character')
            .setDescription('Nama karakter')
            .setRequired(true)
            .setAutocomplete(true)
        )
        .addStringOption(option =>
          option
            .setName('filename')
            .setDescription('Nama file pengetahuan yang akan dihapus')
            .setRequired(true)
            .setAutocomplete(true)
        )
    ),
    
  async execute(interaction) {
    try {
      await interaction.deferReply();
      const subCommand = interaction.options.getSubcommand();
      
      switch (subCommand) {
        case 'list':
          return handleListKnowledge(interaction);
          
        case 'add':
          return handleAddKnowledge(interaction);
          
        case 'get':
          return handleGetKnowledge(interaction);
          
        case 'delete':
          return handleDeleteKnowledge(interaction);
          
        default:
          return interaction.editReply('Subperintah tidak valid. Gunakan: `list`, `add`, `get`, atau `delete`.');
      }
    } catch (error) {
      console.error('Error in knowledge command:', error);
      return interaction.editReply(`Error: ${error.message}`);
    }
  },
  
  // Handle autocomplete requests
  async autocomplete(interaction) {
    try {
      const focusedOption = interaction.options.getFocused(true);
      const subCommand = interaction.options.getSubcommand();
      
      if (focusedOption.name === 'character') {
        // Get all available characters
        const charactersData = getAllCharacters();
        const characters = Object.values(charactersData.characters);
        
        // Filter based on user input
        const filtered = characters.filter(char => 
          char.name.toLowerCase().includes(focusedOption.value.toLowerCase())
        );
        
        // Return top 25 matches
        await interaction.respond(
          filtered.slice(0, 25).map(char => ({
            name: `${char.name} (${char.type})`,
            value: char.name
          }))
        );
      }
      else if (focusedOption.name === 'filename') {
        // Get character name first
        const characterName = interaction.options.getString('character');
        
        if (!characterName) {
          return interaction.respond([]);
        }
        
        // Get character's knowledge files
        const result = listCharacterKnowledge(characterName);
        
        if (!result.success || !result.files || result.files.length === 0) {
          return interaction.respond([]);
        }
        
        // Filter based on user input
        const filtered = result.files.filter(file => 
          file.filename.toLowerCase().includes(focusedOption.value.toLowerCase())
        );
        
        // Return top 25 matches
        await interaction.respond(
          filtered.slice(0, 25).map(file => ({
            name: file.filename,
            value: file.filename
          }))
        );
      }
    } catch (error) {
      console.error('Error in autocomplete handler:', error);
      await interaction.respond([]);
    }
  }
};

// List knowledge files for a character
async function handleListKnowledge(interaction) {
  const characterName = interaction.options.getString('character');
  
  // Check if character exists
  const character = getCharacter(characterName);
  if (!character || character.name.toLowerCase() !== characterName.toLowerCase()) {
    return interaction.editReply(`Karakter "${characterName}" tidak ditemukan.`);
  }
  
  // Get list of knowledge files
  const result = listCharacterKnowledge(character.name);
  
  if (!result.success) {
    return interaction.editReply(`Error melihat daftar pengetahuan: ${result.error}`);
  }
  
  if (result.files.length === 0) {
    return interaction.editReply(`Tidak ada file pengetahuan untuk karakter ${character.name}. Gunakan \`/knowledge add ${character.name} text <content>\` untuk menambahkan.`);
  }
  
  // Create embed with knowledge list
  const embed = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle(`File Pengetahuan untuk ${character.name}`)
    .setDescription(`Ditemukan ${result.files.length} file pengetahuan.`)
    .setTimestamp();
  
  // Add fields for each file (limit to 25 to avoid embed limits)
  const filesToShow = result.files.slice(0, 25);
  
  filesToShow.forEach(file => {
    const createdDate = new Date(file.created).toLocaleDateString();
    const sizeKB = (file.size / 1024).toFixed(2);
    
    embed.addFields({
      name: file.filename,
      value: `Ukuran: ${sizeKB}KB | Dibuat: ${createdDate}\nPratinjau: ${file.preview}`
    });
  });
  
  if (result.files.length > 25) {
    embed.setFooter({
      text: `Menampilkan 25/${result.files.length} file. Lihat file tertentu dengan \`/knowledge get ${character.name} <filename>\``,
      iconURL: interaction.client.user.displayAvatarURL()
    });
  } else {
    embed.setFooter({
      text: `Lihat isi file dengan \`/knowledge get ${character.name} <filename>\``,
      iconURL: interaction.client.user.displayAvatarURL()
    });
  }
  
  return interaction.editReply({ embeds: [embed] });
}

// Add knowledge to a character
async function handleAddKnowledge(interaction) {
  const characterName = interaction.options.getString('character');
  const type = interaction.options.getString('type');
  const content = interaction.options.getString('content');
  
  // Check if character exists
  const character = getCharacter(characterName);
  if (!character || character.name.toLowerCase() !== characterName.toLowerCase()) {
    return interaction.editReply(`Karakter "${characterName}" tidak ditemukan.`);
  }
  
  // Check if there's content
  if (!content) {
    return interaction.editReply('Mohon berikan konten untuk ditambahkan sebagai pengetahuan.');
  }
  
  let result;
  
  switch (type) {
    case 'text':
      // Add text knowledge
      result = addKnowledgeFromText(character.name, content, `manual_${Date.now()}`);
      break;
      
    case 'url':
      // Add URL knowledge (await since it's async)
      await interaction.editReply(`Memproses URL untuk ${character.name}. Ini mungkin memerlukan waktu...`);
      result = await addKnowledgeFromUrl(character.name, content);
      break;
      
    default:
      return interaction.editReply('Jenis tidak valid. Gunakan `text` atau `url`.');
  }
  
  if (!result.success) {
    return interaction.editReply(`Error menambahkan pengetahuan: ${result.error}`);
  }
  
  // Create success embed
  const embed = new EmbedBuilder()
    .setColor('#00ff00')
    .setTitle('Pengetahuan Ditambahkan')
    .setDescription(`Berhasil menambahkan pengetahuan ke ${character.name}`)
    .addFields({
      name: 'Nama File',
      value: result.filename
    })
    .setTimestamp()
    .setFooter({
      text: `Lihat dengan \`/knowledge get ${character.name} ${result.filename}\``,
      iconURL: interaction.client.user.displayAvatarURL()
    });
  
  return interaction.editReply({ embeds: [embed] });
}

// Get knowledge content
async function handleGetKnowledge(interaction) {
  const characterName = interaction.options.getString('character');
  const filename = interaction.options.getString('filename');
  
  // Check if character exists
  const character = getCharacter(characterName);
  if (!character || character.name.toLowerCase() !== characterName.toLowerCase()) {
    return interaction.editReply(`Karakter "${characterName}" tidak ditemukan.`);
  }
  
  // If no specific filename, get all knowledge content
  if (!filename) {
    const result = getAllKnowledgeContent(character.name);
    
    if (!result.success) {
      return interaction.editReply(`Error mengambil pengetahuan: ${result.error}`);
    }
    
    if (result.files === 0) {
      return interaction.editReply(`Tidak ada file pengetahuan untuk karakter ${character.name}.`);
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
        .setTitle(`Pengetahuan untuk ${character.name}`)
        .setDescription(`Ditemukan ${result.files} file pengetahuan. Konten dilampirkan sebagai file karena terlalu panjang.`)
        .setTimestamp()
        .setFooter({
          text: 'Konten pengetahuan tersedia dalam file terlampir',
          iconURL: interaction.client.user.displayAvatarURL()
        });
      
      await interaction.editReply({ 
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
          console.error('Error menghapus file sementara:', err);
        }
      }, 5000);
      
      return;
    }
    
    // Content fits in Discord message
    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle(`Pengetahuan untuk ${character.name}`)
      .setDescription(`Ditemukan ${result.files} file pengetahuan.`)
      .addFields({
        name: 'Konten',
        value: result.content.substring(0, 1020) + (result.content.length > 1020 ? '...' : '')
      })
      .setTimestamp();
    
    return interaction.editReply({ embeds: [embed] });
  }
  
  // Get specific file content
  const result = getKnowledgeContent(character.name, filename);
  
  if (!result.success) {
    return interaction.editReply(`Error mengambil pengetahuan: ${result.error}`);
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
      .setTitle(`File Pengetahuan: ${filename}`)
      .setDescription(`Konten file untuk ${character.name} dilampirkan di bawah.`)
      .setTimestamp()
      .setFooter({
        text: 'Konten pengetahuan tersedia dalam file terlampir',
        iconURL: interaction.client.user.displayAvatarURL()
      });
    
    await interaction.editReply({ 
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
        console.error('Error menghapus file sementara:', err);
      }
    }, 5000);
    
    return;
  }
  
  // Content fits in Discord message
  const embed = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle(`File Pengetahuan: ${filename}`)
    .setDescription(`Konten file untuk ${character.name}:`)
    .addFields({
      name: 'Konten',
      value: result.content.substring(0, 1020) + (result.content.length > 1020 ? '...' : '')
    })
    .setTimestamp();
  
  return interaction.editReply({ embeds: [embed] });
}

// Delete knowledge file
async function handleDeleteKnowledge(interaction) {
  const characterName = interaction.options.getString('character');
  const filename = interaction.options.getString('filename');
  
  // Check if character exists
  const character = getCharacter(characterName);
  if (!character || character.name.toLowerCase() !== characterName.toLowerCase()) {
    return interaction.editReply(`Karakter "${characterName}" tidak ditemukan.`);
  }
  
  // Delete the file
  const result = deleteKnowledgeFile(character.name, filename);
  
  if (!result.success) {
    return interaction.editReply(`Error menghapus file pengetahuan: ${result.error}`);
  }
  
  // Create success embed
  const embed = new EmbedBuilder()
    .setColor('#ff0000')
    .setTitle('File Pengetahuan Dihapus')
    .setDescription(`Berhasil menghapus file pengetahuan dari ${character.name}`)
    .addFields({
      name: 'Nama File',
      value: filename
    })
    .setTimestamp();
  
  return interaction.editReply({ embeds: [embed] });
} 