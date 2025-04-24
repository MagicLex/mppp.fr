// Serverless function to check restaurant status
// This is a debug endpoint to help diagnose issues with restaurant opening hours

// Restaurant configuration - must match what's in src/data/options.ts
const RESTAURANT_CONFIG = {
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

function isRestaurantOpen() {
  const now = new Date();
  
  // Adjust for France time zone (UTC+2 in summer)
  // This ensures consistent behavior regardless of server timezone
  // Retrieve time in local format (France - CEST/CET)
  const options = { timeZone: 'Europe/Paris', hour12: false };
  const franceTimeString = now.toLocaleString('fr-FR', options);
  
  // French time format is DD/MM/YYYY HH:MM:SS
  const dateParts = franceTimeString.split(' ')[0].split('/');
  const timeParts = franceTimeString.split(' ')[1].split(':');
  
  // Create a new date object using the date parts (French format)
  const frenchDate = new Date(
    parseInt(dateParts[2], 10),     // Year
    parseInt(dateParts[1], 10) - 1, // Month (0-indexed)
    parseInt(dateParts[0], 10)      // Day
  );
  
  const currentHour = parseInt(timeParts[0], 10);
  const currentMinute = parseInt(timeParts[1], 10);
  const currentDay = frenchDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Convert current time to decimal hours (e.g., 11:30 -> 11.5)
  const currentTimeDecimal = currentHour + (currentMinute / 60);
  
  const debug = {
    serverTime: now.toString(),
    franceTime: franceTimeString,
    hour: currentHour,
    minute: currentMinute,
    day: currentDay,
    decimalTime: currentTimeDecimal
  };
  
  // Check if restaurant is closed today
  if (RESTAURANT_CONFIG.openingHours.closedDays.includes(currentDay)) {
    return { 
      isOpen: false, 
      reason: `Restaurant is closed today (day ${currentDay})`,
      debug
    };
  }
  
  // Check if it's Sunday
  if (currentDay === 0) {
    const sundayOpening = RESTAURANT_CONFIG.openingHours.sunday.opening;
    const sundayClosing = RESTAURANT_CONFIG.openingHours.sunday.closing;
    
    // Calculate effective open/close times with the buffer periods
    const effectiveOpeningTime = sundayOpening - (RESTAURANT_CONFIG.preorderMinutes / 60);
    const effectiveClosingTime = sundayClosing - (RESTAURANT_CONFIG.lastOrderMinutes / 60);
    
    const isOpen = currentTimeDecimal >= effectiveOpeningTime && currentTimeDecimal <= effectiveClosingTime;
    
    debug.sundayOpeningTime = sundayOpening;
    debug.sundayClosingTime = sundayClosing;
    debug.effectiveOpeningTime = effectiveOpeningTime;
    debug.effectiveClosingTime = effectiveClosingTime;
    
    return { 
      isOpen, 
      reason: isOpen 
        ? 'Restaurant is open (Sunday service)'
        : currentTimeDecimal < effectiveOpeningTime
          ? 'Too early for Sunday service'
          : 'Too late for Sunday service',
      debug
    };
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
  
  debug.lunchService = {
    opening: lunchOpening,
    closing: lunchClosing,
    effectiveOpening: effectiveLunchOpeningTime,
    effectiveClosing: effectiveLunchClosingTime,
    isOpen: isLunchService
  };
  
  debug.dinnerService = {
    opening: dinnerOpening,
    closing: dinnerClosing,
    effectiveOpening: effectiveDinnerOpeningTime,
    effectiveClosing: effectiveDinnerClosingTime,
    isOpen: isDinnerService
  };
  
  const isOpen = isLunchService || isDinnerService;
  
  return { 
    isOpen,
    reason: isOpen 
      ? isLunchService 
        ? 'Restaurant is open for lunch service' 
        : 'Restaurant is open for dinner service'
      : currentTimeDecimal < effectiveLunchOpeningTime
        ? 'Too early for lunch service'
        : currentTimeDecimal > effectiveLunchClosingTime && currentTimeDecimal < effectiveDinnerOpeningTime
          ? 'Between lunch and dinner service'
          : 'After dinner service',
    debug
  };
}

export default async function handler(req, res) {
  // Return detailed restaurant status info
  const status = isRestaurantOpen();
  
  // Optional override for testing
  const debugOverride = req.query.override === 'true';
  
  res.status(200).json({
    ...status,
    isOpen: debugOverride ? true : status.isOpen,
    config: RESTAURANT_CONFIG
  });
}