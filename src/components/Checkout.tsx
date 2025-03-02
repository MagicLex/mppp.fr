import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Elements } from '@stripe/react-stripe-js';
import { getStripe } from '../services/stripe';
import { useCart } from '../context/CartContext';
import PaymentForm from './PaymentForm';
import toast from 'react-hot-toast';
import { trackBeginCheckout } from '../services/analytics';

export default function Checkout() {
  const navigate = useNavigate();
  const { items, total } = useCart();
  const [orderDetails, setOrderDetails] = useState({
    name: '',
    phone: '',
    email: '',
    pickupTime: ''
  });
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  if (items.length === 0) {
    navigate('/');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowPaymentForm(true);
    
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

  const handlePaymentSuccess = () => {
    navigate('/');
  };

  const generateTimeSlots = () => {
    const slots = [];
    const now = new Date();
    const start = new Date(now.setMinutes(Math.ceil(now.getMinutes() / 30) * 30));
    
    for (let i = 0; i < 8; i++) {
      const time = new Date(start.getTime() + i * 30 * 60000);
      if (time.getHours() >= 11 && time.getHours() < 22) {
        slots.push(time.toLocaleTimeString('fr-FR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }));
      }
    }
    return slots;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h2 className="text-3xl font-cartoon text-amber-900">Finaliser la commande</h2>
      
      {!showPaymentForm ? (
        <form onSubmit={handleSubmit} className="card-cartoon p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom complet
            </label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border-4 border-black rounded-xl"
              value={orderDetails.name}
              onChange={(e) => setOrderDetails({ ...orderDetails, name: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Téléphone
            </label>
            <input
              type="tel"
              required
              className="w-full px-3 py-2 border-4 border-black rounded-xl"
              value={orderDetails.phone}
              onChange={(e) => setOrderDetails({ ...orderDetails, phone: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              className="w-full px-3 py-2 border-4 border-black rounded-xl"
              value={orderDetails.email}
              onChange={(e) => setOrderDetails({ ...orderDetails, email: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Heure de retrait
            </label>
            <select
              required
              className="w-full px-3 py-2 border-4 border-black rounded-xl"
              value={orderDetails.pickupTime}
              onChange={(e) => setOrderDetails({ ...orderDetails, pickupTime: e.target.value })}
            >
              <option value="">Sélectionnez une heure</option>
              {generateTimeSlots().map((time) => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
          </div>

          {/* Order Summary */}
          <div className="pt-6 border-t-4 border-black">
            <h3 className="text-xl font-cartoon text-amber-900 mb-4">Récapitulatif de la commande</h3>
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
            <div className="flex justify-between items-center text-xl font-cartoon mb-6">
              <span>Total à payer</span>
              <span className="price-tag">{total.toFixed(2)}€</span>
            </div>
            <button
              type="submit"
              className="w-full btn-cartoon bg-amber-400 text-white py-3 px-4 rounded-2xl font-cartoon text-lg"
            >
              Procéder au paiement
            </button>
          </div>
        </form>
      ) : (
        <div className="card-cartoon p-6 space-y-6">
          <h3 className="text-xl font-cartoon text-amber-900">Paiement</h3>
          <div className="space-y-4">
            <div className="bg-amber-100 p-4 rounded-xl border-4 border-black">
              <h4 className="font-cartoon text-amber-900 mb-2">Détails de la commande</h4>
              <p><strong>Nom:</strong> {orderDetails.name}</p>
              <p><strong>Téléphone:</strong> {orderDetails.phone}</p>
              <p><strong>Email:</strong> {orderDetails.email}</p>
              <p><strong>Heure de retrait:</strong> {orderDetails.pickupTime}</p>
            </div>
            
            <Elements stripe={getStripe()}>
              <PaymentForm 
                orderDetails={orderDetails}
                onSuccess={handlePaymentSuccess}
              />
            </Elements>
          </div>
        </div>
      )}
    </div>
  );
}