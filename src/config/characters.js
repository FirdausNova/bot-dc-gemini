// Modul untuk mengelola karakter AI
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Path ke file penyimpanan karakter
const CHARACTERS_FILE = path.join(__dirname, '../data/characters.json');
const CHARACTERS_DIR = path.join(__dirname, '../data/characters');

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

// Pastikan direktori characters ada
if (!fs.existsSync(CHARACTERS_DIR)) {
  fs.mkdirSync(CHARACTERS_DIR, { recursive: true });
}

/**
 * Ensure character subdirectory exists
 * @param {string} characterName - Character name
 * @returns {string} Path to character directory
 */
function ensureCharacterDirectory(characterName) {
  if (!characterName) return null;
  
  const safeName = characterName.toLowerCase().replace(/\s+/g, '_');
  const characterPath = path.join(CHARACTERS_DIR, safeName);
  
  if (!fs.existsSync(characterPath)) {
    fs.mkdirSync(characterPath, { recursive: true });
  }
  
  return characterPath;
}

/**
 * Ensure characters.json file exists
 */
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

/**
 * Get character config from individual file
 * @param {string} characterName - Character name 
 * @returns {object|null} Character config or null if not found
 */
function getCharacterFromFile(characterName) {
  try {
    if (!characterName) return null;
    
    const safeName = characterName.toLowerCase().replace(/\s+/g, '_');
    const characterPath = path.join(CHARACTERS_DIR, safeName);
    const configPath = path.join(characterPath, 'config.json');
    
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf8');
      const character = JSON.parse(data);
      
      // Ensure all required properties exist
      ensureRequiredProperties(character);
      
      return character;
    }
    
    return null;
  } catch (error) {
    console.error(`Error reading character file for ${characterName}:`, error);
    return null;
  }
}

/**
 * Save character config to individual file
 * @param {string} characterName - Character name
 * @param {object} character - Character data
 * @returns {boolean} Success status
 */
function saveCharacterToFile(characterName, character) {
  try {
    if (!characterName || !character) return false;
    
    const characterPath = ensureCharacterDirectory(characterName);
    const configPath = path.join(characterPath, 'config.json');
    
    // Ensure all required properties exist
    ensureRequiredProperties(character);
    
    fs.writeFileSync(configPath, JSON.stringify(character, null, 2));
    return true;
  } catch (error) {
    console.error(`Error saving character file for ${characterName}:`, error);
    return false;
  }
}

/**
 * Ensure all required properties exist on character object
 * @param {object} character - Character data
 */
function ensureRequiredProperties(character) {
  const requiredProperties = [
    'appearance', 'initialMessage', 'personality', 'background',
    'relationships', 'quirks', 'likes', 'dislikes', 'goals', 'expressionPatterns'
  ];
  
  requiredProperties.forEach(prop => {
    if (!character.hasOwnProperty(prop)) {
      if (prop === 'expressionPatterns') {
        character[prop] = {};
      } else {
        character[prop] = '';
      }
    }
  });
}

/**
 * Get all characters (combines central file and individual files)
 * @returns {object} Characters data
 */
function getAllCharacters() {
  ensureCharactersFile();
  
  try {
    const data = fs.readFileSync(CHARACTERS_FILE, 'utf8');
    const characters = JSON.parse(data);
    
    // Ensure default character has all required properties
    ensureRequiredProperties(characters.default);
    
    // Check for individual character files
    if (fs.existsSync(CHARACTERS_DIR)) {
      const characterDirs = fs.readdirSync(CHARACTERS_DIR);
      
      characterDirs.forEach(dir => {
        const configPath = path.join(CHARACTERS_DIR, dir, 'config.json');
        
        if (fs.existsSync(configPath)) {
          try {
            const characterData = fs.readFileSync(configPath, 'utf8');
            const character = JSON.parse(characterData);
            
            // Use folder structure to determine character name
            const charName = character.name.toLowerCase();
            
            // Only add if not already in characters.json
            if (!characters.characters[charName]) {
              characters.characters[charName] = character;
            }
          } catch (err) {
            console.error(`Error reading character file ${configPath}:`, err);
          }
        }
      });
    }
    
    // Make sure all characters in the main file have required properties
    Object.keys(characters.characters).forEach(key => {
      ensureRequiredProperties(characters.characters[key]);
    });
    
    return characters;
  } catch (error) {
    console.error('Error reading characters file:', error);
    return { default: defaultCharacterObj, characters: {} };
  }
}

/**
 * Get a specific character
 * @param {string} name - Character name
 * @returns {object} Character data
 */
function getCharacter(name) {
  const charactersData = getAllCharacters();
  
  if (!name) {
    return charactersData.default;
  }
  
  const searchName = name.toLowerCase();
  
  // First check for individual file
  const fileCharacter = getCharacterFromFile(searchName);
  if (fileCharacter) {
    return fileCharacter;
  }
  
  // Fallback to characters.json
  return charactersData.characters[searchName] || charactersData.default;
}

/**
 * Add or update a character
 * @param {string} name - Character name
 * @param {string} type - Character type
 * @param {string} description - Character description
 * @param {string} appearance - Character appearance
 * @param {string} initialMessage - Character initial message
 * @param {object} additionalProps - Additional character properties
 * @returns {object} Character data
 */
function setCharacter(name, type, description, appearance = '', initialMessage = '', additionalProps = {}) {
  if (!name) {
    throw new Error('Character name is required');
  }
  
  const character = {
    name,
    type: type || 'custom',
    description: description || `Custom character ${name}`,
    appearance: appearance || '',
    initialMessage: initialMessage || 'Hello! I am ready to assist you.',
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
    // Add to characters.json
    const charactersData = getAllCharacters();
    const searchName = name.toLowerCase();
    
    charactersData.characters[searchName] = character;
    
    fs.writeFileSync(CHARACTERS_FILE, JSON.stringify(charactersData, null, 2));
    
    // Also save as individual file
    saveCharacterToFile(name, character);
    
    return character;
  } catch (error) {
    console.error('Error writing character:', error);
    throw error;
  }
}

/**
 * Set default character
 * @param {string} name - Character name
 * @returns {object} Default character data
 */
function setDefaultCharacter(name) {
  const charactersData = getAllCharacters();
  const searchName = name.toLowerCase();
  
  // First check individual files
  const fileCharacter = getCharacterFromFile(searchName);
  
  if (fileCharacter) {
    charactersData.default = fileCharacter;
  } else if (charactersData.characters[searchName]) {
    charactersData.default = charactersData.characters[searchName];
  } else {
    throw new Error(`Character "${name}" not found`);
  }
  
  fs.writeFileSync(CHARACTERS_FILE, JSON.stringify(charactersData, null, 2));
  return charactersData.default;
}

/**
 * Delete a character
 * @param {string} name - Character name
 * @returns {boolean} Success status
 */
function deleteCharacter(name) {
  const searchName = name.toLowerCase();
  const charactersData = getAllCharacters();
  
  // Check if character exists in characters.json
  const characterExists = !!charactersData.characters[searchName];
  
  if (!characterExists) {
    // Check if character exists as individual file
    const safeName = searchName.replace(/\s+/g, '_');
    const characterPath = path.join(CHARACTERS_DIR, safeName);
    const configPath = path.join(characterPath, 'config.json');
    
    if (!fs.existsSync(configPath)) {
      throw new Error(`Character "${name}" not found`);
    }
    
    // Delete character directory
    try {
      fs.rmSync(characterPath, { recursive: true, force: true });
      return true;
    } catch (err) {
      console.error(`Error deleting character directory ${characterPath}:`, err);
      return false;
    }
  }
  
  // If character is the default, set default to another character
  if (charactersData.default.name.toLowerCase() === searchName) {
    const availableCharacters = Object.keys(charactersData.characters).filter(key => key !== searchName);
    
    if (availableCharacters.length > 0) {
      charactersData.default = charactersData.characters[availableCharacters[0]];
    } else {
      charactersData.default = defaultCharacterObj;
    }
  }
  
  // Remove from characters.json
  delete charactersData.characters[searchName];
  fs.writeFileSync(CHARACTERS_FILE, JSON.stringify(charactersData, null, 2));
  
  // Also delete individual file if it exists
  const safeName = searchName.replace(/\s+/g, '_');
  const characterPath = path.join(CHARACTERS_DIR, safeName);
  
  if (fs.existsSync(characterPath)) {
    try {
      fs.rmSync(characterPath, { recursive: true, force: true });
    } catch (err) {
      console.error(`Error deleting character directory ${characterPath}:`, err);
    }
  }
  
  return true;
}

/**
 * Update character attributes
 * @param {string} name - Character name
 * @param {object} attributes - Character attributes to update
 * @returns {object} Updated character
 */
function updateCharacterAttributes(name, attributes = {}) {
  const character = getCharacter(name);
  
  if (!character || character.name.toLowerCase() !== name.toLowerCase()) {
    throw new Error(`Character "${name}" not found`);
  }
  
  // Apply updates
  const updatedCharacter = { ...character };
  Object.keys(attributes).forEach(key => {
    updatedCharacter[key] = attributes[key];
  });
  
  // Save to characters.json
  const charactersData = getAllCharacters();
  const searchName = name.toLowerCase();
  
  charactersData.characters[searchName] = updatedCharacter;
  
  // If this is the default character, update it too
  if (charactersData.default.name.toLowerCase() === searchName) {
    charactersData.default = updatedCharacter;
  }
  
  fs.writeFileSync(CHARACTERS_FILE, JSON.stringify(charactersData, null, 2));
  
  // Also update individual file
  saveCharacterToFile(name, updatedCharacter);
  
  return updatedCharacter;
}

/**
 * Export character to file
 * @param {string} name - Character name
 * @returns {string} Path to exported file
 */
function exportCharacterToFile(name) {
  const character = getCharacter(name);
  
  if (!character || character.name.toLowerCase() !== name.toLowerCase()) {
    throw new Error(`Character "${name}" not found`);
  }
  
  const tempFilePath = path.join(TEMP_DIR, `${character.name.toLowerCase().replace(/\s+/g, '_')}_config.json`);
  
  // Write character to file
  fs.writeFileSync(tempFilePath, JSON.stringify(character, null, 2));
  
  return tempFilePath;
}

/**
 * Import character from file
 * @param {string} filePath - Path to character file
 * @returns {object} Imported character
 */
function importCharacterFromFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error('Character file not found');
  }
  
  // Read and parse character file
  const fileContent = fs.readFileSync(filePath, 'utf8');
  let character;
  
  try {
    character = JSON.parse(fileContent);
  } catch (error) {
    throw new Error('Invalid character file format');
  }
  
  // Validate required fields
  if (!character.name) {
    throw new Error('Character file missing required field: name');
  }
  
  if (!character.type) {
    character.type = 'custom';
  }
  
  if (!character.description) {
    character.description = `Imported character ${character.name}`;
  }
  
  // Ensure all required properties
  ensureRequiredProperties(character);
  
  // Save to characters.json and individual file
  const charactersData = getAllCharacters();
  const searchName = character.name.toLowerCase();
  
  charactersData.characters[searchName] = character;
  fs.writeFileSync(CHARACTERS_FILE, JSON.stringify(charactersData, null, 2));
  
  saveCharacterToFile(character.name, character);
  
  return character;
}

module.exports = {
  getAllCharacters,
  getCharacter,
  setCharacter,
  setDefaultCharacter,
  deleteCharacter,
  updateCharacterAttributes,
  exportCharacterToFile,
  importCharacterFromFile,
  ensureCharacterDirectory
}; 