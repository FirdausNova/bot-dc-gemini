// Perintah help untuk menampilkan bantuan penggunaan bot
const { EmbedBuilder } = require('discord.js');
require('dotenv').config();

module.exports = {
  name: 'help',
  description: 'Menampilkan bantuan penggunaan bot',
  async execute(message, args) {
    try {
      const prefix = process.env.BOT_PREFIX || '!';
      const autoRespondChannelId = process.env.AUTO_RESPOND_CHANNEL_ID;
      
      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('Bot Discord AI - Bantuan')
        .setDescription(`Berikut adalah daftar perintah yang tersedia.\nPrefix perintah: \`${prefix}\``)
        .addFields(
          {
            name: `${prefix}chat <pesan>`,
            value: 'Berbicara dengan AI menggunakan karakter default'
          },
          {
            name: `${prefix}charchat <nama_karakter> <pesan>`,
            value: 'Berbicara dengan AI menggunakan karakter tertentu'
          },
          {
            name: `${prefix}character list`,
            value: 'Menampilkan daftar karakter yang tersedia'
          },
          {
            name: `${prefix}character add <nama> <tipe> <deskripsi>`,
            value: 'Menambahkan karakter baru'
          },
          {
            name: `${prefix}character set <nama>`,
            value: 'Mengatur karakter default'
          },
          {
            name: `${prefix}character delete <nama>`,
            value: 'Menghapus karakter'
          },
          {
            name: `${prefix}character info [nama]`,
            value: 'Menampilkan informasi karakter (jika nama tidak disebutkan, akan menampilkan karakter default)'
          },
          {
            name: `${prefix}setchannel <add/remove> [channel_id]`,
            value: 'Mengatur channel khusus untuk auto-respond (Admin only)'
          },
          {
            name: `${prefix}clear`,
            value: 'Membersihkan histori percakapan dengan AI'
          },
          {
            name: `${prefix}help`,
            value: 'Menampilkan bantuan penggunaan bot'
          }
        )
        .setFooter({
          text: `Discord AI Bot | Gemini API`,
          iconURL: message.client.user.displayAvatarURL()
        })
        .setTimestamp();
      
      // Tambahkan informasi channel auto-respond jika ada
      if (autoRespondChannelId) {
        embed.addFields({
          name: '📣 Auto-Respond Channel',
          value: `Bot akan merespon semua pesan di channel <#${autoRespondChannelId}> tanpa perlu menggunakan prefix perintah.`
        });
      }
      
      await message.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error in help command:', error);
      await message.reply('Maaf, terjadi kesalahan saat menampilkan bantuan.');
    }
  }
}; 