import React from 'react';
import { products } from '../data/products';
import { useCart } from '../context/CartContext';
import { Plus, Flame } from 'lucide-react';
import toast from 'react-hot-toast';
import LocationMap from './LocationMap';

export default function Menu() {
  const { addItem } = useCart();

  const handleAddToCart = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      addItem(product);
      toast.success('Produit ajouté au panier');
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
            <div key={product.id} className="card-cartoon">
              <div className="aspect-w-16 aspect-h-9 relative">
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="w-full h-48 object-cover rounded-t-[1.5rem]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-t-[1.5rem]" />
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
                  <Plus size={24} className="transition-transform group-hover:rotate-90" />
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