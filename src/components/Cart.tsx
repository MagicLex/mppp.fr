import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, X, ChevronDown, ChevronUp } from 'lucide-react';
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
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-lg font-semibold text-amber-900">{item.product.name}</h3>
                    <p className="text-gray-800">{item.product.price.toFixed(2)}€</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="p-1 rounded-full hover:bg-gray-100 border border-gray-200 z-10"
                    >
                      <Minus size={20} />
                    </button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="p-1 rounded-full hover:bg-gray-100 border border-gray-200 z-10"
                    >
                      <Plus size={20} />
                    </button>
                    <button
                      onClick={() => removeItem(item.product.id)}
                      className="p-1 rounded-full hover:bg-gray-100 ml-2 border border-gray-200 z-10"
                    >
                      <Trash2 size={20} className="text-red-500" />
                    </button>
                  </div>
                </div>
                
                {/* Options list */}
                {item.options && item.options.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 mb-1">Options:</p>
                    <ul className="space-y-1">
                      {item.options.map(option => (
                        <li key={option.id} className="flex items-center justify-between text-sm">
                          <span>{option.name} (+{option.price.toFixed(2)}€)</span>
                          <button 
                            onClick={() => removeOptionFromItem(item.product.id, option.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X size={16} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              {/* Right side: Image */}
              <div className="w-24 h-24 flex-shrink-0">
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="w-full h-full object-cover rounded"
                />
              </div>
            </div>
            
            {/* Item total with options */}
            <div className="mt-2 flex justify-between items-center">
              {item.options && item.options.length > 0 ? (
                <div className="text-sm text-gray-600">
                  Sous-total: {(
                    (item.product.price + 
                     item.options.reduce((sum, opt) => sum + opt.price, 0)) * 
                    item.quantity
                  ).toFixed(2)}€
                </div>
              ) : (
                <div></div>
              )}
              
              <button 
                onClick={() => setEditingItemId(editingItemId === item.product.id ? null : item.product.id)}
                className="text-amber-600 text-sm font-medium flex items-center"
              >
                {editingItemId === item.product.id ? (
                  <>
                    Fermer <ChevronUp size={16} className="ml-1" />
                  </>
                ) : (
                  <>
                    Ajouter des options <ChevronDown size={16} className="ml-1" />
                  </>
                )}
              </button>
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
        <div className="mt-6 pt-6 border-t">
          <div className="flex justify-between items-center text-xl font-bold mb-6">
            <span>Total</span>
            <span>{total.toFixed(2)}€</span>
          </div>
          <div
            className="block w-full bg-amber-400 text-black py-3 px-4 rounded-md text-center font-bold cursor-not-allowed border-4 border-black"
            style={{ boxShadow: '4px 4px 0 #000' }}
          >
            ⚠️ Appelez le 07 64 35 86 46 pour commander ⚠️
          </div>
        </div>
      </div>
    </div>
  );
}