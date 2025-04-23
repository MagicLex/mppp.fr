// Serverless function for creating Stripe checkout sessions
import Stripe from 'stripe';

// Initialize Stripe with the API key from environment variables
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
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
      pickup_time: orderDetails?.pickupTime || 'Dès que possible',
      notes: orderDetails?.notes || 'Aucune instruction particulière',
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