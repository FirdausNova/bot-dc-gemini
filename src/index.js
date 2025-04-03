// Import dependencies
const { Client, GatewayIntentBits, Collection, Events, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { getAIResponse, getUserHistorySummary, getUserNarrativeSummary, generateNarrativeFromHistory } = require('./utils/gemini');
const { getCharacter } = require('./config/characters');

// Inisialisasi client Discord
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// Simpan prefix bot dari .env
const prefix = process.env.BOT_PREFIX || '!';

// Channel khusus untuk auto-respond
const autoRespondChannelId = process.env.AUTO_RESPOND_CHANNEL_ID;

// Koleksi untuk menyimpan perintah
client.commands = new Collection();
client.slashCommands = new Collection();

// Simpan status loading per channel
const loadingStatus = new Map();

// Simpan data konteks per user
const userContexts = new Map();

// Load perintah legacy (dengan prefix)
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  
  if ('name' in command && 'execute' in command) {
    client.commands.set(command.name, command);
    console.log(`Perintah legacy ${command.name} telah dimuat`);
  } else {
    console.log(`Perintah di ${filePath} tidak memiliki properti 'name' atau 'execute' yang diperlukan`);
  }
}

// Load perintah slash (/)
const slashCommandsPath = path.join(__dirname, 'slash-commands');
if (fs.existsSync(slashCommandsPath)) {
  const slashCommandFiles = fs.readdirSync(slashCommandsPath).filter(file => file.endsWith('.js'));

  for (const file of slashCommandFiles) {
    const filePath = path.join(slashCommandsPath, file);
    const command = require(filePath);
    
    if ('data' in command && 'execute' in command) {
      client.slashCommands.set(command.data.name, command);
      console.log(`Perintah slash ${command.data.name} telah dimuat`);
    } else {
      console.log(`Perintah slash di ${filePath} tidak memiliki properti 'data' atau 'execute' yang diperlukan`);
    }
  }
}

// Event handler ketika bot siap
client.once(Events.ClientReady, () => {
  console.log(`Logged in as ${client.user.tag}`);
  console.log(`Support untuk perintah legacy (${prefix}): ${client.commands.size} perintah`);
  console.log(`Support untuk perintah slash (/): ${client.slashCommands.size} perintah`);
});

// Mengirim pesan 'sedang mengetik' ke channel untuk efek alami
async function sendTypingIndicator(channel) {
  try {
    await channel.sendTyping();
  } catch (error) {
    console.error('Error sending typing indicator:', error);
  }
}

// Fungsi untuk mengirim respons AI di channel auto-respond (style natural chat)
async function sendNaturalAIResponse(message, messageContent) {
  try {
    const channelId = message.channelId;
    const userId = message.author.id;
    
    // Simpan konteks percakapan terakhir
    if (!userContexts.has(userId)) {
      userContexts.set(userId, {
        lastMessageTime: Date.now(),
        messageCount: 0
      });
    } else {
      const context = userContexts.get(userId);
      context.lastMessageTime = Date.now();
      context.messageCount += 1;
      userContexts.set(userId, context);
    }
    
    // Cek apakah channel sedang dalam status loading
    if (loadingStatus.get(channelId)) {
      return; // Abaikan jika sedang loading
    }
    
    // Set channel ke status loading
    loadingStatus.set(channelId, true);
    
    // Kirim indikator mengetik selama AI berpikir
    const typingInterval = setInterval(() => {
      sendTypingIndicator(message.channel);
    }, 5000); // Refresh typing indicator setiap 5 detik
    
    // Dapatkan karakter default
    const character = getCharacter();
    
    // Periksa jika pengguna hanya mengetik kata-kata trigger untuk ringkasan memori
    if (messageContent.toLowerCase() === 'ingatan' || 
        messageContent.toLowerCase() === 'memori' || 
        messageContent.toLowerCase() === 'riwayat' ||
        messageContent.toLowerCase() === 'ingat aku') {
      clearInterval(typingInterval);
      
      // Coba dapatkan narasi yang ada atau buat yang baru
      let narrative = getUserNarrativeSummary(userId);
      
      // Jika tidak ada narasi, coba buat narasi baru
      if (!narrative) {
        await message.reply('Sedang membuat narasi dari percakapan kita...');
        narrative = await generateNarrativeFromHistory(userId, character.name);
      }
      
      // Jika masih tidak ada narasi, tampilkan ringkasan statistik sebagai fallback
      if (!narrative) {
        const summary = getUserHistorySummary(userId);
        
        if (typeof summary === 'string') {
          await message.reply(summary);
        } else {
          // Format ringkasan memori sebagai fallback
          const memoryReply = `**Ringkasan Percakapan Kita**\n\n` +
            `Total pesan: ${summary.totalMessages}\n` +
            `Pesan kamu: ${summary.userMessages}\n` +
            `Pesan saya: ${summary.botMessages}\n` +
            `Pertama kali bicara: ${summary.firstMessageDate}\n` +
            `Terakhir bicara: ${summary.lastMessageDate}\n` +
            `Durasi percakapan: ${summary.durationDays} hari\n\n` +
            `Belum ada cukup percakapan untuk membuat narasi yang baik. Mari mengobrol lebih banyak! 😊`;
          
          await message.reply(memoryReply);
        }
      } else {
        // Kirim narasi dalam format embed yang menarik
        // Potong narasi jika terlalu panjang untuk embed Discord (max 4096 karakter)
        const maxDescriptionLength = 4000;
        let trimmedNarrative = narrative;
        
        if (narrative.length > maxDescriptionLength) {
          trimmedNarrative = narrative.substring(0, maxDescriptionLength) + '... *(terpotong karena terlalu panjang)*';
        }
        
        const narrativeEmbed = new EmbedBuilder()
          .setColor('#0099ff')
          .setTitle('Ingatan Percakapan Kita')
          .setDescription(trimmedNarrative)
          .setTimestamp()
          .setFooter({ 
            text: 'Narasi berdasarkan percakapan kita',
            iconURL: message.client.user.displayAvatarURL()
          });
        
        await message.reply({ embeds: [narrativeEmbed] });
      }
      
      // Set channel ke status tidak loading
      loadingStatus.set(channelId, false);
      return;
    }
    
    try {
      // Dapatkan respons dari AI dengan menggunakan histori percakapan
      const response = await getAIResponse(userId, messageContent);
      
      // Hentikan mengetik
      clearInterval(typingInterval);
      
      // Cek panjang respons dan potong jika terlalu panjang (batas Discord 2000 karakter)
      const maxMessageLength = 1900; // Simpan margin untuk reply context
      let formattedResponse = response;
      
      // Jika respons terlalu panjang, potong dan tambahkan notifikasi pemotongan
      if (response.length > maxMessageLength) {
        formattedResponse = response.substring(0, maxMessageLength) + '\n\n... *(respons terpotong karena terlalu panjang)*';
      }
      
      // Kirim respons langsung (tanpa embed) untuk mirip chat biasa
      await message.reply(formattedResponse);
    } catch (error) {
      // Hentikan mengetik
      clearInterval(typingInterval);
      
      console.error('Error responding to message:', error);
      
      // Pesan error yang lebih informatif berdasarkan tipe errornya
      let errorMessage = 'Maaf, terjadi kesalahan saat berkomunikasi dengan AI.';
      
      if (error.message.includes('rate limited') || error.message.includes('coba lagi dalam')) {
        errorMessage = error.message;
      } else if (error.message.includes('quota') || error.message.includes('429')) {
        errorMessage = 'Maaf, kuota API Gemini sudah tercapai. Bot akan otomatis mencoba model alternatif atau silakan coba lagi nanti.';
      } else if (error.message.includes('Tidak bisa terhubung ke Gemini API')) {
        errorMessage = 'Saat ini semua model AI sedang tidak tersedia. Silakan coba lagi dalam beberapa menit.';
      } else if (error.message.includes('Must be 2000 or fewer in length') || error.message.includes('50035')) {
        errorMessage = 'Respons terlalu panjang. Coba kirim pesan yang lebih singkat atau batasi konteks percakapan.';
      }
      
      await message.reply(errorMessage);
    } finally {
      // Set channel ke status tidak loading
      loadingStatus.set(channelId, false);
    }
  } catch (error) {
    console.error('Error in natural response:', error);
    loadingStatus.set(message.channelId, false);
  }
}

// Fungsi untuk mengirim respons AI dengan embed
async function sendEmbedAIResponse(message, messageContent) {
  try {
    // Tampilkan loading status
    const loadingMessage = await message.reply('Sedang berpikir...');
    
    // Dapatkan karakter default
    const character = getCharacter();
    
    // Dapatkan respons dari AI
    const response = await getAIResponse(message.author.id, messageContent);
    
    // Buat embed untuk respons
    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setAuthor({
        name: character.name,
        iconURL: message.client.user.displayAvatarURL()
      })
      .setDescription(response)
      .setFooter({
        text: `Diminta oleh ${message.author.tag}`,
        iconURL: message.author.displayAvatarURL()
      })
      .setTimestamp();
    
    // Edit pesan loading dengan respons
    await loadingMessage.edit({ content: null, embeds: [embed] });
  } catch (error) {
    console.error('Error responding to message:', error);
    
    // Pesan error yang lebih informatif
    let errorMessage = 'Maaf, terjadi kesalahan saat berkomunikasi dengan AI.';
    
    if (error.message.includes('rate limited') || error.message.includes('coba lagi dalam')) {
      errorMessage = error.message;
    } else if (error.message.includes('quota') || error.message.includes('429')) {
      errorMessage = 'Maaf, kuota API Gemini sudah tercapai. Bot akan otomatis mencoba model alternatif atau silakan coba lagi nanti.';
    } else if (error.message.includes('Tidak bisa terhubung ke Gemini API')) {
      errorMessage = 'Saat ini semua model AI sedang tidak tersedia. Silakan coba lagi dalam beberapa menit.';
    }
    
    await message.reply(errorMessage);
  }
}

// Event handler untuk pesan (perintah legacy)
client.on(Events.MessageCreate, async message => {
  // Abaikan pesan dari bot
  if (message.author.bot) return;

  // Periksa jika pesan berada di channel auto-respond
  if (autoRespondChannelId && message.channelId === autoRespondChannelId) {
    // Auto-respond tanpa prefix dengan style chat biasa
    await sendNaturalAIResponse(message, message.content);
    return;
  }
  
  // Periksa jika ada pembatasan channel
  const allowedChannels = process.env.ALLOWED_CHANNEL_IDS 
    ? process.env.ALLOWED_CHANNEL_IDS.split(',') 
    : null;
  
  if (allowedChannels && !allowedChannels.includes(message.channelId)) return;
  
  // Periksa jika pesan dimulai dengan prefix
  if (!message.content.startsWith(prefix)) return;
  
  // Parse argumen perintah
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();
  
  // Periksa jika perintah ada
  if (!client.commands.has(commandName)) return;
  
  const command = client.commands.get(commandName);
  
  try {
    // Eksekusi perintah
    await command.execute(message, args);
  } catch (error) {
    console.error(error);
    await message.reply('Terjadi kesalahan saat menjalankan perintah!');
  }
});

// Event handler untuk interaksi (perintah slash)
client.on(Events.InteractionCreate, async interaction => {
  // Abaikan interaksi selain command
  if (!interaction.isCommand()) return;
  
  // Dapatkan perintah slash dari koleksi
  const command = client.slashCommands.get(interaction.commandName);
  
  // Jika perintah tidak ditemukan, abaikan
  if (!command) return;
  
  try {
    // Eksekusi perintah
    await command.execute(interaction);
  } catch (error) {
    console.error(`Error executing slash command ${interaction.commandName}:`, error);
    
    // Respond dengan pesan error
    const errorContent = { 
      content: 'Terjadi kesalahan saat menjalankan perintah ini!', 
      ephemeral: true 
    };
    
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(errorContent);
    } else {
      await interaction.reply(errorContent);
    }
  }
});

// Login dengan token
client.login(process.env.DISCORD_TOKEN); 