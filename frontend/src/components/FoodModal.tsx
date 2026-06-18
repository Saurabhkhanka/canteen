'use client';

import { useState, useEffect } from 'react';
import { IFoodItemResponse } from '@/store/services/foodApi';
import {
  useCreateFoodItemMutation,
  useUpdateFoodItemMutation,
} from '@/store/services/foodApi';
import { X, Loader2, Save } from 'lucide-react';

interface IFoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  editItem?: IFoodItemResponse | null;
}

export default function FoodModal({ isOpen, onClose, editItem }: IFoodModalProps) {
  const [createFoodItem, { isLoading: isCreating }] = useCreateFoodItemMutation();
  const [updateFoodItem, { isLoading: isUpdating }] = useUpdateFoodItemMutation();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [category, setCategory] = useState<'Snacks' | 'Meals' | 'Drinks'>('Snacks');
  const [isVeg, setIsVeg] = useState(true);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isEditMode = !!editItem;
  const isLoading = isCreating || isUpdating;

  // Sync inputs if editItem is supplied
  useEffect(() => {
    if (editItem) {
      setName(editItem.name);
      setDescription(editItem.description);
      setPrice(String(editItem.price));
      setStock(String(editItem.stock));
      setCategory(editItem.category);
      setIsVeg(editItem.isVeg);
    } else {
      setName('');
      setDescription('');
      setPrice('');
      setStock('');
      setCategory('Snacks');
      setIsVeg(true);
    }
    setErrorMessage(null);
  }, [editItem, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Basic Validations
    if (!name.trim() || !description.trim() || !price || !stock) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    const priceNum = parseFloat(price);
    const stockNum = parseInt(stock, 10);

    if (isNaN(priceNum) || priceNum < 0) {
      setErrorMessage('Price must be a valid positive number.');
      return;
    }

    if (isNaN(stockNum) || stockNum < 0) {
      setErrorMessage('Stock must be a valid positive integer.');
      return;
    }

    const payload = {
      name: name.trim(),
      description: description.trim(),
      price: priceNum,
      stock: stockNum,
      category,
      isVeg,
    };

    try {
      if (isEditMode && editItem) {
        await updateFoodItem({ id: editItem._id, body: payload }).unwrap();
      } else {
        await createFoodItem(payload).unwrap();
      }
      onClose();
    } catch (err: any) {
      console.error('Menu save error:', err);
      setErrorMessage(err.data?.message || 'Error saving food item. Try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl z-10 border border-slate-100 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <h3 className="font-display font-bold text-lg text-slate-800">
            {isEditMode ? 'Edit Menu Item' : 'Add New Food Item'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Errors */}
        {errorMessage && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl text-center">
            {errorMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Item Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Cheese Pizza"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Description *
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the item ingredients, preparation, details..."
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Price (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Quantity in Stock *
              </label>
              <input
                type="number"
                required
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="10"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 items-center">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-500 focus:bg-white transition-colors cursor-pointer"
              >
                <option value="Snacks">Snacks</option>
                <option value="Meals">Meals</option>
                <option value="Drinks">Drinks</option>
              </select>
            </div>

            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="isVegCheckbox"
                checked={isVeg}
                onChange={(e) => setIsVeg(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 border-slate-300 focus:ring-amber-500 cursor-pointer"
              />
              <label htmlFor="isVegCheckbox" className="text-sm font-semibold text-slate-700 cursor-pointer select-none">
                Is Vegetarian? (Veg)
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-sm cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-amber-500/10 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>{isEditMode ? 'Save Changes' : 'Create Item'}</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
