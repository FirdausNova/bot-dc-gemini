/**
 * Multi-language support module for Discord AI Bot
 * Provides translation and language switching functionality
 */

require('dotenv').config();

// Get language setting from .env file
const defaultLanguage = process.env.BOT_LANGUAGE || 'en';

// Translations object
const translations = {
  // English translations
  en: {
    // General messages
    general: {
      error: "Sorry, an error occurred.",
      notFound: "Not found.",
      success: "Success!",
      invalidCommand: "Invalid command."
    },
    
    // Chat related messages
    chat: {
      creatingNarrative: "Creating narrative from our conversation...",
      noNarrative: "Not enough conversation to create a good narrative yet. Let's chat more! 😊",
      conversationMemory: "Our Conversation Memory",
      narrativeBased: "Narrative based on our conversation",
      provideMsgPrompt: "Please provide a message for the AI to respond to.",
      characterNotFound: "Character not found. Use the `!character list` command to see available characters.",
      responseTruncated: "... *(response truncated because it was too long)*"
    },
    
    // Memory related
    memory: {
      conversationSummary: "Conversation Summary",
      totalMessages: "Total messages",
      yourMessages: "Your messages",
      myMessages: "My messages",
      firstTalked: "First talked",
      lastTalked: "Last talked",
      duration: "Conversation duration",
      days: "days",
      memoryCleared: "Memory cleared. I will not remember our previous conversation.",
      noMemory: "No memory saved to export.",
      memoryExport: "Here is the export from our conversation memory:",
      narrativeExport: "Here is the narrative from our conversation:"
    },

    // Character related
    character: {
      characterList: "AI Character List",
      defaultCharacter: "Default Character",
      noCharacters: "No characters available.",
      characterAdded: "New character has been added!",
      appearanceUpdated: "Appearance for character has been updated!",
      initialMessageUpdated: "Initial message for character has been updated!",
      characterExported: "Character configuration has been exported!",
      characterImported: "Character has been successfully imported!",
      defaultChanged: "Default character has been changed!",
      characterDeleted: "Character has been deleted!",
      templateList: "AI Character Template List",
      templatesDescription: "These templates can be used to quickly create new characters.",
      noTemplates: "No character templates available.",
      templateAdded: "Template has been created!",
      templateDeleted: "Template has been deleted!",
      blankTemplate: "Here is a blank template for creating a new character. You can edit this file as desired and then import it with the `!character import` command."
    },

    // Help related
    help: {
      title: "Discord AI Bot - Help",
      description: "Here are the available commands.\nCommand prefix:",
      autoRespondChannel: "Bot will respond to all messages in channel without needing command prefix."
    }
  },
  
  // Indonesian translations
  id: {
    // General messages
    general: {
      error: "Maaf, terjadi kesalahan.",
      notFound: "Tidak ditemukan.",
      success: "Berhasil!",
      invalidCommand: "Perintah tidak valid."
    },
    
    // Chat related messages
    chat: {
      creatingNarrative: "Sedang membuat narasi dari percakapan kita...",
      noNarrative: "Belum ada cukup percakapan untuk membuat narasi yang baik. Mari mengobrol lebih banyak! 😊",
      conversationMemory: "Ingatan Percakapan Kita",
      narrativeBased: "Narasi berdasarkan percakapan kita",
      provideMsgPrompt: "Silakan berikan pesan untuk direspon oleh AI.",
      characterNotFound: "Karakter tidak ditemukan. Gunakan perintah `!character list` untuk melihat karakter yang tersedia.",
      responseTruncated: "... *(respons terpotong karena terlalu panjang)*"
    },
    
    // Memory related
    memory: {
      conversationSummary: "Ringkasan Percakapan Kita",
      totalMessages: "Total pesan",
      yourMessages: "Pesan kamu",
      myMessages: "Pesan saya",
      firstTalked: "Pertama kali bicara",
      lastTalked: "Terakhir bicara",
      duration: "Durasi percakapan",
      days: "hari",
      memoryCleared: "Ingatan berhasil dihapus. Saya tidak akan mengingat percakapan kita sebelumnya.",
      noMemory: "Tidak ada ingatan yang tersimpan untuk diekspor.",
      memoryExport: "Berikut adalah ekspor dari ingatan percakapan kita:",
      narrativeExport: "Berikut adalah narasi dari percakapan kita:"
    },

    // Character related
    character: {
      characterList: "Daftar Karakter AI",
      defaultCharacter: "Karakter Default",
      noCharacters: "Tidak ada karakter yang tersedia.",
      characterAdded: "Karakter baru telah ditambahkan!",
      appearanceUpdated: "Penampilan untuk karakter telah diperbarui!",
      initialMessageUpdated: "Pesan awal untuk karakter telah diperbarui!",
      characterExported: "Konfigurasi karakter telah diekspor!",
      characterImported: "Karakter telah berhasil diimpor!",
      defaultChanged: "Karakter default telah diubah!",
      characterDeleted: "Karakter telah dihapus!",
      templateList: "Daftar Template Karakter AI",
      templatesDescription: "Template ini dapat digunakan untuk membuat karakter baru dengan cepat.",
      noTemplates: "Tidak ada template karakter yang tersedia.",
      templateAdded: "Template telah dibuat!",
      templateDeleted: "Template telah dihapus!",
      blankTemplate: "Berikut adalah template kosong untuk membuat karakter baru. Anda dapat mengedit file ini sesuai keinginan dan kemudian mengimpornya dengan perintah `!character import`."
    },

    // Help related
    help: {
      title: "Bot Discord AI - Bantuan",
      description: "Berikut adalah daftar perintah yang tersedia.\nPrefix perintah:",
      autoRespondChannel: "Bot akan merespon semua pesan di channel tanpa perlu menggunakan prefix perintah."
    }
  }
};

/**
 * Get current language setting
 * @returns {string} Current language code
 */
function getCurrentLanguage() {
  return process.env.BOT_LANGUAGE || defaultLanguage;
}

/**
 * Translate a message key
 * @param {string} key - The translation key in dot notation (e.g., "chat.creatingNarrative")
 * @param {string} [lang] - Optional language code override
 * @returns {string} The translated message
 */
function t(key, lang = null) {
  const currentLang = lang || getCurrentLanguage();
  const fallbackLang = 'en';
  
  // Split the key into parts (e.g., "chat.creatingNarrative" -> ["chat", "creatingNarrative"])
  const keyParts = key.split('.');
  
  // Try to get translation from specified language
  try {
    let translation = translations[currentLang];
    for (const part of keyParts) {
      translation = translation[part];
      if (!translation) break;
    }
    
    // If translation exists, return it
    if (translation) return translation;
    
    // Otherwise, try fallback language
    translation = translations[fallbackLang];
    for (const part of keyParts) {
      translation = translation[part];
      if (!translation) break;
    }
    
    // Return fallback or key if no translation found
    return translation || key;
  } catch (error) {
    console.error(`Translation error for key: ${key}`, error);
    return key;
  }
}

/**
 * Change the bot's language
 * @param {string} lang - Language code to change to
 * @returns {boolean} Success or failure
 */
function setLanguage(lang) {
  if (!translations[lang]) {
    return false;
  }
  
  // Update .env file
  try {
    const fs = require('fs');
    const path = require('path');
    const envPath = path.resolve(process.cwd(), '.env');
    
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    if (envContent.includes('BOT_LANGUAGE=')) {
      envContent = envContent.replace(/BOT_LANGUAGE=.*/g, `BOT_LANGUAGE=${lang}`);
    } else {
      envContent += `\nBOT_LANGUAGE=${lang}`;
    }
    
    fs.writeFileSync(envPath, envContent);
    
    // Update current environment variable
    process.env.BOT_LANGUAGE = lang;
    
    return true;
  } catch (error) {
    console.error('Error updating language setting:', error);
    return false;
  }
}

/**
 * Get list of supported languages
 * @returns {Object} Object with language codes as keys and language names as values
 */
function getSupportedLanguages() {
  return {
    'en': 'English',
    'id': 'Indonesian (Bahasa Indonesia)'
  };
}

module.exports = {
  t,
  getCurrentLanguage,
  setLanguage,
  getSupportedLanguages
}; 