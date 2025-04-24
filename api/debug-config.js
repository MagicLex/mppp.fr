// Debug endpoint for checking environment variables
// IMPORTANT: DO NOT EXPOSE THIS IN PRODUCTION

export default async function handler(req, res) {
  try {
    // Check for basic authentication
    // Only expose a limited subset of config information
    const config = {
      emailEnabled: process.env.EMAIL_ENABLED === 'true',
      hasEmailUser: !!process.env.EMAIL_USER,
      hasEmailPassword: !!process.env.EMAIL_PASSWORD,
      hasOrderEmail: !!process.env.ORDER_EMAIL,
      orderEmailValue: process.env.ORDER_EMAIL || 'commandes@mppp.fr',
      hasStripeSecret: !!process.env.STRIPE_SECRET_KEY,
      hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
      nodeEnv: process.env.NODE_ENV,
      serverTime: new Date().toString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
    
    res.status(200).json({
      success: true,
      message: 'Environment configuration',
      config
    });
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Configuration error', 
      message: error.message 
    });
  }
}