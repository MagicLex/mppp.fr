// Simple file-based storage for admin settings
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name when using ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Settings storage file path
// In Vercel, we need to use /tmp for writable storage
const STORAGE_DIR = process.env.VERCEL ? '/tmp' : path.join(__dirname, '..', 'data');
const SETTINGS_FILE = path.join(STORAGE_DIR, 'admin-settings.json');

// In-memory cache for Vercel
let memoryCache = null;

// Ensure data directory exists
function ensureStorageDir() {
  if (!fs.existsSync(STORAGE_DIR)) {
    try {
      fs.mkdirSync(STORAGE_DIR, { recursive: true });
    } catch (error) {
      console.error('Error creating storage directory:', error);
      throw error;
    }
  }
}

// Read settings from file
export async function readSettings() {
  try {
    // In Vercel, use memory cache if available
    if (process.env.VERCEL && memoryCache) {
      console.log('Reading from memory cache');
      return memoryCache;
    }
    
    ensureStorageDir();
    
    // Check if file exists
    if (!fs.existsSync(SETTINGS_FILE)) {
      // Try to read from the bundled data file
      const bundledFile = path.join(__dirname, '..', 'data', 'admin-settings.json');
      if (fs.existsSync(bundledFile)) {
        const data = await fs.promises.readFile(bundledFile, 'utf8');
        const settings = JSON.parse(data);
        // Cache in memory for Vercel
        if (process.env.VERCEL) {
          memoryCache = settings;
        }
        return settings;
      }
      return null;
    }
    
    // Read and parse JSON data
    const data = await fs.promises.readFile(SETTINGS_FILE, 'utf8');
    const settings = JSON.parse(data);
    
    // Cache in memory for Vercel
    if (process.env.VERCEL) {
      memoryCache = settings;
    }
    
    return settings;
  } catch (error) {
    console.error('Error reading settings file:', error);
    return null;
  }
}

// Write settings to file
export async function writeSettings(settings) {
  try {
    // In Vercel, just update memory cache
    if (process.env.VERCEL) {
      console.log('Updating memory cache in Vercel environment');
      memoryCache = settings;
      return true;
    }
    
    ensureStorageDir();
    
    // Convert to JSON string with nice formatting
    const data = JSON.stringify(settings, null, 2);
    
    // Write to file
    await fs.promises.writeFile(SETTINGS_FILE, data, 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing settings file:', error);
    return false;
  }
}