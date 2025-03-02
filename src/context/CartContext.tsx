import React, { createContext, useContext, useState } from 'react';
import { Product, CartItem, OrderOption } from '../types';

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, options?: OrderOption[]) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  addOptionToItem: (productId: string, option: OrderOption) => void;
  removeOptionFromItem: (productId: string, optionId: string) => void;
  clearCart: () => void;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = (product: Product, options?: OrderOption[]) => {
    setItems(currentItems => {
      const existingItem = currentItems.find(item => item.product.id === product.id);
      if (existingItem) {
        return currentItems.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...currentItems, { product, quantity: 1, options }];
    });
  };

  const removeItem = (productId: string) => {
    setItems(currentItems => currentItems.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) {
      removeItem(productId);
      return;
    }
    setItems(currentItems =>
      currentItems.map(item =>
        item.product.id === productId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const addOptionToItem = (productId: string, option: OrderOption) => {
    setItems(currentItems =>
      currentItems.map(item => {
        if (item.product.id === productId) {
          const options = item.options || [];
          // Check if option already exists
          const existingOption = options.find(opt => opt.id === option.id);
          if (existingOption) {
            return item; // Option already exists, don't add it again
          }
          return { ...item, options: [...options, option] };
        }
        return item;
      })
    );
  };

  const removeOptionFromItem = (productId: string, optionId: string) => {
    setItems(currentItems =>
      currentItems.map(item => {
        if (item.product.id === productId && item.options) {
          return {
            ...item,
            options: item.options.filter(option => option.id !== optionId)
          };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const total = items.reduce(
    (sum, item) => {
      // Base product price
      let itemTotal = item.product.price * item.quantity;
      
      // Add options prices
      if (item.options && item.options.length > 0) {
        const optionsTotal = item.options.reduce(
          (optSum, option) => optSum + option.price,
          0
        );
        itemTotal += optionsTotal * item.quantity;
      }
      
      return sum + itemTotal;
    },
    0
  );

  return (
    <CartContext.Provider value={{
      items,
      addItem,
      removeItem,
      updateQuantity,
      addOptionToItem,
      removeOptionFromItem,
      clearCart,
      total
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}