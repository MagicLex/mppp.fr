import { OrderOption } from '../types';

// Restaurant configuration
export const RESTAURANT_CONFIG = {
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

export function isRestaurantOpen(): boolean {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Convert current time to decimal hours (e.g., 11:30 -> 11.5)
  const currentTimeDecimal = currentHour + (currentMinute / 60);
  
  // Check if restaurant is closed today
  if (RESTAURANT_CONFIG.openingHours.closedDays.includes(currentDay)) {
    return false;
  }
  
  // Check if it's Sunday
  if (currentDay === 0) {
    const sundayOpening = RESTAURANT_CONFIG.openingHours.sunday.opening;
    const sundayClosing = RESTAURANT_CONFIG.openingHours.sunday.closing;
    
    // Calculate effective open/close times with the buffer periods
    const effectiveOpeningTime = sundayOpening - (RESTAURANT_CONFIG.preorderMinutes / 60);
    const effectiveClosingTime = sundayClosing - (RESTAURANT_CONFIG.lastOrderMinutes / 60);
    
    return currentTimeDecimal >= effectiveOpeningTime && currentTimeDecimal <= effectiveClosingTime;
  }
  
  // If it's a weekday (Tuesday-Saturday)
  // Check if current time falls within lunch or dinner service with buffer periods
  const lunchOpening = RESTAURANT_CONFIG.openingHours.weekdays.lunch.opening;
  const lunchClosing = RESTAURANT_CONFIG.openingHours.weekdays.lunch.closing;
  const dinnerOpening = RESTAURANT_CONFIG.openingHours.weekdays.dinner.opening;
  const dinnerClosing = RESTAURANT_CONFIG.openingHours.weekdays.dinner.closing;
  
  // Calculate effective open/close times for lunch service
  const effectiveLunchOpeningTime = lunchOpening - (RESTAURANT_CONFIG.preorderMinutes / 60);
  const effectiveLunchClosingTime = lunchClosing - (RESTAURANT_CONFIG.lastOrderMinutes / 60);
  
  // Calculate effective open/close times for dinner service
  const effectiveDinnerOpeningTime = dinnerOpening - (RESTAURANT_CONFIG.preorderMinutes / 60);
  const effectiveDinnerClosingTime = dinnerClosing - (RESTAURANT_CONFIG.lastOrderMinutes / 60);
  
  // Check if current time falls within lunch or dinner service
  const isLunchService = currentTimeDecimal >= effectiveLunchOpeningTime && currentTimeDecimal <= effectiveLunchClosingTime;
  const isDinnerService = currentTimeDecimal >= effectiveDinnerOpeningTime && currentTimeDecimal <= effectiveDinnerClosingTime;
  
  return isLunchService || isDinnerService;
}

export function getRestaurantStatus(): {isOpen: boolean; message: string} {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Convert current time to decimal hours (e.g., 11:30 -> 11.5)
  const currentTimeDecimal = currentHour + (currentMinute / 60);
  
  // Get standard hours text for display in messages
  const hoursText = "Mardi-Samedi: 12h-14h / 19h-21h | Dimanche: 12h-21h | Fermé le lundi";
  
  // Check if restaurant is closed today (Monday)
  if (RESTAURANT_CONFIG.openingHours.closedDays.includes(currentDay)) {
    return {
      isOpen: false,
      message: `Le restaurant est fermé le lundi. Horaires d'ouverture: ${hoursText}`
    };
  }
  
  // Check if it's Sunday
  if (currentDay === 0) {
    const sundayOpening = RESTAURANT_CONFIG.openingHours.sunday.opening;
    const sundayClosing = RESTAURANT_CONFIG.openingHours.sunday.closing;
    
    // Calculate effective open/close times with the buffer periods
    const effectiveOpeningTime = sundayOpening - (RESTAURANT_CONFIG.preorderMinutes / 60);
    const effectiveClosingTime = sundayClosing - (RESTAURANT_CONFIG.lastOrderMinutes / 60);
    
    if (currentTimeDecimal < effectiveOpeningTime) {
      return {
        isOpen: false,
        message: `Le restaurant n'est pas encore ouvert. Les commandes seront disponibles à partir de ${sundayOpening}h00. Horaires d'ouverture: ${hoursText}`
      };
    } else if (currentTimeDecimal > effectiveClosingTime) {
      return {
        isOpen: false,
        message: `Le restaurant est fermé pour aujourd'hui. Les commandes s'arrêtent 30 minutes avant la fermeture. Horaires d'ouverture: ${hoursText}`
      };
    }
    
    return {
      isOpen: true,
      message: `Restaurant ouvert en continu le dimanche. Les commandes sont acceptées.`
    };
  }
  
  // If it's a weekday (Tuesday-Saturday)
  const lunchOpening = RESTAURANT_CONFIG.openingHours.weekdays.lunch.opening;
  const lunchClosing = RESTAURANT_CONFIG.openingHours.weekdays.lunch.closing;
  const dinnerOpening = RESTAURANT_CONFIG.openingHours.weekdays.dinner.opening;
  const dinnerClosing = RESTAURANT_CONFIG.openingHours.weekdays.dinner.closing;
  
  // Calculate effective open/close times for lunch service
  const effectiveLunchOpeningTime = lunchOpening - (RESTAURANT_CONFIG.preorderMinutes / 60);
  const effectiveLunchClosingTime = lunchClosing - (RESTAURANT_CONFIG.lastOrderMinutes / 60);
  
  // Calculate effective open/close times for dinner service
  const effectiveDinnerOpeningTime = dinnerOpening - (RESTAURANT_CONFIG.preorderMinutes / 60);
  const effectiveDinnerClosingTime = dinnerClosing - (RESTAURANT_CONFIG.lastOrderMinutes / 60);
  
  // Check which service period we're in or approaching
  if (currentTimeDecimal < effectiveLunchOpeningTime) {
    // Before lunch service
    return {
      isOpen: false,
      message: `Le restaurant n'est pas encore ouvert. Les commandes seront disponibles à partir de ${lunchOpening-0.5}h. Horaires d'ouverture: ${hoursText}`
    };
  } else if (currentTimeDecimal > effectiveLunchClosingTime && currentTimeDecimal < effectiveDinnerOpeningTime) {
    // Between lunch and dinner service
    return {
      isOpen: false,
      message: `Le restaurant est en pause entre le service du midi et du soir. Les commandes reprendront à ${dinnerOpening-0.5}h. Horaires d'ouverture: ${hoursText}`
    };
  } else if (currentTimeDecimal > effectiveDinnerClosingTime) {
    // After dinner service
    return {
      isOpen: false,
      message: `Le restaurant est fermé pour aujourd'hui. Les commandes s'arrêtent 30 minutes avant la fermeture. Horaires d'ouverture: ${hoursText}`
    };
  }
  
  // During lunch or dinner service
  const isLunchService = currentTimeDecimal >= effectiveLunchOpeningTime && currentTimeDecimal <= effectiveLunchClosingTime;
  const isDinnerService = currentTimeDecimal >= effectiveDinnerOpeningTime && currentTimeDecimal <= effectiveDinnerClosingTime;
  
  if (isLunchService) {
    return {
      isOpen: true,
      message: `Restaurant ouvert: service du midi. Les commandes sont acceptées.`
    };
  } else if (isDinnerService) {
    return {
      isOpen: true,
      message: `Restaurant ouvert: service du soir. Les commandes sont acceptées.`
    };
  }
  
  // Fallback (should not reach here)
  return {
    isOpen: isRestaurantOpen(),
    message: `Vérification des heures d'ouverture. Horaires: ${hoursText}`
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