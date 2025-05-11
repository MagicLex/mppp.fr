// Store for restaurant operational settings
import { isRestaurantOpen, RESTAURANT_CONFIG } from './options';

// Types for admin settings
export interface RestaurantStatus {
  // Overall status override
  forceClose: boolean;
  
  // Special closings for specific dates (ISO string date keys)
  specialClosings: Record<string, boolean>;
  
  // Override opening hours temporarily
  temporaryHours: {
    active: boolean;
    weekdays: {
      lunch: {
        opening: number;
        closing: number;
      };
      dinner: {
        opening: number;
        closing: number;
      }
    };
    sunday: {
      opening: number;
      closing: number;
    };
  };
  
  // Last updated
  lastUpdated: string;
}

// Default settings
const defaultSettings: RestaurantStatus = {
  forceClose: false,
  specialClosings: {},
  temporaryHours: {
    active: false,
    weekdays: {
      lunch: {
        opening: RESTAURANT_CONFIG.openingHours.weekdays.lunch.opening,
        closing: RESTAURANT_CONFIG.openingHours.weekdays.lunch.closing,
      },
      dinner: {
        opening: RESTAURANT_CONFIG.openingHours.weekdays.dinner.opening,
        closing: RESTAURANT_CONFIG.openingHours.weekdays.dinner.closing,
      }
    },
    sunday: {
      opening: RESTAURANT_CONFIG.openingHours.sunday.opening,
      closing: RESTAURANT_CONFIG.openingHours.sunday.closing,
    }
  },
  lastUpdated: new Date().toISOString()
};

// Local storage key
const ADMIN_SETTINGS_KEY = 'mpp_admin_settings';

// Load settings from localStorage
export function loadAdminSettings(): RestaurantStatus {
  try {
    const stored = localStorage.getItem(ADMIN_SETTINGS_KEY);
    if (stored) {
      return JSON.parse(stored) as RestaurantStatus;
    }
  } catch (error) {
    console.error('Failed to load admin settings', error);
  }
  
  return defaultSettings;
}

// Save settings to localStorage
export function saveAdminSettings(settings: RestaurantStatus): void {
  try {
    settings.lastUpdated = new Date().toISOString();
    localStorage.setItem(ADMIN_SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save admin settings', error);
  }
}

// Check if restaurant is open with admin overrides
export function isRestaurantOpenWithOverrides(): boolean {
  const settings = loadAdminSettings();
  
  // Check if force closed by admin
  if (settings.forceClose) {
    return false;
  }
  
  // Check if closed for today specifically
  const today = new Date();
  const options = { timeZone: 'Europe/Paris' };
  const franceDate = new Date(today.toLocaleString('en-US', options));
  const dateString = franceDate.toISOString().split('T')[0]; // Get YYYY-MM-DD
  
  if (settings.specialClosings[dateString]) {
    return false;
  }
  
  // Use temporary hours if active
  if (settings.temporaryHours.active) {
    // This is just a simple check - we'd need to modify the core logic in options.ts 
    // for a complete implementation
    return isRestaurantOpen(); // Still using regular logic for now
  }
  
  // Default to regular check
  return isRestaurantOpen();
}

// Get detailed restaurant status with admin overrides
export function getRestaurantStatusWithOverrides(): {isOpen: boolean; message: string; adminOverride: boolean} {
  const settings = loadAdminSettings();
  const regularStatus = isRestaurantOpen();
  
  // Check if force closed by admin
  if (settings.forceClose) {
    return {
      isOpen: false,
      message: `Le restaurant est temporairement fermé par décision administrative.`,
      adminOverride: true
    };
  }
  
  // Check if closed for today specifically
  const today = new Date();
  const options = { timeZone: 'Europe/Paris' };
  const franceDate = new Date(today.toLocaleString('en-US', options));
  const dateString = franceDate.toISOString().split('T')[0]; // Get YYYY-MM-DD
  
  if (settings.specialClosings[dateString]) {
    return {
      isOpen: false,
      message: `Le restaurant est exceptionnellement fermé aujourd'hui.`,
      adminOverride: true
    };
  }
  
  // Default to regular check for now
  return {
    isOpen: regularStatus,
    message: `Le restaurant est ${regularStatus ? 'ouvert' : 'fermé'} selon les horaires habituels.`,
    adminOverride: false
  };
}