// Admin configuration and state management for restaurant settings
import { DEFAULT_RESTAURANT_CONFIG } from './constants';

// Types
export interface SpecialClosing {
  date: string; // ISO format YYYY-MM-DD
  reason?: string;
}

export interface AdminSettings {
  // Simple closed toggle with message
  isClosed: boolean;
  closedMessage: string;
  
  // Modified business hours
  businessHours: {
    weekdays: {
      lunch: {
        opening: number; // Stored as decimal, e.g., 12.5 for 12:30
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
  isClosed: false,
  closedMessage: '',
  businessHours: {
    weekdays: {
      lunch: {
        opening: DEFAULT_RESTAURANT_CONFIG.openingHours.weekdays.lunch.opening,
        closing: DEFAULT_RESTAURANT_CONFIG.openingHours.weekdays.lunch.closing,
      },
      dinner: {
        opening: DEFAULT_RESTAURANT_CONFIG.openingHours.weekdays.dinner.opening,
        closing: DEFAULT_RESTAURANT_CONFIG.openingHours.weekdays.dinner.closing,
      }
    },
    sunday: {
      opening: DEFAULT_RESTAURANT_CONFIG.openingHours.sunday.opening,
      closing: DEFAULT_RESTAURANT_CONFIG.openingHours.sunday.closing,
    },
    closedDays: [...DEFAULT_RESTAURANT_CONFIG.openingHours.closedDays]
  },
  preorderMinutes: DEFAULT_RESTAURANT_CONFIG.preorderMinutes,
  lastOrderMinutes: DEFAULT_RESTAURANT_CONFIG.lastOrderMinutes,
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

// Simple function to toggle closed status
export function toggleClosedStatus(isClosed: boolean, message: string = ''): void {
  const settings = loadAdminSettings();
  settings.isClosed = isClosed;
  settings.closedMessage = message;
  saveAdminSettings(settings);
}

// Check if restaurant is open with admin overrides
export function isRestaurantOpenWithOverrides(franceDate?: Date): boolean {
  const settings = loadAdminSettings();
  
  // Simple closed check
  if (settings.isClosed) {
    return false;
  }
  
  // Get current time in France timezone
  const now = franceDate || new Date();
  const options = { timeZone: 'Europe/Paris' };
  const franceDateObj = franceDate || new Date(now.toLocaleString('en-US', options));
  const currentDay = franceDateObj.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Check if it's a closed day
  if (settings.businessHours.closedDays.includes(currentDay)) {
    return false;
  }
  
  // Get hours in decimal (e.g., 9.5 for 9:30)
  const currentHour = franceDateObj.getHours();
  const currentMinute = franceDateObj.getMinutes();
  const currentTimeDecimal = currentHour + (currentMinute / 60);
  
  // For debugging
  console.log(`Current time decimal: ${currentTimeDecimal}, Day: ${currentDay}`);
  
  // Check Sunday hours
  if (currentDay === 0) {
    const openTime = settings.businessHours.sunday.opening;
    const closeTime = settings.businessHours.sunday.closing;
    
    // Can order 30 min before opening until 30 min before closing
    const effectiveOpenTime = openTime - (settings.preorderMinutes / 60);
    const effectiveCloseTime = closeTime - (settings.lastOrderMinutes / 60);
    
    console.log(`Sunday hours: Effective opening ${effectiveOpenTime.toFixed(2)}, closing ${effectiveCloseTime.toFixed(2)}`);
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
  
  console.log(`Weekday hours: 
    Lunch: ${effectiveLunchOpen.toFixed(2)}-${effectiveLunchClose.toFixed(2)}
    Dinner: ${effectiveDinnerOpen.toFixed(2)}-${effectiveDinnerClose.toFixed(2)}`);
  
  // Check if we're in lunch or dinner service time window
  const isLunchOpen = currentTimeDecimal >= effectiveLunchOpen && currentTimeDecimal <= effectiveLunchClose;
  const isDinnerOpen = currentTimeDecimal >= effectiveDinnerOpen && currentTimeDecimal <= effectiveDinnerClose;
  
  return isLunchOpen || isDinnerOpen;
}

// Get detailed restaurant status with admin overrides
// Helper function to format business hours for display throughout the app
export function getFormattedBusinessHours(): string {
  const settings = loadAdminSettings();
  
  // Format time with minutes if needed
  const formatTimeDisplay = (time: number): string => {
    const hours = Math.floor(time);
    const minutes = Math.round((time - hours) * 60);
    return minutes > 0 ? `${hours}h${minutes}` : `${hours}h`;
  };
  
  return "Mardi-Samedi: " + 
    `${formatTimeDisplay(settings.businessHours.weekdays.lunch.opening)}-${formatTimeDisplay(settings.businessHours.weekdays.lunch.closing)} / ` +
    `${formatTimeDisplay(settings.businessHours.weekdays.dinner.opening)}-${formatTimeDisplay(settings.businessHours.weekdays.dinner.closing)} | ` +
    `Dimanche: ${formatTimeDisplay(settings.businessHours.sunday.opening)}-${formatTimeDisplay(settings.businessHours.sunday.closing)} | ` +
    "Fermé le lundi";
}

export function getRestaurantStatusWithOverrides(): {isOpen: boolean; message: string; adminOverride: boolean} {
  const settings = loadAdminSettings();
  
  // Get current time in France timezone
  const now = new Date();
  const options = { timeZone: 'Europe/Paris' };
  const franceDate = new Date(now.toLocaleString('en-US', options));
  const currentDay = franceDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const dateString = franceDate.toISOString().split('T')[0]; // Get YYYY-MM-DD
  
  // Format time with minutes if needed
  const formatTimeDisplay = (time: number): string => {
    const hours = Math.floor(time);
    const minutes = Math.round((time - hours) * 60);
    return minutes > 0 ? `${hours}h${minutes}` : `${hours}h`;
  };
  
  // Get standard hours text for display in messages
  const hoursText = "Mardi-Samedi: " + 
    `${formatTimeDisplay(settings.businessHours.weekdays.lunch.opening)}-${formatTimeDisplay(settings.businessHours.weekdays.lunch.closing)} / ` +
    `${formatTimeDisplay(settings.businessHours.weekdays.dinner.opening)}-${formatTimeDisplay(settings.businessHours.weekdays.dinner.closing)} | ` +
    `Dimanche: ${formatTimeDisplay(settings.businessHours.sunday.opening)}-${formatTimeDisplay(settings.businessHours.sunday.closing)} | ` +
    "Fermé le lundi";
  
  // Simple closed check
  if (settings.isClosed) {
    return {
      isOpen: false,
      message: settings.closedMessage || `Le restaurant est temporairement fermé. Horaires habituels: ${hoursText}`,
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