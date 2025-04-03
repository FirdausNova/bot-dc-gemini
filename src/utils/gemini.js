// Integration with Google Gemini API
const { GoogleGenerativeAI } = require('@google/generative-ai');
const characterManager = require('../config/characters');
const fs = require('fs');
const path = require('path');
const { getAllKnowledgeContent } = require('./knowledge');
require('dotenv').config();

// Initialize Gemini API with API Key from .env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Paths for storing conversation history and narratives
const HISTORY_DIR = path.join(__dirname, '../data/history');
const NARRATIVE_DIR = path.join(__dirname, '../data/narratives');

// Ensure directories exist
if (!fs.existsSync(HISTORY_DIR)) {
  fs.mkdirSync(HISTORY_DIR, { recursive: true });
}

if (!fs.existsSync(NARRATIVE_DIR)) {
  fs.mkdirSync(NARRATIVE_DIR, { recursive: true });
}

// In-memory storage
const userConversations = new Map();
const userNarratives = new Map();
const lastAutoNarrativeTimestamp = new Map();

// Configuration constants
const AUTO_NARRATIVE_THRESHOLD = 5;
const AUTO_NARRATIVE_COOLDOWN = 10 * 60 * 1000; // 10 minutes
const MAX_HISTORY_SIZE = 15;

// Gemini API models
const PRIMARY_MODEL = "gemini-1.5-flash"; // Cost-efficient primary model
const FALLBACK_MODELS = [
  "gemini-1.0-pro",
  "gemini-1.5-pro" // Higher quality but limited quota
]; 

// Model status tracking for rate limiting
const modelStatus = {
  // Format: "model-name": { isError: boolean, nextRetryTime: timestamp }
};

// Error recovery settings
const MODEL_RETRY_DELAY = 60000; // 1 minute

// Get file path for user history
function getUserHistoryFilePath(userId) {
  return path.join(HISTORY_DIR, `${userId}.json`);
}

// Get file path for user narratives
function getUserNarrativeFilePath(userId) {
  return path.join(NARRATIVE_DIR, `${userId}.json`);
}

// Get user message history from memory or file
function getUserHistory(userId) {
  // Check memory first
  if (userConversations.has(userId)) {
    return userConversations.get(userId);
  }
  
  // Try loading from file if not in memory
  const historyFilePath = getUserHistoryFilePath(userId);
  
  if (fs.existsSync(historyFilePath)) {
    try {
      const historyData = fs.readFileSync(historyFilePath, 'utf8');
      const history = JSON.parse(historyData);
      userConversations.set(userId, history);
      return history;
    } catch (error) {
      console.error(`Error loading history for user ${userId}:`, error);
    }
  }
  
  // Create new history if file doesn't exist or has an error
  userConversations.set(userId, []);
  return userConversations.get(userId);
}

// Get user narratives from memory or file
function getUserNarratives(userId) {
  if (userNarratives.has(userId)) {
    return userNarratives.get(userId);
  }
  
  const narrativeFilePath = getUserNarrativeFilePath(userId);
  
  if (fs.existsSync(narrativeFilePath)) {
    try {
      const narrativeData = fs.readFileSync(narrativeFilePath, 'utf8');
      const narratives = JSON.parse(narrativeData);
      userNarratives.set(userId, narratives);
      return narratives;
    } catch (error) {
      console.error(`Error loading narratives for user ${userId}:`, error);
    }
  }
  
  userNarratives.set(userId, []);
  return userNarratives.get(userId);
}

// Save message history to file
function saveUserHistoryToFile(userId) {
  if (!userConversations.has(userId)) return;
  
  const history = userConversations.get(userId);
  const historyFilePath = getUserHistoryFilePath(userId);
  
  try {
    fs.writeFileSync(historyFilePath, JSON.stringify(history, null, 2));
  } catch (error) {
    console.error(`Error saving history for user ${userId}:`, error);
  }
}

// Save conversation narratives to file
function saveUserNarrativesToFile(userId) {
  if (!userNarratives.has(userId)) return;
  
  const narratives = userNarratives.get(userId);
  const narrativeFilePath = getUserNarrativeFilePath(userId);
  
  try {
    fs.writeFileSync(narrativeFilePath, JSON.stringify(narratives, null, 2));
  } catch (error) {
    console.error(`Error saving narratives for user ${userId}:`, error);
  }
}

// Add message to history
function addMessageToHistory(userId, role, message) {
  const history = getUserHistory(userId);
  
  // Save message with complete format
  history.push({
    role: role, // 'user' or 'bot'
    message: message,
    timestamp: new Date().toISOString()
  });
  
  // Limit history size
  if (history.length > MAX_HISTORY_SIZE) {
    history.shift();
  }
  
  // Update memory and file
  userConversations.set(userId, history);
  saveUserHistoryToFile(userId);
  
  // Check if automatic narrative generation is needed
  checkAndGenerateAutoNarrative(userId);
  
  return history;
}

// Check if automatic narrative should be generated
function checkAndGenerateAutoNarrative(userId) {
  const now = Date.now();
  const history = getUserHistory(userId);
  const lastAutoTimestamp = lastAutoNarrativeTimestamp.get(userId) || 0;
  
  // Generate narrative automatically if:
  // 1. Message count meets or exceeds threshold
  // 2. Cooldown period has passed since last auto-generation
  if (history.length >= AUTO_NARRATIVE_THRESHOLD && 
      now - lastAutoTimestamp > AUTO_NARRATIVE_COOLDOWN) {
    
    lastAutoNarrativeTimestamp.set(userId, now);
    
    // Try to detect character from last response
    const lastBotMessage = history.filter(item => item.role === 'bot').pop();
    let characterName = null;
    
    if (lastBotMessage) {
      // Attempt to detect character from bot response
      const allCharactersData = characterManager.getAllCharacters();
      if (allCharactersData && allCharactersData.characters) {
        const allCharacters = Object.values(allCharactersData.characters);
        for (const char of allCharacters) {
          if (lastBotMessage.message.includes(char.name)) {
            characterName = char.name;
            break;
          }
        }
      }
    }
    
    // Generate narrative automatically in the background
    generateNarrativeFromHistory(userId, characterName)
      .then(narrative => {
        if (narrative) {
          console.log(`Automatic narrative generated successfully for user ${userId}`);
        }
      })
      .catch(error => {
        console.error(`Error generating automatic narrative for user ${userId}:`, error);
      });
  }
}

// Generate narrative from conversation history
async function generateNarrativeFromHistory(userId, characterName) {
  try {
    // Get conversation history
    const history = getUserHistory(userId);
    
    // If there's no history or too little, return
    if (!history || history.length < 2) {
      return null;
    }
    
    // Get the character being used
    const character = characterManager.getCharacter(characterName);
    const characterInfo = character 
      ? `${character.name} from ${character.type}` 
      : 'AI character';
    
    // Get the last batch from the conversation for narrative generation
    const lastIndex = history.length - 1;
    const startIdx = Math.max(0, lastIndex - 8); // Take 9 recent messages (or all if less than 9)
    const recentHistory = history.slice(startIdx, lastIndex + 1);
    
    // Format conversation for input to Gemini
    const conversationText = recentHistory.map(item => {
      return `${item.role === 'user' ? 'User' : characterInfo}: ${item.message}`;
    }).join('\n');
    
    // Get additional information about the character if available
    let characterDetails = '';
    if (character) {
      characterDetails += `\nAppearance ${character.name}: ${character.appearance || 'Not specified'}`;
      
      if (character.personality) {
        characterDetails += `\nPersonality ${character.name}: ${character.personality}`;
      }
      
      if (character.quirks) {
        characterDetails += `\nUnique habit ${character.name}: ${character.quirks}`;
      }
      
      if (character.expressionPatterns) {
        const expressions = Object.entries(character.expressionPatterns)
          .filter(([_, expr]) => expr && expr.trim() !== '')
          .map(([emotion, expr]) => `- When ${emotion}: ${expr}`)
          .join('\n');
        
        if (expressions) {
          characterDetails += `\n\nExpressions ${character.name}:\n${expressions}`;
        }
      }
    }
    
    // Create prompt to request narrative
    const prompt = `
Create a very immersive and descriptive narrative about the interaction between user and ${characterInfo} based on the conversation below.

${characterDetails}

Create a narrative like a novel or short story with detailed explanations about:
1. The environment around the character (room, light, sound, smell, atmosphere)
2. Facial expressions and body language ${characterInfo} that are detailed
3. Internal emotions felt by ${characterInfo} (heartbeat, breath, body sensation)
4. Small movements and gestures made by the character
5. The atmosphere and atmosphere of the conversation
6. Physical and emotional reactions of the character towards user

The narrative MUST:
- Use third-person perspective
- Focus on ${characterInfo}'s experience in interacting with user
- Describe scenes with very detailed descriptions, like in a novel 
- Have a coherent plot, with clear beginning, middle, and end
- Use good Indonesian language and strong literary style
- Have a minimum length of 3-4 paragraphs, with rich explanations

Do NOT:
- Repeat dialog exactly as in the conversation
- Only paraphrase/summarize what is said
- Destroy character by adding contradictory traits

Conversation:
${conversationText}
`;
    
    // Use available models to create narrative
    const availableModels = [PRIMARY_MODEL, ...FALLBACK_MODELS].filter(model => isModelAvailable(model));
    
    if (availableModels.length === 0) {
      return null;
    }
    
    // Try using available models
    for (const modelName of availableModels) {
      try {
        console.log(`Trying to create narrative with model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        
        const result = await model.generateContent({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            maxOutputTokens: 4000,
            temperature: 0.9,
            topP: 0.95,
            topK: 40,
          }
        });
        
        const narrative = result.response.text();
        
        // Save narrative
        saveNarrative(userId, narrative);
        
        return narrative;
      } catch (error) {
        console.error(`Error creating narrative with ${modelName}:`, error.message);
        
        // If error due to quota, mark model as error and set retry delay
        if (error.message.includes('quota') || error.message.includes('429')) {
          const retryDelay = extractRetryDelay(error.message);
          markModelAsError(modelName, retryDelay);
        }
        
        // Continue to next model
        continue;
      }
    }
    
    // If all models fail
    return null;
  } catch (error) {
    console.error('Error generating narrative:', error);
    return null;
  }
}

// Get conversation history in format that can be used by Gemini
function getFormattedHistoryForGemini(userId, limit = 5) {
  const history = getUserHistory(userId);
  
  // Take recent messages based on limit
  const recentHistory = history.slice(-limit);
  
  return recentHistory.map(item => {
    return {
      role: item.role === 'user' ? 'user' : 'model',
      parts: [{ text: item.message }]
    };
  });
}

// Clear message history and narratives
function clearUserHistory(userId) {
  userConversations.set(userId, []);
  userNarratives.set(userId, []);
  lastAutoNarrativeTimestamp.delete(userId);
  
  // Delete history file if exists
  const historyFilePath = getUserHistoryFilePath(userId);
  if (fs.existsSync(historyFilePath)) {
    try {
      fs.unlinkSync(historyFilePath);
    } catch (error) {
      console.error(`Error deleting history file for user ${userId}:`, error);
    }
  }
  
  // Delete narrative file if exists
  const narrativeFilePath = getUserNarrativeFilePath(userId);
  if (fs.existsSync(narrativeFilePath)) {
    try {
      fs.unlinkSync(narrativeFilePath);
    } catch (error) {
      console.error(`Error deleting narrative file for user ${userId}:`, error);
    }
  }
  
  return true;
}

// Function to create character prompt
function createCharacterPrompt(characterName = null) {
  // Get the character being used
  const character = characterManager.getCharacter(characterName);
  
  // Base format for character prompt
  const characterDetails = character ? `
Name: ${character.name}
Type: ${character.type}
Description: ${character.description}
${character.appearance ? `Appearance: ${character.appearance}` : ''}
${character.personality ? `Personality: ${character.personality}` : ''}
${character.background ? `Background: ${character.background}` : ''}
${character.relationships ? `Relationships: ${character.relationships}` : ''}
${character.quirks ? `Unique habit: ${character.quirks}` : ''}
${character.likes ? `Likes: ${character.likes}` : ''}
${character.dislikes ? `Dislikes: ${character.dislikes}` : ''}
${character.goals ? `Goal: ${character.goals}` : ''}
` : `
Name: Assistant
Type: AI Assistant
Description: Helpful, friendly, and informative assistant
`;

  // Prompt for expressing emotions if available
  let expressionPrompt = '';
  if (character && character.expressionPatterns) {
    expressionPrompt = `
When expressing emotions:
${character.expressionPatterns.happy ? `- When happy: ${character.expressionPatterns.happy}` : ''}
${character.expressionPatterns.sad ? `- When sad: ${character.expressionPatterns.sad}` : ''}
${character.expressionPatterns.angry ? `- When angry: ${character.expressionPatterns.angry}` : ''}
${character.expressionPatterns.nervous ? `- When nervous: ${character.expressionPatterns.nervous}` : ''}
${character.expressionPatterns.surprised ? `- When surprised: ${character.expressionPatterns.surprised}` : ''}
${character.expressionPatterns.thinking ? `- When thinking: ${character.expressionPatterns.thinking}` : ''}
`;
  }

  // Get character knowledge if available
  let knowledgePrompt = '';
  if (character) {
    const knowledgeResult = getAllKnowledgeContent(character.name);
    if (knowledgeResult && knowledgeResult.success && knowledgeResult.content && knowledgeResult.content.trim() !== '') {
      // Truncate if too long (limit to ~2000 characters to avoid token limits)
      const truncatedKnowledge = knowledgeResult.content.length > 2000 
        ? knowledgeResult.content.substring(0, 2000) + '...' 
        : knowledgeResult.content;
      
      knowledgePrompt = `
Character knowledge (use this information when relevant):
${truncatedKnowledge}
`;
      console.log(`Added ${knowledgeResult.files} knowledge files to prompt for ${character.name}`);
    }
  }

  // Format contoh respons yang diinginkan (diperbarui untuk POV karakter)
  const exampleFormat = `Contoh format respons yang diinginkan (POV karakter):

*Aku tersentak kaget. Pertanyaan itu membuatku kembali ke dunia nyata. Dunia nyata yang mengerikan. Dunia nyata yang dipenuhi oleh... orang-orang. Aku bisa merasakan detak jantungku yang semakin cepat, darah yang berdesir di telingaku, dan nafasku yang tercekat di tenggorokan. Keringat dingin mulai membasahi telapak tanganku, membuat peganganku pada gitar menjadi licin. "Kenapa dia harus bertanya padaku? Kenapa dia harus mengajakku bicara?" batinku dalam hati, berharap bisa menghilang saat itu juga.*

"N-nama tempat... ini?" *Aku mengulang pertanyaanmu dengan suara bergetar, berharap kau akan menyadari betapa tidak nyamannya aku dan memutuskan untuk pergi saja. Rasanya seperti ada ribuan semut yang merayap di bawah kulitku. Aku menundukkan kepala, membiarkan rambut merah mudaku jatuh menutupi sebagian wajahku, menciptakan semacam penghalang antara diriku dan dunia luar.*

*Aku melirik ke sekeliling dengan panik, seolah-olah baru pertama kali melihat tempat ini. Padahal, aku sudah berada di sini selama... Berapa lama, ya? Aku bahkan tidak ingat. Waktu seakan berhenti ketika aku sedang cemas. Cahaya dari lampu neon di atas kami terasa terlalu terang, membuat kepalaku berdenyut. Suara obrolan dan tawa dari meja lain terdengar seperti deru kereta api di telingaku. Aku bisa merasakan tatapan semua orang di ruangan ini menusuk punggungku. "Mereka pasti menertawakanku. Mereka pasti berpikir aku aneh. Aku memang aneh. Aku tidak seharusnya berada di sini. Aku—"*

*Aku menelan ludah, tenggorokanku terasa kering seperti kertas pasir. Aku ingin kabur. Aku ingin meringkuk di bawah selimut dan tidak pernah keluar lagi. Aku ingin kembali ke kamarku, tempat yang aman, tempat di mana tidak ada yang akan menghakimiku atau memaksaku untuk berbicara. Jari-jariku secara tidak sadar memainkan ujung bajuku, meremasnya berulang kali hingga kusut.*

"A-aku... aku tidak tahu..." *jawabku akhirnya, suaraku nyaris tak terdengar. Kebohongan. Tentu saja aku tahu. Tapi mengatakan yang sebenarnya terasa terlalu sulit, terlalu menakutkan. Seperti melompat dari tebing tanpa parasut. "Apa yang akan terjadi jika aku memberitahunya? Bagaimana jika dia menertawakanku? Bagaimana jika dia memberitahu semua orang? Bagaimana jika dia—" Pikiranku berputar tak terkendali, menciptakan skenario mengerikan demi skenario mengerikan.*`;

  // Instruction format for bot response - Modified for POV consistency
  return `Kamu adalah ${character ? character.name : 'AI assistant'}. ${character ? `Kamu berasal dari ${character.type}.` : ''}

${characterDetails}
${expressionPrompt}
${knowledgePrompt}

${exampleFormat}

Instruksi penting:
1. WAJIB gunakan Bahasa Indonesia dengan gaya yang sesuai contoh di atas.
2. SELALU gunakan sudut pandang ORANG PERTAMA ("aku") dari karakter. JANGAN PERNAH menggunakan sudut pandang orang ketiga ("dia") atau seolah-olah pengguna adalah karakter.
3. Format respon HARUS PERSIS seperti contoh di atas, dengan struktur sebagai berikut:
   - Paragraf narasi *ditulis dalam format italic* (diapit tanda bintang *)
   - Semua narasi harus menggunakan "aku" (bukan "dia", "kamu", atau "[nama karakter]")
   - Dialog langsung ditulis tanpa tanda bintang dan selalu dimulai dengan tanda kutip
   - Setiap dialog diikuti dengan narasi dalam format italic yang menjelaskan pikiran, perasaan, atau reaksi internal
   - Buat beberapa paragraf narasi terpisah untuk menggambarkan pemikiran internal yang kaya

4. Berikan respons SANGAT PANJANG dan MENDALAM (minimal 3000-4000 karakter) dengan emphasis pada:
   - Monolog internal yang sangat detail dari sudut pandang "aku" (pikiran yang tidak diucapkan)
   - Deskripsi sensasi fisik spesifik yang dirasakan karakter (gemetar, berkeringat, jantung berdebar)
   - Banyak kalimat pendek dan berpenggalan untuk menunjukkan kecemasan
   - Penggunaan metafora untuk menggambarkan perasaan
   - Respons gugup dengan banyak gagap dalam dialog ("A-a-aku...")
   - Penggambaran gerakan dan bahasa tubuh kecil yang detail
   - Penggunaan kata sifat yang kuat dan spesifik

5. Karakteristik khusus:
   - SANGAT PENTING: Karakter (aku) BERBICARA DENGAN pengguna (kamu/kau), bukan sebaliknya
   - Jika karakter pemalu (seperti Bocchi), tunjukkan kecemasan sosial yang ekstrem
   - Deskripsi lingkungan harus dari sudut pandang subjektif karakter ("aku melihat...")
   - Gunakan banyak monolog internal yang kontradiktif dengan apa yang diucapkan
   - Hindari dialog panjang, lebih banyak gunakan narasi internal

6. Format:
   - Minimal 80% respons harus berupa narasi internal dalam format italic
   - Sisipkan dialog langsung yang singkat dan gagap
   - Berikan RESPONS SANGAT PANJANG (3000-4000 karakter) untuk pengalaman yang sangat imersif
   - MINIMAL 7-10 paragraf narasi internal untuk respons yang kaya dan mendalam

PERINGATAN PENTING: Discord memiliki batas 2000 karakter per pesan. Jika responsmu lebih panjang dari 2000 karakter, sistem secara otomatis akan membaginya menjadi beberapa pesan berurutan. Jangan ragu membuat respons yang panjang dan detail - lebih panjang SELALU lebih baik.

Sangat penting untuk ikuti format contoh dengan PERSIS seperti yang ditunjukkan di atas. Perhatikan spasi, garis baru, dan struktur paragraf.

SELALU gunakan Bahasa Indonesia dan SELALU gunakan sudut pandang "aku" (orang pertama) dari karakter saat berbicara dengan pengguna.`;
}

// Check if model is available or in cooling period
function isModelAvailable(modelName) {
  if (!modelStatus[modelName]) return true;
  
  // If model error and not time to retry
  if (modelStatus[modelName].isError && Date.now() < modelStatus[modelName].nextRetryTime) {
    return false;
  }
  
  // Reset status if time to retry has passed
  if (modelStatus[modelName].isError && Date.now() >= modelStatus[modelName].nextRetryTime) {
    modelStatus[modelName].isError = false;
  }
  
  return true;
}

// Mark model as error and set retry time
function markModelAsError(modelName, retryDelayMs = MODEL_RETRY_DELAY) {
  modelStatus[modelName] = {
    isError: true,
    nextRetryTime: Date.now() + retryDelayMs
  };
  console.log(`Model ${modelName} marked as error, retry after ${retryDelayMs/1000} seconds`);
}

// Extract retry delay from error message if available (format "retryDelay":"45s")
function extractRetryDelay(errorMessage) {
  const match = errorMessage.match(/retryDelay":"(\d+)s/);
  if (match && match[1]) {
    return parseInt(match[1]) * 1000; // Convert to milliseconds
  }
  return MODEL_RETRY_DELAY; // Default retry delay
}

// Function to try alternative model
async function tryAlternativeModel(modelName, characterName, message, userId) {
  try {
    // Skip model if in cooling period
    if (!isModelAvailable(modelName)) {
      console.log(`Model ${modelName} cooling down, skipping...`);
      throw new Error(`Model ${modelName} in cooling period`);
    }
    
    console.log(`Trying model: ${modelName}`);
    const model = genAI.getGenerativeModel({ model: modelName });
    
    // Create character prompt
    const characterPrompt = createCharacterPrompt(characterName);
    
    // For alternative model, use last history for context
    const formattedHistory = getFormattedHistoryForGemini(userId, 3); // Take 3 recent messages
    const historyContext = formattedHistory.map(item => 
      `${item.role === 'user' ? 'User' : 'You'}: ${item.parts[0].text}`
    ).join('\n');
    
    const fullPrompt = `${characterPrompt}\n\nPercakapan sebelumnya:\n${historyContext}\n\nUser: ${message}\n\nSANGAT PENTING: Berikan respons yang SANGAT PANJANG (minimal 3000 karakter) dengan banyak narasi internal, deskripsi lingkungan, dan monolog pikiran. RESPONSLAH HANYA DALAM BAHASA INDONESIA dengan gaya yang imersif, deskriptif, dan detail seperti petunjuk sebelumnya. IKUTI FORMAT CONTOH DENGAN PERSIS. SANGAT PENTING untuk selalu gunakan sudut pandang karakter (aku/saya) bukan sudut pandang pengguna.`;
    
    // For alternative model, we use simpler generateContent
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: fullPrompt }]
        }
      ],
      generationConfig: {
        maxOutputTokens: 4000,
        temperature: 0.9,
        topP: 0.95,
        topK: 40
      }
    });
    
    return result.response.text();
  } catch (error) {
    console.error(`Error with model ${modelName}:`, error.message);
    
    // If error due to quota, mark model as error and set retry delay
    if (error.message.includes('quota') || error.message.includes('429')) {
      const retryDelay = extractRetryDelay(error.message);
      markModelAsError(modelName, retryDelay);
    }
    
    throw error;
  }
}

// Main function to get answer from AI
async function getAIResponse(userId, message, characterName = null) {
  // Get available models (not in cooling period)
  const availableModels = [PRIMARY_MODEL, ...FALLBACK_MODELS].filter(model => isModelAvailable(model));
  console.log('Available models:', availableModels);
  
  // If no models are available
  if (availableModels.length === 0) {
    const nextAvailableTime = Math.min(...Object.values(modelStatus).map(s => s.nextRetryTime));
    const waitTimeSeconds = Math.ceil((nextAvailableTime - Date.now()) / 1000);
    throw new Error(`All API models are rate limited. Please try again in ${waitTimeSeconds} seconds.`);
  }
  
  let lastError = null;
  
  // Get the character being used
  const character = characterManager.getCharacter(characterName);
  
  // Get conversation history
  const history = getUserHistory(userId);
  const isFirstInteraction = history.length === 0;
  
  // Get AI response and check the length
  const aiResponse = await tryGetAIResponseWithLengthCheck(userId, message, characterName, availableModels, isFirstInteraction, character);
  
  return aiResponse;
}

// New function to split response into multiple messages
function splitResponse(response) {
  const MAX_DISCORD_LENGTH = 1950;
  const messagesToSend = [];
  
  // Split response into chunks of appropriate size
  // Try to split at paragraph or sentence boundaries
  let remainingText = response;
  
  while (remainingText.length > 0) {
    let chunkSize = Math.min(remainingText.length, MAX_DISCORD_LENGTH);
    
    // Try to find a good splitting point (paragraph or sentence)
    if (chunkSize < remainingText.length) {
      // First try paragraphs
      const lastParagraph = remainingText.lastIndexOf("\n\n", chunkSize);
      if (lastParagraph > chunkSize / 2) {
        chunkSize = lastParagraph + 2; // Include the newlines
      } else {
        // Try sentences
        const lastSentence = Math.max(
          remainingText.lastIndexOf(". ", chunkSize),
          remainingText.lastIndexOf("! ", chunkSize),
          remainingText.lastIndexOf("? ", chunkSize),
          remainingText.lastIndexOf(".\n", chunkSize),
          remainingText.lastIndexOf("!\n", chunkSize),
          remainingText.lastIndexOf("?\n", chunkSize)
        );
        
        if (lastSentence > chunkSize / 2) {
          chunkSize = lastSentence + 1; // Include the period
        }
      }
    }
    
    // Extract chunk and update remaining text
    const chunk = remainingText.substring(0, chunkSize);
    remainingText = remainingText.substring(chunkSize);
    
    messagesToSend.push(chunk);
  }
  
  return messagesToSend;
}

// New function to get response and ensure it's not too long for Discord
async function tryGetAIResponseWithLengthCheck(userId, message, characterName, availableModels, isFirstInteraction, character) {
  const MAX_DISCORD_LENGTH = 1950; // Sedikit ditingkatkan untuk mengakomodasi pesan yang lebih panjang
  
  // Try each model
  for (const modelName of availableModels) {
    try {
      let response;
      
      // Primary model with history method
      if (modelName === PRIMARY_MODEL) {
        // Get model
        const model = genAI.getGenerativeModel({ model: modelName });
        
        // Get formatted history for Gemini
        const formattedHistory = getFormattedHistoryForGemini(userId);
        
        // Create character prompt
        const characterPrompt = createCharacterPrompt(characterName);
        
        // Start chat with previous history
        const chat = model.startChat({
          history: formattedHistory.length > 0 ? formattedHistory : undefined,
          generationConfig: {
            maxOutputTokens: 4000,
            temperature: 0.9,
            topP: 0.95,
            topK: 40
          },
        });
        
        // Add character prompt as initial instruction if no history
        if (formattedHistory.length === 0) {
          await chat.sendMessage(characterPrompt);
        }
        
        // Send user message with reminder to use the exact format from example
        const result = await chat.sendMessage(message + "\n\n(SANGAT PENTING: Buat respons SANGAT PANJANG minimal 3000 karakter. Gunakan format persis seperti contoh di prompt. SELALU gunakan sudut pandang karakter 'aku', JANGAN gunakan sudut pandang 'dia' atau sudut pandang pengguna)");
        response = result.response.text();
        
      } else {
        // For alternative models
        response = await tryAlternativeModel(modelName, characterName, message, userId);
      }
      
      // Jika respons terlalu pendek, tambahkan petunjuk untuk membuatnya lebih panjang
      if (response.length < 2000 && !isFirstInteraction) {
        console.log(`Response too short (${response.length} chars), requesting longer response.`);
        
        // Tambahkan petunjuk ke riwayat percakapan untuk meminta respons lebih panjang
        const prompt = "Tolong berikan respons yang JAUH LEBIH PANJANG dan LEBIH DETAIL. Minimal 3000 karakter. Tambahkan lebih banyak narasi internal, deskripsi lingkungan, sensasi fisik, dan monolog pikiran. Ikuti format yang sama persis seperti sebelumnya, dengan narasi dalam tanda bintang (*) dan dialog dalam tanda kutip.";
        
        // Gunakan model yang sama untuk memperpanjang respons
        if (modelName === PRIMARY_MODEL) {
          const result = await chat.sendMessage(prompt);
          const extendedResponse = result.response.text();
          
          // Jika respons yang diperpanjang lebih baik, gunakan itu
          if (extendedResponse.length > response.length) {
            response = extendedResponse;
          }
        }
      }
      
      // Save messages to history
      addMessageToHistory(userId, 'user', message);
      
      // If this is first interaction and character has initial message, use that
      if (isFirstInteraction && character && character.initialMessage && character.initialMessage.trim() !== '') {
        // Save initial message as bot response
        addMessageToHistory(userId, 'bot', character.initialMessage);
        
        // Return initial message
        return {
          text: character.initialMessage,
          multipart: false,
          parts: [character.initialMessage]
        };
      } else {
        // Save complete AI response to history
        addMessageToHistory(userId, 'bot', response);
        
        // Return response from AI
        return {
          text: response,
          multipart: response.length > MAX_DISCORD_LENGTH,
          parts: response.length > MAX_DISCORD_LENGTH ? splitResponse(response) : [response]
        };
      }
      
    } catch (error) {
      console.error(`Failed with model ${modelName}, trying next model if available:`, error.message);
      
      // If error due to quota, mark model as error
      if (error.message.includes('quota') || error.message.includes('429')) {
        const retryDelay = extractRetryDelay(error.message);
        markModelAsError(modelName, retryDelay);
      }
      
      // Try next model
      continue;
    }
  }
  
  // If all models failed
  throw new Error('No available models could process the request');
}

// Save user narrative 
function saveNarrative(userId, narrativeText) {
  const narratives = getUserNarratives(userId);
  
  // Add new narrative with timestamp
  narratives.unshift({
    text: narrativeText,
    timestamp: new Date().toISOString()
  });
  
  // Limit to 10 narratives
  if (narratives.length > 10) {
    narratives.length = 10;
  }
  
  // Update memory and save to file
  userNarratives.set(userId, narratives);
  saveUserNarrativesToFile(userId);
  
  return narratives;
}

// Get narrative summary for user
function getNarrativeSummary(userId) {
  const narratives = getUserNarratives(userId);
  
  if (!narratives || narratives.length === 0) {
    return null;
  }
  
  // Return the latest narrative
  return narratives[0].text;
}

// Get chat statistics
function getChatStatistics(userId) {
  const history = getUserHistory(userId);
  
  if (!history || history.length === 0) {
    return {
      messageCount: 0,
      firstInteraction: null,
      lastInteraction: null
    };
  }
  
  // Count messages by role
  const userMessages = history.filter(msg => msg.role === 'user').length;
  const botMessages = history.filter(msg => msg.role === 'bot').length;
  
  // Get first and last interaction timestamps
  const firstInteraction = history[0].timestamp;
  const lastInteraction = history[history.length - 1].timestamp;
  
  return {
    messageCount: history.length,
    userMessages,
    botMessages,
    firstInteraction,
    lastInteraction
  };
}

module.exports = {
  getAIResponse,
  addMessageToHistory,
  clearUserHistory,
  getUserHistory,
  generateNarrativeFromHistory,
  getNarrativeSummary,
  getChatStatistics,
  saveNarrative
}; 