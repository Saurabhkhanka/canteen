'use client';

import { useAppDispatch } from '@/store/hooks';
import { addToCart } from '@/store/slices/cartSlice';
import { IFoodItemResponse } from '@/store/services/foodApi';
import { ShoppingCart, Flame, AlertCircle } from 'lucide-react';

interface IMenuCardProps {
  item: IFoodItemResponse;
}

export default function MenuCard({ item }: IMenuCardProps) {
  const dispatch = useAppDispatch();
  const isOutOfStock = item.stock <= 0;
  const isLowStock = item.stock > 0 && item.stock <= 5;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    dispatch(
      addToCart({
        _id: item._id,
        name: item.name,
        price: item.price,
        stock: item.stock,
      })
    );
  };

  return (
    <div className="group relative bg-white rounded-2xl border border-slate-200/60 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 hover:border-slate-300/60 transition-all duration-300 flex flex-col h-full">
      
      {/* Category & Tags Header Overlay */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10 pointer-events-none">
        
        {/* Veg / Non-Veg Indicator */}
        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase shadow-sm ${
          item.isVeg 
            ? 'bg-green-50 text-green-700 border border-green-200/50' 
            : 'bg-rose-50 text-rose-700 border border-rose-200/50'
        }`}>
          <span className={`w-2 h-2 rounded-full ${item.isVeg ? 'bg-green-600' : 'bg-rose-600'}`} />
          {item.isVeg ? 'Veg' : 'Non-Veg'}
        </span>

        {/* Category Badge */}
        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-900/80 text-white backdrop-blur-sm tracking-wide uppercase">
          {item.category}
        </span>

      </div>

      {/* Card Visual Header Placeholder / Gradient */}
      <div className="w-full h-32 bg-gradient-to-tr from-amber-500/10 to-rose-500/10 flex items-center justify-center relative overflow-hidden">
        {/* Warm visual branding background element */}
        <div className="absolute -bottom-10 -right-10 w-28 h-28 rounded-full bg-amber-500/10 blur-xl group-hover:scale-125 transition-transform duration-500" />
        <Flame size={48} className="text-amber-500/40 group-hover:scale-110 transition-transform duration-300" />
      </div>

      {/* Product Details */}
      <div className="p-5 flex flex-col flex-grow">
        
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="font-display font-bold text-lg text-slate-800 tracking-tight leading-tight group-hover:text-amber-600 transition-colors duration-200">
            {item.name}
          </h3>
          <span className="font-display font-extrabold text-xl text-slate-900 flex-shrink-0">
            ₹{item.price.toFixed(2)}
          </span>
        </div>

        <p className="text-slate-500 text-xs leading-relaxed mb-4 line-clamp-2">
          {item.description}
        </p>

        {/* Stock warning indicators */}
        <div className="mt-auto">
          {isOutOfStock ? (
            <div className="flex items-center gap-1.5 text-rose-600 bg-rose-50 border border-rose-100/50 px-3 py-1.5 rounded-xl text-xs font-semibold mb-3">
              <AlertCircle size={14} />
              <span>Sold Out</span>
            </div>
          ) : isLowStock ? (
            <div className="flex items-center gap-1.5 text-amber-700 bg-amber-50 border border-amber-100/50 px-3 py-1.5 rounded-xl text-xs font-semibold mb-3">
              <AlertCircle size={14} />
              <span>Only {item.stock} left in stock</span>
            </div>
          ) : (
            <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-3 px-1">
              Available Stock: {item.stock}
            </div>
          )}

          {/* Add to Cart button */}
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`w-full py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer ${
              isOutOfStock
                ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                : 'bg-slate-900 text-white hover:bg-amber-500 shadow-md shadow-slate-900/5 hover:shadow-amber-500/20 active:scale-[0.98]'
            }`}
          >
            <ShoppingCart size={16} />
            <span>Add to Cart</span>
          </button>
        </div>

      </div>

    </div>
  );
}
