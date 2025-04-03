// Script untuk mendaftarkan slash commands ke Discord API
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Token Bot Discord dari environment variables
const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID; // ID aplikasi Discord

// Array untuk menyimpan data perintah
const commands = [];
// Path ke folder perintah slash
const slashCommandsPath = path.join(__dirname, 'slash-commands');

// Baca semua file dalam direktori slash-commands
const commandFiles = fs.readdirSync(slashCommandsPath).filter(file => file.endsWith('.js'));

// Ambil data perintah dari setiap file
for (const file of commandFiles) {
  const filePath = path.join(slashCommandsPath, file);
  const command = require(filePath);
  
  // Periksa apakah memiliki properti data dan execute
  if ('data' in command && 'execute' in command) {
    commands.push(command.data.toJSON());
    console.log(`Perintah slash ${command.data.name} telah dimuat`);
  } else {
    console.log(`[WARNING] Perintah di ${filePath} tidak memiliki properti 'data' atau 'execute' yang diperlukan`);
  }
}

// Instance REST untuk komunikasi dengan Discord API
const rest = new REST().setToken(token);

// Fungsi untuk mendaftarkan perintah
(async () => {
  try {
    console.log(`Mulai mendaftarkan ${commands.length} perintah slash...`);
    
    // Metode REST untuk mendaftarkan perintah secara global
    const data = await rest.put(
      Routes.applicationCommands(clientId),
      { body: commands }
    );
    
    console.log(`Berhasil mendaftarkan ${data.length} perintah slash!`);
  } catch (error) {
    console.error('Terjadi kesalahan saat mendaftarkan perintah slash:', error);
  }
})(); 