import { CartItem, OrderDetails } from '../types';

/**
 * Creates a Stripe checkout session through our Vercel serverless function
 */
export async function createStripeCheckout(
  items: CartItem[],
  orderDetails: OrderDetails,
  options?: { override?: boolean }
): Promise<{ id: string; url: string }> {
  try {
    console.log('Creating Stripe checkout for items:', items);
    console.log('Order details:', orderDetails);
    
    // For Vercel API routes
    const response = await fetch(`${window.location.origin}/api/create-checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        items, 
        orderDetails,
        override: options?.override || false, // Pass override flag if provided
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.message || 'Failed to create checkout session');
      } catch (e) {
        throw new Error(`Failed to create checkout session: ${errorText}`);
      }
    }
    
    const session = await response.json();
    console.log('Stripe session created:', session);
    
    // Store order info in localStorage so we can retrieve it when customer returns
    const totalAmount = items.reduce((sum, item) => {
      const basePrice = item.product.price * item.quantity;
      const optionsTotal = item.options ? 
        item.options.reduce((optSum, opt) => optSum + opt.price, 0) * item.quantity : 0;
      return sum + basePrice + optionsTotal;
    }, 0);
    
    localStorage.setItem('mpp_order', JSON.stringify({
      items,
      orderDetails,
      total: totalAmount,
      paymentId: session.id,
      paymentMethod: 'stripe',
      timestamp: new Date().toISOString()
    }));
    
    return {
      id: session.id,
      url: session.url,
    };
  } catch (error) {
    console.error('Error creating Stripe checkout:', error);
    throw error;
  }
}

/**
 * Retrieves a Stripe session from our Vercel serverless function
 */
export async function getSessionStatus(sessionId: string): Promise<any> {
  try {
    console.log('Retrieving Stripe session status:', sessionId);
    
    // For Vercel API routes
    const response = await fetch(`${window.location.origin}/api/session?sessionId=${encodeURIComponent(sessionId)}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.message || 'Failed to retrieve session');
      } catch (e) {
        throw new Error(`Failed to retrieve session: ${errorText}`);
      }
    }
    
    const session = await response.json();
    console.log('Stripe session retrieved:', session);
    
    return session;
  } catch (error) {
    console.error('Error retrieving Stripe session:', error);
    throw error;
  }
}