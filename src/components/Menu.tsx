import React from 'react';
import { products } from '../data/products';
import { useCart } from '../context/CartContext';
import { Plus, Flame, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';
import LocationMap from './LocationMap';
import { useNavigate } from 'react-router-dom';
import { trackAddToCart } from '../services/analytics';

export default function Menu() {
  const { addItem } = useCart();
  const navigate = useNavigate();

  const handleAddToCart = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      addItem(product);
      
      // Track add to cart event
      trackAddToCart(
        product.id,
        product.name,
        product.price,
        1
      );
      
      toast.success('Produit ajouté au panier', {
        icon: '🍗',
        duration: 2000,
      });
      
      // Show a toast with action button
      toast((t) => (
        <div className="flex flex-col">
          <span className="mb-2">Voulez-vous ajouter des options?</span>
          <div className="flex gap-2">
            <button
              onClick={() => {
                toast.dismiss(t.id);
                navigate('/panier');
              }}
              className="px-3 py-1 bg-amber-400 text-white rounded-md text-sm font-medium"
            >
              Oui, aller au panier
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-3 py-1 bg-gray-200 rounded-md text-sm font-medium"
            >
              Non, continuer
            </button>
          </div>
        </div>
      ), {
        duration: 5000,
        style: {
          padding: '16px',
          borderRadius: '10px',
          background: '#fff',
          color: '#333',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          border: '4px solid #000',
        },
      });
    }
  };

  return (
    <div className="space-y-16 py-8">
      <div className="space-y-12">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-cartoon text-amber-900 mb-4">Notre Menu</h2>
          <p className="text-gray-600">
            Découvrez nos spécialités portugaises, préparées avec passion et tradition
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {products.map((product) => (
            <div key={product.id} className="overflow-hidden card-cartoon">
              <div className="relative">
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="w-full h-48 object-cover"
                  style={{ borderTopLeftRadius: 'calc(1.5rem - 4px)', borderTopRightRadius: 'calc(1.5rem - 4px)' }}
                />
                <div 
                  className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" 
                  style={{ borderTopLeftRadius: 'calc(1.5rem - 4px)', borderTopRightRadius: 'calc(1.5rem - 4px)' }}
                />
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-cartoon text-amber-900 flex items-center gap-2">
                      {product.name}
                      {product.id === 'poulet-entier' && (
                        <Flame size={24} className="text-amber-500" />
                      )}
                    </h3>
                    <p className="text-gray-600 mt-1">{product.description}</p>
                  </div>
                  <span className="price-tag">
                    {product.price.toFixed(2)}€
                  </span>
                </div>
                
                <button
                  onClick={() => handleAddToCart(product.id)}
                  className="btn-cartoon w-full bg-amber-400 text-white py-4 px-6 rounded-2xl flex items-center justify-center space-x-3 text-lg font-cartoon"
                >
                  <ShoppingBag size={24} />
                  <span>Ajouter au panier</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-cartoon text-amber-900 mb-6 text-center">Où nous trouver</h2>
        <LocationMap />
      </div>
    </div>
  );
}