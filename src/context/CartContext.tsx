import React, { createContext, useContext, useState } from 'react';

// Define the shape of your context
interface CartContextType {
  cart: any[];
  setCart: React.Dispatch<React.SetStateAction<any[]>>;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<any[]>([]);

  const clearCart = () => setCart([]);

  return (
    <CartContext.Provider value={{ cart, setCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    // This fallback prevents the "cannot destructure property cart of useCart()" error
    return { cart: [], setCart: () => {}, clearCart: () => {} };
  }
  return context;
}