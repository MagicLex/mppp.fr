// Serverless function for handling Stripe webhooks
import Stripe from 'stripe';
import { sendOrderEmail } from './utils/email';

// Initialize Stripe with the API key from environment variables
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Load the webhook secret from environment variables
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
          
          // Extract customer details
          const customerDetails = session.customer_details || {};
          
          // Format order time
          const orderTime = session.metadata?.order_time || new Date().toISOString();
          const orderDate = new Date(orderTime);
          
          // Format date as DD/MM/YYYY
          const date = orderDate.toLocaleDateString('fr-FR');
          
          // Format time as HH:MM
          const time = orderDate.toLocaleTimeString('fr-FR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          });
          
          // Format items as string
          const itemsString = lineItems.data.map(item => 
            `${item.quantity}x ${item.description}`
          ).join('; ');
          
          // Prepare order for email
          const order = {
            id: session.id,
            date,
            time,
            customer_name: customerDetails.name || 'Non spécifié',
            customer_email: customerDetails.email || 'Non spécifié',
            customer_phone: customerDetails.phone || 'Non spécifié',
            pickup_time: session.metadata?.pickup_time || 'ASAP',
            notes: session.metadata?.notes || 'Aucune instruction particulière',
            total: session.amount_total / 100, // Convert from cents to euros
            items: itemsString
          };
          
          console.log('Order processed successfully:', {
            customer: customerDetails,
            amount: session.amount_total / 100,
            items: lineItems.data.length,
            metadata: session.metadata
          });
          
          // Send order notification email
          await sendOrderEmail(order);
          
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