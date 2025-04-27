// Admin configuration and state management for restaurant settings
import { RESTAURANT_CONFIG } from './options';

// Types
export interface SpecialClosing {
  date: string; // ISO format YYYY-MM-DD
  reason?: string;
}

export interface AdminSettings {
  // Overall status override
  forceClose: boolean;
  
  // Special closings for specific dates
  specialClosings: SpecialClosing[];
  
  // Modified business hours
  businessHours: {
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
    closedDays: number[]; // 0 = Sunday, 1 = Monday, etc.
  };
  
  // Configuration
  preorderMinutes: number;
  lastOrderMinutes: number;
  
  // Metadata
  lastUpdated: string;
  updatedBy: string;
  
  // Optional flag to indicate cached data
  cachedData?: boolean;
}

// Storage key for admin settings
const ADMIN_SETTINGS_KEY = 'mpp_admin_settings';

// Default settings based on restaurant config
export const defaultAdminSettings: AdminSettings = {
  forceClose: false,
  specialClosings: [],
  businessHours: {
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
    },
    closedDays: [...RESTAURANT_CONFIG.openingHours.closedDays]
  },
  preorderMinutes: RESTAURANT_CONFIG.preorderMinutes,
  lastOrderMinutes: RESTAURANT_CONFIG.lastOrderMinutes,
  lastUpdated: new Date().toISOString(),
  updatedBy: 'system'
};

// Load settings from localStorage
export function loadAdminSettings(): AdminSettings {
  try {
    const stored = localStorage.getItem(ADMIN_SETTINGS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load admin settings:', error);
  }
  return { ...defaultAdminSettings };
}

// Save settings to localStorage
export function saveAdminSettings(settings: AdminSettings): void {
  try {
    settings.lastUpdated = new Date().toISOString();
    localStorage.setItem(ADMIN_SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save admin settings:', error);
  }
}

// Update specific setting and save
export function updateAdminSetting<K extends keyof AdminSettings>(
  key: K, 
  value: AdminSettings[K], 
  username: string = 'admin'
): AdminSettings {
  const settings = loadAdminSettings();
  settings[key] = value;
  settings.updatedBy = username;
  settings.lastUpdated = new Date().toISOString();
  saveAdminSettings(settings);
  return settings;
}

// Check if a specific date is in the special closings list
export function isDateInSpecialClosings(date: Date): boolean {
  const settings = loadAdminSettings();
  const dateString = date.toISOString().split('T')[0]; // Get YYYY-MM-DD
  return settings.specialClosings.some(closing => closing.date === dateString);
}

// Add a special closing date
export function addSpecialClosing(date: string, reason?: string): void {
  const settings = loadAdminSettings();
  // Check if date already exists
  if (!settings.specialClosings.some(closing => closing.date === date)) {
    settings.specialClosings.push({ date, reason });
    settings.specialClosings.sort((a, b) => a.date.localeCompare(b.date));
    saveAdminSettings(settings);
  }
}

// Remove a special closing date
export function removeSpecialClosing(date: string): void {
  const settings = loadAdminSettings();
  settings.specialClosings = settings.specialClosings.filter(closing => closing.date !== date);
  saveAdminSettings(settings);
}

// Check if restaurant is open with admin overrides
export function isRestaurantOpenWithOverrides(franceDate?: Date): boolean {
  const settings = loadAdminSettings();
  
  // Force close overrides everything
  if (settings.forceClose) {
    return false;
  }
  
  // Get current time in France timezone
  const now = franceDate || new Date();
  const options = { timeZone: 'Europe/Paris' };
  const franceDateObj = franceDate || new Date(now.toLocaleString('en-US', options));
  const currentDay = franceDateObj.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const dateString = franceDateObj.toISOString().split('T')[0]; // Get YYYY-MM-DD
  
  // Check for special closing
  if (settings.specialClosings.some(closing => closing.date === dateString)) {
    return false;
  }
  
  // Check if it's a closed day
  if (settings.businessHours.closedDays.includes(currentDay)) {
    return false;
  }
  
  // Get hours in decimal (e.g., 9.5 for 9:30)
  const currentHour = franceDateObj.getHours();
  const currentMinute = franceDateObj.getMinutes();
  const currentTimeDecimal = currentHour + (currentMinute / 60);
  
  // Check Sunday hours
  if (currentDay === 0) {
    const openTime = settings.businessHours.sunday.opening;
    const closeTime = settings.businessHours.sunday.closing;
    
    // Can order 30 min before opening until 30 min before closing
    const effectiveOpenTime = openTime - (settings.preorderMinutes / 60);
    const effectiveCloseTime = closeTime - (settings.lastOrderMinutes / 60);
    
    return currentTimeDecimal >= effectiveOpenTime && currentTimeDecimal <= effectiveCloseTime;
  }
  
  // Check weekday hours
  // Lunch service
  const lunchOpen = settings.businessHours.weekdays.lunch.opening;
  const lunchClose = settings.businessHours.weekdays.lunch.closing;
  const effectiveLunchOpen = lunchOpen - (settings.preorderMinutes / 60);
  const effectiveLunchClose = lunchClose - (settings.lastOrderMinutes / 60);
  
  // Dinner service  
  const dinnerOpen = settings.businessHours.weekdays.dinner.opening;
  const dinnerClose = settings.businessHours.weekdays.dinner.closing;
  const effectiveDinnerOpen = dinnerOpen - (settings.preorderMinutes / 60);
  const effectiveDinnerClose = dinnerClose - (settings.lastOrderMinutes / 60);
  
  // Check if we're in lunch or dinner service time window
  const isLunchOpen = currentTimeDecimal >= effectiveLunchOpen && currentTimeDecimal <= effectiveLunchClose;
  const isDinnerOpen = currentTimeDecimal >= effectiveDinnerOpen && currentTimeDecimal <= effectiveDinnerClose;
  
  return isLunchOpen || isDinnerOpen;
}

// Get detailed restaurant status with admin overrides
export function getRestaurantStatusWithOverrides(): {isOpen: boolean; message: string; adminOverride: boolean} {
  const settings = loadAdminSettings();
  
  // Get current time in France timezone
  const now = new Date();
  const options = { timeZone: 'Europe/Paris' };
  const franceDate = new Date(now.toLocaleString('en-US', options));
  const currentDay = franceDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const dateString = franceDate.toISOString().split('T')[0]; // Get YYYY-MM-DD
  
  // Get standard hours text for display in messages
  const hoursText = "Mardi-Samedi: " + 
    `${settings.businessHours.weekdays.lunch.opening}h-${settings.businessHours.weekdays.lunch.closing}h / ` +
    `${settings.businessHours.weekdays.dinner.opening}h-${settings.businessHours.weekdays.dinner.closing}h | ` +
    `Dimanche: ${settings.businessHours.sunday.opening}h-${settings.businessHours.sunday.closing}h | ` +
    "Fermé le lundi";
  
  // Force close overrides everything
  if (settings.forceClose) {
    return {
      isOpen: false,
      message: `Le restaurant est temporairement fermé. Horaires habituels: ${hoursText}`,
      adminOverride: true
    };
  }
  
  // Check for special closing
  const specialClosing = settings.specialClosings.find(closing => closing.date === dateString);
  if (specialClosing) {
    const message = specialClosing.reason 
      ? `Le restaurant est exceptionnellement fermé aujourd'hui: ${specialClosing.reason}. Horaires habituels: ${hoursText}`
      : `Le restaurant est exceptionnellement fermé aujourd'hui. Horaires habituels: ${hoursText}`;
    
    return {
      isOpen: false,
      message,
      adminOverride: true
    };
  }
  
  // Check if it's a closed day
  if (settings.businessHours.closedDays.includes(currentDay)) {
    return {
      isOpen: false,
      message: `Le restaurant est fermé le ${currentDay === 1 ? 'lundi' : 'jour'}. Horaires d'ouverture: ${hoursText}`,
      adminOverride: false
    };
  }
  
  // Continue with standard open/close logic but using admin settings
  const isOpen = isRestaurantOpenWithOverrides(franceDate);
  
  // We could add more detailed messages based on time of day, but for now keep it simple
  if (isOpen) {
    return {
      isOpen: true,
      message: "Le restaurant est ouvert. Les commandes sont acceptées.",
      adminOverride: false
    };
  } else {
    return {
      isOpen: false,
      message: `Le restaurant est actuellement fermé. Horaires d'ouverture: ${hoursText}`,
      adminOverride: false
    };
  }
}