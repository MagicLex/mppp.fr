import React from 'react';
import { useCoupon } from '../context/CouponContext';

export default function CouponBanner() {
  const { couponCode, discountRate, removeCoupon } = useCoupon();
  
  if (!couponCode) return null;
  
  const discountPercent = Math.round(discountRate * 100);
  
  return (
    <div className="bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-4 shadow-lg">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">🎉</span>
          <div>
            <span className="font-bold text-lg">Promotion active!</span>
            <span className="ml-2 text-sm opacity-90">
              Code <span className="font-mono bg-white/20 px-2 py-1 rounded">{couponCode}</span> appliqué
            </span>
            <span className="ml-2 text-sm font-bold">
              -{discountPercent}% sur toute la commande
            </span>
          </div>
        </div>
        <button
          onClick={removeCoupon}
          className="text-white/80 hover:text-white transition-colors"
          aria-label="Retirer le code promo"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
}