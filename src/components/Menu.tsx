import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { Plus, Flame, ShoppingBag, Coffee, Utensils, Cookie, Candy } from 'lucide-react';
import toast from 'react-hot-toast';
import LocationMap from './LocationMap';
import { useNavigate } from 'react-router-dom';
import { trackAddToCart } from '../services/analytics';
// Import from the central menu service
import { 
  getAllProducts, 
  getHomePageProducts, 
  getProductsByCategory, 
  getFeaturedProducts,
  getOptionsByType,
  getOptionTypes
} from '../services/menu';
import { Product, OrderOption } from '../types';

export default function Menu() {
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [menuProducts, setMenuProducts] = useState<Product[]>([]);
  const [drinkOptions, setDrinkOptions] = useState<OrderOption[]>([]);
  const [sideOptions, setSideOptions] = useState<OrderOption[]>([]);
  const [sauceOptions, setSauceOptions] = useState<OrderOption[]>([]);
  const [dessertOptions, setDessertOptions] = useState<OrderOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load products and options from the menu service
    const loadData = async () => {
      try {
        // Get all products
        const products = await getAllProducts();
        setMenuProducts(products);
        
        // Get drink options
        const drinks = await getOptionsByType('drinks');
        setDrinkOptions(drinks);
        
        // Get side options
        const sides = await getOptionsByType('sides');
        setSideOptions(sides);
        
        // Get sauce options
        const sauces = await getOptionsByType('sauces');
        setSauceOptions(sauces);
        
        // Get dessert options
        const desserts = await getOptionsByType('desserts');
        setDessertOptions(desserts);
      } catch (error) {
        console.error('Error loading menu data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
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
      // Show options toast in a clean, straightforward way
      toast((t) => (
        <div className="flex flex-col">
          <span className="mb-4 text-lg font-medium text-center">Voulez-vous ajouter des options?</span>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => {
                toast.dismiss(t.id);
                navigate('/panier');
              }}
              className="px-4 py-2 bg-amber-400 text-black rounded-md text-base font-medium border-2 border-black"
            >
              Oui, aller au panier
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-4 py-2 bg-gray-200 rounded-md text-base font-medium border-2 border-black"
            >
              Non, continuer
            </button>
          </div>
        </div>
      ), {
        duration: 5000,
        position: 'top-center',
        style: {
          padding: '16px',
          background: '#fff',
          color: '#333',
          borderRadius: '0.75rem',
          border: '4px solid #000',
          boxShadow: '0 6px 12px rgba(0, 0, 0, 0.2)',
          width: '100%',
          maxWidth: '400px',
        }
      });
    }
  };
  
  // Handle adding a standalone option to cart
  const handleAddOptionToCart = (option: OrderOption) => {
    // Get icon based on option type
    let icon = '/images/ui/default-option.svg';
    let emoji = '✓';
    
    switch(option.type) {
      case 'drink':
        emoji = '🥤';
        break;
      case 'side':
        emoji = '🍟';
        break;
      case 'sauce':
        emoji = '🧂';
        break;
      case 'extra':
        emoji = '🍽️';
        break;
    }
    
    // Create a product-like object from the option
    const optionAsProduct: Product = {
      id: `option-${option.type}-${option.id}`, // Include type in the ID for better identification
      name: option.name,
      description: option.description || '',
      price: option.price,
      image: icon, // Use an icon placeholder instead of an actual image
    };
    
    // Add to cart as a product
    addItem(optionAsProduct);
    
    // Track add to cart event
    trackAddToCart(
      optionAsProduct.id,
      optionAsProduct.name,
      optionAsProduct.price,
      1
    );
    
    // Show success toast with emoji based on option type
    toast.success(`${option.name} ajouté au panier`, {
      icon: emoji,
      duration: 2000,
    });
  };

  return (
    <div className="space-y-16 py-8">
      <div className="space-y-12">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-amber-900 mb-4">Notre Menu</h2>
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
                    <h3 className="text-2xl font-bold text-amber-900 flex items-center gap-2">
                      {product.name}
                      {product.id === 'poulet-entier' && (
                        <Flame size={24} className="text-amber-500" />
                      )}
                    </h3>
                    <p className="text-gray-600 mt-2 line-clamp-3">{product.description}</p>
                  </div>
                  
                  <button
                    onClick={() => handleAddToCart(product.id)}
                    className="btn-cartoon w-full bg-amber-400 text-black py-4 px-6 rounded-2xl flex items-center justify-center space-x-3 text-lg mt-4"
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
      
      {/* Options Sections - Grouped by type */}
      <div className="space-y-10">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-amber-900 mb-4">Extras et Boissons</h2>
          <p className="text-gray-600">
            Ajoutez des options individuelles à votre commande
          </p>
        </div>
        
        {/* Drinks Section */}
        {drinkOptions.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-amber-800 max-w-6xl mx-auto px-4">Boissons</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-w-6xl mx-auto">
              {drinkOptions.map((drink) => (
                <div key={drink.id} className="bg-white rounded-lg border-2 border-amber-200 shadow p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-lg">{drink.name}</h4>
                    <span className="font-bold text-amber-600">{drink.price.toFixed(2)}€</span>
                  </div>
                  
                  <button
                    onClick={() => handleAddOptionToCart(drink)}
                    className="w-full bg-amber-400 text-black py-2 px-3 rounded-md flex items-center justify-center space-x-2 text-sm font-semibold border-2 border-amber-500 hover:bg-amber-500 transition-colors"
                  >
                    <Coffee size={16} />
                    <span>Ajouter</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Sides Section */}
        {sideOptions.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-amber-800 max-w-6xl mx-auto px-4">Accompagnements</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-w-6xl mx-auto">
              {sideOptions.map((side) => (
                <div key={side.id} className="bg-white rounded-lg border-2 border-amber-200 shadow p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-lg">{side.name}</h4>
                    <span className="font-bold text-amber-600">{side.price.toFixed(2)}€</span>
                  </div>
                  
                  <button
                    onClick={() => handleAddOptionToCart(side)}
                    className="w-full bg-amber-400 text-black py-2 px-3 rounded-md flex items-center justify-center space-x-2 text-sm font-semibold border-2 border-amber-500 hover:bg-amber-500 transition-colors"
                  >
                    <Utensils size={16} />
                    <span>Ajouter</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Sauces Section */}
        {sauceOptions.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-amber-800 max-w-6xl mx-auto px-4">Sauces</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-w-6xl mx-auto">
              {sauceOptions.map((sauce) => (
                <div key={sauce.id} className="bg-white rounded-lg border-2 border-amber-200 shadow p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-lg">{sauce.name}</h4>
                    <span className="font-bold text-amber-600">{sauce.price.toFixed(2)}€</span>
                  </div>
                  
                  <button
                    onClick={() => handleAddOptionToCart(sauce)}
                    className="w-full bg-amber-400 text-black py-2 px-3 rounded-md flex items-center justify-center space-x-2 text-sm font-semibold border-2 border-amber-500 hover:bg-amber-500 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 19h16"></path>
                      <path d="M4 15h16"></path>
                      <path d="M10 3v4"></path>
                      <path d="M14 3v4"></path>
                      <path d="M10 14v2"></path>
                      <path d="M14 14v2"></path>
                      <path d="M8 7h8a4 4 0 0 1 4 4v10H4V11a4 4 0 0 1 4-4Z"></path>
                    </svg>
                    <span>Ajouter</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Desserts Section */}
        {dessertOptions.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-amber-800 max-w-6xl mx-auto px-4">Desserts</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-w-6xl mx-auto">
              {dessertOptions.map((dessert) => (
                <div key={dessert.id} className="bg-white rounded-lg border-2 border-amber-200 shadow p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-lg">{dessert.name}</h4>
                    <span className="font-bold text-amber-600">{dessert.price.toFixed(2)}€</span>
                  </div>
                  
                  <button
                    onClick={() => handleAddOptionToCart(dessert)}
                    className="w-full bg-amber-400 text-black py-2 px-3 rounded-md flex items-center justify-center space-x-2 text-sm font-semibold border-2 border-amber-500 hover:bg-amber-500 transition-colors"
                  >
                    <Cookie size={16} />
                    <span>Ajouter</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-amber-900 mb-6 text-center">Où nous trouver</h2>
        <LocationMap />
      </div>
    </div>
  );
}