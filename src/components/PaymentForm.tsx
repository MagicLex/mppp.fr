import React, { useState, useEffect } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { createPaymentIntent } from '../services/stripe';
import { createOrUpdateContact, createDealForContact } from '../services/hubspot';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';

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
  const stripe = useStripe();
  const elements = useElements();
  const { total, items, clearCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const [paymentIntentId, setPaymentIntentId] = useState('');

  useEffect(() => {
    const getPaymentIntent = async () => {
      try {
        const { clientSecret, id } = await createPaymentIntent(total * 100); // amount in cents
        setClientSecret(clientSecret);
        setPaymentIntentId(id);
      } catch (error) {
        console.error('Error creating payment intent:', error);
        toast.error('Erreur lors de la préparation du paiement');
      }
    };

    if (total > 0) {
      getPaymentIntent();
    }
  }, [total]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      return;
    }

    setIsProcessing(true);

    try {
      // Create/update contact in HubSpot
      await createOrUpdateContact({
        email: orderDetails.email,
        firstname: orderDetails.name,
        phone: orderDetails.phone,
        lastorder: new Date().toISOString()
      });

      // In a real app, this would be confirmed by your backend
      // For demo, we'll simulate a successful payment
      const orderSummary = items.map(item => 
        `${item.quantity}x ${item.product.name}`
      ).join(', ');

      // Create deal in HubSpot
      await createDealForContact(
        orderDetails.email,
        total,
        `Commande: ${orderSummary}. Heure de retrait: ${orderDetails.pickupTime}`
      );

      // Simulate payment confirmation
      // In a real app, you would use stripe.confirmCardPayment with the clientSecret
      setTimeout(() => {
        clearCart();
        onSuccess();
        toast.success('Paiement réussi! Votre commande est confirmée.');
        setIsProcessing(false);
      }, 2000);
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Erreur lors du paiement. Veuillez réessayer.');
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 border-4 border-black rounded-2xl bg-white">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
              },
            },
          }}
        />
      </div>
      
      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className={`w-full btn-cartoon bg-amber-400 text-white py-3 px-4 rounded-2xl font-cartoon text-lg ${
          isProcessing ? 'opacity-70 cursor-not-allowed' : 'hover:bg-amber-500'
        }`}
      >
        {isProcessing ? 'Traitement en cours...' : `Payer ${total.toFixed(2)}€`}
      </button>
    </form>
  );
}