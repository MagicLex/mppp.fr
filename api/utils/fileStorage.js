// Simple file-based storage for admin settings
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name when using ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Settings storage file path
const STORAGE_DIR = path.join(__dirname, '..', 'data');
const SETTINGS_FILE = path.join(STORAGE_DIR, 'admin-settings.json');

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
    ensureStorageDir();
    
    // Check if file exists
    if (!fs.existsSync(SETTINGS_FILE)) {
      return null;
    }
    
    // Read and parse JSON data
    const data = await fs.promises.readFile(SETTINGS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading settings file:', error);
    return null;
  }
}

// Write settings to file
export async function writeSettings(settings) {
  try {
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