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
  
  // Get current hour and day in France timezone
  const options = { timeZone: 'Europe/Paris' };
  const franceDate = new Date(now.toLocaleString('en-US', options));
  const franceHour = franceDate.getHours();
  const franceMinute = franceDate.getMinutes();
  const franceDay = franceDate.getDay();

  // Simple debug output
  console.log(`France time: ${franceHour}:${franceMinute}, Day: ${franceDay}`);
  
  // Is it Monday? We're closed
  if (franceDay === 1) {
    return false;
  }
  
  // Is it Sunday?
  if (franceDay === 0) {
    const openTime = RESTAURANT_CONFIG.openingHours.sunday.opening;
    const closeTime = RESTAURANT_CONFIG.openingHours.sunday.closing;
    
    // Convert to decimal time for simpler comparison (e.g., 11:30 = 11.5)
    const currentDecimal = franceHour + (franceMinute / 60);
    
    // Can order 30 min before opening until 30 min before closing
    const effectiveOpenTime = openTime - (RESTAURANT_CONFIG.preorderMinutes / 60);
    const effectiveCloseTime = closeTime - (RESTAURANT_CONFIG.lastOrderMinutes / 60);
    
    return currentDecimal >= effectiveOpenTime && currentDecimal <= effectiveCloseTime;
  }
  
  // It's Tuesday-Saturday - check lunch and dinner hours
  const currentDecimal = franceHour + (franceMinute / 60);
  
  // Lunch service
  const lunchOpen = RESTAURANT_CONFIG.openingHours.weekdays.lunch.opening;
  const lunchClose = RESTAURANT_CONFIG.openingHours.weekdays.lunch.closing;
  const effectiveLunchOpen = lunchOpen - (RESTAURANT_CONFIG.preorderMinutes / 60);
  const effectiveLunchClose = lunchClose - (RESTAURANT_CONFIG.lastOrderMinutes / 60);
  
  // Dinner service  
  const dinnerOpen = RESTAURANT_CONFIG.openingHours.weekdays.dinner.opening;
  const dinnerClose = RESTAURANT_CONFIG.openingHours.weekdays.dinner.closing;
  const effectiveDinnerOpen = dinnerOpen - (RESTAURANT_CONFIG.preorderMinutes / 60);
  const effectiveDinnerClose = dinnerClose - (RESTAURANT_CONFIG.lastOrderMinutes / 60);
  
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
    const restaurantOpen = isRestaurantOpen();
    
    if (!restaurantOpen && !override) {
      return res.status(400).json({ 
        error: 'Restaurant is closed',
        message: "Le restaurant n'accepte pas de commandes pour le moment. Horaires: Mardi-Samedi: 12h-14h / 19h-21h (commandes 30min avant la fermeture)"
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
      
      // Determine restaurant closing time for today
      let closingHour = 0;
      let closingMinute = 0;
      
      // Is it Sunday?
      if (franceDay === 0) {
        closingHour = 21; // 21:00
        closingMinute = 0;
      } else if (franceDay !== 1) { // Not Monday (closed)
        // For other days, determine if we're in lunch or dinner service
        if (franceHour < 14) {
          // Lunch service
          closingHour = 14; // 14:00
          closingMinute = 0;
        } else {
          // Dinner service
          closingHour = 21; // 21:00
          closingMinute = 0;
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