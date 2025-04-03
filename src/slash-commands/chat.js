// Perintah slash untuk chat dengan AI
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getAIResponse, getUserHistorySummary, getUserNarrativeSummary, generateNarrativeFromHistory } = require('../utils/gemini');
const { getCharacter } = require('../config/characters');

module.exports = {
  // Definisi perintah dan opsi
  data: new SlashCommandBuilder()
    .setName('chat')
    .setDescription('Berbicara dengan AI menggunakan karakter default')
    .addStringOption(option => 
      option.setName('pesan')
        .setDescription('Pesan yang ingin disampaikan ke AI')
        .setRequired(true)),
  
  // Fungsi eksekusi saat perintah dipanggil
  async execute(interaction) {
    try {
      // Ambil pesan dari opsi
      const messageContent = interaction.options.getString('pesan');
      const userId = interaction.user.id;
      
      // Periksa jika pengguna meminta ringkasan memori
      if (messageContent.toLowerCase() === 'memori' || 
          messageContent.toLowerCase() === 'ingatan' || 
          messageContent.toLowerCase() === 'riwayat' ||
          messageContent.toLowerCase() === 'ingat aku') {
        
        await interaction.deferReply();
        
        // Coba dapatkan narasi yang ada atau buat yang baru
        let narrative = getUserNarrativeSummary(userId);
        
        // Jika tidak ada narasi, coba buat narasi baru
        if (!narrative) {
          await interaction.editReply('Sedang membuat narasi dari percakapan kita...');
          narrative = await generateNarrativeFromHistory(userId, getCharacter().name);
        }
        
        // Jika masih tidak ada narasi, tampilkan ringkasan statistik sebagai fallback
        if (!narrative) {
          const summary = getUserHistorySummary(userId);
          
          if (typeof summary === 'string') {
            await interaction.editReply(summary);
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
            
            await interaction.editReply(memoryReply);
          }
        } else {
          // Kirim narasi dalam format embed yang menarik
          const narrativeEmbed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('Ingatan Percakapan Kita')
            .setDescription(narrative)
            .setTimestamp()
            .setFooter({ 
              text: 'Narasi berdasarkan percakapan kita',
              iconURL: interaction.client.user.displayAvatarURL()
            });
          
          await interaction.editReply({ embeds: [narrativeEmbed] });
        }
        
        return;
      }
      
      // Beri tahu user bahwa bot sedang berpikir
      await interaction.deferReply();
      
      // Dapatkan karakter default
      const character = getCharacter();
      
      // Dapatkan respons dari AI
      const aiResponse = await getAIResponse(userId, messageContent);
      
      // Periksa jika respons adalah multipart
      if (aiResponse.multipart) {
        console.log(`Mengirim multipart response (${aiResponse.parts.length} bagian) untuk slash command`);
        
        // Kirim bagian pertama dalam bentuk embed
        const embed = new EmbedBuilder()
          .setColor('#0099ff')
          .setAuthor({
            name: character.name,
            iconURL: interaction.client.user.displayAvatarURL()
          })
          .setDescription(aiResponse.parts[0])
          .setFooter({
            text: `Diminta oleh ${interaction.user.tag} (Bagian 1/${aiResponse.parts.length})`,
            iconURL: interaction.user.displayAvatarURL()
          })
          .setTimestamp();
        
        // Kirim bagian pertama sebagai respons awal
        await interaction.editReply({ embeds: [embed] });
        
        // Kirim bagian lainnya sebagai respons terpisah
        for (let i = 1; i < aiResponse.parts.length; i++) {
          // Tampilkan "bot sedang mengetik" 
          await interaction.channel.sendTyping();
          
          // Buat embed untuk bagian berikutnya
          const partEmbed = new EmbedBuilder()
            .setColor('#0099ff')
            .setAuthor({
              name: character.name,
              iconURL: interaction.client.user.displayAvatarURL()
            })
            .setDescription(aiResponse.parts[i])
            .setFooter({
              text: `Diminta oleh ${interaction.user.tag} (Bagian ${i+1}/${aiResponse.parts.length})`,
              iconURL: interaction.user.displayAvatarURL()
            })
            .setTimestamp();
          
          // Kirim sebagai respons terpisah
          await interaction.followUp({ embeds: [partEmbed] });
          
          // Delay kecil untuk terlihat lebih natural
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } else {
        // Respons tunggal (non-multipart)
        const formattedResponse = aiResponse.text;
        
        // Buat embed untuk respons
        const embed = new EmbedBuilder()
          .setColor('#0099ff')
          .setAuthor({
            name: character.name,
            iconURL: interaction.client.user.displayAvatarURL()
          })
          .setDescription(formattedResponse)
          .setFooter({
            text: `Diminta oleh ${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL()
          })
          .setTimestamp();
        
        // Kirim respons embed
        await interaction.editReply({ embeds: [embed] });
      }
      
    } catch (error) {
      console.error('Error responding to chat command:', error);
      
      // Cek apakah interaksi sudah direply
      const reply = error.message.includes('Unknown interaction') ? interaction.followUp : interaction.editReply;
      
      // Pesan error yang lebih informatif
      let errorMessage = 'Maaf, terjadi kesalahan saat berkomunikasi dengan AI.';
      
      if (error.message.includes('rate limited') || error.message.includes('coba lagi dalam')) {
        errorMessage = error.message;
      } else if (error.message.includes('quota') || error.message.includes('429')) {
        errorMessage = 'Maaf, kuota API Gemini sudah tercapai. Bot akan otomatis mencoba model alternatif atau silakan coba lagi nanti.';
      } else if (error.message.includes('Tidak bisa terhubung ke Gemini API')) {
        errorMessage = 'Saat ini semua model AI sedang tidak tersedia. Silakan coba lagi dalam beberapa menit.';
      }
      
      // Handle jika interaksi sudah expired
      try {
        await reply({ content: errorMessage, ephemeral: true });
      } catch (e) {
        console.error('Error replying to interaction:', e);
      }
    }
  },
}; 