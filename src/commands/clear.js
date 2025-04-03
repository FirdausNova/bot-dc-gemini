// Perintah untuk membersihkan histori percakapan dengan AI
const { clearUserHistory } = require('../utils/gemini');

module.exports = {
  name: 'clear',
  description: 'Membersihkan histori percakapan dengan AI',
  async execute(message, args) {
    try {
      // Bersihkan histori percakapan user
      clearUserHistory(message.author.id);
      
      await message.reply('Histori percakapan Anda dengan AI telah dihapus.');
    } catch (error) {
      console.error('Error in clear command:', error);
      await message.reply('Maaf, terjadi kesalahan saat membersihkan histori percakapan.');
    }
  }
}; 