import React, { useState, useEffect } from 'react';
import { createPayment, confirmPayment } from '../services/zettle';
import { createOrUpdateContact, createDealForContact } from '../services/hubspot';
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
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: ''
  });

  useEffect(() => {
    const initializePayment = async () => {
      try {
        if (total > 0) {
          const { paymentId: newPaymentId } = await createPayment(total * 100); // amount in cents
          setPaymentId(newPaymentId);
        }
      } catch (error) {
        console.error('Error initializing Zettle payment:', error);
        toast.error('Erreur lors de la préparation du paiement');
      }
    };

    initializePayment();
  }, [total]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    // Validate card details
    if (!cardDetails.cardNumber || !cardDetails.expiryDate || !cardDetails.cvv) {
      toast.error('Veuillez saisir tous les détails de votre carte');
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

      // Confirm payment with Zettle
      // In a real app, this would send the card details securely to your backend
      // Your backend would then use Zettle API to process the payment
      const { success, transactionId } = await confirmPayment(paymentId);
      
      if (!success) {
        throw new Error('Payment confirmation failed');
      }

      // Create order summary
      const orderSummary = items.map(item => 
        `${item.quantity}x ${item.product.name}`
      ).join(', ');

      // Create deal in HubSpot
      await createDealForContact(
        orderDetails.email,
        total,
        `Commande: ${orderSummary}. Heure de retrait: ${orderDetails.pickupTime}`
      );
      
      // Track purchase event
      trackPurchase(
        transactionId,
        total,
        items.map(item => ({
          productId: item.product.id,
          productName: item.product.name,
          price: item.product.price + (item.options ? item.options.reduce((sum, opt) => sum + opt.price, 0) : 0),
          quantity: item.quantity
        }))
      );

      // Handle successful payment
      clearCart();
      onSuccess();
      toast.success('Paiement réussi! Votre commande est confirmée.');
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Erreur lors du paiement. Veuillez réessayer.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCardDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 border-4 border-black rounded-2xl bg-white space-y-4">
        <div>
          <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-1">
            Numéro de carte
          </label>
          <input
            id="cardNumber"
            name="cardNumber"
            type="text"
            placeholder="1234 5678 9012 3456"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            value={cardDetails.cardNumber}
            onChange={handleInputChange}
            maxLength={19}
          />
        </div>
        
        <div className="flex space-x-4">
          <div className="flex-1">
            <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 mb-1">
              Date d'expiration
            </label>
            <input
              id="expiryDate"
              name="expiryDate"
              type="text"
              placeholder="MM/AA"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              value={cardDetails.expiryDate}
              onChange={handleInputChange}
              maxLength={5}
            />
          </div>
          
          <div className="w-1/3">
            <label htmlFor="cvv" className="block text-sm font-medium text-gray-700 mb-1">
              CVV
            </label>
            <input
              id="cvv"
              name="cvv"
              type="text"
              placeholder="123"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              value={cardDetails.cvv}
              onChange={handleInputChange}
              maxLength={4}
            />
          </div>
        </div>

        <div className="flex items-center pt-2">
          <span className="text-sm text-gray-500">Paiement sécurisé</span>
        </div>
      </div>
      
      <button
        type="submit"
        disabled={isProcessing}
        className={`w-full btn-cartoon bg-amber-400 text-white py-3 px-4 rounded-2xl font-cartoon text-lg ${
          isProcessing ? 'opacity-70 cursor-not-allowed' : 'hover:bg-amber-500'
        }`}
      >
        {isProcessing ? 'Traitement en cours...' : `Payer ${total.toFixed(2)}€`}
      </button>
    </form>
  );
}