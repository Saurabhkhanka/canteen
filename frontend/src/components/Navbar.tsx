'use client';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout } from '@/store/slices/authSlice';
import { selectCartTotalQuantity, clearCart } from '@/store/slices/cartSlice';
import { useLogoutMutation } from '@/store/services/authApi';
import { useRouter } from 'next/navigation';
import { ShoppingBag, LogOut, UtensilsCrossed, User } from 'lucide-react';
import Link from 'next/link';

interface INavbarProps {
  onCartToggle?: () => void;
}

export default function Navbar({ onCartToggle }: INavbarProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const cartCount = useAppSelector(selectCartTotalQuantity);
  const [triggerLogout] = useLogoutMutation();

  const handleLogout = async () => {
    try {
      await triggerLogout().unwrap();
      dispatch(logout());
      dispatch(clearCart());
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Fallback
      dispatch(logout());
      dispatch(clearCart());
      router.push('/login');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/85 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link href={isAuthenticated ? (user?.role === 'admin' ? '/admin' : '/dashboard') : '/login'} className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform duration-200">
            <UtensilsCrossed size={20} className="group-hover:rotate-12 transition-transform duration-200" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            Campus<span className="text-amber-500">Canteen</span>
          </span>
        </Link>

        {/* Action Items */}
        {isAuthenticated && user && (
          <div className="flex items-center gap-4">
            
            {/* User Profile Badge */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100/80 border border-slate-200/50">
              <User size={16} className="text-slate-500" />
              <div className="text-left leading-none">
                <p className="text-xs font-semibold text-slate-800">{user.name}</p>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mt-0.5">{user.role}</p>
              </div>
            </div>

            {/* Cart Button (Students Only) */}
            {user.role === 'student' && onCartToggle && (
              <button
                onClick={onCartToggle}
                className="relative p-2.5 rounded-xl border border-slate-200 text-slate-700 hover:text-amber-500 hover:border-amber-200 hover:bg-amber-50/50 transition-all duration-200 shadow-sm cursor-pointer"
                aria-label="Toggle Shopping Cart"
              >
                <ShoppingBag size={20} />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow-sm animate-pulse">
                    {cartCount}
                  </span>
                )}
              </button>
            )}

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50/50 transition-all duration-200 shadow-sm cursor-pointer"
              title="Logout"
            >
              <LogOut size={20} />
            </button>

          </div>
        )}

      </div>
    </header>
  );
}
