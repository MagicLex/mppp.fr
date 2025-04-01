import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { Plus, Flame, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';
import LocationMap from './LocationMap';
import { useNavigate } from 'react-router-dom';
import { trackAddToCart } from '../services/analytics';
// Import from the central menu service
import { getAllProducts, getHomePageProducts, getProductsByCategory, getFeaturedProducts } from '../services/menu';
import { Product } from '../types';

export default function Menu() {
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [menuProducts, setMenuProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load products from the menu service
    const loadProducts = async () => {
      try {
        // Get all products
        const products = await getAllProducts();
        console.log('Loaded products from CSV:', products);
        setMenuProducts(products);
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const handleAddToCart = (productId: string) => {
    const product = menuProducts.find(p => p.id === productId);
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
              className="px-3 py-1 bg-amber-400 text-black rounded-md text-sm font-medium"
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

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
              <p>Chargement du menu...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-6xl mx-auto">
            {menuProducts.map((product) => (
              <div key={product.id} className="overflow-hidden card-cartoon transform hover:scale-[1.02] transition-transform duration-300">
                <div className="relative">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-72 object-cover"
                    style={{ borderTopLeftRadius: 'calc(1.5rem - 4px)', borderTopRightRadius: 'calc(1.5rem - 4px)' }}
                  />
                  <span className="price-tag absolute top-4 right-4 shadow-lg">
                    {typeof product.price === 'number' ? product.price.toFixed(2) : 'N/A'}€
                  </span>
                </div>
                <div className="p-6">
                  <div className="mb-4">
                    <h3 className="text-2xl font-cartoon text-amber-900 flex items-center gap-2">
                      {product.name}
                      {product.id === 'poulet-entier' && (
                        <Flame size={24} className="text-amber-500" />
                      )}
                    </h3>
                    <p className="text-gray-600 mt-2 line-clamp-3">{product.description}</p>
                  </div>
                  
                  <button
                    onClick={() => handleAddToCart(product.id)}
                    className="btn-cartoon w-full bg-amber-400 text-black py-4 px-6 rounded-2xl flex items-center justify-center space-x-3 text-lg font-cartoon mt-4"
                  >
                    <ShoppingBag size={24} />
                    <span>Ajouter au panier</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-cartoon text-amber-900 mb-6 text-center">Où nous trouver</h2>
        <LocationMap />
      </div>
    </div>
  );
}