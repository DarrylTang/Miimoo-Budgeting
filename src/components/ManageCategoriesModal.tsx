'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  Plus,
  Edit2,
  Trash2,
  Check,
  RotateCcw,
  AlertCircle,
  Search,
} from 'lucide-react';
import { useBudget } from '@/lib/store';
import { CategoryItem } from '@/types';
import { CategoryIcon, AVAILABLE_CATEGORY_ICONS } from '@/components/CategoryIcon';

interface ManageCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Color palettes for categories: each has a vibrant accent color and matching light pastel background
export const CATEGORY_COLOR_PALETTES = [
  { color: '#F46C6C', bgColor: '#FFF0F0', name: 'Coral Red' },
  { color: '#F97316', bgColor: '#FFF7ED', name: 'Orange' },
  { color: '#E89E38', bgColor: '#FFFBEB', name: 'Amber' },
  { color: '#10B981', bgColor: '#ECFDF5', name: 'Emerald' },
  { color: '#58B5A7', bgColor: '#E8F8F5', name: 'Teal' },
  { color: '#2C5E6E', bgColor: '#E6F0F2', name: 'Deep Teal' },
  { color: '#06B6D4', bgColor: '#ECFEFF', name: 'Cyan' },
  { color: '#3B82F6', bgColor: '#EFF6FF', name: 'Blue' },
  { color: '#6366F1', bgColor: '#EEF2FF', name: 'Indigo' },
  { color: '#8B5CF6', bgColor: '#F5F3FF', name: 'Purple' },
  { color: '#EC4899', bgColor: '#FDF2F8', name: 'Pink' },
  { color: '#64748B', bgColor: '#F1F5F9', name: 'Slate' },
];

export function ManageCategoriesModal({ isOpen, onClose }: ManageCategoriesModalProps) {
  const {
    categories,
    transactions,
    addCategory,
    updateCategory,
    deleteCategory,
    resetCategoriesToDefault,
  } = useBudget();

  // Mode: 'list' | 'add' | 'edit'
  const [viewMode, setViewMode] = useState<'list' | 'add' | 'edit'>('list');

  // Filter in list mode: 'all' | 'expense' | 'income'
  const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'income'>('all');

  // Currently editing category
  const [editingCatId, setEditingCatId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [type, setType] = useState<'expense' | 'income' | 'both'>('expense');
  const [icon, setIcon] = useState('UtensilsCrossed');
  const [color, setColor] = useState('#F46C6C');
  const [bgColor, setBgColor] = useState('#FFF0F0');
  const [formError, setFormError] = useState<string | null>(null);

  // Icon search in form
  const [iconSearch, setIconSearch] = useState('');

  // Delete confirmation state
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryItem | null>(null);

  // Reset confirmation state
  const [confirmReset, setConfirmReset] = useState(false);

  // Calculate usage counts per category name
  const usageCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.forEach((tx) => {
      map[tx.category] = (map[tx.category] || 0) + 1;
    });
    return map;
  }, [transactions]);

  // Filtered categories
  const filteredCategories = useMemo(() => {
    if (typeFilter === 'all') return categories;
    return categories.filter((c) => c.type === typeFilter || c.type === 'both');
  }, [categories, typeFilter]);

  // Filtered icons for the icon picker
  const filteredIcons = useMemo(() => {
    if (!iconSearch.trim()) return AVAILABLE_CATEGORY_ICONS;
    const query = iconSearch.toLowerCase();
    return AVAILABLE_CATEGORY_ICONS.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.label.toLowerCase().includes(query)
    );
  }, [iconSearch]);

  if (!isOpen) return null;

  const handleStartAdd = () => {
    setEditingCatId(null);
    setName('');
    setType(typeFilter === 'income' ? 'income' : 'expense');
    setIcon('Tag');
    setColor('#58B5A7');
    setBgColor('#E8F8F5');
    setFormError(null);
    setIconSearch('');
    setViewMode('add');
  };

  const handleStartEdit = (cat: CategoryItem) => {
    setEditingCatId(cat.id);
    setName(cat.name);
    setType(cat.type);
    setIcon(cat.icon);
    setColor(cat.color || '#F46C6C');
    setBgColor(cat.bgColor || '#FFF0F0');
    setFormError(null);
    setIconSearch('');
    setViewMode('edit');
  };

  const handleSelectColorPalette = (p: typeof CATEGORY_COLOR_PALETTES[0]) => {
    setColor(p.color);
    setBgColor(p.bgColor);
  };

  const handleSave = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormError('Category name is required.');
      return;
    }

    // Check for duplicate name if renamed
    const duplicate = categories.find(
      (c) =>
        c.name.toLowerCase() === trimmedName.toLowerCase() &&
        c.id !== editingCatId
    );
    if (duplicate) {
      setFormError(`A category named "${trimmedName}" already exists.`);
      return;
    }

    if (viewMode === 'edit' && editingCatId) {
      updateCategory(editingCatId, {
        name: trimmedName,
        type,
        icon,
        color,
        bgColor,
      });
    } else {
      addCategory({
        name: trimmedName,
        type,
        icon,
        color,
        bgColor,
      });
    }

    setViewMode('list');
  };

  const handleConfirmDelete = () => {
    if (!categoryToDelete) return;
    deleteCategory(categoryToDelete.id);
    setCategoryToDelete(null);
  };

  const handleResetToDefaults = () => {
    if (confirmReset) {
      resetCategoriesToDefault();
      setConfirmReset(false);
    } else {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 4000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center select-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-200"
        onClick={() => {
          if (viewMode !== 'list') setViewMode('list');
          else onClose();
        }}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl z-10 max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
        {/* Header */}
        <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-gray-100">
          <button
            onClick={() => {
              if (viewMode !== 'list') setViewMode('list');
              else onClose();
            }}
            aria-label="Close modal"
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <h2 className="font-bold text-base text-[#2D3748]">
            {viewMode === 'list' && 'Entry Categories'}
            {viewMode === 'add' && 'New Category'}
            {viewMode === 'edit' && 'Edit Category'}
          </h2>

          <div className="w-8 flex justify-end">
            {viewMode === 'list' && (
              <button
                type="button"
                onClick={handleResetToDefaults}
                title="Reset categories to default"
                className={`p-1.5 rounded-lg transition-colors text-xs ${
                  confirmReset
                    ? 'bg-red-50 text-red-600 font-bold'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                }`}
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar">
          {/* ===================== LIST VIEW ===================== */}
          {viewMode === 'list' && (
            <div className="space-y-4 animate-in fade-in">
              {/* Type Filter Tabs + Add Button */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex bg-[#F1F3F6] p-1 rounded-2xl flex-1">
                  <button
                    type="button"
                    onClick={() => setTypeFilter('all')}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      typeFilter === 'all'
                        ? 'bg-white text-[#2D3748] shadow-xs'
                        : 'text-[#718096] hover:text-[#2D3748]'
                    }`}
                  >
                    All ({categories.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTypeFilter('expense')}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      typeFilter === 'expense'
                        ? 'bg-[#FF7676] text-white shadow-xs'
                        : 'text-[#718096] hover:text-[#2D3748]'
                    }`}
                  >
                    Expense ({categories.filter((c) => c.type === 'expense' || c.type === 'both').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTypeFilter('income')}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      typeFilter === 'income'
                        ? 'bg-[#58B5A7] text-white shadow-xs'
                        : 'text-[#718096] hover:text-[#2D3748]'
                    }`}
                  >
                    Income ({categories.filter((c) => c.type === 'income' || c.type === 'both').length})
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleStartAdd}
                  className="py-2 px-3 bg-[#58B5A7] hover:bg-[#4EABA0] text-white rounded-2xl font-bold text-xs flex items-center gap-1 shadow-xs active:scale-95 transition-all shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>

              {/* Reset warning toast */}
              {confirmReset && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between text-xs text-red-600 animate-in fade-in">
                  <div className="flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Tap reset icon again to restore defaults</span>
                  </div>
                  <button
                    onClick={() => setConfirmReset(false)}
                    className="text-red-400 hover:text-red-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Categories Cards List */}
              <div className="space-y-2">
                {filteredCategories.map((cat) => {
                  const txCount = usageCountMap[cat.name] || 0;
                  return (
                    <div
                      key={cat.id}
                      className="p-3 bg-white rounded-2xl border border-gray-100 hover:border-gray-200 card-shadow flex items-center justify-between transition-all group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Category Icon Badge */}
                        <div
                          className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs"
                          style={{
                            backgroundColor: cat.bgColor || '#FFF0F0',
                            color: cat.color || '#F46C6C',
                          }}
                        >
                          <CategoryIcon name={cat.icon} className="w-5 h-5" strokeWidth={2.2} />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-[#2D3748] truncate">
                              {cat.name}
                            </h4>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                                cat.type === 'income'
                                  ? 'bg-[#E8F8F5] text-[#4EABA0]'
                                  : cat.type === 'both'
                                  ? 'bg-[#F1F5F9] text-[#64748B]'
                                  : 'bg-[#FFF0F0] text-[#F46C6C]'
                              }`}
                            >
                              {cat.type}
                            </span>
                          </div>
                          <span className="text-[11px] font-medium text-gray-400 block mt-0.5">
                            {txCount} {txCount === 1 ? 'transaction' : 'transactions'}
                          </span>
                        </div>
                      </div>

                      {/* Actions: Edit & Delete */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(cat)}
                          className="w-8 h-8 rounded-xl bg-gray-50 hover:bg-[#E0F4F1] hover:text-[#58B5A7] flex items-center justify-center text-gray-500 active:scale-95 transition-colors"
                          title={`Edit ${cat.name}`}
                          aria-label={`Edit ${cat.name}`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setCategoryToDelete(cat)}
                          className="w-8 h-8 rounded-xl bg-gray-50 hover:bg-red-50 hover:text-red-500 flex items-center justify-center text-gray-400 active:scale-95 transition-colors"
                          title={`Delete ${cat.name}`}
                          aria-label={`Delete ${cat.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {filteredCategories.length === 0 && (
                  <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <p className="text-xs font-semibold text-gray-400">No categories found.</p>
                    <button
                      type="button"
                      onClick={handleStartAdd}
                      className="mt-2 text-xs font-bold text-[#58B5A7] hover:underline"
                    >
                      Create one now
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===================== ADD / EDIT VIEW ===================== */}
          {(viewMode === 'add' || viewMode === 'edit') && (
            <div className="space-y-4 animate-in fade-in">
              {/* Live Preview Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-b from-[#F8F9FA] to-white border border-gray-200/80 flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-xs transition-colors duration-200"
                    style={{
                      backgroundColor: bgColor,
                      color: color,
                    }}
                  >
                    <CategoryIcon name={icon} className="w-6 h-6" strokeWidth={2.3} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                      Live Preview
                    </span>
                    <h3 className="font-extrabold text-base text-[#2D3748]">
                      {name.trim() || 'Category Name'}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                          type === 'income'
                            ? 'bg-[#E8F8F5] text-[#4EABA0]'
                            : type === 'both'
                            ? 'bg-[#F1F5F9] text-[#64748B]'
                            : 'bg-[#FFF0F0] text-[#F46C6C]'
                        }`}
                      >
                        {type}
                      </span>
                      <span className="text-[10px] text-gray-400">• Icon: {icon}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Error Alert */}
              {formError && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-600 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Category Name Input */}
              <div>
                <label className="text-xs font-bold text-[#718096] block mb-1">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dining, Coffee, Subscriptions..."
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  autoFocus
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-[#2D3748] outline-hidden focus:border-[#58B5A7] focus:bg-white transition-all"
                />
              </div>

              {/* Type Selection Tabs */}
              <div>
                <label className="text-xs font-bold text-[#718096] block mb-1">
                  Entry Type
                </label>
                <div className="flex bg-[#F1F3F6] p-1 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setType('expense')}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      type === 'expense'
                        ? 'bg-[#FF7676] text-white shadow-xs'
                        : 'text-[#718096] hover:text-[#2D3748]'
                    }`}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('income')}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      type === 'income'
                        ? 'bg-[#58B5A7] text-white shadow-xs'
                        : 'text-[#718096] hover:text-[#2D3748]'
                    }`}
                  >
                    Income
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('both')}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      type === 'both'
                        ? 'bg-[#64748B] text-white shadow-xs'
                        : 'text-[#718096] hover:text-[#2D3748]'
                    }`}
                  >
                    Both
                  </button>
                </div>
              </div>

              {/* Color Palette Picker */}
              <div>
                <label className="text-xs font-bold text-[#718096] block mb-1.5">
                  Color Theme
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {CATEGORY_COLOR_PALETTES.map((palette) => {
                    const isSelected = color === palette.color;
                    return (
                      <button
                        key={palette.color}
                        type="button"
                        onClick={() => handleSelectColorPalette(palette)}
                        title={palette.name}
                        className={`h-9 rounded-xl flex items-center justify-center transition-all ${
                          isSelected
                            ? 'ring-2 ring-offset-2 ring-[#2D3748] scale-105 shadow-xs'
                            : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: palette.color }}
                      >
                        {isSelected && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Icon Picker */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-[#718096]">
                    Select Icon
                  </label>
                  <span className="text-[10px] font-semibold text-gray-400">
                    {filteredIcons.length} available
                  </span>
                </div>

                {/* Icon search input */}
                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search icons (e.g. food, car, card)..."
                    value={iconSearch}
                    onChange={(e) => setIconSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-[#2D3748] outline-hidden focus:border-[#58B5A7]"
                  />
                  {iconSearch && (
                    <button
                      type="button"
                      onClick={() => setIconSearch('')}
                      className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Icon Grid */}
                <div className="grid grid-cols-6 gap-2 max-h-44 overflow-y-auto p-1 bg-gray-50/70 rounded-2xl border border-gray-200/60 no-scrollbar">
                  {filteredIcons.map((item) => {
                    const isSelected = icon === item.name;
                    return (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => setIcon(item.name)}
                        title={item.label}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
                          isSelected
                            ? 'bg-white shadow-xs ring-2 ring-[#58B5A7] text-[#58B5A7]'
                            : 'hover:bg-white text-gray-600'
                        }`}
                      >
                        <CategoryIcon name={item.name} className="w-4 h-4" />
                        <span className="text-[8px] font-medium truncate max-w-full mt-1 text-gray-500">
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 font-bold text-xs active:scale-95 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="flex-1 py-2.5 rounded-xl bg-[#58B5A7] hover:bg-[#4EABA0] text-white font-bold text-xs shadow-xs active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{viewMode === 'edit' ? 'Update Category' : 'Save Category'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        {categoryToDelete && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-xs z-20 p-6 flex flex-col justify-center animate-in fade-in duration-150">
            <div className="text-center space-y-3 max-w-xs mx-auto">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-500 mx-auto flex items-center justify-center shadow-xs">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#2D3748]">
                Delete &quot;{categoryToDelete.name}&quot;?
              </h3>
              <p className="text-xs text-gray-500">
                {usageCountMap[categoryToDelete.name] ? (
                  <>
                    <strong className="text-red-500">
                      {usageCountMap[categoryToDelete.name]}
                    </strong>{' '}
                    existing transactions currently use this category. Deleting it will keep historical
                    transactions intact with this label.
                  </>
                ) : (
                  'This category is not currently used by any transactions.'
                )}
              </p>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setCategoryToDelete(null)}
                  className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-bold text-xs active:scale-95 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-xs shadow-xs active:scale-95 transition-all"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
