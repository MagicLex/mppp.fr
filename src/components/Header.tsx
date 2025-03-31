import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Clock, MapPin } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function Header() {
  const { items } = useCart();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="relative">
      <div className="bg-gradient-to-b from-amber-400 to-amber-300 border-b-4 border-black">
        <div className="container mx-auto px-4">
          {/* Top Navigation */}
          <div className="flex items-center justify-between py-3">
            <Link to="/" className="flex items-center">
              <img 
                src="/images/logos/logo_mpp.png" 
                alt="Mon P'tit Poulet" 
                className="h-20 w-auto" 
              />
            </Link>
            <div className="flex items-center gap-4">
              <Link to="/panier" className="relative">
                <div className="bg-white p-2 rounded-full border-4 border-black">
                  <ShoppingCart size={24} className="text-black" />
                  {itemCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-sm font-cartoon rounded-full h-6 w-6 flex items-center justify-center border-2 border-black">
                      {itemCount}
                    </span>
                  )}
                </div>
              </Link>
            </div>
          </div>

          {/* Hero Section with two columns */}
          <div className="py-6 flex flex-col md:flex-row items-center">
            {/* Left column - Text content */}
            <div className="md:w-1/2 text-left">
              <h2 className="text-5xl font-cartoon text-black mb-4 leading-tight">
                Authentique Poulet Portugais
              </h2>
              <p className="text-2xl text-black mb-6 font-cartoon">
                Grillé au charbon de bois avec notre sauce Piri Piri
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center gap-2 bg-white/90 px-4 py-2 rounded-full border-4 border-black">
                  <Clock size={20} />
                  <span>Ouvert 12h à 14h - 19h à 21h du Mardi au Samedi</span>
                </div>
                <div className="flex items-center gap-2 bg-white/90 px-4 py-2 rounded-full border-4 border-black">
                  <MapPin size={20} />
                  <span>24 Rue des Olivettes, 44000 Nantes</span>
                </div>
              </div>
            </div>
            
            {/* Right column - Mascot */}
            <div className="md:w-1/2 flex justify-center items-center mt-3 md:mt-0">
              <img 
                src="/images/logos/mascotte.png" 
                alt="Mascotte" 
                className="h-80 w-auto" 
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}