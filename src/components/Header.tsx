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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white/90 p-4 rounded-xl border-4 border-black">
                <div className="flex gap-3">
                  <Clock size={24} className="text-amber-600 flex-shrink-0" />
                  <div className="text-black">
                    <p className="font-bold mb-1">Horaires</p>
                    <p>Mar-Sam: 12h-14h / 19h-21h</p>
                    <p>Dim: 12h-21h</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <MapPin size={24} className="text-amber-600 flex-shrink-0" />
                  <div className="text-black">
                    <p className="font-bold mb-1">Adresse</p>
                    <p>24 Rue des Olivettes</p>
                    <p>44000 Nantes</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 flex-shrink-0">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                  <div className="text-black">
                    <p className="font-bold mb-1">Téléphone</p>
                    <p className="font-bold text-amber-600">07 64 35 86 46</p>
                  </div>
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