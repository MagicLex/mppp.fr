import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, X, ChevronDown, ChevronUp, Coffee, Utensils, Cookie } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { OrderOption } from '../types';
import ProductOptions from './ProductOptions';

export default function Cart() {
  const { items, updateQuantity, removeItem, removeOptionFromItem, addOptionToItem, total } = useCart();
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

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
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-amber-900">Votre Panier</h2>
      <div className="bg-white rounded-lg shadow-md p-6">
        {items.map((item) => (
          <div key={item.product.id} className="py-4 border-b last:border-0">
            <div className="flex flex-row">
              {/* Left side: Product info, controls, and options */}
              <div className="flex-1 pr-4 min-w-0">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center">
                      <h3 className="text-xl font-bold text-amber-900">{item.product.name}</h3>
                      
                      {/* Add options button - inline with product name */}
                      <button 
                        onClick={() => setEditingItemId(editingItemId === item.product.id ? null : item.product.id)}
                        className="ml-3 py-1 px-3 rounded-md text-sm font-semibold border-2 bg-amber-400 border-amber-500 text-amber-900 hover:bg-amber-500 flex items-center"
                      >
                        {editingItemId === item.product.id ? 'Fermer' : 'Options +'}
                      </button>
                    </div>
                    <p className="text-lg font-medium text-gray-800">{item.product.price.toFixed(2)}€</p>
                    
                    {/* Options pills */}
                    {item.options && item.options.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
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
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="p-1.5 rounded-full hover:bg-gray-100 border-2 border-gray-300 z-10"
                    >
                      <Minus size={22} />
                    </button>
                    <span className="w-10 text-center text-lg font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="p-1.5 rounded-full hover:bg-gray-100 border-2 border-gray-300 z-10"
                    >
                      <Plus size={22} />
                    </button>
                    <button
                      onClick={() => removeItem(item.product.id)}
                      className="p-1.5 rounded-full hover:bg-gray-100 ml-2 border-2 border-gray-300 z-10"
                    >
                      <Trash2 size={22} className="text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Right side: Image or Icon */}
              <div className="w-24 h-24 flex-shrink-0 bg-amber-50 rounded flex items-center justify-center">
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
            </div>
            
            {/* Item total with options */}
            <div className="mt-4 flex justify-between items-center">
              {item.options && item.options.length > 0 ? (
                <div className="text-base font-semibold text-gray-800">
                  Sous-total: <span className="text-lg">{(
                    (item.product.price + 
                     item.options.reduce((sum, opt) => sum + opt.price, 0)) * 
                    item.quantity
                  ).toFixed(2)}€</span>
                </div>
              ) : (
                <div></div>
              )}
            </div>
            
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
        <div className="mt-8 pt-6 border-t border-gray-300">
          <div className="flex justify-between items-center text-2xl font-bold mb-6">
            <span>Total</span>
            <span className="text-amber-900">{total.toFixed(2)}€</span>
          </div>
          <Link
            to="/commander"
            className="block w-full bg-amber-400 text-black py-4 px-4 rounded-lg text-center text-xl font-bold hover:bg-amber-500 border-4 border-black transition-all"
            style={{ boxShadow: '4px 4px 0 #000' }}
          >
            Passer à la commande
          </Link>
        </div>
      </div>
    </div>
  );
}