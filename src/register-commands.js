// Script untuk mendaftarkan perintah slash ke Discord API
require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

// Variabel untuk token bot dan aplikasi ID dari .env
const token = process.env.DISCORD_BOT_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;

// Array untuk menyimpan data perintah
const commands = [];

// Path ke folder perintah slash
const commandsPath = path.join(__dirname, 'slash-commands');

// Baca semua file perintah di direktori slash-commands
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

// Tambahkan data perintah ke array commands
for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	
	// Periksa apakah perintah memiliki properti data dan execute yang diperlukan
	if ('data' in command && 'execute' in command) {
		commands.push(command.data.toJSON());
		console.log(`[✓] Perintah slash ${command.data.name} berhasil dimuat`);
	} else {
		console.log(`[⚠] Perintah di ${filePath} tidak memiliki properti "data" atau "execute" yang diperlukan`);
	}
}

// Buat instance REST
const rest = new REST().setToken(token);

// Fungsi untuk mendaftarkan perintah
(async () => {
	try {
		console.log(`Memulai refresh ${commands.length} perintah aplikasi (/) ke Discord API...`);

		// Mendaftarkan perintah secara global (akan tersedia di semua server)
		const data = await rest.put(
			Routes.applicationCommands(clientId),
			{ body: commands },
		);

		console.log(`Berhasil me-refresh ${data.length} perintah aplikasi (/) ke Discord API.`);
	} catch (error) {
		console.error('Terjadi kesalahan saat mendaftarkan perintah:', error);
	}
})(); 