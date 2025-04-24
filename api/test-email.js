/**
 * Test endpoint for sending sample order emails
 * THIS SHOULD BE REMOVED IN PRODUCTION
 */
import { sendOrderEmail } from './utils/email';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Sample order data (can be overridden by request body)
    const defaultOrder = {
      id: 'test_' + Date.now().toString(),
      date: new Date().toLocaleDateString('fr-FR'),
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      customer_name: 'Client Test',
      customer_email: 'test@example.com',
      customer_phone: '0612345678',
      pickup_time: '30min',
      notes: 'Ceci est un test de notification de commande',
      total: 28.50,
      items: '1x Poulet entier; 2x Coca-Cola; 1x Pommes de terre'
    };
    
    // Merge default data with request body if provided
    const testOrder = { ...defaultOrder, ...req.body };
    
    // Send test email
    const result = await sendOrderEmail(testOrder);
    
    res.status(200).json({ 
      success: true, 
      message: 'Test email sent successfully', 
      emailResult: result,
      orderData: testOrder
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to send test email', 
      message: error.message 
    });
  }
}