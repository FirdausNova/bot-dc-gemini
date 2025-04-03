// Perintah untuk mengelola karakter AI
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
  description: 'Mengelola karakter AI untuk bot',
  async execute(message, args) {
    if (!args.length) {
      return message.reply('Silakan tentukan subperintah: `list`, `add`, `set`, `delete`, `info`, `appearance`, `message`, `export`, `import`, `template`.');
    }
    
    const subCommand = args[0].toLowerCase();
    
    try {
      switch (subCommand) {
        case 'list':
          return handleListCharacters(message);
        
        case 'add':
          if (args.length < 3) {
            return message.reply('Penggunaan: `!character add <nama> <tipe> <deskripsi>`');
          }
          
          const name = args[1];
          const type = args[2];
          const description = args.slice(3).join(' ');
          
          return handleAddCharacter(message, name, type, description);
        
        case 'set':
          if (args.length < 2) {
            return message.reply('Penggunaan: `!character set <nama>`');
          }
          
          return handleSetDefaultCharacter(message, args[1]);
        
        case 'delete':
          if (args.length < 2) {
            return message.reply('Penggunaan: `!character delete <nama>`');
          }
          
          return handleDeleteCharacter(message, args[1]);
        
        case 'appearance':
        case 'penampilan':
          if (args.length < 3) {
            return message.reply('Penggunaan: `!character appearance <nama> <deskripsi_penampilan>`');
          }
          
          const charName = args[1];
          const appearance = args.slice(2).join(' ');
          
          return handleUpdateAppearance(message, charName, appearance);
          
        case 'message':
        case 'pesan':
          if (args.length < 3) {
            return message.reply('Penggunaan: `!character message <nama> <pesan_awal>`');
          }
          
          const charNameForMsg = args[1];
          const initialMessage = args.slice(2).join(' ');
          
          return handleUpdateInitialMessage(message, charNameForMsg, initialMessage);
          
        case 'export':
        case 'ekspor':
          if (args.length < 2) {
            return message.reply('Penggunaan: `!character export <nama>` - Mengekspor konfigurasi karakter ke file.');
          }
          
          return handleExportCharacter(message, args[1]);
          
        case 'import':
        case 'impor':
          if (message.attachments.size === 0) {
            return message.reply('Silakan lampirkan file konfigurasi karakter saat menjalankan perintah ini. Contoh: `!character import` dengan file terlampir.');
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
                return message.reply('Penggunaan: `!character template info <nama_template>` - Menampilkan informasi detail template.');
              }
              return handleTemplateInfo(message, args[2]);
              
            case 'use':
              if (args.length < 4) {
                return message.reply('Penggunaan: `!character template use <nama_template> <nama_karakter>` - Membuat karakter baru dari template.');
              }
              return handleUseTemplate(message, args[2], args[3]);
              
            case 'add':
              if (args.length < 3) {
                return message.reply('Penggunaan: `!character template add <nama_template> <nama_karakter>` - Menambahkan karakter yang ada sebagai template baru.');
              }
              return handleAddTemplate(message, args[2], args[3]);
              
            case 'delete':
            case 'remove':
              if (args.length < 3) {
                return message.reply('Penggunaan: `!character template delete <nama_template>` - Menghapus template karakter.');
              }
              return handleDeleteTemplate(message, args[2]);
              
            case 'blank':
            case 'kosong':
              return handleExportBlankTemplate(message);
              
            default:
              return message.reply('Subperintah template tidak valid. Gunakan: `list`, `info`, `use`, `add`, `delete`, atau `blank`.');
          }
        
        case 'info':
          const targetName = args.length > 1 ? args[1] : null;
          return handleCharacterInfo(message, targetName);
        
        default:
          return message.reply('Subperintah tidak valid. Gunakan: `list`, `add`, `set`, `delete`, `appearance`, `message`, `export`, `import`, `template`, atau `info`.');
      }
    } catch (error) {
      console.error('Error in character command:', error);
      return message.reply(`Error: ${error.message}`);
    }
  }
};

// Menampilkan daftar karakter
async function handleListCharacters(message) {
  const charactersData = getAllCharacters();
  const defaultCharacter = charactersData.default;
  const characters = Object.values(charactersData.characters);
  
  if (!characters.length) {
    return message.reply('Tidak ada karakter yang tersedia.');
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
      iconURL: message.client.user.displayAvatarURL()
    })
    .setTimestamp();
  
  return message.reply({ embeds: [embed] });
}

// Menampilkan informasi karakter
async function handleCharacterInfo(message, name) {
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
      iconURL: message.client.user.displayAvatarURL()
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
  
  return message.reply({ embeds: [embed] });
}

// Menambahkan karakter baru
async function handleAddCharacter(message, name, type, description) {
  try {
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
        text: 'Gunakan !character appearance dan !character message untuk menambahkan penampilan dan pesan awal',
        iconURL: message.client.user.displayAvatarURL()
      })
      .setTimestamp();
    
    return message.reply({ embeds: [embed] });
  } catch (error) {
    return message.reply(`Error: ${error.message}`);
  }
}

// Mengupdate deskripsi penampilan karakter
async function handleUpdateAppearance(message, name, appearance) {
  try {
    // Cek apakah karakter ada
    const originalCharacter = getCharacter(name);
    if (!originalCharacter || originalCharacter.name.toLowerCase() !== name.toLowerCase()) {
      return message.reply(`Karakter "${name}" tidak ditemukan.`);
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
    
    return message.reply({ embeds: [embed] });
  } catch (error) {
    return message.reply(`Error: ${error.message}`);
  }
}

// Mengupdate pesan awal karakter
async function handleUpdateInitialMessage(message, name, initialMessage) {
  try {
    // Cek apakah karakter ada
    const originalCharacter = getCharacter(name);
    if (!originalCharacter || originalCharacter.name.toLowerCase() !== name.toLowerCase()) {
      return message.reply(`Karakter "${name}" tidak ditemukan.`);
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
    
    return message.reply({ embeds: [embed] });
  } catch (error) {
    return message.reply(`Error: ${error.message}`);
  }
}

// Mengekspor karakter ke file
async function handleExportCharacter(message, name) {
  try {
    // Ekspor karakter ke file
    const filePath = await exportCharacterToFile(name);
    
    // Kirim file ke pengguna
    await message.reply({
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
    
  } catch (error) {
    return message.reply(`Error: ${error.message}`);
  }
}

// Mengimpor karakter dari file
async function handleImportCharacter(message) {
  try {
    // Cek apakah file tersedia dari lampiran pesan
    const attachment = message.attachments.first();
    
    if (!attachment) {
      return message.reply('Silakan lampirkan file konfigurasi karakter saat menjalankan perintah ini.');
    }
    
    // Buat direktori temp jika belum ada
    const tempDir = path.join(__dirname, '../../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Buat nama file temporary
    const tempFilePath = path.join(tempDir, `temp_${Date.now()}.json`);
    
    // Unduh file lampiran
    const response = await fetch(attachment.url);
    const fileContent = await response.text();
    
    fs.writeFileSync(tempFilePath, fileContent);
    
    // Impor karakter dari file
    const character = await importCharacterFromFile(tempFilePath);
    
    // Hapus file temporary
    try {
      fs.unlinkSync(tempFilePath);
    } catch (err) {
      console.error('Error deleting temporary file:', err);
    }
    
    const embed = new EmbedBuilder()
      .setColor('#00ff00')
      .setTitle('Karakter Diimpor')
      .setDescription(`Karakter **${character.name}** telah berhasil diimpor!`)
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
    
    return message.reply({ embeds: [embed] });
  } catch (error) {
    console.error('Error importing character:', error);
    return message.reply(`Error: ${error.message}`);
  }
}

// Mengatur karakter default
async function handleSetDefaultCharacter(message, name) {
  try {
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
    
    return message.reply({ embeds: [embed] });
  } catch (error) {
    return message.reply(`Error: ${error.message}`);
  }
}

// Menghapus karakter
async function handleDeleteCharacter(message, name) {
  try {
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
      
      return message.reply({ embeds: [embed] });
    } else {
      return message.reply(`Gagal menghapus karakter "${name}".`);
    }
  } catch (error) {
    return message.reply(`Error: ${error.message}`);
  }
}

// Menampilkan daftar template karakter
async function handleListTemplates(message) {
  const templates = getAllTemplates();
  const templateNames = Object.keys(templates);
  
  if (!templateNames.length) {
    return message.reply('Tidak ada template karakter yang tersedia.');
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
      text: `Total: ${templateNames.length} template | Gunakan !character template info <nama> untuk detail`,
      iconURL: message.client.user.displayAvatarURL()
    })
    .setTimestamp();
  
  return message.reply({ embeds: [embed] });
}

// Menampilkan informasi detail template
async function handleTemplateInfo(message, templateName) {
  const template = getTemplate(templateName);
  
  if (!template) {
    return message.reply(`Template "${templateName}" tidak ditemukan.`);
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
      text: `Gunakan !character template use ${templateName} <nama_baru> untuk membuat karakter`,
      iconURL: message.client.user.displayAvatarURL()
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
  
  return message.reply({ embeds: [embed] });
}

// Menggunakan template untuk membuat karakter baru
async function handleUseTemplate(message, templateName, characterName) {
  try {
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
    
    return message.reply({ embeds: [embed] });
  } catch (error) {
    return message.reply(`Error: ${error.message}`);
  }
}

// Menambahkan karakter yang ada sebagai template baru
async function handleAddTemplate(message, templateName, characterName) {
  try {
    // Cek apakah karakter ada
    const character = getCharacter(characterName);
    if (!character || character.name.toLowerCase() !== characterName.toLowerCase()) {
      return message.reply(`Karakter "${characterName}" tidak ditemukan.`);
    }
    
    // Buat template baru
    const template = {
      name: character.name,
      type: character.type,
      description: character.description,
      appearance: character.appearance || '',
      initialMessage: character.initialMessage || ''
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
        text: `Gunakan !character template use ${templateName} <nama_baru> untuk membuat karakter dari template ini`,
        iconURL: message.client.user.displayAvatarURL()
      });
    
    return message.reply({ embeds: [embed] });
  } catch (error) {
    return message.reply(`Error: ${error.message}`);
  }
}

// Menghapus template
async function handleDeleteTemplate(message, templateName) {
  try {
    // Hapus template
    deleteTemplate(templateName);
    
    const embed = new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle('Template Dihapus')
      .setDescription(`Template **${templateName}** telah dihapus!`)
      .setTimestamp();
    
    return message.reply({ embeds: [embed] });
  } catch (error) {
    return message.reply(`Error: ${error.message}`);
  }
}

// Mengekspor template kosong
async function handleExportBlankTemplate(message) {
  try {
    const blankTemplatePath = path.join(__dirname, '../../src/data/blank_template.json');
    
    if (!fs.existsSync(blankTemplatePath)) {
      // Jika file tidak ada, buat file template kosong
      const blankTemplate = {
        "name": "Nama Karakter",
        "type": "anime/movie/game/custom",
        "description": "Deskripsi singkat tentang karakter, termasuk kepribadian, latar belakang, dan karakteristik utama.",
        "appearance": "Deskripsi detail tentang penampilan fisik karakter, seperti rambut, mata, pakaian, dan ciri-ciri khusus lainnya.",
        "initialMessage": "Pesan yang akan diucapkan karakter saat pertama kali berbicara dengan pengguna."
      };
      
      // Pastikan direktori ada
      const dirPath = path.dirname(blankTemplatePath);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      
      fs.writeFileSync(blankTemplatePath, JSON.stringify(blankTemplate, null, 2));
    }
    
    // Kirim file template kosong ke pengguna
    await message.reply({
      content: "Berikut adalah template kosong untuk membuat karakter baru. Anda dapat mengedit file ini sesuai keinginan dan kemudian mengimpornya dengan perintah `!character import`.",
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