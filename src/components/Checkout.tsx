import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';
import { trackBeginCheckout } from '../services/analytics';
import { createStripeCheckout } from '../services/stripeService';
import { createOrUpdateContact } from '../services/hubspot';
import { isRestaurantOpen, getRestaurantStatus } from '../data/options';

export default function Checkout() {
  const navigate = useNavigate();
  const { items, total } = useCart();
  const [orderDetails, setOrderDetails] = useState({
    pickupTime: '',
    notes: ''
  });
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [restaurantStatus, setRestaurantStatus] = useState(getRestaurantStatus());
  
  // Check if restaurant is open periodically
  useEffect(() => {
    // Check restaurant status immediately
    setRestaurantStatus(getRestaurantStatus());
    
    // Set up an interval to check every minute
    const interval = setInterval(() => {
      setRestaurantStatus(getRestaurantStatus());
    }, 60000); // 60 seconds
    
    return () => clearInterval(interval); // Clean up on unmount
  }, []);

  if (items.length === 0) {
    navigate('/');
    return null;
  }
  
  // If restaurant is closed, show a message
  if (!restaurantStatus.isOpen) {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <h2 className="text-3xl font-bold text-amber-900">Finaliser la commande</h2>
        <div className="card-cartoon p-6 space-y-6">
          <div className="text-center p-4 bg-red-100 rounded-lg border-4 border-red-500">
            <h3 className="text-xl font-bold text-red-700 mb-2">Restaurant fermé</h3>
            <p className="text-red-700 mb-4">{restaurantStatus.message}</p>
            <button 
              onClick={() => navigate('/')} 
              className="btn-cartoon bg-amber-400 text-black py-2 px-4 rounded-xl"
            >
              Retour au menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Log form data before submission
    console.log('Form submission - Order details:', orderDetails);
    
    // Validate pickup time
    if (!orderDetails.pickupTime?.trim()) {
      alert('Veuillez indiquer une heure de retrait');
      return;
    }
    
    // Show payment options directly
    setShowPaymentOptions(true);
    
    // Track begin checkout event
    trackBeginCheckout(
      items.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        price: item.product.price + (item.options ? item.options.reduce((sum, opt) => sum + opt.price, 0) : 0),
        quantity: item.quantity
      })),
      total
    );
  };
  
  // Handle Stripe payment directly
  const handleStripePayment = async (event: React.MouseEvent<HTMLButtonElement> = null) => {
    console.log('Processing Stripe payment...');
    console.log('Order details:', orderDetails);
    console.log('Cart items:', items);
    
    // Check if Alt key is pressed (debug override for testing)
    const overrideMode = event?.altKey || false;
    if (overrideMode) {
      console.log('DEBUG MODE: Override restaurant hours check');
    }
    
    setIsProcessing(true);

    try {
      // Create simplified order details for Stripe
      const stripeOrderDetails = {
        pickupTime: orderDetails.pickupTime,
        notes: orderDetails.notes || 'Aucune instruction particulière'
      };
      
      // Create Stripe checkout session through our Vercel serverless function
      const session = await createStripeCheckout(items, stripeOrderDetails, { 
        override: overrideMode 
      });
      
      // Redirect to Stripe Checkout
      if (session && session.url) {
        console.log("Redirecting to Stripe checkout page:", session.url);
        window.location.href = session.url;
      } else {
        console.error("Invalid Stripe checkout URL. Payment cannot proceed.");
        toast.error("Une erreur est survenue lors de la redirection vers la page de paiement. Veuillez réessayer.");
        setIsProcessing(false);
      }
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

  // PayPlug payment has been removed as we're only using Stripe now

  const generateTimeSlots = () => {
    const slots = [];
    
    // Add relative time slots (30 min and beyond)
    const relativeTimeSlots = [
      { value: '30min', label: 'Dans 30 minutes' },
      { value: '45min', label: 'Dans 45 minutes' },
      { value: '60min', label: 'Dans 1 heure' },
      { value: '90min', label: 'Dans 1h30' },
      { value: '120min', label: 'Dans 2 heures' },
    ];
    
    // Get current hour to check if we're within business hours
    const now = new Date();
    const currentHour = now.getHours();
    
    // Only show time slots if we're within or approaching business hours (11:00 - 22:00)
    if (currentHour >= 9 && currentHour < 22) {
      return relativeTimeSlots;
    }
    
    return [];
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 mt-4">
      
      {!showPaymentOptions ? (
        <form onSubmit={handleSubmit} className="card-cartoon p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Heure de retrait souhaitée
            </label>
            <select
              className="w-full px-3 py-2 border-4 border-black rounded-xl"
              value={orderDetails.pickupTime}
              onChange={(e) => setOrderDetails({ ...orderDetails, pickupTime: e.target.value })}
              required
            >
              <option value="">Choisir une heure de retrait</option>
              <option value="ASAP">Dès que possible (~30 min)</option>
              {generateTimeSlots().map(slot => (
                <option key={slot.value} value={slot.value}>{slot.label}</option>
              ))}
            </select>
            <p className="text-sm text-gray-500 italic mt-1">
              Préparation en 30 minutes environ après commande.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Instructions spéciales (optionnel)
            </label>
            <textarea
              placeholder="Ex: allergies, préférences, etc."
              className="w-full px-3 py-2 border-4 border-black rounded-xl"
              value={orderDetails.notes}
              onChange={(e) => setOrderDetails({ ...orderDetails, notes: e.target.value })}
              rows={3}
            />
          </div>

          {/* Order Summary */}
          <div className="pt-6 border-t-4 border-black">
            <h3 className="text-xl font-bold text-amber-900 mb-4">Récapitulatif de la commande</h3>
            <div className="space-y-2 mb-4">
              {items.map((item) => (
                <div key={item.product.id} className="flex justify-between">
                  <div>
                    <span className="font-medium">{item.quantity}x {item.product.name}</span>
                    {item.options && item.options.length > 0 && (
                      <ul className="text-sm text-gray-600 ml-4">
                        {item.options.map(option => (
                          <li key={option.id}>+ {option.name}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <span>
                    {((item.product.price + 
                      (item.options ? item.options.reduce((sum, opt) => sum + opt.price, 0) : 0)) * 
                      item.quantity).toFixed(2)}€
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center text-xl font-bold mb-6">
              <span>Total à payer</span>
              <span className="price-tag">{total.toFixed(2)}€</span>
            </div>
            <button
              type="submit"
              className="w-full btn-cartoon bg-amber-400 text-black py-3 px-4 rounded-2xl text-lg border-4 border-black"
              style={{ boxShadow: '4px 4px 0 #000' }}
            >
              Continuer pour payer
            </button>
          </div>
        </form>
      ) : (
        <div className="card-cartoon p-6 space-y-6">
          <h3 className="text-xl font-bold text-amber-900">Continuer vers le paiement</h3>
          <div className="space-y-4">
            <div className="bg-amber-100 p-4 rounded-xl border-4 border-black">
              <h4 className="font-bold text-amber-900 mb-2">Détails de la commande</h4>
              <p><strong>Heure de retrait:</strong> {orderDetails.pickupTime}</p>
              {orderDetails.notes && (
                <p><strong>Instructions:</strong> {orderDetails.notes}</p>
              )}
            </div>
            
            <div className="space-y-6">
              <div className="p-4 border-4 border-black rounded-2xl bg-white space-y-4">
                <p className="text-gray-700 mb-4">
                  Vous allez être redirigé vers Stripe pour finaliser votre paiement. Vous pourrez y saisir vos coordonnées et informations de carte bancaire en toute sécurité.
                </p>
                
                {/* Stripe Payment Button */}
                <button
                  onClick={handleStripePayment}
                  disabled={isProcessing}
                  className="w-full btn-cartoon bg-blue-600 text-white py-3 px-4 rounded-2xl text-lg border-4 border-black mb-4 hover:bg-blue-700 transition-colors"
                  style={{ boxShadow: '4px 4px 0 #000' }}
                >
                  {isProcessing ? 'Traitement en cours...' : 'Payer par Carte Bancaire'}
                </button>
                
                {/* Contact Info */}
                <div className="text-center mt-6 border-t-2 border-gray-200 pt-4">
                  <p className="text-sm text-gray-700">
                    Besoin d'aide avec votre commande?
                  </p>
                  <p className="text-sm font-bold mt-1">
                    Appelez-nous au 07 64 35 86 46
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}