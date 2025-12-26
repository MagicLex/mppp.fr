import React, { useState, useEffect } from 'react';
import { createPayment } from '../services/payplugService';
import { createStripeCheckout } from '../services/stripeService';
import { createOrUpdateContact } from '../services/hubspot';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';
import { trackPurchase } from '../services/analytics';

interface PaymentFormProps {
  orderDetails: {
    name: string;
    phone: string;
    email: string;
    pickupTime: string;
  };
  onSuccess: () => void;
}

export default function PaymentForm({ orderDetails, onSuccess }: PaymentFormProps) {
  const { total, items, clearCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentId, setPaymentId] = useState('');

  // In a production app, we don't need to initialize the payment on load
  // We'll do it when the user clicks the submit button

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    console.log('Order details:', orderDetails);
    console.log('Cart items:', items);
    
    setIsProcessing(true);

    try {
      // Create return and cancel URLs - use hash router format (#/)
      const returnUrl = `${window.location.origin}/#/payment-success`;
      const cancelUrl = `${window.location.origin}/#/payment-cancel`;
      
      // Create/update contact in HubSpot
      await createOrUpdateContact({
        email: orderDetails.email,
        firstname: orderDetails.name,
        phone: orderDetails.phone,
        lastorder: new Date().toISOString()
      });
      
      // Initialize payment intent with PayPlug
      const paymentIntent = await createPayment(
        items, 
        orderDetails,
        returnUrl,
        cancelUrl
      );
      
      // Store order info in localStorage so we can retrieve it when customer returns
      localStorage.setItem('mpp_order', JSON.stringify({
        items,
        orderDetails,
        total,
        paymentId: paymentIntent.id,
        timestamp: new Date().toISOString()
      }));
      
      // Direct the user to PayPlug's hosted payment page
      if (paymentIntent && paymentIntent.clientSecret) {
        console.log("Redirecting to PayPlug payment page:", paymentIntent.clientSecret);
        window.location.href = paymentIntent.clientSecret;
      } else {
        console.error("Invalid payment URL. Payment cannot proceed.");
        toast.error("Une erreur est survenue lors de la redirection vers la page de paiement. Veuillez réessayer.");
        setIsProcessing(false);
      }
      
      // Payment processing will be handled by PayPlug
      // The rest of this code won't execute because we're redirecting

      // This code won't run due to the redirect
      // Deal creation and purchase tracking will be handled in the payment success component
    } catch (error) {
      console.error('Payment error:', error);
      
      // Provide more specific error feedback based on PayPlug error patterns
      if (error instanceof Error) {
        let errorMessage = error.message;
        
        // Handle common PayPlug API errors
        if (error.message.includes('SyntaxError')) {
          errorMessage = 'Service de paiement indisponible. Veuillez réessayer plus tard.';
        } else if (error.message.includes('403')) {
          errorMessage = 'Problème d\'authentification avec notre service de paiement.';
        } else if (error.message.includes('CORS')) {
          errorMessage = 'Problème technique. Veuillez réessayer dans quelques instants.';
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Connexion au service de paiement impossible. Vérifiez votre connexion internet.';
        }
        
        // Log for debugging
        console.error("Payment error details:", error);
        
        // Show user-friendly message
        toast.error(`Erreur: ${errorMessage}`, { duration: 8000 });
      } else {
        toast.error('Erreur lors du paiement. Veuillez réessayer.', { duration: 5000 });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // No input handling needed

  const handleStripePayment = async (event: React.MouseEvent) => {
    event.preventDefault();
    
    console.log('Processing Stripe payment...');
    console.log('Order details:', orderDetails);
    console.log('Cart items:', items);
    
    setIsProcessing(true);

    try {
      // Create/update contact in HubSpot
      await createOrUpdateContact({
        email: orderDetails.email,
        firstname: orderDetails.name,
        phone: orderDetails.phone,
        lastorder: new Date().toISOString()
      });
      
      // Client-only implementation will handle redirect to Stripe checkout
      // and store order data in localStorage
      await createStripeCheckout(items, orderDetails);
      
      // Note: The createStripeCheckout function will redirect to Stripe
      // so this code below will not execute unless there's an error
      
    } catch (error) {
      console.error('Stripe payment error:', error);
      
      // Show user-friendly error message
      if (error instanceof Error) {
        toast.error(`Erreur: ${error.message}`, { duration: 8000 });
      } else {
        toast.error('Erreur lors du paiement. Veuillez réessayer.', { duration: 5000 });
      }
      
      setIsProcessing(false);
    }
  };

  const handlePayPlugPayment = async (event: React.MouseEvent) => {
    event.preventDefault();
    
    console.log('Processing PayPlug payment...');
    console.log('Order details:', orderDetails);
    console.log('Cart items:', items);
    
    setIsProcessing(true);

    try {
      // Create return and cancel URLs - use hash router format (#/)
      const returnUrl = `${window.location.origin}/#/payment-success`;
      const cancelUrl = `${window.location.origin}/#/payment-cancel`;
      
      // Create/update contact in HubSpot
      await createOrUpdateContact({
        email: orderDetails.email,
        firstname: orderDetails.name,
        phone: orderDetails.phone,
        lastorder: new Date().toISOString()
      });
      
      // Initialize payment intent with PayPlug
      const paymentIntent = await createPayment(
        items, 
        orderDetails,
        returnUrl,
        cancelUrl
      );
      
      // Store order info in localStorage so we can retrieve it when customer returns
      localStorage.setItem('mpp_order', JSON.stringify({
        items,
        orderDetails,
        total,
        paymentId: paymentIntent.id,
        paymentMethod: 'payplug',
        timestamp: new Date().toISOString()
      }));
      
      // Direct the user to PayPlug's hosted payment page
      if (paymentIntent && paymentIntent.clientSecret) {
        console.log("Redirecting to PayPlug payment page:", paymentIntent.clientSecret);
        window.location.href = paymentIntent.clientSecret;
      } else {
        console.error("Invalid payment URL. Payment cannot proceed.");
        toast.error("Une erreur est survenue lors de la redirection vers la page de paiement. Veuillez réessayer.");
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('PayPlug payment error:', error);
      
      // Provide more specific error feedback based on PayPlug error patterns
      if (error instanceof Error) {
        let errorMessage = error.message;
        
        // Handle common PayPlug API errors
        if (error.message.includes('SyntaxError')) {
          errorMessage = 'Service de paiement indisponible. Veuillez réessayer plus tard.';
        } else if (error.message.includes('403')) {
          errorMessage = 'Problème d\'authentification avec notre service de paiement.';
        } else if (error.message.includes('CORS')) {
          errorMessage = 'Problème technique. Veuillez réessayer dans quelques instants.';
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Connexion au service de paiement impossible. Vérifiez votre connexion internet.';
        }
        
        // Log for debugging
        console.error("Payment error details:", error);
        
        // Show user-friendly message
        toast.error(`Erreur: ${errorMessage}`, { duration: 8000 });
      } else {
        toast.error('Erreur lors du paiement. Veuillez réessayer.', { duration: 5000 });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-4 border-4 border-black rounded-2xl bg-white space-y-4">
        <h3 className="text-xl font-cartoon text-center mb-4">Choisissez votre méthode de paiement</h3>
        
        {/* Stripe Payment Button */}
        <button
          onClick={handleStripePayment}
          disabled={isProcessing}
          className="w-full btn-cartoon bg-blue-600 text-white py-3 px-4 rounded-2xl text-lg border-4 border-black mb-4 hover:bg-blue-700 transition-colors"
          style={{ boxShadow: '4px 4px 0 #000' }}
        >
          {isProcessing ? 'Traitement en cours...' : 'Payer par Carte Bancaire (Stripe)'}
        </button>
        
        {/* PayPlug Payment Button */}
        <button
          onClick={handlePayPlugPayment}
          disabled={isProcessing}
          className="w-full btn-cartoon bg-amber-500 text-black py-3 px-4 rounded-2xl text-lg border-4 border-black hover:bg-amber-600 transition-colors"
          style={{ boxShadow: '4px 4px 0 #000' }}
        >
          {isProcessing ? 'Traitement en cours...' : 'Payer par Carte Bancaire (PayPlug)'}
        </button>
        
        {/* Contact Info */}
        <div className="text-center mt-6 border-t-2 border-gray-200 pt-4">
          <p className="text-sm text-gray-700">
            Besoin d'aide avec votre commande?
          </p>
          <p className="text-sm font-bold mt-1">
            Appelez-nous au 06 68 85 18 03
          </p>
        </div>
      </div>
    </div>
  );
}