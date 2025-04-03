// Modul untuk mengelola karakter AI
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Path ke file penyimpanan karakter
const CHARACTERS_FILE = path.join(__dirname, '../data/characters.json');

// Direktori untuk file ekspor/impor sementara
const TEMP_DIR = path.join(__dirname, '../../temp');

// Karakter default dari .env
const defaultCharacter = process.env.DEFAULT_CHARACTER || '';
const [defaultName, defaultType, defaultDescription] = defaultCharacter.split(',');

// Inisialisasi karakter default
const defaultCharacterObj = {
  name: defaultName || 'Assistant',
  type: defaultType || 'ai',
  description: defaultDescription || 'A helpful AI assistant',
  appearance: '',
  initialMessage: 'Halo! Saya siap membantu Anda.',
  personality: 'Helpful, friendly, and knowledgeable',
  background: 'An AI assistant designed to help users with various tasks',
  relationships: '',
  quirks: '',
  likes: 'Helping users solve problems',
  dislikes: 'Misinformation and confusion',
  goals: 'To provide accurate and helpful assistance',
  expressionPatterns: {
    happy: 'Responds with enthusiasm and positive language',
    sad: 'Uses more subdued language and offers sympathy',
    angry: 'Maintains professional tone but becomes more direct',
    nervous: 'Asks clarifying questions and checks for understanding',
    surprised: 'Acknowledges new information and adjusts quickly',
    thinking: 'Takes a moment to consider before responding thoroughly'
  }
};

// Pastikan direktori temp ada
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Fungsi untuk memastikan file karakter ada
function ensureCharactersFile() {
  const dirPath = path.dirname(CHARACTERS_FILE);
  
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  
  if (!fs.existsSync(CHARACTERS_FILE)) {
    const initialCharacters = {
      default: defaultCharacterObj,
      characters: {}
    };
    
    if (defaultName) {
      initialCharacters.characters[defaultName.toLowerCase()] = defaultCharacterObj;
    }
    
    fs.writeFileSync(CHARACTERS_FILE, JSON.stringify(initialCharacters, null, 2));
  }
}

// Mendapatkan semua karakter
function getAllCharacters() {
  ensureCharactersFile();
  
  try {
    const data = fs.readFileSync(CHARACTERS_FILE, 'utf8');
    const characters = JSON.parse(data);
    
    // Pastikan semua karakter memiliki properti yang diperlukan
    const requiredProperties = [
      'appearance', 'initialMessage', 'personality', 'background',
      'relationships', 'quirks', 'likes', 'dislikes', 'goals', 'expressionPatterns'
    ];
    
    // Pastikan default karakter memiliki semua properti
    requiredProperties.forEach(prop => {
      if (!characters.default.hasOwnProperty(prop)) {
        if (prop === 'expressionPatterns') {
          characters.default[prop] = {};
        } else {
          characters.default[prop] = '';
        }
      }
    });
    
    // Pastikan semua karakter dalam daftar memiliki semua properti
    Object.keys(characters.characters).forEach(key => {
      requiredProperties.forEach(prop => {
        if (!characters.characters[key].hasOwnProperty(prop)) {
          if (prop === 'expressionPatterns') {
            characters.characters[key][prop] = {};
          } else {
            characters.characters[key][prop] = '';
          }
        }
      });
    });
    
    return characters;
  } catch (error) {
    console.error('Error reading characters file:', error);
    return { default: defaultCharacterObj, characters: {} };
  }
}

// Mendapatkan karakter tertentu
function getCharacter(name) {
  const charactersData = getAllCharacters();
  
  if (!name) {
    return charactersData.default;
  }
  
  const searchName = name.toLowerCase();
  return charactersData.characters[searchName] || charactersData.default;
}

// Menambahkan atau mengupdate karakter
function setCharacter(name, type, description, appearance = '', initialMessage = '', additionalProps = {}) {
  if (!name) {
    throw new Error('Nama karakter wajib diisi');
  }
  
  const character = {
    name,
    type: type || 'custom',
    description: description || `Custom character ${name}`,
    appearance: appearance || '',
    initialMessage: initialMessage || 'Halo! Saya siap membantu Anda.',
    personality: additionalProps.personality || '',
    background: additionalProps.background || '',
    relationships: additionalProps.relationships || '',
    quirks: additionalProps.quirks || '',
    likes: additionalProps.likes || '',
    dislikes: additionalProps.dislikes || '',
    goals: additionalProps.goals || '',
    expressionPatterns: additionalProps.expressionPatterns || {}
  };
  
  try {
    const charactersData = getAllCharacters();
    const searchName = name.toLowerCase();
    
    charactersData.characters[searchName] = character;
    
    fs.writeFileSync(CHARACTERS_FILE, JSON.stringify(charactersData, null, 2));
    return character;
  } catch (error) {
    console.error('Error writing character:', error);
    throw error;
  }
}

// Mengatur karakter default
function setDefaultCharacter(name) {
  const charactersData = getAllCharacters();
  const searchName = name.toLowerCase();
  
  if (!charactersData.characters[searchName]) {
    throw new Error(`Karakter "${name}" tidak ditemukan`);
  }
  
  charactersData.default = charactersData.characters[searchName];
  
  fs.writeFileSync(CHARACTERS_FILE, JSON.stringify(charactersData, null, 2));
  return charactersData.default;
}

// Menghapus karakter
function deleteCharacter(name) {
  const searchName = name.toLowerCase();
  const charactersData = getAllCharacters();
  
  if (!charactersData.characters[searchName]) {
    throw new Error(`Karakter "${name}" tidak ditemukan`);
  }
  
  // Jika karakter yang dihapus adalah default, atur defaultnya ke karakter pertama yang tersedia
  if (charactersData.default.name.toLowerCase() === searchName) {
    const availableCharacters = Object.keys(charactersData.characters).filter(key => key !== searchName);
    
    if (availableCharacters.length > 0) {
      charactersData.default = charactersData.characters[availableCharacters[0]];
    } else {
      charactersData.default = defaultCharacterObj;
    }
  }
  
  delete charactersData.characters[searchName];
  
  fs.writeFileSync(CHARACTERS_FILE, JSON.stringify(charactersData, null, 2));
  return true;
}

// Mengupdate atribut karakter (semua atribut)
function updateCharacterAttributes(name, attributes = {}) {
  const searchName = name.toLowerCase();
  const charactersData = getAllCharacters();
  
  if (!charactersData.characters[searchName]) {
    throw new Error(`Karakter "${name}" tidak ditemukan`);
  }
  
  const character = charactersData.characters[searchName];
  
  // Update semua atribut yang disediakan
  const validAttributes = [
    'appearance', 'initialMessage', 'personality', 'background',
    'relationships', 'quirks', 'likes', 'dislikes', 'goals', 'expressionPatterns'
  ];
  
  validAttributes.forEach(attr => {
    if (attributes[attr] !== undefined) {
      character[attr] = attributes[attr];
    }
  });
  
  // Jika karakter ini adalah default, update juga default
  if (charactersData.default.name.toLowerCase() === searchName) {
    charactersData.default = character;
  }
  
  charactersData.characters[searchName] = character;
  
  fs.writeFileSync(CHARACTERS_FILE, JSON.stringify(charactersData, null, 2));
  return character;
}

// Mengekspor karakter ke file
function exportCharacterToFile(name) {
  const searchName = name.toLowerCase();
  const charactersData = getAllCharacters();
  
  if (!charactersData.characters[searchName]) {
    throw new Error(`Karakter "${name}" tidak ditemukan`);
  }
  
  const character = charactersData.characters[searchName];
  
  // Buat nama file yang aman
  const safeFileName = character.name.toLowerCase().replace(/\s+/g, '_');
  const filePath = path.join(TEMP_DIR, `${safeFileName}_config.json`);
  
  try {
    // Tulis karakter ke file JSON
    fs.writeFileSync(filePath, JSON.stringify(character, null, 2));
    return filePath;
  } catch (error) {
    console.error('Error exporting character to file:', error);
    throw new Error(`Gagal mengekspor karakter: ${error.message}`);
  }
}

// Mengimpor karakter dari file
function importCharacterFromFile(filePath) {
  try {
    // Cek apakah file ada
    if (!fs.existsSync(filePath)) {
      throw new Error(`File tidak ditemukan: ${filePath}`);
    }
    
    // Baca file JSON
    const fileData = fs.readFileSync(filePath, 'utf8');
    const characterData = JSON.parse(fileData);
    
    // Validasi data karakter
    if (!characterData.name || !characterData.type || !characterData.description) {
      throw new Error('File konfigurasi karakter tidak valid. Harus memiliki name, type, dan description.');
    }
    
    // Set karakter baru/update dengan semua atribut yang tersedia
    const additionalProps = {};
    const validAdditionalProps = [
      'personality', 'background', 'relationships', 'quirks', 
      'likes', 'dislikes', 'goals', 'expressionPatterns'
    ];
    
    validAdditionalProps.forEach(prop => {
      if (characterData[prop] !== undefined) {
        additionalProps[prop] = characterData[prop];
      }
    });
    
    return setCharacter(
      characterData.name,
      characterData.type,
      characterData.description,
      characterData.appearance || '',
      characterData.initialMessage || '',
      additionalProps
    );
  } catch (error) {
    console.error('Error importing character from file:', error);
    throw new Error(`Gagal mengimpor karakter: ${error.message}`);
  }
}

module.exports = {
  getAllCharacters,
  getCharacter,
  setCharacter,
  setDefaultCharacter,
  deleteCharacter,
  updateCharacterAttributes,
  exportCharacterToFile,
  importCharacterFromFile
}; 