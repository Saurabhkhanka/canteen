'use client';

import { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { useGetMenuQuery } from '@/store/services/foodApi';
import { useGetMyOrdersQuery } from '@/store/services/orderApi';
import { useGetMeQuery } from '@/store/services/authApi';
import { setCredentials, setLoading } from '@/store/slices/authSlice';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import MenuCard from '@/components/MenuCard';
import CartDrawer from '@/components/CartDrawer';
import { Search, RotateCcw, AlertTriangle, Coffee, Utensils, GlassWater, IndianRupee, Clock, CheckCircle } from 'lucide-react';

export default function StudentDashboard() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  
  const { isAuthenticated, user, loading } = useAppSelector((state) => state.auth);

  // States
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [category, setCategory] = useState<string>('All');
  const [isVeg, setIsVeg] = useState<boolean | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');

  // 1. Fetch current profile if not loaded
  const { data: meData, isFetching: isMeFetching } = useGetMeQuery(undefined, {
    skip: isAuthenticated,
  });

  useEffect(() => {
    if (meData?.success && meData.user) {
      dispatch(setCredentials(meData.user));
    } else if (!isMeFetching && !isAuthenticated) {
      dispatch(setLoading(false));
      router.replace('/login');
    }
  }, [meData, isMeFetching, isAuthenticated, dispatch, router]);

  // Route protection
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/login');
    } else if (isAuthenticated && user && user.role !== 'student') {
      router.replace('/admin');
    }
  }, [isAuthenticated, user, loading, router]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounced(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // 2. Fetch menu and orders
  const {
    data: menuData,
    isLoading: isMenuLoading,
    isError: isMenuError,
    refetch: refetchMenu,
  } = useGetMenuQuery({
    category: category === 'All' ? undefined : category,
    isVeg,
    search: searchDebounced.trim() ? searchDebounced.trim() : undefined,
  }, {
    skip: !isAuthenticated || user?.role !== 'student',
  });

  const {
    data: ordersData,
    isLoading: isOrdersLoading,
    refetch: refetchOrders,
  } = useGetMyOrdersQuery(undefined, {
    skip: !isAuthenticated || user?.role !== 'student',
    pollingInterval: 10000, // Poll orders every 10s to reflect status changes!
  });

  if (loading || isMeFetching || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2Icon />
          <p className="text-slate-500 font-medium text-sm">Loading workspace...</p>
        </div>
      </div>
    );
  }

  const handleResetFilters = () => {
    setCategory('All');
    setIsVeg(undefined);
    setSearch('');
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'Preparing':
        return 'bg-blue-50 text-blue-700 border-blue-200/50';
      case 'Ready for Pickup':
        return 'bg-green-50 text-green-700 border-green-200/50 animate-pulse';
      case 'Completed':
        return 'bg-slate-50 text-slate-400 border-slate-100';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col">
      <Navbar onCartToggle={() => setIsCartOpen(true)} />

      {/* Cart side drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content (Browse Menu) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Welcome Banner & Spend Stat */}
          <div className="bg-gradient-to-r from-amber-500 to-rose-500 rounded-3xl p-6 text-white shadow-xl shadow-amber-500/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h2 className="font-display font-extrabold text-2xl tracking-tight">Welcome, {user.name}!</h2>
              <p className="text-amber-100 text-sm mt-1">Ready to order something delicious today?</p>
            </div>
            
            {/* Total Spent Stat widget */}
            <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <IndianRupee size={20} />
              </div>
              <div>
                <p className="text-[10px] text-amber-100 uppercase font-bold tracking-wider">Total Spent</p>
                <p className="font-display font-extrabold text-xl leading-none mt-1">
                  ₹{(ordersData?.data?.reduce((sum, o) => sum + (o.status === 'Completed' ? o.totalPrice : 0), 0) || 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Search and Filters panel */}
          <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm space-y-4">
            
            {/* Search */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <Search size={18} />
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search food items (e.g. paneer, wraps, shakes)..."
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-500 rounded-xl text-sm focus:outline-none transition-all"
              />
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              
              {/* Category pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {['All', 'Snacks', 'Meals', 'Drinks'].map((cat) => {
                  const Icon = cat === 'Snacks' ? Coffee : cat === 'Meals' ? Utensils : cat === 'Drinks' ? GlassWater : null;
                  const isSelected = category === cat;

                  return (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap ${
                        isSelected
                          ? 'bg-amber-500 border-amber-500 text-white shadow-sm'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      {Icon && <Icon size={12} />}
                      <span>{cat}</span>
                    </button>
                  );
                })}
              </div>

              {/* Veg Toggle & Reset */}
              <div className="flex items-center gap-2">
                
                {/* Veg Toggle */}
                <button
                  onClick={() => setIsVeg(isVeg === undefined ? true : isVeg === true ? false : undefined)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    isVeg === true
                      ? 'bg-green-50 border-green-200 text-green-700 font-bold'
                      : isVeg === false
                      ? 'bg-rose-50 border-rose-200 text-rose-700 font-bold'
                      : 'bg-white border-slate-200 text-slate-500'
                  }`}
                >
                  {isVeg === true ? 'Only Veg' : isVeg === false ? 'Only Non-Veg' : 'Veg / Non-Veg'}
                </button>

                {/* Reset button */}
                {(category !== 'All' || isVeg !== undefined || search !== '') && (
                  <button
                    onClick={handleResetFilters}
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 border border-slate-200 bg-white rounded-lg transition-colors cursor-pointer"
                    title="Clear Filters"
                  >
                    <RotateCcw size={14} />
                  </button>
                )}

              </div>

            </div>

          </div>

          {/* Menu Items Grid */}
          <div>
            <h3 className="font-display font-bold text-lg text-slate-800 mb-4 px-1">Browse Menu</h3>
            
            {isMenuLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-64 rounded-2xl bg-white border border-slate-200/60 p-5 animate-pulse space-y-4">
                    <div className="w-full h-24 bg-slate-100 rounded-xl" />
                    <div className="w-2/3 h-5 bg-slate-100 rounded-lg" />
                    <div className="w-full h-8 bg-slate-100 rounded-lg" />
                  </div>
                ))}
              </div>
            ) : isMenuError ? (
              <div className="p-8 bg-rose-50 border border-rose-200 rounded-2xl text-center text-rose-700 text-sm font-semibold flex items-center justify-center gap-2">
                <AlertTriangle size={18} />
                <span>Error loading menu items. Please try again.</span>
              </div>
            ) : menuData?.count === 0 ? (
              <div className="p-12 text-center text-slate-400 bg-white border border-slate-200/60 rounded-2xl shadow-sm">
                <p className="text-sm font-medium">No menu items match your search/filters.</p>
                <button
                  onClick={handleResetFilters}
                  className="text-xs text-amber-500 font-bold hover:text-amber-600 hover:underline mt-2 cursor-pointer"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {menuData?.data.map((item) => (
                  <MenuCard key={item._id} item={item} />
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Content Sidebar (Active Orders & History) */}
        <div className="space-y-6">
          <h3 className="font-display font-bold text-lg text-slate-800 px-1 flex items-center justify-between">
            <span>Order History</span>
            <button
              onClick={() => refetchOrders()}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw size={10} />
              <span>Refresh</span>
            </button>
          </h3>

          {isOrdersLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-white border border-slate-200/60 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : ordersData?.count === 0 ? (
            <div className="p-8 bg-white border border-slate-200/60 rounded-2xl text-center text-slate-400 text-xs">
              You have not placed any orders yet. Once you order food, it will appear here.
            </div>
          ) : (
            <div className="space-y-4 max-h-[calc(100vh-16rem)] overflow-y-auto pr-1">
              {ordersData?.data.map((order) => {
                const dateString = new Date(order.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                const isPulsing = order.status === 'Ready for Pickup';

                return (
                  <div
                    key={order._id}
                    className={`bg-white border rounded-2xl p-4 shadow-sm hover:border-slate-300 transition-all duration-200 ${
                      isPulsing ? 'ring-2 ring-green-500/20 border-green-300' : 'border-slate-200/60'
                    }`}
                  >
                    
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Order ID</p>
                        <p className="text-xs font-semibold text-slate-800 font-mono mt-0.5">{order._id.slice(-8)}</p>
                      </div>

                      {/* Colored status badge */}
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border tracking-wide uppercase ${getStatusStyle(order.status)}`}>
                        {order.status}
                      </span>
                    </div>

                    {/* Ordered Items list */}
                    <div className="border-t border-slate-100 py-2.5">
                      <ul className="space-y-1.5">
                        {order.items.map((item, index) => (
                          <li key={index} className="text-xs text-slate-600 flex justify-between">
                            <span>{item.name} <span className="text-slate-400 font-semibold">x{item.quantity}</span></span>
                            <span className="font-semibold text-slate-700">₹{(item.price * item.quantity).toFixed(2)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-slate-100 pt-2.5 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-semibold">{dateString}</span>
                      <div className="text-right">
                        <span className="text-xs text-slate-500 mr-1.5 font-semibold">Paid</span>
                        <span className="text-sm font-extrabold text-slate-800">₹{order.totalPrice.toFixed(2)}</span>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>

      </main>
    </div>
  );
}

// Simple loader helper
function Loader2Icon() {
  return <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-amber-500 animate-spin" />;
}
