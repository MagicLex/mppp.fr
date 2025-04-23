/**
 * Email utility for sending order notifications
 */
import nodemailer from 'nodemailer';

// Create a nodemailer transporter with OVH SMTP settings
const transporter = nodemailer.createTransport({
  host: 'ssl0.ovh.net',
  port: 587,
  secure: false, // false for TLS - port 587
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
  
  // Format order details
  const orderDetails = `
    <p><strong>Heure de retrait:</strong> ${order.pickup_time}</p>
    <p><strong>Instructions:</strong> ${order.notes}</p>
    <p><strong>Total:</strong> ${order.total.toFixed(2)}€</p>
  `;
  
  // Format items as HTML list
  const itemsList = order.items
    .split('; ')
    .map(item => `<li>${item}</li>`)
    .join('');
  
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
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Nouvelle Commande #${order.id}</h1>
            <p>${order.date} à ${order.time}</p>
          </div>
          
          <div class="section">
            <h2>Détails Client</h2>
            ${customerDetails}
          </div>
          
          <div class="section">
            <h2>Informations Commande</h2>
            ${orderDetails}
          </div>
          
          <div class="section">
            <h2>Articles Commandés</h2>
            <div class="items">
              <ul>
                ${itemsList}
              </ul>
            </div>
          </div>
          
          <div class="footer">
            <p>Mon P'tit Poulet - 24 Rue des Olivettes, 44000 Nantes</p>
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
  return `
NOUVELLE COMMANDE #${order.id}
${order.date} à ${order.time}

DÉTAILS CLIENT
-------------
Client: ${order.customer_name}
Email: ${order.customer_email}
Téléphone: ${order.customer_phone}

INFORMATIONS COMMANDE
--------------------
Heure de retrait: ${order.pickup_time}
Instructions: ${order.notes}
Total: ${order.total.toFixed(2)}€

ARTICLES COMMANDÉS
-----------------
${order.items.split('; ').join('\n')}

--
Mon P'tit Poulet - 24 Rue des Olivettes, 44000 Nantes
  `;
}

/**
 * Send an order notification email
 * 
 * @param {Object} order - The order details
 * @returns {Promise<Object>} - Mail delivery result
 */
export async function sendOrderEmail(order) {
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
      from: `"MPPP Commande" <${process.env.EMAIL_USER}>`,
      to: process.env.ORDER_EMAIL || 'contact@mppp.fr',
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