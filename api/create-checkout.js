// Serverless function for creating Stripe checkout sessions
import Stripe from 'stripe';

// Initialize Stripe with the API key from environment variables
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if restaurant is currently accepting orders
    if (!isRestaurantOpen()) {
      // Get current day of week
      const currentDay = new Date().getDay();
      let message = '';
      
      // Provide a more specific message based on the day
      if (RESTAURANT_CONFIG.openingHours.closedDays.includes(currentDay)) {
        message = "Le restaurant est fermé le lundi. Horaires d'ouverture: Mardi-Samedi: 12h-14h / 19h-21h | Dimanche: 12h-21h";
      } else if (currentDay === 0) { // Sunday
        message = "Le restaurant n'accepte pas de commandes pour le moment. Horaires du dimanche: 12h-21h (commandes 30min avant la fermeture)";
      } else {
        message = "Le restaurant n'accepte pas de commandes pour le moment. Horaires: Mardi-Samedi: 12h-14h / 19h-21h (commandes 30min avant la fermeture)";
      }
      
      return res.status(400).json({ 
        error: 'Restaurant is closed',
        message
      });
    }
    
    const { items, orderDetails } = req.body;
    
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