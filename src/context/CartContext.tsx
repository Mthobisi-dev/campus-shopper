'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '@/types';

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColour?: string;
  selectedSize?: string;
}

interface CartContextType {
  cart: CartItem[];
  isOpen: boolean;
  addToCart: (product: Product, colour?: string, size?: string) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  cartCount: number;
  subtotal: number;
  shippingTotal: number;
  grandTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = 'campus_shopper_cart';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setCart(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Error loading cart from storage:', e);
    }
  }, []);

  // Save cart to localStorage when updated
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.error('Error saving cart to storage:', e);
    }
  }, [cart, mounted]);

  function addToCart(product: Product, colour?: string, size?: string) {
    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.product.id === product.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += 1;
        if (colour) updated[existingIndex].selectedColour = colour;
        if (size) updated[existingIndex].selectedSize = size;
        return updated;
      }
      return [...prev, { product, quantity: 1, selectedColour: colour, selectedSize: size }];
    });
    setIsOpen(true);
  }

  function removeFromCart(productId: string) {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  }

  function updateQuantity(productId: string, quantity: number) {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, quantity } : item))
    );
  }

  function clearCart() {
    setCart([]);
  }

  function openCart() {
    setIsOpen(true);
  }

  function closeCart() {
    setIsOpen(false);
  }

  const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

  const subtotal = +cart
    .reduce((sum, item) => sum + (Number(item.product.price_zar) || 0) * item.quantity, 0)
    .toFixed(2);

  const shippingTotal = +cart
    .reduce((sum, item) => sum + (Number(item.product.shipping_cost_zar) || 0), 0)
    .toFixed(2);

  const grandTotal = +(subtotal + shippingTotal).toFixed(2);

  return (
    <CartContext.Provider
      value={{
        cart,
        isOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        openCart,
        closeCart,
        cartCount,
        subtotal,
        shippingTotal,
        grandTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
