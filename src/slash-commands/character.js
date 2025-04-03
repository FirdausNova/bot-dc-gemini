// Perintah slash untuk mengelola karakter AI
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
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
  // Definisi perintah dan subcommands
  data: new SlashCommandBuilder()
    .setName('character')
    .setDescription('Mengelola karakter AI untuk bot')
    // Subcommand untuk melihat daftar karakter
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('Menampilkan daftar karakter yang tersedia'))
    // Subcommand untuk menambahkan karakter baru
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Menambahkan karakter baru')
        .addStringOption(option => 
          option.setName('nama')
            .setDescription('Nama karakter')
            .setRequired(true))
        .addStringOption(option => 
          option.setName('tipe')
            .setDescription('Tipe karakter (anime, movie, game, custom)')
            .setRequired(true))
        .addStringOption(option => 
          option.setName('deskripsi')
            .setDescription('Deskripsi karakter')
            .setRequired(true)))
    // Subcommand untuk mengatur karakter default
    .addSubcommand(subcommand =>
      subcommand
        .setName('set')
        .setDescription('Mengatur karakter default')
        .addStringOption(option => 
          option.setName('nama')
            .setDescription('Nama karakter yang akan dijadikan default')
            .setRequired(true)))
    // Subcommand untuk menghapus karakter
    .addSubcommand(subcommand =>
      subcommand
        .setName('delete')
        .setDescription('Menghapus karakter')
        .addStringOption(option => 
          option.setName('nama')
            .setDescription('Nama karakter yang akan dihapus')
            .setRequired(true)))
    // Subcommand untuk melihat info karakter
    .addSubcommand(subcommand =>
      subcommand
        .setName('info')
        .setDescription('Menampilkan informasi detail karakter')
        .addStringOption(option => 
          option.setName('nama')
            .setDescription('Nama karakter (kosongkan untuk karakter default)')
            .setRequired(false)))
    // Subcommand untuk mengatur penampilan karakter
    .addSubcommand(subcommand =>
      subcommand
        .setName('appearance')
        .setDescription('Mengatur deskripsi penampilan karakter')
        .addStringOption(option => 
          option.setName('nama')
            .setDescription('Nama karakter')
            .setRequired(true))
        .addStringOption(option => 
          option.setName('penampilan')
            .setDescription('Deskripsi penampilan karakter')
            .setRequired(true)))
    // Subcommand untuk mengatur pesan awal karakter
    .addSubcommand(subcommand =>
      subcommand
        .setName('message')
        .setDescription('Mengatur pesan awal karakter')
        .addStringOption(option => 
          option.setName('nama')
            .setDescription('Nama karakter')
            .setRequired(true))
        .addStringOption(option => 
          option.setName('pesan')
            .setDescription('Pesan awal karakter')
            .setRequired(true)))
    // Subcommand untuk mengekspor karakter
    .addSubcommand(subcommand =>
      subcommand
        .setName('export')
        .setDescription('Mengekspor konfigurasi karakter ke file')
        .addStringOption(option => 
          option.setName('nama')
            .setDescription('Nama karakter yang akan diekspor')
            .setRequired(true)))
    // Subcommand untuk template karakter
    .addSubcommandGroup(group =>
      group
        .setName('template')
        .setDescription('Mengelola template karakter')
        // Subcommand untuk melihat daftar template
        .addSubcommand(subcommand =>
          subcommand
            .setName('list')
            .setDescription('Menampilkan daftar template karakter yang tersedia'))
        // Subcommand untuk melihat info template
        .addSubcommand(subcommand =>
          subcommand
            .setName('info')
            .setDescription('Menampilkan informasi detail template')
            .addStringOption(option => 
              option.setName('nama')
                .setDescription('Nama template')
                .setRequired(true)))
        // Subcommand untuk menggunakan template
        .addSubcommand(subcommand =>
          subcommand
            .setName('use')
            .setDescription('Membuat karakter baru dari template')
            .addStringOption(option => 
              option.setName('template')
                .setDescription('Nama template')
                .setRequired(true))
            .addStringOption(option => 
              option.setName('nama')
                .setDescription('Nama karakter baru')
                .setRequired(true)))
        // Subcommand untuk menambahkan template
        .addSubcommand(subcommand =>
          subcommand
            .setName('add')
            .setDescription('Menambahkan karakter sebagai template baru')
            .addStringOption(option => 
              option.setName('template')
                .setDescription('Nama template baru')
                .setRequired(true))
            .addStringOption(option => 
              option.setName('karakter')
                .setDescription('Nama karakter yang akan dijadikan template')
                .setRequired(true)))
        // Subcommand untuk menghapus template
        .addSubcommand(subcommand =>
          subcommand
            .setName('delete')
            .setDescription('Menghapus template karakter')
            .addStringOption(option => 
              option.setName('nama')
                .setDescription('Nama template yang akan dihapus')
                .setRequired(true)))
        // Subcommand untuk mendapatkan template kosong
        .addSubcommand(subcommand =>
          subcommand
            .setName('blank')
            .setDescription('Mendapatkan template kosong untuk membuat karakter'))),
  
  // Fungsi eksekusi saat perintah dipanggil
  async execute(interaction) {
    try {
      const subCommand = interaction.options.getSubcommand();
      const subCommandGroup = interaction.options.getSubcommandGroup();
      
      // Handle template subcommand group
      if (subCommandGroup === 'template') {
        switch (subCommand) {
          case 'list':
            return handleListTemplates(interaction);
          case 'info':
            return handleTemplateInfo(interaction);
          case 'use':
            return handleUseTemplate(interaction);
          case 'add':
            return handleAddTemplate(interaction);
          case 'delete':
            return handleDeleteTemplate(interaction);
          case 'blank':
            return handleExportBlankTemplate(interaction);
        }
      }
      
      // Handle karakter subcommands
      switch (subCommand) {
        case 'list':
          return handleListCharacters(interaction);
        case 'add':
          return handleAddCharacter(interaction);
        case 'set':
          return handleSetDefaultCharacter(interaction);
        case 'delete':
          return handleDeleteCharacter(interaction);
        case 'info':
          return handleCharacterInfo(interaction);
        case 'appearance':
          return handleUpdateAppearance(interaction);
        case 'message':
          return handleUpdateInitialMessage(interaction);
        case 'export':
          return handleExportCharacter(interaction);
      }
    } catch (error) {
      console.error('Error in character command:', error);
      
      // Respond dengan pesan error
      try {
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply({ content: `Error: ${error.message}`, ephemeral: true });
        } else {
          await interaction.reply({ content: `Error: ${error.message}`, ephemeral: true });
        }
      } catch (e) {
        console.error('Error replying to interaction:', e);
      }
    }
  }
};

// Menampilkan daftar karakter
async function handleListCharacters(interaction) {
  const charactersData = getAllCharacters();
  const defaultCharacter = charactersData.default;
  const characters = Object.values(charactersData.characters);
  
  if (!characters.length) {
    return interaction.reply('Tidak ada karakter yang tersedia.');
  }
  
  const embed = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle('Daftar Karakter AI')
    .setDescription(`Karakter Default: **${defaultCharacter.name}** (${defaultCharacter.type})`)
    .addFields(
      characters.map(char => {
        return {
          name: `${char.name} (${char.type})`,
          value: char.description.length > 100 ? char.description.substring(0, 97) + '...' : char.description
        };
      })
    )
    .setFooter({
      text: `Total: ${characters.length} karakter`,
      iconURL: interaction.client.user.displayAvatarURL()
    })
    .setTimestamp();
  
  return interaction.reply({ embeds: [embed] });
}

// Menampilkan informasi karakter
async function handleCharacterInfo(interaction) {
  const name = interaction.options.getString('nama');
  const character = getCharacter(name);
  
  const embed = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle(`Karakter: ${character.name}`)
    .addFields([
      {
        name: 'Tipe',
        value: character.type,
        inline: true
      },
      {
        name: 'Status',
        value: !name || (name && getCharacter().name.toLowerCase() === character.name.toLowerCase()) ? 'Default' : 'Custom',
        inline: true
      },
      {
        name: 'Deskripsi',
        value: character.description
      }
    ])
    .setTimestamp()
    .setFooter({
      text: `Karakter AI`,
      iconURL: interaction.client.user.displayAvatarURL()
    });
  
  // Tambahkan informasi penampilan jika ada
  if (character.appearance && character.appearance.trim() !== '') {
    embed.addFields({
      name: 'Penampilan',
      value: character.appearance
    });
  }
  
  // Tambahkan informasi pesan awal jika ada
  if (character.initialMessage && character.initialMessage.trim() !== '') {
    embed.addFields({
      name: 'Pesan Awal',
      value: character.initialMessage
    });
  }
  
  // Tambahkan atribut-atribut roleplay jika ada
  const roleplayAttrs = [
    { key: 'personality', name: 'Kepribadian' },
    { key: 'background', name: 'Latar Belakang' },
    { key: 'relationships', name: 'Hubungan' },
    { key: 'quirks', name: 'Kebiasaan Unik' },
    { key: 'likes', name: 'Kesukaan' },
    { key: 'dislikes', name: 'Ketidaksukaan' },
    { key: 'goals', name: 'Tujuan' }
  ];
  
  roleplayAttrs.forEach(attr => {
    if (character[attr.key] && character[attr.key].trim() !== '') {
      embed.addFields({
        name: attr.name,
        value: character[attr.key]
      });
    }
  });
  
  return interaction.reply({ embeds: [embed] });
}

// Implementasi fungsi-fungsi handler lainnya
// Menambahkan karakter baru
async function handleAddCharacter(interaction) {
  await interaction.deferReply();
  
  const name = interaction.options.getString('nama');
  const type = interaction.options.getString('tipe');
  const description = interaction.options.getString('deskripsi');
  
  const character = setCharacter(name, type, description);
  
  const embed = new EmbedBuilder()
    .setColor('#00ff00')
    .setTitle('Karakter Ditambahkan')
    .setDescription(`Karakter baru telah ditambahkan!`)
    .addFields([
      {
        name: 'Nama',
        value: character.name,
        inline: true
      },
      {
        name: 'Tipe',
        value: character.type,
        inline: true
      },
      {
        name: 'Deskripsi',
        value: character.description
      }
    ])
    .setFooter({
      text: 'Gunakan /character appearance dan /character message untuk menambahkan penampilan dan pesan awal',
      iconURL: interaction.client.user.displayAvatarURL()
    })
    .setTimestamp();
  
  return interaction.editReply({ embeds: [embed] });
}

// Mengupdate deskripsi penampilan karakter
async function handleUpdateAppearance(interaction) {
  await interaction.deferReply();
  
  const name = interaction.options.getString('nama');
  const appearance = interaction.options.getString('penampilan');
  
  // Cek apakah karakter ada
  const originalCharacter = getCharacter(name);
  if (!originalCharacter || originalCharacter.name.toLowerCase() !== name.toLowerCase()) {
    return interaction.editReply(`Karakter "${name}" tidak ditemukan.`);
  }
  
  // Update penampilan karakter
  const updatedCharacter = updateCharacterAttributes(name, { appearance });
  
  const embed = new EmbedBuilder()
    .setColor('#00ff00')
    .setTitle('Penampilan Karakter Diperbarui')
    .setDescription(`Penampilan untuk **${updatedCharacter.name}** telah diperbarui!`)
    .addFields([
      {
        name: 'Penampilan Baru',
        value: updatedCharacter.appearance
      }
    ])
    .setTimestamp();
  
  return interaction.editReply({ embeds: [embed] });
}

// Mengupdate pesan awal karakter
async function handleUpdateInitialMessage(interaction) {
  await interaction.deferReply();
  
  const name = interaction.options.getString('nama');
  const initialMessage = interaction.options.getString('pesan');
  
  // Cek apakah karakter ada
  const originalCharacter = getCharacter(name);
  if (!originalCharacter || originalCharacter.name.toLowerCase() !== name.toLowerCase()) {
    return interaction.editReply(`Karakter "${name}" tidak ditemukan.`);
  }
  
  // Update pesan awal karakter
  const updatedCharacter = updateCharacterAttributes(name, { initialMessage });
  
  const embed = new EmbedBuilder()
    .setColor('#00ff00')
    .setTitle('Pesan Awal Karakter Diperbarui')
    .setDescription(`Pesan awal untuk **${updatedCharacter.name}** telah diperbarui!`)
    .addFields([
      {
        name: 'Pesan Awal Baru',
        value: updatedCharacter.initialMessage
      }
    ])
    .setTimestamp();
  
  return interaction.editReply({ embeds: [embed] });
}

// Mengekspor karakter ke file
async function handleExportCharacter(interaction) {
  await interaction.deferReply();
  
  const name = interaction.options.getString('nama');
  
  // Ekspor karakter ke file
  const filePath = await exportCharacterToFile(name);
  
  // Kirim file ke pengguna
  await interaction.editReply({
    content: `Konfigurasi karakter **${name}** telah diekspor!`,
    files: [{
      attachment: filePath,
      name: `${name.toLowerCase().replace(/\s+/g, '_')}_config.json`
    }]
  });
  
  // Hapus file setelah dikirim
  setTimeout(() => {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      console.error('Error deleting temporary file:', err);
    }
  }, 5000);
}

// Mengatur karakter default
async function handleSetDefaultCharacter(interaction) {
  await interaction.deferReply();
  
  const name = interaction.options.getString('nama');
  const character = setDefaultCharacter(name);
  
  const embed = new EmbedBuilder()
    .setColor('#00ff00')
    .setTitle('Karakter Default Diubah')
    .setDescription(`Karakter default telah diubah menjadi **${character.name}**!`)
    .addFields([
      {
        name: 'Tipe',
        value: character.type,
        inline: true
      },
      {
        name: 'Deskripsi',
        value: character.description
      }
    ])
    .setTimestamp();
  
  return interaction.editReply({ embeds: [embed] });
}

// Menghapus karakter
async function handleDeleteCharacter(interaction) {
  await interaction.deferReply();
  
  const name = interaction.options.getString('nama');
  const success = deleteCharacter(name);
  
  if (success) {
    const newDefault = getCharacter();
    
    const embed = new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle('Karakter Dihapus')
      .setDescription(`Karakter **${name}** telah dihapus!`)
      .addFields([
        {
          name: 'Karakter Default Saat Ini',
          value: `${newDefault.name} (${newDefault.type})`
        }
      ])
      .setTimestamp();
    
    return interaction.editReply({ embeds: [embed] });
  } else {
    return interaction.editReply(`Gagal menghapus karakter "${name}".`);
  }
}

// Menampilkan daftar template karakter
async function handleListTemplates(interaction) {
  const templates = getAllTemplates();
  const templateNames = Object.keys(templates);
  
  if (!templateNames.length) {
    return interaction.reply('Tidak ada template karakter yang tersedia.');
  }
  
  const embed = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle('Daftar Template Karakter AI')
    .setDescription('Template ini dapat digunakan untuk membuat karakter baru dengan cepat.')
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
      text: `Total: ${templateNames.length} template | Gunakan /character template info <nama> untuk detail`,
      iconURL: interaction.client.user.displayAvatarURL()
    })
    .setTimestamp();
  
  return interaction.reply({ embeds: [embed] });
}

// Menampilkan informasi detail template
async function handleTemplateInfo(interaction) {
  const templateName = interaction.options.getString('nama');
  const template = getTemplate(templateName);
  
  if (!template) {
    return interaction.reply(`Template "${templateName}" tidak ditemukan.`);
  }
  
  const embed = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle(`Template Karakter: ${templateName}`)
    .addFields([
      {
        name: 'Nama Karakter',
        value: template.name,
        inline: true
      },
      {
        name: 'Tipe',
        value: template.type,
        inline: true
      },
      {
        name: 'Deskripsi',
        value: template.description
      }
    ])
    .setTimestamp()
    .setFooter({
      text: `Gunakan /character template use ${templateName} <nama_baru> untuk membuat karakter`,
      iconURL: interaction.client.user.displayAvatarURL()
    });
  
  // Tambahkan informasi penampilan jika ada
  if (template.appearance && template.appearance.trim() !== '') {
    embed.addFields({
      name: 'Penampilan',
      value: template.appearance
    });
  }
  
  // Tambahkan informasi pesan awal jika ada
  if (template.initialMessage && template.initialMessage.trim() !== '') {
    embed.addFields({
      name: 'Pesan Awal',
      value: template.initialMessage
    });
  }
  
  // Tambahkan atribut-atribut roleplay jika ada
  const roleplayAttrs = [
    { key: 'personality', name: 'Kepribadian' },
    { key: 'background', name: 'Latar Belakang' },
    { key: 'relationships', name: 'Hubungan' },
    { key: 'quirks', name: 'Kebiasaan Unik' },
    { key: 'likes', name: 'Kesukaan' },
    { key: 'dislikes', name: 'Ketidaksukaan' },
    { key: 'goals', name: 'Tujuan' }
  ];
  
  roleplayAttrs.forEach(attr => {
    if (template[attr.key] && template[attr.key].trim() !== '') {
      embed.addFields({
        name: attr.name,
        value: template[attr.key]
      });
    }
  });
  
  return interaction.reply({ embeds: [embed] });
}

// Menggunakan template untuk membuat karakter baru
async function handleUseTemplate(interaction) {
  await interaction.deferReply();
  
  const templateName = interaction.options.getString('template');
  const characterName = interaction.options.getString('nama');
  
  const character = createCharacterFromTemplate(templateName, characterName);
  
  const embed = new EmbedBuilder()
    .setColor('#00ff00')
    .setTitle('Karakter Dibuat dari Template')
    .setDescription(`Karakter **${character.name}** telah dibuat dari template **${templateName}**!`)
    .addFields([
      {
        name: 'Tipe',
        value: character.type,
        inline: true
      },
      {
        name: 'Deskripsi',
        value: character.description
      }
    ])
    .setTimestamp();
  
  // Tambahkan informasi penampilan jika ada
  if (character.appearance && character.appearance.trim() !== '') {
    embed.addFields({
      name: 'Penampilan',
      value: character.appearance
    });
  }
  
  // Tambahkan informasi pesan awal jika ada
  if (character.initialMessage && character.initialMessage.trim() !== '') {
    embed.addFields({
      name: 'Pesan Awal',
      value: character.initialMessage
    });
  }
  
  return interaction.editReply({ embeds: [embed] });
}

// Menambahkan karakter yang ada sebagai template baru
async function handleAddTemplate(interaction) {
  await interaction.deferReply();
  
  const templateName = interaction.options.getString('template');
  const characterName = interaction.options.getString('karakter');
  
  // Cek apakah karakter ada
  const character = getCharacter(characterName);
  if (!character || character.name.toLowerCase() !== characterName.toLowerCase()) {
    return interaction.editReply(`Karakter "${characterName}" tidak ditemukan.`);
  }
  
  // Buat template baru
  const template = {
    name: character.name,
    type: character.type,
    description: character.description,
    appearance: character.appearance || '',
    initialMessage: character.initialMessage || '',
    personality: character.personality || '',
    background: character.background || '',
    relationships: character.relationships || '',
    quirks: character.quirks || '',
    likes: character.likes || '',
    dislikes: character.dislikes || '',
    goals: character.goals || '',
    expressionPatterns: character.expressionPatterns || {}
  };
  
  // Simpan template
  saveTemplate(templateName, template);
  
  const embed = new EmbedBuilder()
    .setColor('#00ff00')
    .setTitle('Template Baru Ditambahkan')
    .setDescription(`Template **${templateName}** telah dibuat dari karakter **${character.name}**!`)
    .addFields([
      {
        name: 'Tipe',
        value: template.type,
        inline: true
      },
      {
        name: 'Deskripsi',
        value: template.description
      }
    ])
    .setTimestamp()
    .setFooter({
      text: `Gunakan /character template use ${templateName} <nama_baru> untuk membuat karakter dari template ini`,
      iconURL: interaction.client.user.displayAvatarURL()
    });
  
  return interaction.editReply({ embeds: [embed] });
}

// Menghapus template
async function handleDeleteTemplate(interaction) {
  await interaction.deferReply();
  
  const templateName = interaction.options.getString('nama');
  
  // Hapus template
  deleteTemplate(templateName);
  
  const embed = new EmbedBuilder()
    .setColor('#ff0000')
    .setTitle('Template Dihapus')
    .setDescription(`Template **${templateName}** telah dihapus!`)
    .setTimestamp();
  
  return interaction.editReply({ embeds: [embed] });
}

// Mengekspor template kosong
async function handleExportBlankTemplate(interaction) {
  await interaction.deferReply();
  
  const blankTemplatePath = path.join(__dirname, '../../src/data/blank_template.json');
  
  if (!fs.existsSync(blankTemplatePath)) {
    // Jika file tidak ada, buat file template kosong
    const blankTemplate = {
      "name": "Nama Karakter",
      "type": "anime/movie/game/custom",
      "description": "Deskripsi singkat tentang karakter, termasuk kepribadian, latar belakang, dan karakteristik utama.",
      "appearance": "Deskripsi detail tentang penampilan fisik karakter, seperti rambut, mata, pakaian, dan ciri-ciri khusus lainnya.",
      "personality": "Deskripsi mendalam tentang sifat, tingkah laku, kebiasaan, cara bicara, dan reaksi emosional karakter dalam berbagai situasi.",
      "background": "Sejarah dan latar belakang karakter yang mempengaruhi motivasi dan perilakunya saat ini.",
      "relationships": "Hubungan karakter dengan tokoh-tokoh penting lainnya dalam dunianya.",
      "quirks": "Kebiasaan unik, kata-kata khas, atau gerakan khusus yang sering dilakukan karakter.",
      "likes": "Hal-hal yang disukai karakter, seperti makanan, aktivitas, atau topik pembicaraan favorit.",
      "dislikes": "Hal-hal yang tidak disukai karakter, seperti ketakutan, kekesalan, atau topik sensitif.",
      "goals": "Tujuan jangka pendek dan jangka panjang karakter yang memotivasi tindakannya.",
      "initialMessage": "Pesan yang akan diucapkan karakter saat pertama kali berbicara dengan pengguna.",
      "expressionPatterns": {
        "happy": "Cara karakter mengekspresikan kebahagiaan, seperti 'tersenyum lebar dengan mata berbinar'",
        "sad": "Cara karakter mengekspresikan kesedihan, seperti 'menunduk dengan bahu yang turun'",
        "angry": "Cara karakter mengekspresikan kemarahan, seperti 'mengerutkan alis dengan tangan terkepal'",
        "nervous": "Cara karakter mengekspresikan kegugupan, seperti 'mengalihkan pandangan sambil memainkan jari'",
        "surprised": "Cara karakter mengekspresikan keterkejutan, seperti 'membelalakkan mata dengan mulut sedikit terbuka'",
        "thinking": "Cara karakter mengekspresikan sedang berpikir, seperti 'mengetuk dagu sambil menatap ke atas'"
      }
    };
    
    // Pastikan direktori ada
    const dirPath = path.dirname(blankTemplatePath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    
    fs.writeFileSync(blankTemplatePath, JSON.stringify(blankTemplate, null, 2));
  }
  
  // Kirim file template kosong ke pengguna
  await interaction.editReply({
    content: "Berikut adalah template kosong untuk membuat karakter baru. Anda dapat mengedit file ini sesuai keinginan.",
    files: [{
      attachment: blankTemplatePath,
      name: "blank_character_template.json"
    }]
  });
} 