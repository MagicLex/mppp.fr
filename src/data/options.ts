import { OrderOption } from '../types';
import { 
  loadAdminSettings, 
  defaultAdminSettings, 
  isRestaurantOpenWithOverrides, 
  getRestaurantStatusWithOverrides 
} from './adminConfig';
import { DEFAULT_RESTAURANT_CONFIG } from './constants';

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
  return isRestaurantOpenWithOverrides();
}

export function getRestaurantStatus(): {isOpen: boolean; message: string} {
  // Forward to the adminConfig implementation
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