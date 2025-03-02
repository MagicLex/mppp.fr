import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Header from './components/Header';
import Menu from './components/Menu';
import Cart from './components/Cart';
import Checkout from './components/Checkout';
import { CartProvider } from './context/CartContext';

function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <div className="min-h-screen bg-amber-50">
          <Header />
          <main className="container mx-auto px-4 pb-12">
            <Routes>
              <Route path="/" element={<Menu />} />
              <Route path="/panier" element={<Cart />} />
              <Route path="/commander" element={<Checkout />} />
            </Routes>
          </main>
          <Toaster 
            position="bottom-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#fff',
                color: '#333',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                borderRadius: '0.5rem',
                border: '4px solid #000',
              },
            }} 
          />
        </div>
      </CartProvider>
    </BrowserRouter>
  );
}

export default App;