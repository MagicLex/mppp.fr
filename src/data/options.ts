import { OrderOption } from '../types';

// Restaurant configuration
export const RESTAURANT_CONFIG = {
  openingHours: {
    // 24-hour format
    opening: 11, // 11:00 AM
    closing: 22, // 10:00 PM
  },
  // Allow ordering 30 minutes before opening
  preorderMinutes: 30,
  // Stop orders 30 minutes before closing
  lastOrderMinutes: 30
};

export function isRestaurantOpen(): boolean {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  // Convert current time to decimal hours (e.g., 11:30 -> 11.5)
  const currentTimeDecimal = currentHour + (currentMinute / 60);
  
  // Calculate effective open/close times with the buffer periods
  const effectiveOpeningTime = RESTAURANT_CONFIG.openingHours.opening - (RESTAURANT_CONFIG.preorderMinutes / 60);
  const effectiveClosingTime = RESTAURANT_CONFIG.openingHours.closing - (RESTAURANT_CONFIG.lastOrderMinutes / 60);
  
  return currentTimeDecimal >= effectiveOpeningTime && currentTimeDecimal <= effectiveClosingTime;
}

export function getRestaurantStatus(): {isOpen: boolean; message: string} {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  // Convert current time to decimal hours (e.g., 11:30 -> 11.5)
  const currentTimeDecimal = currentHour + (currentMinute / 60);
  
  // Calculate effective open/close times with the buffer periods
  const effectiveOpeningTime = RESTAURANT_CONFIG.openingHours.opening - (RESTAURANT_CONFIG.preorderMinutes / 60);
  const effectiveClosingTime = RESTAURANT_CONFIG.openingHours.closing - (RESTAURANT_CONFIG.lastOrderMinutes / 60);
  
  // Format times for display
  const openingTimeFormatted = `${RESTAURANT_CONFIG.openingHours.opening}:00`;
  const closingTimeFormatted = `${RESTAURANT_CONFIG.openingHours.closing}:00`;
  
  if (currentTimeDecimal < effectiveOpeningTime) {
    return {
      isOpen: false,
      message: `Le restaurant n'est pas encore ouvert. Les commandes seront disponibles à partir de ${openingTimeFormatted}. Restaurant ouvert de ${openingTimeFormatted} à ${closingTimeFormatted}.`
    };
  } else if (currentTimeDecimal > effectiveClosingTime) {
    return {
      isOpen: false,
      message: `Le restaurant est fermé pour aujourd'hui. Les commandes s'arrêtent 30 minutes avant la fermeture. Restaurant ouvert de ${openingTimeFormatted} à ${closingTimeFormatted}.`
    };
  }
  
  return {
    isOpen: true,
    message: `Restaurant ouvert : les commandes sont acceptées.`
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