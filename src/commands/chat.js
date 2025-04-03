// Perintah chat untuk berbicara dengan AI
const { 
  getAIResponse, 
  getUserHistorySummary, 
  getUserNarrativeSummary, 
  generateNarrativeFromHistory
} = require('../utils/gemini');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'chat',
  description: 'Berbicara dengan AI sesuai karakter yang dipilih',
  async execute(message, args) {
    try {
      // Dapatkan pesan dari user
      const query = args.join(' ');
      const userId = message.author.id;
      
      // Cek jika user ingin melihat ringkasan memori
      if (query.toLowerCase() === 'memori' || 
          query.toLowerCase() === 'ingatan' || 
          query.toLowerCase() === 'riwayat' ||
          query.toLowerCase() === 'ingat aku') {
        
        // Coba dapatkan narasi yang ada atau buat yang baru
        let narrative = getUserNarrativeSummary(userId);
        
        // Jika tidak ada narasi, coba buat narasi baru
        if (!narrative) {
          await message.reply('Sedang membuat narasi dari percakapan kita...');
          narrative = await generateNarrativeFromHistory(userId);
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
          const narrativeEmbed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('Ingatan Percakapan Kita')
            .setDescription(narrative)
            .setTimestamp()
            .setFooter({ 
              text: 'Narasi berdasarkan percakapan kita',
              iconURL: message.client.user.displayAvatarURL()
            });
          
          await message.reply({ embeds: [narrativeEmbed] });
        }
        
        return;
      }
      
      if (!query) {
        await message.reply('Silakan berikan pesan untuk direspon oleh AI.');
        return;
      }
      
      // Menampilkan indikator mengetik untuk efek natural
      await message.channel.sendTyping();
      
      // Dapatkan jawaban dari AI
      const response = await getAIResponse(userId, query);
      
      // Kirim respons langsung (tanpa embed) untuk mirip chat biasa
      await message.reply(response);
    } catch (error) {
      console.error('Error in chat command:', error);
      
      // Pesan error yang lebih informatif berdasarkan tipe errornya
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
}; 