// Perintah memory untuk mengelola ingatan percakapan dengan AI
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
  description: 'Mengelola ingatan/histori percakapan dengan AI',
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
      await message.reply('Maaf, terjadi kesalahan saat mengelola ingatan/histori percakapan.');
    }
  }
};

// Fungsi untuk menampilkan ringkasan ingatan
async function showMemorySummary(message, userId) {
  const summary = getUserHistorySummary(userId);
  
  if (typeof summary === 'string') {
    await message.reply(summary);
    return;
  }
  
  // Format ringkasan memori
  const memoryReply = `**Ringkasan Percakapan Kita**\n\n` +
    `Total pesan: ${summary.totalMessages}\n` +
    `Pesan kamu: ${summary.userMessages}\n` +
    `Pesan saya: ${summary.botMessages}\n` +
    `Pertama kali bicara: ${summary.firstMessageDate}\n` +
    `Terakhir bicara: ${summary.lastMessageDate}\n` +
    `Durasi percakapan: ${summary.durationDays} hari\n\n` +
    `Saya ingat semua percakapan kita dan menggunakan ingatan ini untuk merespon lebih baik! 😊\n\n` +
    `Gunakan \`!memory narrative\` untuk melihat versi narasi dari percakapan kita.`;
  
  await message.reply(memoryReply);
}

// Fungsi untuk menampilkan narasi percakapan
async function showNarrativeMemory(message, userId) {
  // Coba dapatkan narasi yang ada
  let narrative = getUserNarrativeSummary(userId);
  
  // Jika tidak ada narasi, coba buat narasi baru
  if (!narrative) {
    await message.reply('Sedang membuat narasi dari percakapan kita...');
    narrative = await generateNarrativeFromHistory(userId);
  }
  
  // Jika masih tidak ada narasi, tampilkan pesan error
  if (!narrative) {
    await message.reply('Belum ada cukup percakapan untuk membuat narasi. Silakan mengobrol lebih banyak terlebih dahulu.');
    return;
  }
  
  // Format narasi
  const narrativeEmbed = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle('Ingatan Percakapan Kita')
    .setDescription(narrative)
    .setTimestamp()
    .setFooter({ 
      text: 'Narasi berdasarkan percakapan terakhir kita',
      iconURL: message.client.user.displayAvatarURL()
    });
  
  await message.reply({ embeds: [narrativeEmbed] });
}

// Fungsi untuk membuat narasi baru
async function generateNewNarrative(message, userId) {
  await message.reply('Sedang membuat narasi baru dari percakapan kita...');
  
  // Coba buat narasi baru
  const narrative = await generateNarrativeFromHistory(userId);
  
  if (!narrative) {
    await message.reply('Belum ada cukup percakapan untuk membuat narasi. Silakan mengobrol lebih banyak terlebih dahulu.');
    return;
  }
  
  // Format narasi
  const narrativeEmbed = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle('Narasi Baru')
    .setDescription(narrative)
    .setTimestamp()
    .setFooter({ 
      text: 'Narasi dibuat untuk percakapan terakhir kita',
      iconURL: message.client.user.displayAvatarURL()
    });
  
  await message.reply({ embeds: [narrativeEmbed] });
}

// Fungsi untuk mengkonfigurasi auto narrative
async function configureAutoNarrative(message, args) {
  // Jika tidak ada argumen, tampilkan pengaturan saat ini
  if (!args || args.length === 0) {
    const currentConfig = setAutoNarrativeConfig(); // Memanggil tanpa parameter untuk mendapatkan konfigurasi saat ini
    
    const autoNarrativeInfo = `**Konfigurasi Narasi Otomatis**\n\n` +
      `Narasi otomatis dibuat setiap kali pengguna mencapai ${currentConfig.threshold} pesan dalam percakapan.\n` +
      `Narasi otomatis hanya dibuat sekali setiap ${currentConfig.cooldown / (60 * 1000)} menit untuk menghemat penggunaan API.\n\n` +
      `*Gaya Shapes.inc:* Bot secara otomatis membuat narasi percakapan tanpa perlu diminta.\n\n` +
      `**Perintah:**\n` +
      `\`!memory auto threshold <jumlah>\` - Mengatur jumlah pesan yang diperlukan untuk memicu narasi otomatis\n` +
      `\`!memory auto cooldown <menit>\` - Mengatur interval minimal (dalam menit) antara pembuatan narasi otomatis`;
    
    await message.reply(autoNarrativeInfo);
    return;
  }
  
  // Jika ada argumen, coba atur konfigurasi
  if (args[0] === 'threshold' && args.length >= 2) {
    const threshold = parseInt(args[1]);
    
    if (isNaN(threshold) || threshold < 2) {
      await message.reply('Nilai threshold harus berupa angka dan minimal 2 pesan.');
      return;
    }
    
    const config = setAutoNarrativeConfig(threshold, null);
    await message.reply(`Berhasil mengatur threshold narasi otomatis menjadi ${config.threshold} pesan.`);
    return;
  }
  
  if (args[0] === 'cooldown' && args.length >= 2) {
    const cooldownMinutes = parseInt(args[1]);
    
    if (isNaN(cooldownMinutes) || cooldownMinutes < 1) {
      await message.reply('Nilai cooldown harus berupa angka dan minimal 1 menit.');
      return;
    }
    
    const cooldownMs = cooldownMinutes * 60 * 1000;
    const config = setAutoNarrativeConfig(null, cooldownMs);
    await message.reply(`Berhasil mengatur cooldown narasi otomatis menjadi ${cooldownMinutes} menit.`);
    return;
  }
  
  // Jika argumen tidak valid
  await message.reply('Perintah tidak valid. Gunakan `!memory auto` untuk melihat pengaturan saat ini dan petunjuk penggunaan.');
}

// Fungsi untuk menampilkan semua narasi
async function showAllNarratives(message, userId) {
  const narratives = getAllUserNarratives(userId);
  
  if (!narratives || narratives.length === 0) {
    await message.reply('Belum ada narasi yang tersimpan. Gunakan `!memory generate` untuk membuat narasi baru.');
    return;
  }
  
  // Jika hanya ada satu narasi
  if (narratives.length === 1) {
    const narrativeEmbed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('Ingatan Percakapan Kita')
      .setDescription(narratives[0].narrative)
      .setTimestamp(new Date(narratives[0].timestamp))
      .setFooter({ 
        text: 'Satu-satunya narasi yang tersimpan',
        iconURL: message.client.user.displayAvatarURL()
      });
    
    await message.reply({ embeds: [narrativeEmbed] });
    return;
  }
  
  // Jika ada banyak narasi, kirim beberapa terakhir
  const maxNarratives = Math.min(3, narratives.length);
  const recentNarratives = narratives.slice(-maxNarratives);
  
  for (let i = 0; i < recentNarratives.length; i++) {
    const narrative = recentNarratives[i];
    const date = new Date(narrative.timestamp);
    
    const narrativeEmbed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle(`Ingatan #${narratives.length - maxNarratives + i + 1}`)
      .setDescription(narrative.narrative)
      .setTimestamp(date)
      .setFooter({ 
        text: `Narasi ${i + 1} dari ${maxNarratives}${narrative.isAutoGenerated ? ' (Dibuat otomatis)' : ''}`,
        iconURL: message.client.user.displayAvatarURL()
      });
    
    await message.reply({ embeds: [narrativeEmbed] });
    
    // Tunggu sebentar sebelum mengirim narasi berikutnya untuk menghindari rate limiting
    if (i < recentNarratives.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Jika ada lebih banyak narasi yang tidak ditampilkan
  if (narratives.length > maxNarratives) {
    await message.reply(`Hanya menampilkan ${maxNarratives} narasi terbaru dari total ${narratives.length} narasi.`);
  }
}

// Fungsi untuk menghapus ingatan
async function clearMemory(message, userId) {
  const success = clearUserHistory(userId);
  
  if (success) {
    await message.reply('Ingatan berhasil dihapus. Saya tidak akan mengingat percakapan kita sebelumnya.');
  } else {
    await message.reply('Gagal menghapus ingatan. Mungkin tidak ada ingatan yang tersimpan.');
  }
}

// Fungsi untuk mengekspor ingatan
async function exportMemory(message, userId) {
  const history = getUserHistory(userId);
  
  if (!history || history.length === 0) {
    await message.reply('Tidak ada ingatan yang tersimpan untuk diekspor.');
    return;
  }
  
  // Format untuk tampilan yang lebih baik
  const formattedHistory = history.map(item => {
    const timestamp = new Date(item.timestamp).toLocaleString();
    return `[${timestamp}] ${item.role === 'user' ? 'Kamu' : 'AI'}: ${item.message}`;
  }).join('\n\n');
  
  // Buat file teks sementara
  const tempDir = path.join(__dirname, '../../temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  const filePath = path.join(tempDir, `memory_${userId}.txt`);
  fs.writeFileSync(filePath, formattedHistory, 'utf8');
  
  // Kirim file
  await message.reply({
    content: 'Berikut adalah ekspor dari ingatan percakapan kita:',
    files: [{
      attachment: filePath,
      name: 'memory_export.txt'
    }]
  });
  
  // Coba ekspor juga narasi jika ada
  const narratives = getAllUserNarratives(userId);
  if (narratives && narratives.length > 0) {
    const formattedNarratives = narratives.map((item, index) => {
      const timestamp = new Date(item.timestamp).toLocaleString();
      return `=== NARASI #${index + 1} (${timestamp})${item.isAutoGenerated ? ' (OTOMATIS)' : ''} ===\n\n${item.narrative}\n\n`;
    }).join('\n' + '='.repeat(50) + '\n\n');
    
    const narrativeFilePath = path.join(tempDir, `narrative_${userId}.txt`);
    fs.writeFileSync(narrativeFilePath, formattedNarratives, 'utf8');
    
    await message.reply({
      content: 'Berikut adalah narasi dari percakapan kita:',
      files: [{
        attachment: narrativeFilePath,
        name: 'narrative_export.txt'
      }]
    });
    
    // Hapus file sementara setelah dikirim
    setTimeout(() => {
      try {
        fs.unlinkSync(narrativeFilePath);
      } catch (error) {
        console.error('Error deleting temp narrative file:', error);
      }
    }, 5000);
  }
  
  // Hapus file sementara setelah dikirim
  setTimeout(() => {
    try {
      fs.unlinkSync(filePath);
    } catch (error) {
      console.error('Error deleting temp file:', error);
    }
  }, 5000);
}

// Fungsi untuk menampilkan bantuan
async function showHelp(message) {
  const helpText = `**Perintah Memori/Ingatan (Gaya Shapes.inc)**\n\n` +
    `\`!memory\` - Menampilkan narasi percakapan (gaya Shapes.inc)\n` +
    `\`!memory narrative\` - Menampilkan narasi percakapan (gaya Shapes.inc)\n` +
    `\`!memory summary\` - Menampilkan ringkasan statistik percakapan\n` +
    `\`!memory generate\` - Membuat narasi baru dari percakapan terakhir\n` +
    `\`!memory all\` - Menampilkan beberapa narasi terbaru\n` +
    `\`!memory auto\` - Melihat/mengatur konfigurasi narasi otomatis\n` +
    `\`!memory clear\` - Menghapus semua ingatan percakapan\n` +
    `\`!memory export\` - Mengekspor ingatan percakapan sebagai file teks\n` +
    `\`!memory help\` - Menampilkan bantuan ini\n\n` +
    `**Gaya Shapes.inc:**\n` +
    `Bot secara otomatis menciptakan narasi dari percakapan tanpa perlu diminta. Narasi dibuat setelah beberapa pesan dikirim oleh user dan AI.\n\n` +
    `Alternatif lain:\n` +
    `\`!chat memori\` - Melihat narasi percakapan\n` +
    `\`!charchat memori\` - Melihat narasi percakapan\n` +
    `Ketik \`ingatan\` di channel auto-respond`;
  
  await message.reply(helpText);
} 