// Serverless function for creating Stripe checkout sessions
import Stripe from 'stripe';
// Import built-in modules directly
import fs from 'fs';
import path from 'path';

// Default config that will be used if admin settings can't be loaded
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

// Initialize Stripe with the API key from environment variables
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// This is for backwards compatibility with the old structure
// Must match src/data/constants.ts
const DEFAULT_RESTAURANT_CONFIG = {
  openingHours: {
    // 24-hour format for week days (Tuesday-Saturday)
    weekdays: {
      lunch: {
        opening: DEFAULT_CONFIG.businessHours.weekdays.lunch.opening,
        closing: DEFAULT_CONFIG.businessHours.weekdays.lunch.closing
      },
      dinner: {
        opening: DEFAULT_CONFIG.businessHours.weekdays.dinner.opening,
        closing: DEFAULT_CONFIG.businessHours.weekdays.dinner.closing
      }
    },
    // Sunday has continuous hours
    sunday: {
      opening: DEFAULT_CONFIG.businessHours.sunday.opening,
      closing: DEFAULT_CONFIG.businessHours.sunday.closing
    },
    // Restaurant is closed on Monday
    closedDays: [...DEFAULT_CONFIG.businessHours.closedDays],
  },
  // Allow ordering 30 minutes before opening
  preorderMinutes: DEFAULT_CONFIG.preorderMinutes,
  // Stop orders 30 minutes before closing
  lastOrderMinutes: DEFAULT_CONFIG.lastOrderMinutes
};

// Implement the admin settings functions directly in this file
// to avoid import issues with Vercel deployment

// Check if restaurant is force closed based on admin settings
async function isRestaurantForceClosed() {
  try {
    const settings = await getAdminSettings();
    return settings.forceClose === true;
  } catch (error) {
    console.error('Error checking force closed status:', error);
    return false;
  }
}

// Check if a date is a special closing date
async function isSpecialClosingDate(date) {
  try {
    const settings = await getAdminSettings();
    
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

// Get admin settings
async function getAdminSettings() {
  try {
    // In serverless environment, use environment variables or default config
    // We can't rely on file storage in Vercel Functions
    return DEFAULT_CONFIG;
  } catch (error) {
    console.error('Error getting admin settings:', error);
    return DEFAULT_CONFIG;
  }
}

async function isRestaurantOpen() {
  // Use the local implementations
  const now = new Date();
  
  // Get current hour and day in France timezone
  const options = { timeZone: 'Europe/Paris' };
  const franceDate = new Date(now.toLocaleString('en-US', options));
  const franceHour = franceDate.getHours();
  const franceMinute = franceDate.getMinutes();
  const franceDay = franceDate.getDay();

  // Simple debug output
  console.log(`France time: ${franceHour}:${franceMinute}, Day: ${franceDay}`);
  
  // Check if force closed from admin panel
  if (await isRestaurantForceClosed()) {
    console.log('Restaurant is force closed by admin');
    return false;
  }
  
  // Check if today is a special closing day
  if (await isSpecialClosingDate(franceDate)) {
    console.log('Restaurant is closed for a special date');
    return false;
  }
  
  // Get admin settings - this may have modified business hours
  const adminSettings = await getAdminSettings();
  const config = adminSettings || DEFAULT_RESTAURANT_CONFIG;
  
  // Is it a closed day? (Using admin settings which may have been modified)
  if (config.openingHours && config.openingHours.closedDays && config.openingHours.closedDays.includes(franceDay)) {
    console.log(`Restaurant is closed on day ${franceDay}`);
    return false;
  }
  
  // Alternative check for new structure
  if (config.businessHours && config.businessHours.closedDays && config.businessHours.closedDays.includes(franceDay)) {
    console.log(`Restaurant is closed on day ${franceDay} (new config structure)`);
    return false;
  }
  
  // Is it Sunday?
  if (franceDay === 0) {
    // Handle both config structures
    const openTime = config.businessHours?.sunday?.opening || 
                     config.openingHours?.sunday?.opening || 12;
    const closeTime = config.businessHours?.sunday?.closing || 
                      config.openingHours?.sunday?.closing || 21;
    
    // Convert to decimal time for simpler comparison (e.g., 11:30 = 11.5)
    const currentDecimal = franceHour + (franceMinute / 60);
    
    // Get preorder and last order minutes, with fallbacks
    const preorderMinutes = config.preorderMinutes || config.preorderMinutes || 30;
    const lastOrderMinutes = config.lastOrderMinutes || config.lastOrderMinutes || 30;
    
    // Can order 30 min before opening until 30 min before closing
    const effectiveOpenTime = openTime - (preorderMinutes / 60);
    const effectiveCloseTime = closeTime - (lastOrderMinutes / 60);
    
    return currentDecimal >= effectiveOpenTime && currentDecimal <= effectiveCloseTime;
  }
  
  // It's Tuesday-Saturday - check lunch and dinner hours
  const currentDecimal = franceHour + (franceMinute / 60);
  
  // Get preorder and last order minutes, with fallbacks
  const preorderMinutes = config.preorderMinutes || config.preorderMinutes || 30;
  const lastOrderMinutes = config.lastOrderMinutes || config.lastOrderMinutes || 30;
  
  // Lunch service - handle both config structures
  const lunchOpen = config.businessHours?.weekdays?.lunch?.opening || 
                     config.openingHours?.weekdays?.lunch?.opening || 12;
  const lunchClose = config.businessHours?.weekdays?.lunch?.closing || 
                     config.openingHours?.weekdays?.lunch?.closing || 14;
  const effectiveLunchOpen = lunchOpen - (preorderMinutes / 60);
  const effectiveLunchClose = lunchClose - (lastOrderMinutes / 60);
  
  // Dinner service - handle both config structures  
  const dinnerOpen = config.businessHours?.weekdays?.dinner?.opening || 
                     config.openingHours?.weekdays?.dinner?.opening || 19;
  const dinnerClose = config.businessHours?.weekdays?.dinner?.closing || 
                     config.openingHours?.weekdays?.dinner?.closing || 21;
  const effectiveDinnerOpen = dinnerOpen - (preorderMinutes / 60);
  const effectiveDinnerClose = dinnerClose - (lastOrderMinutes / 60);
  
  // Check if we're in lunch or dinner service time window
  const isLunchOpen = currentDecimal >= effectiveLunchOpen && currentDecimal <= effectiveLunchClose;
  const isDinnerOpen = currentDecimal >= effectiveDinnerOpen && currentDecimal <= effectiveDinnerClose;
  
  return isLunchOpen || isDinnerOpen;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Allow override for testing
    const override = req.query.override === 'true' || req.body.override === true;
    
    // Check if restaurant is currently accepting orders
    const restaurantOpen = await isRestaurantOpen();
    
    if (!restaurantOpen && !override) {
      // Get admin settings for accurate hours in message
      const adminSettings = await getAdminSettings();
      const config = adminSettings || DEFAULT_RESTAURANT_CONFIG;
      
      // Format hours for display in a user-friendly way
      const lunchHours = `${Math.floor(config.businessHours.weekdays.lunch.opening)}h-${Math.floor(config.businessHours.weekdays.lunch.closing)}h`;
      const dinnerHours = `${Math.floor(config.businessHours.weekdays.dinner.opening)}h-${Math.floor(config.businessHours.weekdays.dinner.closing)}h`;
      const sundayHours = `${Math.floor(config.businessHours.sunday.opening)}h-${Math.floor(config.businessHours.sunday.closing)}h`;
      
      // Dynamic hours message
      const hoursMessage = `Mardi-Samedi: ${lunchHours} / ${dinnerHours} | Dimanche: ${sundayHours} | Fermé le lundi`;
      
      return res.status(400).json({ 
        error: 'Restaurant is closed',
        message: `Le restaurant n'accepte pas de commandes pour le moment. Horaires: ${hoursMessage} (commandes ${config.lastOrderMinutes}min avant la fermeture)`
      });
    }
    
    const { items, orderDetails } = req.body;
    
    // Validate pickup time to ensure it's not beyond 30 minutes after closing
    if (!override && orderDetails?.pickupTime) {
      const now = new Date();
      const options = { timeZone: 'Europe/Paris' };
      const franceDate = new Date(now.toLocaleString('en-US', options));
      const franceHour = franceDate.getHours();
      const franceMinute = franceDate.getMinutes();
      const franceDay = franceDate.getDay();
      
      // Get requested pickup time in minutes from now
      let requestedMinutes = 0;
      
      if (orderDetails.pickupTime.endsWith('min')) {
        requestedMinutes = parseInt(orderDetails.pickupTime.replace('min', ''));
      } else if (orderDetails.pickupTime === 'ASAP') {
        requestedMinutes = 30; // Assume 30 minutes for ASAP
      }
      
      // Get current settings for accurate closing times
      const adminSettings = await getAdminSettings();
      const config = adminSettings || DEFAULT_RESTAURANT_CONFIG;
      
      // Determine restaurant closing time for today
      let closingHour = 0;
      let closingMinute = 0;
      
      // Is it Sunday?
      if (franceDay === 0) {
        // Use admin settings for Sunday hours
        const sundayClosing = config.businessHours.sunday.closing;
        closingHour = Math.floor(sundayClosing);
        closingMinute = Math.round((sundayClosing - closingHour) * 60);
      } else if (franceDay !== 1 && !config.businessHours.closedDays.includes(franceDay)) {
        // For other days, determine if we're in lunch or dinner service
        if (franceHour < config.businessHours.weekdays.lunch.closing) {
          // Lunch service
          const lunchClosing = config.businessHours.weekdays.lunch.closing;
          closingHour = Math.floor(lunchClosing);
          closingMinute = Math.round((lunchClosing - closingHour) * 60);
        } else {
          // Dinner service
          const dinnerClosing = config.businessHours.weekdays.dinner.closing;
          closingHour = Math.floor(dinnerClosing);
          closingMinute = Math.round((dinnerClosing - closingHour) * 60);
        }
      }
      
      // Calculate minutes until closing
      const closingTimeInMinutes = (closingHour * 60 + closingMinute) - (franceHour * 60 + franceMinute);
      
      // If requested pickup time exceeds 30 minutes after closing
      if (requestedMinutes > (closingTimeInMinutes + 30)) {
        return res.status(400).json({
          error: 'Invalid pickup time',
          message: "L'heure de retrait demandée n'est pas valide. Elle ne peut pas être plus de 30 minutes après la fermeture du restaurant."
        });
      }
    }
    
    if (!items || !items.length) {
      return res.status(400).json({ error: 'No items provided for checkout' });
    }
    
    // Format line items for Stripe
    const lineItems = items.map(item => {
      // Calculate total price including options
      const basePrice = item.product.price;
      const optionsTotal = item.options ? item.options.reduce((sum, opt) => sum + opt.price, 0) : 0;
      const itemPrice = basePrice + optionsTotal;
      
      // Format name with options if present
      let productName = item.product.name;
      if (item.options && item.options.length > 0) {
        const optionNames = item.options.map(opt => opt.name).join(', ');
        productName = `${productName} (${optionNames})`;
      }
      
      return {
        price_data: {
          currency: 'eur',
          product_data: {
            name: productName,
            description: item.product.description || '',
            // Add image if available
            images: item.product.image ? [`${req.headers.origin}${item.product.image}`] : []
          },
          unit_amount: Math.round(itemPrice * 100), // Convert to cents
        },
        quantity: item.quantity,
      };
    });
    
    // Store order details in metadata
    const metadata = {
      pickup_time: orderDetails?.pickupTime || 'ASAP',
      notes: orderDetails?.notes || 'Aucune instruction particulière',
      order_time: new Date().toISOString(),
    };
    
    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${req.headers.origin}/#/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/#/payment-cancel`,
      metadata,
      client_reference_id: Date.now().toString(),
      locale: 'fr',
      // Collect customer details
      billing_address_collection: 'required',
      shipping_address_collection: {
        allowed_countries: ['FR'],
      },
      phone_number_collection: {
        enabled: true,
      },
      custom_text: {
        shipping_address: {
          message: 'Vos coordonnées pour le retrait à 24 Rue des Olivettes, 44000 Nantes'
        },
      }
    });
    
    res.status(200).json({ id: session.id, url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    res.status(500).json({ 
      error: 'Failed to create checkout session',
      message: error.message 
    });
  }
}