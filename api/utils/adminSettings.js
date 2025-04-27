// Server-side implementation of admin settings
import { readSettings } from './fileStorage.js';

// In-memory cache for admin settings
let cachedSettings = null;
let cachedSettingsExpiry = 0;
const CACHE_TTL = 60 * 1000; // 1 minute cache

// Default configuration - should match src/data/constants.ts
const DEFAULT_CONFIG = {
  forceClose: false,
  specialClosings: [],
  businessHours: {
    weekdays: {
      lunch: {
        opening: 12, // 12:00
        closing: 14, // 14:00
      },
      dinner: {
        opening: 19, // 19:00
        closing: 21, // 21:00
      }
    },
    sunday: {
      opening: 12, // 12:00
      closing: 21, // 21:00
    },
    closedDays: [1] // Monday is closed by default
  },
  preorderMinutes: 30,
  lastOrderMinutes: 30
};

// Fetch admin settings from file storage
async function fetchAdminSettings() {
  // If we have cached settings and they're still valid, use them
  const now = Date.now();
  if (cachedSettings && cachedSettingsExpiry > now) {
    return cachedSettings;
  }
  
  try {
    // Read from file storage
    const settings = await readSettings();
    
    if (settings) {
      // Update cache
      cachedSettings = settings;
      cachedSettingsExpiry = now + CACHE_TTL;
      return settings;
    }
    
    // If no settings found, use defaults
    return DEFAULT_CONFIG;
  } catch (error) {
    console.error('Error fetching admin settings:', error);
    // If we encounter an error, return default config
    return DEFAULT_CONFIG;
  }
}

// Check if restaurant is force closed
export async function isRestaurantForceClosed() {
  try {
    const settings = await fetchAdminSettings();
    return settings.forceClose === true;
  } catch (error) {
    console.error('Error checking force closed status:', error);
    return false;
  }
}

// Check if a date is a special closing date
export async function isSpecialClosingDate(date) {
  try {
    const settings = await fetchAdminSettings();
    
    // Format date as YYYY-MM-DD
    const dateStr = typeof date === 'string' 
      ? date 
      : date.toISOString().split('T')[0];
    
    return settings.specialClosings.some(sc => sc.date === dateStr);
  } catch (error) {
    console.error('Error checking special closings:', error);
    return false;
  }
}

// Get the complete settings
export async function getAdminSettings() {
  try {
    return await fetchAdminSettings();
  } catch (error) {
    console.error('Error getting admin settings:', error);
    return DEFAULT_CONFIG;
  }
}