import { CartItem, OrderDetails, PaymentIntent } from '../types';
import { v4 as uuidv4 } from 'uuid';

// PayPlug Integration - Based on API version 1.0.7
// Official PayPlug API endpoint: https://api.payplug.com/v1

const PAYPLUG_TEST_SECRET_KEY = 'sk_test_2h7Rx3fonFGxwrdDL9tMwL';
const PAYPLUG_API_VERSION = '2019-08-06';

// We need to use a CORS proxy since we only have FTP access
// Using corsproxy.io as the primary proxy service
const CORS_PROXY = 'https://corsproxy.io/?';
const PAYPLUG_API_URL = CORS_PROXY + 'https://api.payplug.com/v1';

// Helper to format cart items for PayPlug's payment_context
function formatCartItems(items: CartItem[]) {
  return items.map(item => {
    // Calculate item price including options
    const basePrice = item.product.price;
    const optionsTotal = item.options ? item.options.reduce((sum, opt) => sum + opt.price, 0) : 0;
    const itemPrice = basePrice + optionsTotal;
    
    // Handle options in the item name if present
    let productName = item.product.name;
    if (item.options && item.options.length > 0) {
      const optionNames = item.options.map(opt => opt.name).join(', ');
      productName = `${productName} (${optionNames})`;
    }
    
    return {
      brand: "Mon P'tit Poulet",
      expected_delivery_date: getTodayPlusDays(1), // Tomorrow
      delivery_label: "Retrait en boutique",
      delivery_type: "SHIP_TO_STORE", // PSD2 compliant value
      merchant_item_id: item.product.id,
      name: productName,
      price: Math.round(itemPrice * 100), // Convert to cents
      quantity: item.quantity,
      total_amount: Math.round(itemPrice * item.quantity * 100), // Convert to cents
    };
  });
}

// Helper to get a date in YYYY-MM-DD format
function getTodayPlusDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

export async function createPayment(
  items: CartItem[],
  customerDetails: OrderDetails,
  returnUrl: string,
  cancelUrl: string,
): Promise<PaymentIntent> {
  try {
    console.log('Creating payment for items:', items);
    console.log('Customer details:', customerDetails);
    
    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => {
      const itemTotal = item.product.price * item.quantity;
      const optionsTotal = item.options ? 
        item.options.reduce((optSum, opt) => optSum + opt.price, 0) * item.quantity : 0;
      return sum + itemTotal + optionsTotal;
    }, 0);
    
    // Amount in cents with VAT - PayPlug requires amount in cents
    const amountInCents = Math.round(totalAmount * 100);
    console.log(`Total amount: ${totalAmount}€ (${amountInCents} cents)`);
    
    // Split the name into first and last name
    const nameParts = customerDetails.name.split(' ');
    const firstName = nameParts[0] || 'Client';
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'MPP';
    
    // Create payment payload according to PayPlug API documentation v1.0.7
    const payload = {
      amount: amountInCents,
      currency: "EUR",
      customer: {
        first_name: firstName,
        last_name: lastName,
        email: customerDetails.email,
        // Additional required fields for PSD2 compliance
        address1: "24 Rue des Olivettes",
        postcode: "44000",
        city: "Nantes",
        country: "FR",
        language: "fr"
      },
      hosted_payment: {
        return_url: returnUrl,
        cancel_url: cancelUrl
      },
      notification_url: "https://mppp.fr/api/payment-webhook", // Would need server implementation
      // Always enable 3DS for maximum security
      force_3ds: true,
      // Store order details and customer info in metadata
      metadata: {
        customer_name: customerDetails.name,
        customer_phone: customerDetails.phone,
        pickup_time: customerDetails.pickupTime || "Dès que possible",
        order_id: uuidv4().substring(0, 8),
        order_items: JSON.stringify(items.map(item => `${item.quantity}x ${item.product.name}`).slice(0, 3))
      }
    };
    
    // Log the complete payload for debugging
    console.log('Payment payload:', JSON.stringify(payload, null, 2));
    
    // For development/testing, we're returning a simulated payment intent
    // In production, this would be an actual API call to PayPlug
    
    // IMPORTANT: In a production environment, this API call should be made server-side
    // to protect your secret key. For now, we're doing it client-side just for demonstration.
    
    // IMPORTANT: This is a client-side API call to PayPlug
    // In a production environment, this should be implemented server-side
    
    try {
      console.log(`Making API request to PayPlug via CORS proxy`);
      
      const response = await fetch(`${PAYPLUG_API_URL}/payments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PAYPLUG_TEST_SECRET_KEY}`,
          'Content-Type': 'application/json',
          'PayPlug-Version': PAYPLUG_API_VERSION
        },
        body: JSON.stringify(payload)
      });
      
      // Better error handling with text fallback
      if (!response.ok) {
        let errorMessage = 'Payment creation failed';
        try {
          const errorText = await response.text();
          
          // Try to parse error as JSON
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.message || errorData.error || errorMessage;
            console.error("PayPlug error:", errorData);
          } catch (e) {
            // If can't parse as JSON, use text
            console.error("PayPlug error (text):", errorText);
            errorMessage = errorText || errorMessage;
          }
        } catch (e) {
          console.error("Failed to read error response", e);
        }
        
        throw new Error(errorMessage);
      }
      
      // Parse successful response
      const data = await response.json();
      
      console.log("PayPlug payment created:", data);
      
      // Return the payment URL so we can redirect the user
      // Make sure we have a valid payment URL
      if (!data.hosted_payment || !data.hosted_payment.payment_url) {
        throw new Error('No payment URL returned from PayPlug');
      }
      
      console.log("Received payment URL:", data.hosted_payment.payment_url);
      
      return {
        id: data.id,
        clientSecret: data.hosted_payment.payment_url,
      };
    } catch (apiError) {
      console.error("PayPlug API error:", apiError);
      throw apiError;
    }
    
    // In production, this would use backend endpoint to keep API key secure
    // For now, we're using a simulated response, but in production you'd use:
    
    /* PRODUCTION CODE:
    
    // This should be moved to a secure backend endpoint
    const response = await fetch(`${PAYPLUG_API_URL}/payments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYPLUG_TEST_SECRET_KEY}`,
        'Content-Type': 'application/json',
        'PayPlug-Version': PAYPLUG_API_VERSION
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Payment creation failed');
    }
    
    const data = await response.json();
    
    return {
      id: data.id,
      clientSecret: data.hosted_payment.payment_url,
    };
    */
    
    // IMPORTANT: In a real implementation, NEVER expose your secret key in frontend code
    // Always use a backend endpoint to create payments
    
  } catch (error) {
    console.error('Error creating payment:', error);
    throw error;
  }
}

export async function confirmPayment(paymentIntentId: string): Promise<{ success: boolean }> {
  // Check payment status with PayPlug according to API documentation v1.0.7
  try {
    console.log('Confirming payment with ID:', paymentIntentId);
    
    // Encode the payment ID to handle special characters in URLs
    const encodedId = encodeURIComponent(paymentIntentId);
    const url = `${PAYPLUG_API_URL}/payments/${encodedId}`;
    
    try {
      console.log(`Retrieving payment status from: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${PAYPLUG_TEST_SECRET_KEY}`,
          'Content-Type': 'application/json',
          'PayPlug-Version': PAYPLUG_API_VERSION
        }
      });
      
      // Better error handling with text fallback
      if (!response.ok) {
        let errorMessage = 'Payment confirmation failed';
        try {
          const errorText = await response.text();
          
          // Try to parse error as JSON
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.message || errorData.error || errorMessage;
            console.error("PayPlug error:", errorData);
          } catch (e) {
            // If can't parse as JSON, use text
            console.error("PayPlug error (text):", errorText);
            errorMessage = errorText || errorMessage;
          }
        } catch (e) {
          console.error("Failed to read error response", e);
        }
        
        throw new Error(errorMessage);
      }
      
      // Parse successful response
      const data = await response.json();
      console.log("PayPlug payment status:", data);
      
      // According to the PayPlug API, is_paid indicates if payment was successful
      return {
        success: data.is_paid === true
      };
    } catch (apiError) {
      console.error("PayPlug API error:", apiError);
      throw apiError;
    }
  } catch (error) {
    console.error('Error confirming payment:', error);
    throw error;
  }
}