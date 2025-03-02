import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, ChefHat, Clock, MapPin } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function Header() {
  const { items } = useCart();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="relative">
      <div className="bg-gradient-to-b from-amber-400 to-amber-300 border-b-4 border-black">
        <div className="container mx-auto px-4">
          {/* Top Navigation */}
          <div className="flex items-center justify-between py-4">
            <Link to="/" className="flex items-center space-x-3">
                <img src="/public/images/logos/logo_mpp.png" alt="Mon P'tit Poulet" className="w-10 h-10" />
            </Link>
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

          {/* Hero Section */}
          <div className="py-16 md:py-24 flex flex-col md:flex-row items-center justify-between">
            <div className="text-center md:text-left md:flex-1">
              <h2 className="text-5xl md:text-6xl font-cartoon text-black mb-6 leading-tight">
                Authentique<br />Poulet Portugais
              </h2>
              <p className="text-2xl md:text-3xl text-black mb-8 font-cartoon">
                Grillé au charbon de bois<br />avec notre sauce Piri Piri
              </p>
              <div className="flex flex-col md:flex-row items-center gap-6 text-black font-medium">
                <div className="flex items-center gap-3 bg-white/80 p-3 rounded-full border-4 border-black">
                  <Clock size={24} />
                  <span>Ouvert 7/7 de 11h à 22h</span>
                </div>
                <div className="flex items-center gap-3 bg-white/80 p-3 rounded-full border-4 border-black">
                  <MapPin size={24} />
                  <span>24 Rue des Olivettes, 44000 Nantes</span>
                </div>
              </div>
            </div>
            <div className="hidden md:block md:flex-1">
              <img src="public/images/logos/mascotte.png" alt="Mascotte" className="w-64 h-64" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}