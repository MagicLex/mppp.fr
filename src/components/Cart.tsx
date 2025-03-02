import React from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function Cart() {
  const { items, updateQuantity, removeItem, total } = useCart();

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

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-amber-900">Votre Panier</h2>
      <div className="bg-white rounded-lg shadow-md p-6">
        {items.map((item) => (
          <div key={item.product.id} className="flex items-center py-4 border-b last:border-0">
            <img
              src={item.product.image}
              alt={item.product.name}
              className="w-24 h-24 object-cover rounded"
            />
            <div className="flex-1 ml-4">
              <h3 className="text-lg font-semibold text-amber-900">{item.product.name}</h3>
              <p className="text-gray-600">{item.product.price.toFixed(2)}€</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <Minus size={20} />
              </button>
              <span className="w-8 text-center">{item.quantity}</span>
              <button
                onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <Plus size={20} />
              </button>
              <button
                onClick={() => removeItem(item.product.id)}
                className="p-1 rounded-full hover:bg-gray-100 ml-4"
              >
                <Trash2 size={20} className="text-red-500" />
              </button>
            </div>
          </div>
        ))}
        <div className="mt-6 pt-6 border-t">
          <div className="flex justify-between items-center text-xl font-bold">
            <span>Total</span>
            <span>{total.toFixed(2)}€</span>
          </div>
          <Link
            to="/commander"
            className="mt-6 w-full bg-amber-400 text-white py-3 px-4 rounded-md text-center font-semibold hover:bg-amber-500 transition-colors"
          >
            Passer la commande
          </Link>
        </div>
      </div>
    </div>
  );
}