'use client';

import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  selectCartItems,
  selectCartTotalPrice,
  addToCart,
  decrementQuantity,
  removeFromCart,
  clearCart,
} from '@/store/slices/cartSlice';
import { usePlaceOrderMutation } from '@/store/services/orderApi';
import { X, Minus, Plus, Trash2, ShoppingBag, ArrowRight, Loader2 } from 'lucide-react';

interface ICartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: ICartDrawerProps) {
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector(selectCartItems);
  const totalPrice = useAppSelector(selectCartTotalPrice);
  const [placeOrder, { isLoading }] = usePlaceOrderMutation();
  
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleIncrement = (item: any) => {
    dispatch(
      addToCart({
        _id: item._id,
        name: item.name,
        price: item.price,
        stock: item.stock,
      })
    );
  };

  const handleDecrement = (id: string) => {
    dispatch(decrementQuantity(id));
  };

  const handleRemove = (id: string) => {
    dispatch(removeFromCart(id));
  };

  const handleCheckout = async () => {
    setSuccessMessage(null);
    setErrorMessage(null);

    if (cartItems.length === 0) return;

    // Map cart items for backend payload: { foodItem: string, quantity: number }
    const orderPayload = cartItems.map((item) => ({
      foodItem: item._id,
      quantity: item.quantity,
    }));

    try {
      const response = await placeOrder({ items: orderPayload }).unwrap();
      setSuccessMessage('Order placed successfully! Check your email receipt.');
      dispatch(clearCart());
      
      // Auto close and clear message after 2.5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 2500);
    } catch (err: any) {
      console.error('Checkout failed:', err);
      setErrorMessage(err.data?.message || 'Failed to place order. Try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      {/* Background backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex">
        {/* Sliding Panel */}
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col h-full transform transition-transform duration-300">
          
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="text-amber-500" size={22} />
              <h2 className="font-display font-bold text-lg text-slate-800">Your Basket</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Alert Banners */}
          {successMessage && (
            <div className="m-4 p-3 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold rounded-xl text-center">
              {successMessage}
            </div>
          )}
          {errorMessage && (
            <div className="m-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl text-center">
              {errorMessage}
            </div>
          )}

          {/* Cart Items List */}
          <div className="flex-grow overflow-y-auto px-6 py-4 space-y-4">
            {cartItems.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-3">
                <ShoppingBag size={48} className="stroke-1 text-slate-300" />
                <p className="text-sm font-medium">Your basket is empty</p>
                <button
                  onClick={onClose}
                  className="text-xs text-amber-500 font-bold hover:text-amber-600 hover:underline"
                >
                  Browse Menu items
                </button>
              </div>
            ) : (
              cartItems.map((item) => (
                <div
                  key={item._id}
                  className="flex items-center justify-between gap-4 p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-50/80 transition-colors duration-200"
                >
                  <div className="flex-grow">
                    <h4 className="text-sm font-bold text-slate-800 line-clamp-1">{item.name}</h4>
                    <p className="text-xs font-semibold text-slate-500 mt-1">₹{item.price.toFixed(2)} each</p>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center border border-slate-200 bg-white rounded-lg overflow-hidden shadow-sm">
                      <button
                        onClick={() => handleDecrement(item._id)}
                        className="p-1 px-2 hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="px-2 text-xs font-bold text-slate-800 select-none min-w-[20px] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleIncrement(item)}
                        className="p-1 px-2 hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    <button
                      onClick={() => handleRemove(item._id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Remove item"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Checkout Footer Section */}
          {cartItems.length > 0 && (
            <div className="border-t border-slate-200/80 bg-slate-50 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-500">Order Subtotal:</span>
                <span className="font-display font-extrabold text-2xl text-slate-900">₹{totalPrice.toFixed(2)}</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-normal">
                Taxes are calculated at check-out. By checking out you agree to receive an automated order confirmation invoice via email.
              </p>

              <button
                onClick={handleCheckout}
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/15 cursor-pointer disabled:opacity-50 active:scale-[0.99] transition-all"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Processing Order...</span>
                  </>
                ) : (
                  <>
                    <span>Place Order</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
