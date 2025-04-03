// Perintah untuk mengatur channel khusus untuk auto-respond
const fs = require('fs');
const path = require('path');
const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
require('dotenv').config();

module.exports = {
  name: 'setchannel',
  description: 'Mengatur channel khusus untuk auto-respond',
  async execute(message, args) {
    try {
      // Periksa izin admin
      if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return message.reply('Anda tidak memiliki izin untuk menggunakan perintah ini.');
      }
      
      if (args.length === 0) {
        return message.reply('Penggunaan: `!setchannel <add/remove> [channel_id]`\nJika channel_id tidak diisi, akan menggunakan channel saat ini.');
      }
      
      const action = args[0].toLowerCase();
      let channelId = args[1] || message.channel.id; // Gunakan channel saat ini jika tidak ada yang ditentukan
      
      // Path ke file .env
      const envPath = path.resolve(process.cwd(), '.env');
      
      // Baca file .env
      let envContent = fs.readFileSync(envPath, 'utf8');
      
      switch (action) {
        case 'add':
          // Periksa apakah channel ada
          const channel = message.guild.channels.cache.get(channelId);
          if (!channel) {
            return message.reply('Channel tidak ditemukan.');
          }
          
          // Update atau tambahkan variabel AUTO_RESPOND_CHANNEL_ID
          if (envContent.includes('AUTO_RESPOND_CHANNEL_ID=')) {
            envContent = envContent.replace(/AUTO_RESPOND_CHANNEL_ID=.*/g, `AUTO_RESPOND_CHANNEL_ID=${channelId}`);
          } else {
            envContent += `\nAUTO_RESPOND_CHANNEL_ID=${channelId}`;
          }
          
          // Simpan perubahan
          fs.writeFileSync(envPath, envContent);
          
          // Update variabel lingkungan
          process.env.AUTO_RESPOND_CHANNEL_ID = channelId;
          
          // Kirim notifikasi reguler
          await message.reply(`Channel <#${channelId}> telah diatur sebagai channel auto-respond.\nBot sekarang akan merespon secara otomatis semua pesan di channel ini tanpa perlu prefix perintah.`);
          
          // Kirim pesan perkenalan di channel yang diatur jika itu bukan channel saat ini
          if (channelId !== message.channelId) {
            const targetChannel = message.guild.channels.cache.get(channelId);
            await targetChannel.send('Halo! Saya telah diaktifkan di channel ini. Mulai sekarang, saya akan merespon setiap pesan yang kamu kirim tanpa perlu menggunakan perintah. Silakan langsung mengobrol dengan saya seperti chatting biasa! 😊');
          } else {
            // Jika channel saat ini, tambahkan pesan sambutan
            await message.channel.send('Halo! Saya telah diaktifkan di channel ini. Mulai sekarang, saya akan merespon setiap pesan yang kamu kirim tanpa perlu menggunakan perintah. Silakan langsung mengobrol dengan saya seperti chatting biasa! 😊');
          }
          
          return;
          
        case 'remove':
          // Hapus variabel AUTO_RESPOND_CHANNEL_ID
          if (envContent.includes('AUTO_RESPOND_CHANNEL_ID=')) {
            envContent = envContent.replace(/AUTO_RESPOND_CHANNEL_ID=.*/g, '# AUTO_RESPOND_CHANNEL_ID=');
          }
          
          // Simpan perubahan
          fs.writeFileSync(envPath, envContent);
          
          // Update variabel lingkungan
          delete process.env.AUTO_RESPOND_CHANNEL_ID;
          
          await message.reply('Fitur auto-respond telah dinonaktifkan. Bot tidak akan lagi merespon pesan secara otomatis di channel manapun.');
          
          return;
          
        default:
          return message.reply('Tindakan tidak valid. Gunakan `add` atau `remove`.');
      }
    } catch (error) {
      console.error('Error in setchannel command:', error);
      return message.reply('Terjadi kesalahan saat mengatur channel auto-respond.');
    }
  }
}; 