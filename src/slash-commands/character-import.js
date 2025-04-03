// Perintah slash untuk mengimpor karakter dari file
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { importCharacterFromFile } = require('../config/characters');
const fs = require('fs');
const path = require('path');
const { AttachmentBuilder } = require('discord.js');

module.exports = {
  // Definisi perintah
  data: new SlashCommandBuilder()
    .setName('import')
    .setDescription('Mengimpor karakter dari file JSON')
    .addAttachmentOption(option => 
      option.setName('file')
        .setDescription('File JSON karakter untuk diimpor')
        .setRequired(true)),
    
  // Fungsi eksekusi saat perintah dipanggil
  async execute(interaction) {
    await interaction.deferReply();
    
    try {
      // Dapatkan file dari opsi
      const file = interaction.options.getAttachment('file');
      
      // Validasi tipe file (harus JSON)
      if (!file.name.endsWith('.json')) {
        return interaction.editReply('File harus berformat JSON (.json)');
      }
      
      // Buat direktori temp jika belum ada
      const tempDir = path.join(__dirname, '../../temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      // Path ke file temp
      const filePath = path.join(tempDir, file.name);
      
      // Unduh file
      const response = await fetch(file.url);
      const fileData = await response.arrayBuffer();
      fs.writeFileSync(filePath, Buffer.from(fileData));
      
      // Impor karakter dari file
      const character = await importCharacterFromFile(filePath);
      
      // Hapus file temporary
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error('Error deleting temporary file:', err);
      }
      
      // Buat embed untuk respons sukses
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
            value: character.description.length > 100 
              ? character.description.substring(0, 97) + '...' 
              : character.description
          }
        ])
        .setTimestamp()
        .setFooter({
          text: 'Gunakan /character info untuk melihat detail lengkap',
          iconURL: interaction.client.user.displayAvatarURL()
        });
      
      // Kirim respons sukses
      return interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error importing character:', error);
      return interaction.editReply(`Error: ${error.message}`);
    }
  }
}; 