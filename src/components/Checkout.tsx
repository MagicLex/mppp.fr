import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';
import { trackBeginCheckout } from '../services/analytics';
import { createStripeCheckout } from '../services/stripeService';
import { createOrUpdateContact } from '../services/hubspot';
import { isRestaurantOpen, getRestaurantStatus } from '../data/options';
import { isRestaurantOpenWithOverrides, getRestaurantStatusWithOverrides, loadAdminSettings } from '../data/adminConfig';
import ClosedModal from './ClosedModal';

export default function Checkout() {
  const navigate = useNavigate();
  const { items, total } = useCart();
  // Get today's date in YYYY-MM-DD format for default pickup date
  const today = new Date();
  const options = { timeZone: 'Europe/Paris' };
  const franceDate = new Date(today.toLocaleString('en-US', options));
  const defaultPickupDate = franceDate.toISOString().split('T')[0]; // YYYY-MM-DD

  const [orderDetails, setOrderDetails] = useState({
    pickupDate: defaultPickupDate,
    pickupTime: '',
    notes: ''
  });
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [restaurantStatus, setRestaurantStatus] = useState(getRestaurantStatus());
  
  // Check if restaurant is open periodically
  useEffect(() => {
    // Check restaurant status immediately with admin overrides
    setRestaurantStatus(getRestaurantStatusWithOverrides());
    
    // Set up an interval to check every minute
    const interval = setInterval(() => {
      setRestaurantStatus(getRestaurantStatusWithOverrides());
    }, 60000); // 60 seconds
    
    return () => clearInterval(interval); // Clean up on unmount
  }, []);

  if (items.length === 0) {
    navigate('/');
    return null;
  }
  
  // We no longer check if restaurant is open
  // Orders can be placed at any time for future pickup

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Log form data before submission
    console.log('Form submission - Order details:', orderDetails);

    // Validate pickup date and time
    if (!orderDetails.pickupDate?.trim()) {
      alert('Veuillez choisir une date de retrait');
      return;
    }

    if (!orderDetails.pickupTime?.trim()) {
      alert('Veuillez choisir une heure de retrait');
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
      // Create simplified order details for Stripe with French timezone
      const stripeOrderDetails = {
        pickupDate: orderDetails.pickupDate,
        pickupTime: orderDetails.pickupTime,
        formattedPickup: `${orderDetails.pickupDate} à ${orderDetails.pickupTime}`,
        notes: orderDetails.notes || 'Aucune instruction particulière',
        order_time: new Date().toLocaleString('en-US', { timeZone: 'Europe/Paris' })
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

  const generatePickupOptions = () => {
    // Get current time in France timezone regardless of user's location
    const now = new Date();
    const options = { timeZone: 'Europe/Paris' };
    const franceDate = new Date(now.toLocaleString('en-US', options));

    // Generate next 7 days for pickup options
    const dateOptions = [];

    // Get admin settings for business hours
    const adminSettings = loadAdminSettings();
    const config = adminSettings.businessHours;

    // For today, we need special handling to only show valid times
    const currentHour = franceDate.getHours();
    const currentMinute = franceDate.getMinutes();

    // Add dates for the next 7 days
    for (let i = 0; i < 7; i++) {
      const date = new Date(franceDate);
      date.setDate(date.getDate() + i);
      const day = date.getDay(); // 0 = Sunday, 1 = Monday, etc.

      // Skip closed days (e.g., Monday)
      if (config.closedDays.includes(day)) {
        continue;
      }

      // Format date as "Aujourd'hui", "Demain", or day name
      let dateLabel;
      if (i === 0) {
        dateLabel = "Aujourd'hui";
      } else if (i === 1) {
        dateLabel = "Demain";
      } else {
        // Format as day name + date
        const dayName = new Intl.DateTimeFormat('fr-FR', { weekday: 'long' }).format(date);
        const dateNumber = date.getDate();
        const month = new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(date);
        dateLabel = `${dayName} ${dateNumber} ${month}`;
      }

      const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD

      dateOptions.push({
        value: dateString,
        label: dateLabel,
        day: day
      });
    }

    return dateOptions;
  };

  const generateTimeSlots = (selectedDate: string) => {
    // Get current time in France timezone regardless of user's location
    const now = new Date();
    const options = { timeZone: 'Europe/Paris' };
    const franceDate = new Date(now.toLocaleString('en-US', options));

    // Convert selected date to Date object
    const pickupDate = new Date(selectedDate + 'T00:00:00');
    const isToday = pickupDate.toDateString() === franceDate.toDateString();

    // Get admin settings for business hours
    const adminSettings = loadAdminSettings();
    const config = adminSettings.businessHours;

    // Get the day of week for the selected date
    const day = pickupDate.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Generate available time slots based on business hours
    const timeSlots = [];

    // Preparation time in minutes
    const prepTime = 30;

    // Current time plus prep time (for today only)
    const currentHour = franceDate.getHours();
    const currentMinute = franceDate.getMinutes();
    const currentTimeInMinutes = (currentHour * 60) + currentMinute + prepTime;

    // Generate time slots in 15-minute increments
    if (day === 0) {
      // Sunday hours
      const openingHour = Math.floor(config.sunday.opening);
      const openingMinute = Math.round((config.sunday.opening - openingHour) * 60);
      const closingHour = Math.floor(config.sunday.closing);
      const closingMinute = Math.round((config.sunday.closing - closingHour) * 60);

      const openingTimeInMinutes = (openingHour * 60) + openingMinute;
      const closingTimeInMinutes = (closingHour * 60) + closingMinute;

      // Generate time slots every 15 minutes during business hours
      for (let minutes = openingTimeInMinutes; minutes <= closingTimeInMinutes; minutes += 15) {
        // For today, skip times that are already past + prep time
        if (isToday && minutes < currentTimeInMinutes) {
          continue;
        }

        const hour = Math.floor(minutes / 60);
        const minute = minutes % 60;

        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        timeSlots.push({
          value: timeString,
          label: timeString
        });
      }
    } else if (!config.closedDays.includes(day)) {
      // Weekday hours - separate lunch and dinner

      // Lunch hours
      const lunchOpeningHour = Math.floor(config.weekdays.lunch.opening);
      const lunchOpeningMinute = Math.round((config.weekdays.lunch.opening - lunchOpeningHour) * 60);
      const lunchClosingHour = Math.floor(config.weekdays.lunch.closing);
      const lunchClosingMinute = Math.round((config.weekdays.lunch.closing - lunchClosingHour) * 60);

      const lunchOpeningTimeInMinutes = (lunchOpeningHour * 60) + lunchOpeningMinute;
      const lunchClosingTimeInMinutes = (lunchClosingHour * 60) + lunchClosingMinute;

      // Generate lunch time slots every 15 minutes
      for (let minutes = lunchOpeningTimeInMinutes; minutes <= lunchClosingTimeInMinutes; minutes += 15) {
        // For today, skip times that are already past + prep time
        if (isToday && minutes < currentTimeInMinutes) {
          continue;
        }

        const hour = Math.floor(minutes / 60);
        const minute = minutes % 60;

        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        timeSlots.push({
          value: timeString,
          label: timeString
        });
      }

      // Dinner hours
      const dinnerOpeningHour = Math.floor(config.weekdays.dinner.opening);
      const dinnerOpeningMinute = Math.round((config.weekdays.dinner.opening - dinnerOpeningHour) * 60);
      const dinnerClosingHour = Math.floor(config.weekdays.dinner.closing);
      const dinnerClosingMinute = Math.round((config.weekdays.dinner.closing - dinnerClosingHour) * 60);

      const dinnerOpeningTimeInMinutes = (dinnerOpeningHour * 60) + dinnerOpeningMinute;
      const dinnerClosingTimeInMinutes = (dinnerClosingHour * 60) + dinnerClosingMinute;

      // Generate dinner time slots every 15 minutes
      for (let minutes = dinnerOpeningTimeInMinutes; minutes <= dinnerClosingTimeInMinutes; minutes += 15) {
        // For today, skip times that are already past + prep time
        if (isToday && minutes < currentTimeInMinutes) {
          continue;
        }

        const hour = Math.floor(minutes / 60);
        const minute = minutes % 60;

        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        timeSlots.push({
          value: timeString,
          label: timeString
        });
      }
    }

    return timeSlots;
  };

  // Check if restaurant is closed (manual override)
  const adminSettings = loadAdminSettings();
  if (adminSettings.isClosed) {
    return <ClosedModal message={adminSettings.closedMessage} />;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 mt-4">
      
      {!showPaymentOptions ? (
        <form onSubmit={handleSubmit} className="card-cartoon p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de retrait
              </label>
              <select
                className="w-full px-3 py-2 border-4 border-black rounded-xl"
                value={orderDetails.pickupDate}
                onChange={(e) => setOrderDetails({ ...orderDetails, pickupDate: e.target.value, pickupTime: '' })}
                required
              >
                <option value="">Choisir une date</option>
                {generatePickupOptions().map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            {orderDetails.pickupDate && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Heure de retrait
                </label>
                <select
                  className="w-full px-3 py-2 border-4 border-black rounded-xl"
                  value={orderDetails.pickupTime}
                  onChange={(e) => setOrderDetails({ ...orderDetails, pickupTime: e.target.value })}
                  required
                >
                  <option value="">Choisir une heure</option>
                  {generateTimeSlots(orderDetails.pickupDate).map(slot => (
                    <option key={slot.value} value={slot.value}>{slot.label}</option>
                  ))}
                </select>
              </div>
            )}

            <p className="text-sm text-gray-500 italic mt-1">
              Préparation de votre commande pour le jour et l'heure choisis.
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
              <p><strong>Date et heure de retrait:</strong> {orderDetails.pickupDate} à {orderDetails.pickupTime}</p>
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