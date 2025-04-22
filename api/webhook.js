// Serverless function for handling Stripe webhooks
import Stripe from 'stripe';

// Initialize Stripe with the API key from environment variables
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// This is your Stripe CLI webhook secret for testing
// Replace this with your actual webhook secret in production
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Verify webhook signature
    if (endpointSecret) {
      // Get raw body for signature verification
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
      }
      const rawBody = Buffer.concat(chunks).toString('utf8');
      
      event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
    } else {
      // If no webhook secret (not recommended for production), just parse the payload
      event = req.body;
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        console.log('Payment succeeded:', session.id);
        
        try {
          // Get line items from the session
          const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
          
          // Process the order (e.g., save to database, send email, etc.)
          console.log('Order processed successfully:', {
            customer: session.customer_details,
            amount: session.amount_total / 100, // Convert from cents to euros
            items: lineItems.data.length
          });
          
          // You could call other APIs or services here
        } catch (error) {
          console.error('Error processing order:', error);
        }
        break;
      
      case 'checkout.session.expired':
        console.log('Checkout session expired:', event.data.object.id);
        break;
      
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }
}