import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Clock, MapPin, AlertCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { isRestaurantOpen, getRestaurantStatus } from '../data/options';

export default function Header() {
  const { items } = useCart();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const [restaurantStatus, setRestaurantStatus] = useState(getRestaurantStatus());
  const location = useLocation();
  
  // Check if restaurant is open periodically
  useEffect(() => {
    // Check restaurant status immediately
    setRestaurantStatus(getRestaurantStatus());
    
    // Set up an interval to check every minute
    const interval = setInterval(() => {
      setRestaurantStatus(getRestaurantStatus());
    }, 60000); // 60 seconds
    
    return () => clearInterval(interval); // Clean up on unmount
  }, []);

  return (
    <>
      {/* Restaurant status banner */}
      {!restaurantStatus.isOpen && (
        <div className="bg-red-600 text-white py-2 px-4 text-center">
          <div className="container mx-auto flex items-center justify-center">
            <AlertCircle className="mr-2" size={18} />
            <p className="text-sm font-medium">{restaurantStatus.message}</p>
          </div>
        </div>
      )}
      
      <header className="relative overflow-visible">
        <div className="bg-gradient-to-b from-amber-400 to-amber-300 border-b-4 border-black">
          <div className="container mx-auto px-4">
            {/* Desktop layout */}
            <div className="hidden md:flex justify-between items-center py-3">
              {/* Logo */}
              <Link to="/" className="flex-shrink-0">
                <img 
                  src="/images/logos/logo_mpp.png" 
                  alt="Mon P'tit Poulet" 
                  className="h-48 w-auto" 
                />
              </Link>
              
              {/* Text content */}
              <div className="flex flex-col">
                <h2 className="text-3xl font-cartoon text-black leading-tight">
                  Authentique Poulet Portugais
                </h2>
                <p className="text-xl text-black font-cartoon mb-3">
                  Grillé au charbon de bois avec notre sauce Piri Piri
                </p>
                
                {/* Contact info in three clear lines */}
                <div className="flex flex-col gap-y-1 mt-1 text-sm">
                  <div className="flex items-start">
                    <Clock size={18} className="text-black mr-1 flex-shrink-0 mt-1" />
                    <p className="text-black"><span className="font-bold mr-1">Horaires:</span> Mardi-Samedi: 12h-14h / 19h-21h | Dimanche: 12h-21h</p>
                  </div>
                  
                  <div className="flex items-start">
                    <MapPin size={18} className="text-black mr-1 flex-shrink-0 mt-1" />
                    <p className="text-black"><span className="font-bold mr-1">Adresse:</span> 24 Rue des Olivettes, 44000 Nantes</p>
                  </div>
                  
                  <div className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-black mr-1 flex-shrink-0 mt-1">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                    <p className="text-black"><span className="font-bold mr-1">Téléphone:</span> <span className="font-bold">07 64 35 86 46</span></p>
                  </div>
                </div>
              </div>
              
              {/* Desktop cart */}
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

            {/* Mobile layout */}
            <div className="md:hidden flex flex-col py-3">
              {/* Logo and cart */}
              <div className="flex justify-between items-center">
                <Link to="/" className="flex-shrink-0">
                  <img 
                    src="/images/logos/logo_mpp.png" 
                    alt="Mon P'tit Poulet" 
                    className="h-28 w-auto" 
                  />
                </Link>
                
                {/* Cart link */}
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
              
              {/* Mobile text content */}
              <div className="mt-4">
                <h2 className="text-2xl font-cartoon text-black leading-tight">
                  Authentique Poulet Portugais
                </h2>
                <p className="text-lg text-black font-cartoon mb-3">
                  Grillé au charbon de bois avec notre sauce Piri Piri
                </p>
                
                {/* Contact info in three clear lines */}
                <div className="flex flex-col gap-y-1 mt-1 text-sm">
                  <div className="flex items-start">
                    <Clock size={18} className="text-black mr-1 flex-shrink-0 mt-1" />
                    <p className="text-black"><span className="font-bold mr-1">Horaires:</span> Mardi-Samedi: 12h-14h / 19h-21h | Dimanche: 12h-21h</p>
                  </div>
                  
                  <div className="flex items-start">
                    <MapPin size={18} className="text-black mr-1 flex-shrink-0 mt-1" />
                    <p className="text-black"><span className="font-bold mr-1">Adresse:</span> 24 Rue des Olivettes, 44000 Nantes</p>
                  </div>
                  
                  <div className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-black mr-1 flex-shrink-0 mt-1">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                    <p className="text-black"><span className="font-bold mr-1">Téléphone:</span> <span className="font-bold">07 64 35 86 46</span></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Image garde as background with mascot on top - only shown on homepage */}
      {location.pathname === '/' && (
        <div className="mb-24 relative border-b-4 border-black">
          {/* Full width background image */}
          <div className="w-full overflow-hidden">
            <img 
              src="/images/menu/image_garde.jpeg" 
              alt="Background" 
              className="w-full object-cover h-[20rem] md:h-[40rem]" 
            />
          </div>
          
          {/* Mascot with circular background */}
          <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
            {/* Circular background with black border - using amber-300 color to match header */}
            <div className="rounded-full bg-amber-300 border-4 border-black h-[16rem] w-[16rem] md:h-[22rem] md:w-[22rem] flex items-center justify-center relative">
              {/* Mascot image - 50% bigger than container */}
              <img 
                src="/images/logos/mascotte.png" 
                alt="Mascotte" 
                className="absolute w-[150%] h-auto" 
                style={{ transform: 'translateY(-10%)' }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}