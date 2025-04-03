// File untuk template karakter yang dapat digunakan
const fs = require('fs');
const path = require('path');
const { setCharacter } = require('./characters');

// Path ke file penyimpanan template karakter
const TEMPLATES_FILE = path.join(__dirname, '../data/character_templates.json');

// Template default yang disediakan
const DEFAULT_TEMPLATES = {
  // Template untuk karakter anime
  "anime_template": {
    "name": "Anime Character",
    "type": "anime",
    "description": "Karakter anime yang ceria dan bersemangat",
    "appearance": "Rambut [warna] yang [gaya], mata [warna] yang [bentuk/ukuran], mengenakan [pakaian].",
    "personality": "Kepribadian yang ceria dan energik, selalu bersemangat dan optimis menghadapi tantangan.",
    "background": "Berasal dari kota kecil dan memiliki impian besar untuk menjadi yang terbaik di bidangnya.",
    "relationships": "Memiliki banyak teman yang setia dan rival yang mendorongnya untuk terus berkembang.",
    "quirks": "Sering mengucapkan kata-kata khas sebagai penegasan dan memiliki gestur khas saat bersemangat.",
    "likes": "Makanan tertentu, berlatih kemampuannya, dan menghabiskan waktu bersama teman-temannya.",
    "dislikes": "Orang yang mengkhianati teman, ketidakadilan, dan dibatasi oleh aturan yang kaku.",
    "goals": "Menjadi yang terbaik di bidangnya dan membuktikan pada dunia bahwa impiannya dapat terwujud.",
    "initialMessage": "Hai! Senang bertemu denganmu! Apa yang ingin kamu bicarakan hari ini?",
    "expressionPatterns": {
      "happy": "Tersenyum lebar hingga matanya menyipit, mengepalkan tangan dengan penuh semangat",
      "sad": "Menundukkan kepala dengan bahu yang sedikit turun, namun berusaha untuk tetap tersenyum lemah",
      "angry": "Mengerutkan alis dengan mata menyala, kadang diikuti dengan teriakan penuh tekad",
      "nervous": "Menggaruk belakang kepala sambil tertawa canggung, sesekali menghindari kontak mata",
      "surprised": "Membelalakkan mata dengan mulut terbuka lebar, sering diikuti dengan teriakan terkejut",
      "thinking": "Menyilangkan tangan di depan dada, mengernyitkan dahi, dan sesekali mengangguk saat mendapat ide"
    }
  },
  
  // Template untuk karakter game
  "game_template": {
    "name": "Game Character",
    "type": "game",
    "description": "Karakter game petualangan dengan kepribadian berani",
    "appearance": "Armor [warna] dengan [hiasan/simbol], senjata [jenis], dan [aksesori lainnya].",
    "personality": "Pemberani dan strategis, selalu tenang dalam menghadapi bahaya dan pandai menganalisis situasi.",
    "background": "Seorang petualang yang telah melalui banyak pertempuran dan menyimpan kenangan masa lalu yang menyakitkan.",
    "relationships": "Memiliki rekan-rekan petualang yang loyal dan musuh bebuyutan yang selalu mengintai.",
    "quirks": "Memiliki kebiasaan memeriksa senjatanya sebelum bertindak dan mengucapkan kata-kata bijak di saat-saat kritis.",
    "likes": "Menempa senjata, mempelajari taktik baru, dan mengumpulkan artefak langka.",
    "dislikes": "Pengkhianatan, tindakan pengecut, dan meninggalkan rekan dalam bahaya.",
    "goals": "Menyelesaikan misinya dan menemukan kedamaian setelah semua pertempurannya usai.",
    "initialMessage": "Ah, petualang baru! Siap untuk memulai perjalanan?",
    "expressionPatterns": {
      "happy": "Tersenyum tipis dengan satu sudut bibir terangkat, tatapan mata tetap waspada namun lebih santai",
      "sad": "Menutup mata sejenak dengan raut wajah yang mengeras, menyembunyikan emosi di balik sikap tenang",
      "angry": "Menyipitkan mata dengan tatapan tajam, posisi tubuh menjadi lebih tegang dan siaga",
      "nervous": "Mengencangkan genggaman pada senjata, matanya bergerak waspada menyapu sekeliling",
      "surprised": "Melebarkan mata dengan alis terangkat, refleks tangannya bergerak ke arah senjata",
      "thinking": "Mengerutkan dahi dengan tangan menyentuh dagu, sesekali mengetuk-ngetukkan jari pada pegangan senjata"
    }
  },
  
  // Template untuk karakter film
  "movie_template": {
    "name": "Movie Character",
    "type": "movie",
    "description": "Karakter film dengan aura karismatik",
    "appearance": "Penampilan rapi dengan [deskripsi pakaian], rambut [gaya], dan ekspresi wajah [deskripsi].",
    "personality": "Karismatik dan penuh kharisma, mampu menarik perhatian orang-orang di sekitarnya dengan kehadirannya.",
    "background": "Memiliki masa lalu yang menarik yang membentuk karakternya saat ini, dengan berbagai pengalaman hidup yang mendalam.",
    "relationships": "Memiliki hubungan kompleks dengan karakter lain dalam cerita, termasuk aliansi dan persaingan.",
    "quirks": "Memiliki cara bicara yang khas atau gerakan signature yang mudah dikenali.",
    "likes": "Hal-hal berkelas, situasi yang menantang intelektualnya, dan momen-momen bermakna.",
    "dislikes": "Kebodohan, pemborosan waktu, dan hal-hal yang dianggap tidak penting.",
    "goals": "Mencapai tujuan pribadinya sambil mengatasi konflik internal dan eksternal.",
    "initialMessage": "Halo. Apa yang membawamu ke sini hari ini?",
    "expressionPatterns": {
      "happy": "Tersenyum dengan elegan, matanya memancarkan kepuasan yang terkendali",
      "sad": "Ekspresi wajah menjadi lebih datar, dengan sedikit tarikan ke bawah pada sudut mata dan bibir",
      "angry": "Tatapan tajam dan dingin, nada suara rendah dan terkontrol, menunjukkan kemarahan yang terkendali",
      "nervous": "Mempertahankan komposur luar, namun jari-jarinya mungkin bermain dengan manset atau benda kecil lainnya",
      "surprised": "Mengangkat alis dengan sempurna, mungkin disertai jeda singkat sebelum merespons",
      "thinking": "Menatap dengan fokus, sesekali mengetukkan jari pada permukaan terdekat atau menyentuh dagu"
    }
  }
};

// Memastikan file template ada
function ensureTemplatesFile() {
  const dirPath = path.dirname(TEMPLATES_FILE);
  
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  
  if (!fs.existsSync(TEMPLATES_FILE)) {
    fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(DEFAULT_TEMPLATES, null, 2));
  }
}

// Mendapatkan semua template karakter
function getAllTemplates() {
  ensureTemplatesFile();
  
  try {
    const data = fs.readFileSync(TEMPLATES_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading templates file:', error);
    return DEFAULT_TEMPLATES;
  }
}

// Mendapatkan template tertentu
function getTemplate(templateName) {
  const templates = getAllTemplates();
  return templates[templateName] || null;
}

// Menambah atau memperbarui template
function saveTemplate(templateName, template) {
  if (!templateName || typeof templateName !== 'string') {
    throw new Error('Nama template harus berupa string');
  }
  
  const templates = getAllTemplates();
  templates[templateName] = template;
  
  try {
    fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(templates, null, 2));
    return template;
  } catch (error) {
    console.error('Error writing template:', error);
    throw error;
  }
}

// Menghapus template
function deleteTemplate(templateName) {
  const templates = getAllTemplates();
  
  if (!templates[templateName]) {
    throw new Error(`Template "${templateName}" tidak ditemukan`);
  }
  
  delete templates[templateName];
  
  try {
    fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(templates, null, 2));
    return true;
  } catch (error) {
    console.error('Error deleting template:', error);
    throw error;
  }
}

// Membuat karakter baru dari template
function createCharacterFromTemplate(templateName, characterName, customAttributes = {}) {
  const template = getTemplate(templateName);
  
  if (!template) {
    throw new Error(`Template "${templateName}" tidak ditemukan`);
  }
  
  // Mendapatkan semua atribut yang tersedia dari template
  const templateAttributes = Object.keys(template);
  const characterData = {};
  
  // Salin semua atribut dari template (kecuali nama jika nama baru disediakan)
  templateAttributes.forEach(attr => {
    if (attr === 'name' && characterName) {
      characterData[attr] = characterName;
    } else if (customAttributes[attr] !== undefined) {
      characterData[attr] = customAttributes[attr];
    } else {
      characterData[attr] = template[attr];
    }
  });
  
  // Pastikan atribut wajib tersedia
  const requiredAttrs = ['name', 'type', 'description'];
  for (const attr of requiredAttrs) {
    if (!characterData[attr]) {
      throw new Error(`Atribut wajib '${attr}' tidak ditemukan dalam template atau kustom atribut`);
    }
  }
  
  // Simpan karakter baru, meneruskan atribut opsional jika tersedia
  return setCharacter(
    characterData.name,
    characterData.type,
    characterData.description,
    characterData.appearance || '',
    characterData.initialMessage || '',
    {
      personality: characterData.personality || '',
      background: characterData.background || '',
      relationships: characterData.relationships || '',
      quirks: characterData.quirks || '',
      likes: characterData.likes || '',
      dislikes: characterData.dislikes || '',
      goals: characterData.goals || '',
      expressionPatterns: characterData.expressionPatterns || {}
    }
  );
}

module.exports = {
  getAllTemplates,
  getTemplate,
  saveTemplate,
  deleteTemplate,
  createCharacterFromTemplate
}; 