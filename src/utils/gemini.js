// Integrasi dengan Google Gemini API
const { GoogleGenerativeAI } = require('@google/generative-ai');
const characterManager = require('../config/characters');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Inisialisasi Gemini API dengan API Key dari .env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Path untuk menyimpan histori percakapan
const HISTORY_DIR = path.join(__dirname, '../data/history');
const NARRATIVE_DIR = path.join(__dirname, '../data/narratives');

// Pastikan direktori untuk menyimpan histori dan narasi ada
if (!fs.existsSync(HISTORY_DIR)) {
  fs.mkdirSync(HISTORY_DIR, { recursive: true });
}

if (!fs.existsSync(NARRATIVE_DIR)) {
  fs.mkdirSync(NARRATIVE_DIR, { recursive: true });
}

// Menyimpan histori percakapan per user dalam memori
const userConversations = new Map();

// Menyimpan narasi untuk percakapan user
const userNarratives = new Map();

// Menyimpan data tentang kapan narasi terakhir dibuat otomatis
const lastAutoNarrativeTimestamp = new Map();

// Jumlah pesan yang diperlukan untuk membuat narasi otomatis
const AUTO_NARRATIVE_THRESHOLD = 5;

// Waktu minimum (dalam milidetik) antara pembuatan narasi otomatis
const AUTO_NARRATIVE_COOLDOWN = 10 * 60 * 1000; // 10 menit

// Ukuran histori maksimal per user
const MAX_HISTORY_SIZE = 15; // Menambah ukuran histori untuk konteks yang lebih baik

// Model Gemini yang akan digunakan - menggunakan beberapa model yang tersedia
// Mengubah model default menjadi gemini-1.5-flash untuk menghemat kuota
const PRIMARY_MODEL = "gemini-1.5-flash"; // Model utama yang hemat kuota
const FALLBACK_MODELS = [
  "gemini-1.0-pro",
  "gemini-1.5-pro" // Memindahkan model pro ke fallback terakhir karena kuota terbatas
]; 

// Status model - tracking model yang sedang error dan waktu retry
const modelStatus = {
  // Format: "model-name": { isError: boolean, nextRetryTime: timestamp }
};

// Waktu cooling period untuk model yang error (dalam milidetik)
const MODEL_RETRY_DELAY = 60000; // 1 menit

// Fungsi untuk mendapatkan path file histori per user
function getUserHistoryFilePath(userId) {
  return path.join(HISTORY_DIR, `${userId}.json`);
}

// Fungsi untuk mendapatkan path file narasi per user
function getUserNarrativeFilePath(userId) {
  return path.join(NARRATIVE_DIR, `${userId}.json`);
}

// Mendapatkan histori pesan user dari file atau memori
function getUserHistory(userId) {
  // Cek terlebih dahulu di memori
  if (userConversations.has(userId)) {
    return userConversations.get(userId);
  }
  
  // Jika tidak ada di memori, coba load dari file
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
  
  // Jika file tidak ada atau error, buat histori baru
  userConversations.set(userId, []);
  return userConversations.get(userId);
}

// Mendapatkan narasi percakapan user dari file atau memori
function getUserNarratives(userId) {
  // Cek terlebih dahulu di memori
  if (userNarratives.has(userId)) {
    return userNarratives.get(userId);
  }
  
  // Jika tidak ada di memori, coba load dari file
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
  
  // Jika file tidak ada atau error, buat narasi baru
  userNarratives.set(userId, []);
  return userNarratives.get(userId);
}

// Menyimpan histori pesan ke file
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

// Menyimpan narasi percakapan ke file
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

// Menyimpan pesan dalam histori
function addMessageToHistory(userId, role, message) {
  const history = getUserHistory(userId);
  
  // Simpan pesan dengan format yang lebih lengkap
  history.push({
    role: role, // 'user' atau 'bot'
    message: message,
    timestamp: new Date().toISOString()
  });
  
  // Batasi jumlah pesan dalam histori
  if (history.length > MAX_HISTORY_SIZE) {
    history.shift();
  }
  
  // Update memori dan file
  userConversations.set(userId, history);
  
  // Simpan ke file
  saveUserHistoryToFile(userId);
  
  // Cek apakah perlu membuat narasi otomatis
  checkAndGenerateAutoNarrative(userId);
  
  return history;
}

// Cek apakah perlu membuat narasi otomatis berdasarkan jumlah pesan
function checkAndGenerateAutoNarrative(userId) {
  const now = Date.now();
  const history = getUserHistory(userId);
  const lastAutoTimestamp = lastAutoNarrativeTimestamp.get(userId) || 0;
  
  // Hanya buat narasi otomatis jika:
  // 1. Jumlah pesan lebih dari atau sama dengan threshold
  // 2. Sudah melewati cooldown sejak narasi otomatis terakhir
  if (history.length >= AUTO_NARRATIVE_THRESHOLD && 
      now - lastAutoTimestamp > AUTO_NARRATIVE_COOLDOWN) {
    
    // Update timestamp narasi otomatis terakhir
    lastAutoNarrativeTimestamp.set(userId, now);
    
    // Dapatkan karakternya dari pesan terakhir jika ada
    const lastBotMessage = history.filter(item => item.role === 'bot').pop();
    let characterName = null;
    
    if (lastBotMessage) {
      // Coba deteksi karakter dari respons bot
      const allCharacters = characterManager.getAllCharacters();
      if (allCharacters) {
        for (const char of allCharacters) {
          if (lastBotMessage.message.includes(char.name)) {
            characterName = char.name;
            break;
          }
        }
      }
    }
    
    // Buat narasi secara otomatis di background
    generateNarrativeFromHistory(userId, characterName)
      .then(narrative => {
        if (narrative) {
          console.log(`Narasi otomatis berhasil dibuat untuk user ${userId}`);
        }
      })
      .catch(error => {
        console.error(`Error membuat narasi otomatis untuk user ${userId}:`, error);
      });
  }
}

// Membuat narasi dari histori percakapan
async function generateNarrativeFromHistory(userId, characterName) {
  try {
    // Dapatkan histori percakapan
    const history = getUserHistory(userId);
    
    // Jika tidak ada histori atau terlalu sedikit, return
    if (!history || history.length < 2) {
      return null;
    }
    
    // Dapatkan karakter yang digunakan
    const character = characterManager.getCharacter(characterName);
    const characterInfo = character 
      ? `${character.name} dari ${character.type}` 
      : 'karakter AI';
    
    // Mendapatkan batch terakhir dari percakapan untuk dibuat narasi
    const lastIndex = history.length - 1;
    const startIdx = Math.max(0, lastIndex - 8); // Ambil 9 pesan terakhir (atau semua jika kurang dari 9)
    const recentHistory = history.slice(startIdx, lastIndex + 1);
    
    // Format percakapan untuk input ke Gemini
    const conversationText = recentHistory.map(item => {
      return `${item.role === 'user' ? 'User' : characterInfo}: ${item.message}`;
    }).join('\n');
    
    // Ambil informasi tambahan tentang karakter jika ada
    let characterDetails = '';
    if (character) {
      characterDetails += `\nPenampilan ${character.name}: ${character.appearance || 'Tidak didefinisikan'}`;
      
      if (character.personality) {
        characterDetails += `\nKepribadian ${character.name}: ${character.personality}`;
      }
      
      if (character.quirks) {
        characterDetails += `\nKebiasaan unik ${character.name}: ${character.quirks}`;
      }
      
      if (character.expressionPatterns) {
        const expressions = Object.entries(character.expressionPatterns)
          .filter(([_, expr]) => expr && expr.trim() !== '')
          .map(([emotion, expr]) => `- Saat ${emotion}: ${expr}`)
          .join('\n');
        
        if (expressions) {
          characterDetails += `\n\nEkspresi ${character.name}:\n${expressions}`;
        }
      }
    }
    
    // Buat prompt untuk meminta narasi
    const prompt = `
Buatlah narasi yang sangat imersif dan deskriptif tentang interaksi antara user dan ${characterInfo} berdasarkan percakapan berikut.

${characterDetails}

Buat narasi seperti penggalan novel atau cerita pendek dengan penjelasan detail tentang:
1. Lingkungan di sekitar karakter (ruangan, cahaya, suara, aroma, suasana)
2. Ekspresi wajah dan bahasa tubuh ${characterInfo} yang mendetail
3. Emosi internal yang dirasakan ${characterInfo} (detak jantung, napas, sensasi tubuh)
4. Gerakan dan gestur kecil yang dilakukan karakter
5. Suasana dan atmosfer percakapan
6. Reaksi fisik dan emosional karakter terhadap user

Narasi HARUS:
- Menggunakan sudut pandang orang ketiga
- Berfokus pada pengalaman ${characterInfo} dalam berinteraksi dengan user
- Menggambarkan adegan dengan sangat detail, seperti dalam novel 
- Memiliki alur yang koheren, dengan awal, tengah, dan akhir yang jelas
- Menggunakan bahasa Indonesia yang baik dan gaya sastra yang kuat
- Memiliki panjang minimal 3-4 paragraf, dengan penjelasan yang kaya

Jangan:
- Mengulang dialog persis seperti dalam percakapan
- Hanya memparafrase/meringkas apa yang dikatakan
- Merusak karakter dengan menambahkan sifat yang bertentangan

Percakapan:
${conversationText}
`;
    
    // Gunakan model yang tersedia untuk membuat narasi
    const availableModels = [PRIMARY_MODEL, ...FALLBACK_MODELS].filter(model => isModelAvailable(model));
    
    if (availableModels.length === 0) {
      return null;
    }
    
    // Coba gunakan model yang tersedia
    for (const modelName of availableModels) {
      try {
        console.log(`Mencoba membuat narasi dengan model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        
        const result = await model.generateContent({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            maxOutputTokens: 1500,
            temperature: 0.8,
            topP: 0.95,
            topK: 40,
          }
        });
        
        const narrative = result.response.text();
        
        // Simpan narasi
        saveNarrative(userId, narrative);
        
        return narrative;
      } catch (error) {
        console.error(`Error membuat narasi dengan ${modelName}:`, error.message);
        
        // Jika error karena kuota, tandai model sebagai error dan set retry delay
        if (error.message.includes('quota') || error.message.includes('429')) {
          const retryDelay = extractRetryDelay(error.message);
          markModelAsError(modelName, retryDelay);
        }
        
        // Lanjutkan ke model berikutnya
        continue;
      }
    }
    
    // Jika semua model gagal
    return null;
  } catch (error) {
    console.error('Error generating narrative:', error);
    return null;
  }
}

// Mendapatkan histori percakapan dalam format yang dapat digunakan oleh Gemini
function getFormattedHistoryForGemini(userId, limit = 5) {
  const history = getUserHistory(userId);
  
  // Ambil beberapa pesan terakhir berdasarkan limit
  const recentHistory = history.slice(-limit);
  
  return recentHistory.map(item => {
    return {
      role: item.role === 'user' ? 'user' : 'model',
      parts: [{ text: item.message }]
    };
  });
}

// Membersihkan histori pesan dan narasi
function clearUserHistory(userId) {
  userConversations.set(userId, []);
  userNarratives.set(userId, []);
  lastAutoNarrativeTimestamp.delete(userId);
  
  // Hapus file histori jika ada
  const historyFilePath = getUserHistoryFilePath(userId);
  if (fs.existsSync(historyFilePath)) {
    try {
      fs.unlinkSync(historyFilePath);
    } catch (error) {
      console.error(`Error deleting history file for user ${userId}:`, error);
    }
  }
  
  // Hapus file narasi jika ada
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

// Membuat prompt berdasarkan karakter
function createCharacterPrompt(characterName) {
  const character = characterManager.getCharacter(characterName);
  
  let prompt = `Kamu adalah ${character.name} dari ${character.type}. ${character.description}.`;
  
  // Tambahkan deskripsi penampilan jika ada
  if (character.appearance && character.appearance.trim() !== '') {
    prompt += `\nPenampilanmu: ${character.appearance}`;
  }
  
  // Tambahkan atribut-atribut roleplay jika tersedia
  if (character.personality && character.personality.trim() !== '') {
    prompt += `\nKepribadian: ${character.personality}`;
  }
  
  if (character.background && character.background.trim() !== '') {
    prompt += `\nLatar belakang: ${character.background}`;
  }
  
  if (character.quirks && character.quirks.trim() !== '') {
    prompt += `\nKebiasaan unik: ${character.quirks}`;
  }
  
  if (character.expressionPatterns && Object.keys(character.expressionPatterns).length > 0) {
    prompt += `\nPola ekspresi emosi:`;
    for (const [emotion, expression] of Object.entries(character.expressionPatterns)) {
      if (expression && expression.trim() !== '') {
        prompt += `\n- ${emotion}: ${expression}`;
      }
    }
  }
  
  prompt += `
Kamu harus selalu menjawab seperti karakter tersebut, dengan kepribadian dan gaya bicara yang sesuai.
Kamu memiliki ingatan tentang percakapan sebelumnya dengan pengguna ini.
Gunakan ingatan percakapan sebelumnya untuk memberikan jawaban yang relevan dan kontekstual.
Jangan pernah keluar dari karakter apapun yang ditanyakan.

PENTING: Buatlah respons yang sangat deskriptif, imersif, dan detail, seperti penggalan novel atau cerita pendek. 

Saat merespons, selalu sertakan:
1. Bahasa tubuh dan ekspresi wajah - gambarkan dengan detail bagaimana tubuhmu bergerak, ekspresi wajahmu, dan gesturmu
2. Emosi internal - jelaskan apa yang kamu rasakan secara internal, seperti debar jantung, nafas, keringat, dll
3. Detail lingkungan - deskripsi tentang apa yang kamu lihat, dengar, cium, atau rasakan di sekitarmu
4. Dialog dan pikiran - gunakan kombinasi dialog (teks biasa) dan narasi deskriptif (*dalam tanda bintang*) 

Formatmu harus mencampurkan:
- *Deskripsi narasi dalam tanda bintang* untuk detail lingkungan, bahasa tubuh, emosi, dan ekspresi
- "Dialog langsung dalam tanda kutip" atau dialog biasa tanpa tanda kutip
- Respons harus panjang (minimal 4-5 paragraf), detail, dan menyertakan banyak deskripsi.

CONTOH FORMAT:
*[Deskripsi bahasa tubuh dan ekspresi]*
"Dialog yang diucapkan" 
*[Deskripsi reaksi fisik, emosi, dan lingkungan sekitar]*
"Dialog lanjutan"

Ini akan menciptakan respons yang sangat imersif yang membuat pengguna merasa benar-benar berinteraksi dengan karakter.`;
  
  return prompt;
}

// Cek apakah model tersedia atau sedang dalam cooling period
function isModelAvailable(modelName) {
  if (!modelStatus[modelName]) return true;
  
  // Jika model error dan belum waktunya retry
  if (modelStatus[modelName].isError && Date.now() < modelStatus[modelName].nextRetryTime) {
    return false;
  }
  
  // Reset status jika sudah melewati waktu retry
  if (modelStatus[modelName].isError && Date.now() >= modelStatus[modelName].nextRetryTime) {
    modelStatus[modelName].isError = false;
  }
  
  return true;
}

// Menandai model sebagai error dan atur waktu retry
function markModelAsError(modelName, retryDelayMs = MODEL_RETRY_DELAY) {
  modelStatus[modelName] = {
    isError: true,
    nextRetryTime: Date.now() + retryDelayMs
  };
  console.log(`Model ${modelName} ditandai error, retry setelah ${retryDelayMs/1000} detik`);
}

// Ekstrak retry delay dari error message jika tersedia (format "retryDelay":"45s")
function extractRetryDelay(errorMessage) {
  const match = errorMessage.match(/retryDelay":"(\d+)s/);
  if (match && match[1]) {
    return parseInt(match[1]) * 1000; // Konversi ke milidetik
  }
  return MODEL_RETRY_DELAY; // Default retry delay
}

// Fungsi untuk mencoba model alternatif
async function tryAlternativeModel(modelName, characterName, message, userId) {
  try {
    // Skip model jika sedang dalam cooling period
    if (!isModelAvailable(modelName)) {
      console.log(`Model ${modelName} sedang cooling down, melewati...`);
      throw new Error(`Model ${modelName} sedang dalam cooling period`);
    }
    
    console.log(`Mencoba model: ${modelName}`);
    const model = genAI.getGenerativeModel({ model: modelName });
    
    // Buat karakter prompt
    const characterPrompt = createCharacterPrompt(characterName);
    
    // Untuk model alternatif, gunakan histori terakhir untuk konteks
    const formattedHistory = getFormattedHistoryForGemini(userId, 3); // Ambil 3 pesan terakhir
    const historyContext = formattedHistory.map(item => 
      `${item.role === 'user' ? 'User' : 'You'}: ${item.parts[0].text}`
    ).join('\n');
    
    const fullPrompt = `${characterPrompt}\n\nPercakapan sebelumnya:\n${historyContext}\n\nUser: ${message}\n\nResponslah dengan gaya yang imersif, deskriptif, dan detail seperti petunjuk sebelumnya.`;
    
    // Untuk model alternatif, kita gunakan generateContent yang lebih sederhana
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: fullPrompt }]
        }
      ],
      generationConfig: {
        maxOutputTokens: 1500, // Meningkatkan jumlah token untuk respons yang lebih panjang dan deskriptif
        temperature: 0.8, // Sedikit meningkatkan kreativitas
        topP: 0.95,
        topK: 40
      }
    });
    
    return result.response.text();
  } catch (error) {
    console.error(`Error with model ${modelName}:`, error.message);
    
    // Jika error karena kuota, tandai model sebagai error dan set retry delay
    if (error.message.includes('quota') || error.message.includes('429')) {
      const retryDelay = extractRetryDelay(error.message);
      markModelAsError(modelName, retryDelay);
    }
    
    throw error;
  }
}

// Fungsi utama untuk mendapatkan jawaban dari AI
async function getAIResponse(userId, message, characterName = null) {
  // Dapatkan daftar model yang tersedia (tidak dalam cooling period)
  const availableModels = [PRIMARY_MODEL, ...FALLBACK_MODELS].filter(model => isModelAvailable(model));
  console.log('Model tersedia:', availableModels);
  
  // Jika tidak ada model yang tersedia
  if (availableModels.length === 0) {
    const nextAvailableTime = Math.min(...Object.values(modelStatus).map(s => s.nextRetryTime));
    const waitTimeSeconds = Math.ceil((nextAvailableTime - Date.now()) / 1000);
    throw new Error(`Semua model API sedang rate limited. Silakan coba lagi dalam ${waitTimeSeconds} detik.`);
  }
  
  let lastError = null;
  
  // Dapatkan karakter yang digunakan
  const character = characterManager.getCharacter(characterName);
  
  // Dapatkan histori percakapan
  const history = getUserHistory(userId);
  const isFirstInteraction = history.length === 0;
  
  // Coba model yang tersedia satu per satu
  for (const modelName of availableModels) {
    try {
      // Jika model adalah model utama dan tersedia, gunakan metode chat dengan histori
      if (modelName === PRIMARY_MODEL) {
        try {
          // Dapatkan model
          const model = genAI.getGenerativeModel({ model: modelName });
          
          // Dapatkan histori percakapan terformat untuk Gemini
          const formattedHistory = getFormattedHistoryForGemini(userId);
          
          // Buat karakter prompt
          const characterPrompt = createCharacterPrompt(characterName);
          
          // Mulai chat dengan histori sebelumnya
          const chat = model.startChat({
            history: formattedHistory.length > 0 ? formattedHistory : undefined,
            generationConfig: {
              maxOutputTokens: 1500, // Meningkatkan output tokens untuk respons yang lebih panjang dan deskriptif
              temperature: 0.8, // Sedikit meningkatkan kreativitas
              topP: 0.95,
              topK: 40
            },
          });
          
          // Tambahkan character prompt sebagai instruksi awal jika tidak ada histori
          if (formattedHistory.length === 0) {
            await chat.sendMessage(characterPrompt);
          }
          
          // Kirim pesan user terbaru dan dapatkan respons
          const result = await chat.sendMessage(message);
          const response = result.response;
          
          // Simpan pesan ke histori
          addMessageToHistory(userId, 'user', message);
          
          // Jika ini adalah interaksi pertama dan karakter memiliki pesan awal, gunakan itu
          if (isFirstInteraction && character.initialMessage && character.initialMessage.trim() !== '') {
            // Simpan pesan awal sebagai respons bot
            addMessageToHistory(userId, 'bot', character.initialMessage);
            
            // Kembalikan pesan awal
            return character.initialMessage;
          } else {
            // Simpan respons AI ke histori
            addMessageToHistory(userId, 'bot', response.text());
            
            // Kembalikan respons dari AI
            return response.text();
          }
        } catch (error) {
          console.error(`Error dengan model utama ${modelName}:`, error.message);
          
          // Jika error karena kuota, tandai model sebagai error dan set retry delay
          if (error.message.includes('quota') || error.message.includes('429')) {
            const retryDelay = extractRetryDelay(error.message);
            markModelAsError(modelName, retryDelay);
          }
          
          // Lanjutkan ke model berikutnya
          throw error;
        }
      } else {
        // Untuk model non-utama, gunakan metode generateContent
        const response = await tryAlternativeModel(modelName, characterName, message, userId);
        
        // Simpan pesan ke histori
        addMessageToHistory(userId, 'user', message);
        
        // Jika ini adalah interaksi pertama dan karakter memiliki pesan awal, gunakan itu
        if (isFirstInteraction && character.initialMessage && character.initialMessage.trim() !== '') {
          // Simpan pesan awal sebagai respons bot
          addMessageToHistory(userId, 'bot', character.initialMessage);
          
          // Kembalikan pesan awal
          return character.initialMessage;
        } else {
          // Simpan respons AI ke histori
          addMessageToHistory(userId, 'bot', response);
          
          // Kembalikan respons dari AI
          return response;
        }
      }
    } catch (error) {
      lastError = error;
      // Lanjutkan ke model berikutnya jika gagal
      continue;
    }
  }
  
  // Jika semua model gagal
  throw new Error(`Tidak bisa terhubung ke Gemini API. ${lastError.message}`);
}

// Mendapatkan ringkasan histori percakapan user
function getUserHistorySummary(userId) {
  const history = getUserHistory(userId);
  
  if (history.length === 0) {
    return "Belum ada percakapan dengan AI.";
  }
  
  const firstDate = new Date(history[0].timestamp);
  const lastDate = new Date(history[history.length - 1].timestamp);
  
  const summary = {
    totalMessages: history.length,
    userMessages: history.filter(item => item.role === 'user').length,
    botMessages: history.filter(item => item.role === 'bot').length,
    firstMessageDate: firstDate.toLocaleString(),
    lastMessageDate: lastDate.toLocaleString(),
    durationDays: Math.floor((lastDate - firstDate) / (1000 * 60 * 60 * 24))
  };
  
  return summary;
}

// Mendapatkan narasi percakapan user
function getUserNarrativeSummary(userId) {
  const narratives = getUserNarratives(userId);
  
  if (narratives.length === 0) {
    return null;
  }
  
  // Return narasi terakhir
  return narratives[narratives.length - 1].narrative;
}

// Mendapatkan semua narasi percakapan user
function getAllUserNarratives(userId) {
  return getUserNarratives(userId);
}

// Ubah konfigurasi narasi otomatis
function setAutoNarrativeConfig(threshold, cooldown) {
  if (threshold && threshold > 0) {
    AUTO_NARRATIVE_THRESHOLD = threshold;
  }
  
  if (cooldown && cooldown > 0) {
    AUTO_NARRATIVE_COOLDOWN = cooldown;
  }
  
  return {
    threshold: AUTO_NARRATIVE_THRESHOLD,
    cooldown: AUTO_NARRATIVE_COOLDOWN
  };
}

// Menyimpan narasi ke daftar narasi
function saveNarrative(userId, narrative) {
  // Dapatkan narasi yang sudah ada
  const narratives = getUserNarratives(userId);
  
  // Tambahkan narasi baru
  narratives.push({
    narrative: narrative,
    timestamp: new Date().toISOString(),
    isAutoGenerated: true
  });
  
  // Jika terlalu banyak narasi, hapus yang paling lama
  if (narratives.length > 10) {
    narratives.shift();
  }
  
  // Simpan narasi ke memori dan file
  userNarratives.set(userId, narratives);
  saveUserNarrativesToFile(userId);
}

module.exports = {
  getAIResponse,
  clearUserHistory,
  getUserHistory,
  getUserHistorySummary,
  getUserNarrativeSummary,
  getAllUserNarratives,
  generateNarrativeFromHistory,
  setAutoNarrativeConfig
}; 