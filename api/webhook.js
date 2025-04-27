// Serverless function for handling Stripe webhooks
import Stripe from 'stripe';
import nodemailer from 'nodemailer';

// Import email utility directly since the relative import is causing issues
// on Vercel's serverless environment
// Create a nodemailer transporter with OVH SMTP settings
const transporter = nodemailer.createTransport({
  host: 'ssl0.ovh.net',
  port: 465,
  secure: true, // true for SSL on port 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

/**
 * Format order details as HTML for email
 * 
 * @param {Object} order - The order object
 * @returns {string} - HTML content
 */
function formatHTML(order) {
  // Format customer details
  const customerDetails = `
    <p><strong>Client:</strong> ${order.customer_name}</p>
    <p><strong>Email:</strong> ${order.customer_email}</p>
    <p><strong>Téléphone:</strong> ${order.customer_phone}</p>
  `;
  
  // Format pickup time in a readable format
  let readablePickupTime = order.pickup_time;
  if (order.pickup_time === 'ASAP') {
    readablePickupTime = 'Dès que possible';
  } else if (order.pickup_time === '15min') {
    readablePickupTime = 'Dans 15 minutes';
  } else if (order.pickup_time === '30min') {
    readablePickupTime = 'Dans 30 minutes';
  } else if (order.pickup_time === '45min') {
    readablePickupTime = 'Dans 45 minutes';
  } else if (order.pickup_time === '60min') {
    readablePickupTime = 'Dans 1 heure';
  } else if (order.pickup_time === '90min') {
    readablePickupTime = 'Dans 1h30';
  } else if (order.pickup_time === '120min') {
    readablePickupTime = 'Dans 2 heures';
  }
  
  // Format order details
  const orderDetails = `
    <p><strong>Heure de retrait:</strong> ${readablePickupTime}</p>
    <p><strong>Instructions:</strong> ${order.notes || 'Aucune instruction particulière'}</p>
    <p><strong>Total:</strong> ${order.total.toFixed(2)}€</p>
  `;
  
  // Format items as HTML list
  const itemsList = order.items
    .split('; ')
    .map(item => `<li>${item}</li>`)
    .join('');
  
  // Calculate estimated ready time in France timezone
  let readyTimeEstimate = '';
  
  // Get the current time in France
  const options = { timeZone: 'Europe/Paris' };
  const orderDateTime = new Date(new Date().toLocaleString('en-US', options));
  
  // Ensure minimum preparation time of 25 minutes
  const minPreparationMinutes = 25;
  
  if (order.pickup_time === 'ASAP') {
    // Use minimum 25 minutes for ASAP orders
    const readyTime = new Date(orderDateTime.getTime() + minPreparationMinutes * 60000);
    readyTimeEstimate = readyTime.toLocaleTimeString('fr-FR', { 
      timeZone: 'Europe/Paris',
      hour: '2-digit', 
      minute: '2-digit' 
    });
  } else if (order.pickup_time.endsWith('min')) {
    // Extract the number of minutes
    let minutes = parseInt(order.pickup_time.replace('min', ''));
    
    // Enforce minimum preparation time
    minutes = Math.max(minutes, minPreparationMinutes);
    
    const readyTime = new Date(orderDateTime.getTime() + minutes * 60000);
    readyTimeEstimate = readyTime.toLocaleTimeString('fr-FR', { 
      timeZone: 'Europe/Paris',
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #F2B705; padding: 15px; text-align: center; border-radius: 5px; margin-bottom: 20px; }
          .header h1 { margin: 0; color: #000; }
          .section { margin-bottom: 25px; padding: 15px; background-color: #f9f9f9; border-radius: 5px; }
          .items { background-color: #fff; padding: 15px; border-radius: 5px; }
          .footer { text-align: center; font-size: 0.8em; color: #777; margin-top: 30px; }
          .highlight { background-color: #FFF0C5; padding: 10px; border-radius: 5px; border-left: 4px solid #F2B705; margin-bottom: 15px; }
          .time-block { background-color: #F04D4E; color: white; font-size: 24px; padding: 15px; text-align: center; border-radius: 5px; margin-bottom: 15px; }
          .btn { display: inline-block; padding: 10px 20px; background-color: #F2B705; color: #000; text-decoration: none; border-radius: 5px; font-weight: bold; margin-bottom: 15px; }
          table { width: 100%; border-collapse: collapse; }
          table th, table td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
          table th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="time-block">
            🕒 À PRÉPARER POUR ${readyTimeEstimate}
          </div>
        
          <div class="header">
            <h1>Nouvelle Commande #${order.id.substring(0, 8)}</h1>
            <p>${order.date} à ${order.time}</p>
          </div>
          
          <div class="highlight">
            <p style="margin: 0; font-size: 16px;"><strong>Information:</strong> Le client a demandé un retrait ${readablePickupTime.toLowerCase()}</p>
          </div>
          
          <div class="section">
            <h2>Détails Client</h2>
            ${customerDetails}
            <a href="tel:${order.customer_phone}" class="btn">📞 Appeler le client</a>
          </div>
          
          <div class="section">
            <h2>Informations Commande</h2>
            ${orderDetails}
          </div>
          
          <div class="section">
            <h2>Articles Commandés</h2>
            <div class="items">
              <table style="width:100%">
                <tr>
                  <th>Quantité</th>
                  <th>Article</th>
                </tr>
                ${order.items.split('; ').map(item => {
                  const [quantity, name] = item.split('x ');
                  return `<tr>
                    <td>${quantity.trim()}</td>
                    <td>${name.trim()}</td>
                  </tr>`;
                }).join('')}
              </table>
            </div>
          </div>
          
          <div class="footer">
            <p>Mon P'tit Poulet - 24 Rue des Olivettes, 44000 Nantes</p>
            <p>Commande passée sur <a href="https://www.mppp.fr">www.mppp.fr</a></p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Format order details as plain text for email
 * 
 * @param {Object} order - The order object
 * @returns {string} - Plain text content
 */
function formatPlain(order) {
  // Format pickup time in a readable format
  let readablePickupTime = order.pickup_time;
  if (order.pickup_time === 'ASAP') {
    readablePickupTime = 'Dès que possible';
  } else if (order.pickup_time === '15min') {
    readablePickupTime = 'Dans 15 minutes';
  } else if (order.pickup_time === '30min') {
    readablePickupTime = 'Dans 30 minutes';
  } else if (order.pickup_time === '45min') {
    readablePickupTime = 'Dans 45 minutes';
  } else if (order.pickup_time === '60min') {
    readablePickupTime = 'Dans 1 heure';
  } else if (order.pickup_time === '90min') {
    readablePickupTime = 'Dans 1h30';
  } else if (order.pickup_time === '120min') {
    readablePickupTime = 'Dans 2 heures';
  }
  
  // Calculate estimated ready time in France timezone
  let readyTimeEstimate = '';
  
  // Get the current time in France
  const options = { timeZone: 'Europe/Paris' };
  const orderDateTime = new Date(new Date().toLocaleString('en-US', options));
  
  // Ensure minimum preparation time of 25 minutes
  const minPreparationMinutes = 25;
  
  if (order.pickup_time === 'ASAP') {
    // Use minimum 25 minutes for ASAP orders
    const readyTime = new Date(orderDateTime.getTime() + minPreparationMinutes * 60000);
    readyTimeEstimate = readyTime.toLocaleTimeString('fr-FR', { 
      timeZone: 'Europe/Paris',
      hour: '2-digit', 
      minute: '2-digit' 
    });
  } else if (order.pickup_time.endsWith('min')) {
    // Extract the number of minutes
    let minutes = parseInt(order.pickup_time.replace('min', ''));
    
    // Enforce minimum preparation time
    minutes = Math.max(minutes, minPreparationMinutes);
    
    const readyTime = new Date(orderDateTime.getTime() + minutes * 60000);
    readyTimeEstimate = readyTime.toLocaleTimeString('fr-FR', { 
      timeZone: 'Europe/Paris',
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
  
  // Format items as a readable list
  const itemsList = order.items.split('; ').map(item => {
    const parts = item.split('x ');
    if (parts.length === 2) {
      return `${parts[0].trim()}x ${parts[1].trim()}`;
    }
    return item;
  }).join('\n');
  
  return `
NOUVELLE COMMANDE #${order.id.substring(0, 8)}
${order.date} à ${order.time}

⏰ COMMANDE À PRÉPARER POUR: ${readyTimeEstimate}
Note: Le client a demandé ${readablePickupTime.toLowerCase()}

DÉTAILS CLIENT
-------------
Client: ${order.customer_name}
Email: ${order.customer_email}
Téléphone: ${order.customer_phone}

INFORMATIONS COMMANDE
--------------------
Heure de retrait: ${readablePickupTime}
Instructions: ${order.notes || 'Aucune instruction particulière'}
Total: ${order.total.toFixed(2)}€

ARTICLES COMMANDÉS
-----------------
${itemsList}

--
Mon P'tit Poulet - 24 Rue des Olivettes, 44000 Nantes
Commande passée sur www.mppp.fr
  `;
}

/**
 * Send an order notification email
 * 
 * @param {Object} order - The order details
 * @returns {Promise<Object>} - Mail delivery result
 */
async function sendOrderEmail(order) {
  try {
    // Skip if email is disabled
    if (process.env.EMAIL_ENABLED !== 'true') {
      console.log('Email notifications are disabled');
      return { skipped: true };
    }
    
    // Get current timestamp for logging
    const timestamp = new Date().toISOString();
    
    // Prepare email
    const mailOptions = {
      from: `"Mon P'tit Poulet - Commandes" <${process.env.EMAIL_USER}>`,
      to: process.env.ORDER_EMAIL || 'commandes@mppp.fr',
      subject: `🧾 Nouvelle commande #${order.id.substring(0, 8)}`,
      text: formatPlain(order),
      html: formatHTML(order)
    };
    
    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log(`${timestamp} - Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('Error sending order email:', error);
    // Don't throw, just log, to prevent webhook failures
    return { error: error.message };
  }
}

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
          
          // Format order time using France timezone
          let orderDate;
          
          if (session.metadata?.order_time) {
            // Use the order_time from metadata (which should be in France time)
            orderDate = new Date(session.metadata.order_time);
          } else {
            // Fallback: Get current time in France
            const options = { timeZone: 'Europe/Paris' };
            orderDate = new Date(new Date().toLocaleString('en-US', options));
          }
          
          // Format date as DD/MM/YYYY in French format
          const date = orderDate.toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris' });
          
          // Format time as HH:MM in French format
          const time = orderDate.toLocaleTimeString('fr-FR', { 
            timeZone: 'Europe/Paris',
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