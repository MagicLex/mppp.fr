import { OrderOption } from '../types';
import { loadAdminSettings, defaultAdminSettings } from './adminConfig';

// Default restaurant configuration
// (this will be used only as a fallback if admin settings aren't available)
export const DEFAULT_RESTAURANT_CONFIG = {
  openingHours: {
    // 24-hour format for week days (Tuesday-Saturday)
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
    // Sunday has continuous hours
    sunday: {
      opening: 12, // 12:00
      closing: 21, // 21:00
    },
    // Restaurant is closed on Monday
    closedDays: [1], // 0 = Sunday, 1 = Monday, etc.
  },
  // Allow ordering 30 minutes before opening
  preorderMinutes: 30,
  // Stop orders 30 minutes before closing
  lastOrderMinutes: 30
};

// Get current restaurant configuration (from admin settings or defaults)
export function getRestaurantConfig() {
  // Try to load admin settings first
  try {
    const adminSettings = loadAdminSettings();
    
    // Convert admin settings to restaurant config format
    return {
      openingHours: adminSettings.businessHours,
      preorderMinutes: adminSettings.preorderMinutes,
      lastOrderMinutes: adminSettings.lastOrderMinutes,
      // Include admin override flags
      forceClose: adminSettings.forceClose,
      specialClosings: adminSettings.specialClosings
    };
  } catch (error) {
    console.error('Error loading admin settings, using defaults:', error);
    return DEFAULT_RESTAURANT_CONFIG;
  }
}

// Restaurant configuration - dynamically gets latest admin settings
export const RESTAURANT_CONFIG = getRestaurantConfig();

export function isRestaurantOpen(): boolean {
  // Forward to the adminConfig implementation
  const { isRestaurantOpenWithOverrides } = require('./adminConfig');
  return isRestaurantOpenWithOverrides();
}

export function getRestaurantStatus(): {isOpen: boolean; message: string} {
  // Forward to the adminConfig implementation
  const { getRestaurantStatusWithOverrides } = require('./adminConfig');
  const status = getRestaurantStatusWithOverrides();
  
  // Just take the isOpen and message properties (maintain existing API)
  return {
    isOpen: status.isOpen,
    message: status.message
  };
}

export const orderOptions: Record<string, OrderOption[]> = {
  drinks: [
    {
      id: 'coca-cola',
      name: 'Coca-Cola',
      price: 2.50,
      type: 'drink'
    },
    {
      id: 'sprite',
      name: 'Sprite',
      price: 2.50,
      type: 'drink'
    },
    {
      id: 'fanta',
      name: 'Fanta Orange',
      price: 2.50,
      type: 'drink'
    },
    {
      id: 'water',
      name: 'Eau Minérale',
      price: 1.50,
      type: 'drink'
    },
    {
      id: 'sumol',
      name: 'Sumol (Ananas)',
      price: 2.90,
      type: 'drink'
    }
  ],
  sauces: [
    {
      id: 'piri-piri-extra',
      name: 'Sauce Piri Piri (Extra Piquante)',
      price: 1.00,
      type: 'sauce'
    },
    {
      id: 'piri-piri-mild',
      name: 'Sauce Piri Piri (Douce)',
      price: 1.00,
      type: 'sauce'
    },
    {
      id: 'aioli',
      name: 'Aïoli',
      price: 1.00,
      type: 'sauce'
    }
  ],
  sides: [
    {
      id: 'salade',
      name: 'Salade Verte',
      price: 3.50,
      type: 'side'
    },
    {
      id: 'riz',
      name: 'Riz Portugais',
      price: 3.50,
      type: 'side'
    }
  ]
};