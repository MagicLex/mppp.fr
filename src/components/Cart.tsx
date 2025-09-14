import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, X, Coffee, Utensils, Cookie } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useCoupon } from '../context/CouponContext';
import { OrderOption } from '../types';
import ProductOptions from './ProductOptions';
import { loadAdminSettings } from '../data/adminConfig';

export default function Cart() {
  const { items, updateQuantity, removeItem, removeOptionFromItem, addOptionToItem, total } = useCart();
  const { couponCode, getDiscountedPrice, getDiscountAmount } = useCoupon();
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [isRestaurantClosed, setIsRestaurantClosed] = useState(false);

  // Check if restaurant is closed
  useEffect(() => {
    const checkClosedStatus = () => {
      const settings = loadAdminSettings();
      setIsRestaurantClosed(settings.isClosed || false);
    };

    checkClosedStatus();
    // Check every 30 seconds for updates
    const interval = setInterval(checkClosedStatus, 30000);
    return () => clearInterval(interval);
  }, [])

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-amber-900 mb-4">Votre panier est vide</h2>
        <Link to="/" className="text-amber-600 hover:text-amber-700">
          Retourner au menu
        </Link>
      </div>
    );
  }

  const handleAddOption = (productId: string, option: OrderOption) => {
    addOptionToItem(productId, option);
  };

  const handleRemoveOption = (productId: string, optionId: string) => {
    removeOptionFromItem(productId, optionId);
  };

  return (
    <div className="space-y-6 mt-4">
      <div className="bg-white rounded-lg shadow-md p-6">
        {items.map((item) => (
          <div key={item.product.id} className="py-4 border-b last:border-0">
            {/* Mobile-first layout with improved readability */}
            <div className="flex flex-row">
              {/* Left side: Product image */}
              <div className="w-24 h-24 flex-shrink-0 bg-amber-50 rounded flex items-center justify-center mr-3">
                {item.product.id.startsWith('option-') ? (
                  // Show appropriate icon based on option type
                  <div className="text-amber-600">
                    {item.product.id.includes('-drink-') ? (
                      <Coffee size={32} />
                    ) : item.product.id.includes('-side-') ? (
                      <Utensils size={32} />
                    ) : item.product.id.includes('-dessert-') ? (
                      <Cookie size={32} />
                    ) : item.product.id.includes('-sauce-') ? (
                      <div className="text-amber-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 19h16"></path>
                          <path d="M4 15h16"></path>
                          <path d="M10 3v4"></path>
                          <path d="M14 3v4"></path>
                          <path d="M10 14v2"></path>
                          <path d="M14 14v2"></path>
                          <path d="M8 7h8a4 4 0 0 1 4 4v10H4V11a4 4 0 0 1 4-4Z"></path>
                        </svg>
                      </div>
                    ) : (
                      // Default icon for other option types
                      <div className="bg-amber-100 p-2 rounded-full">
                        <span className="text-2xl">+</span>
                      </div>
                    )}
                  </div>
                ) : (
                  // For regular products, show image with fallback
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-full h-full object-cover rounded"
                    onError={(e) => {
                      // If image fails to load, replace with a placeholder color
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.classList.add('bg-amber-200');
                      e.currentTarget.parentElement!.innerHTML = `<div class="text-amber-800 font-bold text-xl">${item.product.name.charAt(0)}</div>`;
                    }}
                  />
                )}
              </div>

              {/* Right side: Product info, restructured for better mobile readability */}
              <div className="flex-1 min-w-0">
                {/* Product name and unit price in clearer layout */}
                <div className="flex flex-col space-y-1">
                  <h3 className="text-xl font-bold text-amber-900 pr-2">{item.product.name}</h3>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-500">Prix unitaire:</span>
                    <span className="ml-2 text-base font-medium text-gray-800">{item.product.price.toFixed(2)}€</span>
                  </div>
                </div>

                {/* Options pill display */}
                {item.options && item.options.length > 0 && (
                  <div className="flex flex-wrap gap-2 my-3 border-t border-gray-100 pt-2">
                    {item.options.map(option => (
                      <div key={option.id} className="inline-flex items-center bg-amber-100 rounded-full px-3 py-1 border border-amber-300">
                        <span className="font-medium text-amber-900 text-sm">{option.name}</span>
                        <span className="font-semibold text-amber-700 text-sm ml-1">+{option.price.toFixed(2)}€</span>
                        <button
                          onClick={() => removeOptionFromItem(item.product.id, option.id)}
                          className="ml-1 text-red-500 hover:text-red-700"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Clear separation for controls section */}
                <div className="border-t border-gray-100 pt-3 mt-3">
                  {/* Options button - more prominent */}
                  <div className="mb-3">
                    <button
                      onClick={() => setEditingItemId(editingItemId === item.product.id ? null : item.product.id)}
                      className="py-1.5 px-3 rounded-md text-sm font-semibold border-2 bg-amber-400 border-amber-500 text-amber-900 hover:bg-amber-500 flex items-center"
                    >
                      {editingItemId === item.product.id ? 'Fermer' : 'Options +'}
                    </button>
                  </div>

                  {/* Two-row layout for mobile: controls on top, info below */}
                  <div className="flex flex-col space-y-3 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
                    {/* Quantity controls - more spacious for touch */}
                    <div className="flex items-center">
                      <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="p-2 rounded-l-lg bg-gray-100 hover:bg-gray-200"
                        >
                          <Minus size={18} className="text-gray-700" />
                        </button>
                        <span className="w-10 text-center text-lg font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="p-2 rounded-r-lg bg-gray-100 hover:bg-gray-200"
                        >
                          <Plus size={18} className="text-gray-700" />
                        </button>
                      </div>

                      {/* Delete button - positioned consistently */}
                      <button
                        onClick={() => removeItem(item.product.id)}
                        className="ml-3 p-2 rounded-full bg-red-100 hover:bg-red-200 border border-red-300"
                        aria-label="Supprimer"
                      >
                        <Trash2 size={18} className="text-red-500" />
                      </button>
                    </div>

                    {/* Item subtotal - clear and prominent */}
                    <div className="bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 inline-flex items-center self-start">
                      <span className="text-sm font-medium text-gray-700">Sous-total:</span>
                      <span className="text-lg font-bold text-amber-900 ml-2">{(
                        (item.product.price +
                         (item.options ? item.options.reduce((sum, opt) => sum + opt.price, 0) : 0)) *
                        item.quantity
                      ).toFixed(2)}€</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* We don't need the duplicate total display as we've already got it in the layout above */}
            
            {/* Options editor */}
            {editingItemId === item.product.id && (
              <div className="mt-4 pt-4 border-t border-dashed">
                <ProductOptions 
                  selectedOptions={item.options || []}
                  onAddOption={(option) => handleAddOption(item.product.id, option)}
                  onRemoveOption={(optionId) => handleRemoveOption(item.product.id, optionId)}
                />
              </div>
            )}
          </div>
        ))}
        <div className="mt-8 pt-6 border-t-4 border-amber-500">
          {/* Prominent cart total - enhanced for mobile with clear visual hierarchy */}
          <div className="bg-amber-100 rounded-lg p-4 border-2 border-amber-300 mb-6">
            {couponCode ? (
              <>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2">
                  <span className="text-base text-gray-700 mb-1 sm:mb-0">Sous-total</span>
                  <span className="text-xl text-gray-700">{total.toFixed(2)}€</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 text-green-600">
                  <span className="text-base font-semibold mb-1 sm:mb-0">Réduction ({couponCode})</span>
                  <span className="text-xl font-semibold">-{getDiscountAmount(total).toFixed(2)}€</span>
                </div>
                <div className="border-t-2 border-amber-300 pt-2 flex flex-col sm:flex-row sm:justify-between sm:items-center">
                  <span className="text-lg font-bold text-gray-800 mb-1 sm:mb-0">Total avec réduction</span>
                  <span className="text-3xl font-extrabold text-amber-900">{getDiscountedPrice(total).toFixed(2)}€</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                  <span className="text-lg font-bold text-gray-800 mb-1 sm:mb-0">Total de la commande</span>
                  <span className="text-3xl font-extrabold text-amber-900">{total.toFixed(2)}€</span>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Prix TTC avec toutes les options
                </div>
              </>
            )}
          </div>

          {/* Large, easy-to-tap checkout button with enhanced visual effects */}
          {isRestaurantClosed ? (
            <button
              disabled
              className="block w-full py-5 px-4 rounded-xl text-center text-xl font-bold border-4 border-gray-400 bg-gray-300 text-gray-600 cursor-not-allowed"
              style={{ boxShadow: '0 6px 0 #999' }}
            >
              Restaurant fermé - Commande indisponible
            </button>
          ) : (
            <Link
              to="/commander"
              className="block w-full py-5 px-4 rounded-xl text-center text-xl font-bold border-4 border-black transition-all bg-amber-400 text-black hover:bg-amber-500 active:translate-y-1 active:shadow-none"
              style={{ boxShadow: '0 6px 0 #000' }}
            >
              Passer à la commande
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}