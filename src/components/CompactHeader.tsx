import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, ArrowLeft } from 'lucide-react';
import { useCart } from '../context/CartContext';

type CompactHeaderProps = {
  title: string;
  showBackButton?: boolean;
  showCart?: boolean;
};

export default function CompactHeader({ title, showBackButton = true, showCart = false }: CompactHeaderProps) {
  const { items } = useCart();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  
  return (
    <header className="bg-gradient-to-b from-amber-400 to-amber-300 border-b-4 border-black py-2">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Left side - Logo with back button */}
          <div className="flex items-center">
            {showBackButton && (
              <Link to="/" className="mr-3">
                <ArrowLeft size={24} className="text-black" />
              </Link>
            )}
            <Link to="/" className="flex items-center">
              <img 
                src="/images/logos/logo_mpp.png" 
                alt="Mon P'tit Poulet" 
                className="h-12 w-auto mr-3"
              />
              <h1 className="text-xl font-bold text-black hidden sm:block">{title}</h1>
            </Link>
          </div>
          
          {/* Center - Mobile title */}
          <h1 className="text-xl font-bold text-black sm:hidden">{title}</h1>
          
          {/* Right side - Cart button if enabled */}
          {showCart && (
            <Link to="/panier" className="relative">
              <div className="bg-white p-2 rounded-full border-3 border-black">
                <ShoppingCart size={20} className="text-black" />
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-sm font-medium rounded-full h-5 w-5 flex items-center justify-center border-2 border-black">
                    {itemCount}
                  </span>
                )}
              </div>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}