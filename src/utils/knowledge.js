/**
 * Knowledge management module for character training
 * Handles knowledge base storage, training, and retrieval
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const { t } = require('./i18n');

// Base directories for knowledge and characters
const KNOWLEDGE_DIR = path.join(__dirname, '../data/knowledge');
const CHARACTERS_DIR = path.join(__dirname, '../data/characters');

// Ensure directories exist
if (!fs.existsSync(KNOWLEDGE_DIR)) {
  fs.mkdirSync(KNOWLEDGE_DIR, { recursive: true });
}

if (!fs.existsSync(CHARACTERS_DIR)) {
  fs.mkdirSync(CHARACTERS_DIR, { recursive: true });
}

/**
 * Create character-specific knowledge directory
 * @param {string} characterName - Name of the character
 * @returns {string} Path to character knowledge directory
 */
function getCharacterKnowledgePath(characterName) {
  if (!characterName) return null;
  
  const safeName = characterName.toLowerCase().replace(/\s+/g, '_');
  const characterKnowledgePath = path.join(KNOWLEDGE_DIR, safeName);
  
  if (!fs.existsSync(characterKnowledgePath)) {
    fs.mkdirSync(characterKnowledgePath, { recursive: true });
  }
  
  return characterKnowledgePath;
}

/**
 * Create character-specific directory
 * @param {string} characterName - Name of the character
 * @returns {string} Path to character directory
 */
function getCharacterPath(characterName) {
  if (!characterName) return null;
  
  const safeName = characterName.toLowerCase().replace(/\s+/g, '_');
  const characterPath = path.join(CHARACTERS_DIR, safeName);
  
  if (!fs.existsSync(characterPath)) {
    fs.mkdirSync(characterPath, { recursive: true });
  }
  
  return characterPath;
}

/**
 * Add knowledge data from text
 * @param {string} characterName - Name of the character
 * @param {string} content - Text content to add
 * @param {string} title - Optional title for the knowledge file
 * @returns {object} Result of operation
 */
function addKnowledgeFromText(characterName, content, title = '') {
  try {
    if (!characterName || !content) {
      return { success: false, error: 'Character name and content are required' };
    }
    
    const knowledgePath = getCharacterKnowledgePath(characterName);
    
    // Create filename based on title or timestamp
    const safeTitle = title 
      ? title.toLowerCase().replace(/[^a-z0-9]+/g, '_').substring(0, 30)
      : `knowledge_${Date.now()}`;
    
    const filename = `${safeTitle}.txt`;
    const filepath = path.join(knowledgePath, filename);
    
    // Write content to file
    fs.writeFileSync(filepath, content);
    
    return { 
      success: true, 
      message: `Knowledge added for character ${characterName}`,
      filename 
    };
  } catch (error) {
    console.error('Error adding knowledge from text:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Add knowledge data from website URL
 * @param {string} characterName - Name of the character
 * @param {string} url - Website URL to scrape
 * @returns {Promise<object>} Result of operation
 */
async function addKnowledgeFromUrl(characterName, url) {
  try {
    if (!characterName || !url) {
      return { success: false, error: 'Character name and URL are required' };
    }
    
    // Basic URL validation
    const urlPattern = /^(https?:\/\/)?([\w-]+(\.[\w-]+)+)([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])?$/;
    if (!urlPattern.test(url)) {
      return { success: false, error: 'Invalid URL format' };
    }
    
    // Add https if protocol is missing
    const fullUrl = url.startsWith('http') ? url : `https://${url}`;
    
    try {
      // Fetch webpage content
      const response = await axios.get(fullUrl);
      const html = response.data;
      
      // Use cheerio to parse HTML and extract text
      const $ = cheerio.load(html);
      
      // Remove script, style, and other non-content elements
      $('script, style, meta, link, noscript, iframe, svg').remove();
      
      // Extract title and main text content
      const title = $('title').text().trim() || new URL(fullUrl).hostname;
      
      // Extract text from paragraphs, headings, and other content elements
      let content = '';
      $('p, h1, h2, h3, h4, h5, li, div, span, article').each((i, el) => {
        const text = $(el).text().trim();
        if (text && text.length > 20) { // Only include substantial content
          content += text + '\n\n';
        }
      });
      
      // Clean up content (remove excessive spaces and newlines)
      content = content.replace(/\n{3,}/g, '\n\n').trim();
      
      // Add URL as source reference
      content = `Source: ${fullUrl}\nTitle: ${title}\nDate scraped: ${new Date().toISOString()}\n\n${content}`;
      
      // Calculate safe filename from URL
      const urlObj = new URL(fullUrl);
      const domain = urlObj.hostname.replace('www.', '');
      const safeDomain = domain.replace(/[^a-z0-9]+/g, '_');
      const safeTitle = `${safeDomain}_${Date.now()}`;
      
      // Add to knowledge base
      return addKnowledgeFromText(characterName, content, safeTitle);
      
    } catch (fetchError) {
      console.error('Error fetching URL:', fetchError);
      return { success: false, error: `Failed to fetch URL: ${fetchError.message}` };
    }
    
  } catch (error) {
    console.error('Error adding knowledge from URL:', error);
    return { success: false, error: error.message };
  }
}

/**
 * List all knowledge files for a character
 * @param {string} characterName - Name of the character
 * @returns {object} List of knowledge files
 */
function listCharacterKnowledge(characterName) {
  try {
    if (!characterName) {
      return { success: false, error: 'Character name is required' };
    }
    
    const knowledgePath = getCharacterKnowledgePath(characterName);
    
    if (!fs.existsSync(knowledgePath)) {
      return { success: true, files: [] };
    }
    
    // Get all files in knowledge directory
    const files = fs.readdirSync(knowledgePath)
      .filter(file => file.endsWith('.txt'))
      .map(file => {
        const filePath = path.join(knowledgePath, file);
        const stats = fs.statSync(filePath);
        
        // Get first 100 characters as preview
        let preview = '';
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          preview = content.substring(0, 100) + (content.length > 100 ? '...' : '');
        } catch (err) {
          preview = 'Error reading file';
        }
        
        return {
          filename: file,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime,
          preview
        };
      });
    
    return { success: true, files };
    
  } catch (error) {
    console.error('Error listing knowledge files:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get knowledge content for a specific file
 * @param {string} characterName - Name of the character
 * @param {string} filename - Knowledge file name
 * @returns {object} File content
 */
function getKnowledgeContent(characterName, filename) {
  try {
    if (!characterName || !filename) {
      return { success: false, error: 'Character name and filename are required' };
    }
    
    const knowledgePath = getCharacterKnowledgePath(characterName);
    const filePath = path.join(knowledgePath, filename);
    
    if (!fs.existsSync(filePath)) {
      return { success: false, error: 'Knowledge file not found' };
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    
    return { success: true, content, filename };
    
  } catch (error) {
    console.error('Error getting knowledge content:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete a knowledge file
 * @param {string} characterName - Name of the character
 * @param {string} filename - Knowledge file name
 * @returns {object} Result of operation
 */
function deleteKnowledgeFile(characterName, filename) {
  try {
    if (!characterName || !filename) {
      return { success: false, error: 'Character name and filename are required' };
    }
    
    const knowledgePath = getCharacterKnowledgePath(characterName);
    const filePath = path.join(knowledgePath, filename);
    
    if (!fs.existsSync(filePath)) {
      return { success: false, error: 'Knowledge file not found' };
    }
    
    fs.unlinkSync(filePath);
    
    return { success: true, message: `Knowledge file ${filename} deleted` };
    
  } catch (error) {
    console.error('Error deleting knowledge file:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get all knowledge content for a character
 * @param {string} characterName - Name of the character
 * @returns {object} Combined knowledge content
 */
function getAllKnowledgeContent(characterName) {
  try {
    if (!characterName) {
      return { success: false, error: 'Character name is required' };
    }
    
    const knowledgePath = getCharacterKnowledgePath(characterName);
    
    if (!fs.existsSync(knowledgePath)) {
      return { success: true, content: '', files: 0 };
    }
    
    // Get all files in knowledge directory
    const files = fs.readdirSync(knowledgePath).filter(file => file.endsWith('.txt'));
    
    if (files.length === 0) {
      return { success: true, content: '', files: 0 };
    }
    
    // Combine content from all files
    let combinedContent = '';
    
    files.forEach(file => {
      const filePath = path.join(knowledgePath, file);
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        combinedContent += `\n===== ${file} =====\n\n${content}\n\n`;
      } catch (err) {
        console.error(`Error reading file ${file}:`, err);
      }
    });
    
    return { 
      success: true, 
      content: combinedContent.trim(), 
      files: files.length 
    };
    
  } catch (error) {
    console.error('Error getting all knowledge content:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  addKnowledgeFromText,
  addKnowledgeFromUrl,
  listCharacterKnowledge,
  getKnowledgeContent,
  deleteKnowledgeFile,
  getAllKnowledgeContent,
  getCharacterPath,
  getCharacterKnowledgePath
}; 