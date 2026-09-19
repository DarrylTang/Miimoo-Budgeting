'use client';

import React, { useState } from 'react';
import {
  X,
  Edit2,
  Download,
  BookOpen,
  Repeat,
  Database,
  HelpCircle,
  RotateCcw,
  Eye,
  EyeOff,
  ChevronRight,
  ShieldCheck,
  Tag,
} from 'lucide-react';
import { useBudget } from '@/lib/store';

interface SidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAccounts: () => void;
  onOpenRecurring: () => void;
  onOpenCategories: () => void;
  onOpenDataCenter: () => void;
  onOpenHelp: () => void;
}

export function SidebarDrawer({
  isOpen,
  onClose,
  onOpenAccounts,
  onOpenRecurring,
  onOpenCategories,
  onOpenDataCenter,
  onOpenHelp,
}: SidebarDrawerProps) {
  const {
    userName,
    setUserName,
    exportJSON,
    resetToSampleData,
    isBalanceHidden,
    toggleBalanceHidden,
    accounts,
    transactions,
    categories,
  } = useBudget();

  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(userName);
  const [confirmReset, setConfirmReset] = useState(false);

  if (!isOpen) return null;

  const handleSaveName = () => {
    if (tempName.trim()) {
      setUserName(tempName.trim());
    }
    setIsEditingName(false);
  };

  const handleBackupNow = () => {
    exportJSON();
  };

  const handleReset = () => {
    if (confirmReset) {
      resetToSampleData();
      setConfirmReset(false);
      onClose();
    } else {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 5000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex select-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl z-10 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-left duration-200">
        <div>
          {/* Drawer Header with Close */}
          <div className="p-5 pb-3 flex items-center justify-between border-b border-gray-100">
            <span className="text-xs font-bold uppercase tracking-wider text-[#A0AEC0]">
              Menu & Settings
            </span>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 active:scale-95 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Darryl Profile Section */}
          <div className="p-5 bg-gradient-to-b from-[#FFF5F5] to-white border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#FF7676] to-[#F46C6C] p-[2.5px] shadow-sm">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center font-bold text-xl text-[#F46C6C]">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-[#38A169] rounded-full border-2 border-white" />
              </div>

              <div className="flex-1 min-w-0">
                {isEditingName ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                      autoFocus
                      className="w-full text-base font-bold text-[#2D3748] border-b border-[#F46C6C] outline-hidden bg-transparent px-1"
                    />
                    <button
                      onClick={handleSaveName}
                      className="text-xs px-2 py-1 bg-[#F46C6C] text-white rounded-md font-medium"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-lg font-bold text-[#2D3748] truncate">{userName}</h3>
                    <button
                      onClick={() => {
                        setTempName(userName);
                        setIsEditingName(true);
                      }}
                      className="text-gray-400 hover:text-[#F46C6C] p-1 transition-colors"
                      title="Edit Name"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                <p className="text-xs text-[#718096] truncate">
                  {accounts.length} Accounts • {transactions.length} Records
                </p>
              </div>
            </div>

            {/* Dark Teal "Backup Now" Pill Button */}
            <div className="mt-4">
              <button
                type="button"
                onClick={handleBackupNow}
                className="w-full py-2.5 px-4 bg-[#2C5E6E] hover:bg-[#234C59] active:scale-[0.98] text-white rounded-xl font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Backup Now</span>
              </button>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="p-3 space-y-1">
            {/* Manage Accounts */}
            <button
              onClick={() => {
                onClose();
                onOpenAccounts();
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#E0F4F1] flex items-center justify-center text-[#58B5A7]">
                  <BookOpen className="w-4 h-4" />
                </div>
                <span className="font-semibold text-sm text-[#2D3748]">Manage Accounts</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>

            {/* Recurring */}
            <button
              onClick={() => {
                onClose();
                onOpenRecurring();
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#FFF0F0] flex items-center justify-center text-[#F46C6C]">
                  <Repeat className="w-4 h-4" />
                </div>
                <span className="font-semibold text-sm text-[#2D3748]">Recurring Rules</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>

            {/* Entry Categories */}
            <button
              onClick={() => {
                onClose();
                onOpenCategories();
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#FFF7ED] flex items-center justify-center text-[#F97316]">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-semibold text-sm text-[#2D3748] block">Entry Categories</span>
                  <span className="text-[11px] text-gray-400">{categories.length} categories</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>

            {/* Data Center */}
            <button
              onClick={() => {
                onClose();
                onOpenDataCenter();
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#EDE9FE] flex items-center justify-center text-[#8B5CF6]">
                  <Database className="w-4 h-4" />
                </div>
                <span className="font-semibold text-sm text-[#2D3748]">Data Center</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>

            {/* Q&A / Help */}
            <button
              onClick={() => {
                onClose();
                onOpenHelp();
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#FEF3C7] flex items-center justify-center text-[#D97706]">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <span className="font-semibold text-sm text-[#2D3748]">Q&A / Help</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>

            {/* Privacy Toggle */}
            <button
              onClick={toggleBalanceHidden}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#F1F5F9] flex items-center justify-center text-[#64748B]">
                  {isBalanceHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </div>
                <span className="font-semibold text-sm text-[#2D3748]">
                  {isBalanceHidden ? 'Show Balances' : 'Mask Balances'}
                </span>
              </div>
              <span className="text-xs font-medium text-gray-400">
                {isBalanceHidden ? 'Hidden' : 'Visible'}
              </span>
            </button>
          </div>
        </div>

        {/* Footer / Reset Data */}
        <div className="p-4 border-t border-gray-100 pb-safe">
          <div className="flex items-center justify-center gap-1 text-[11px] text-gray-400 mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-[#58B5A7]" />
            <span>Miimoo Budgeting v1.0 • Offline Ready</span>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className={`w-full py-2.5 px-3 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-all ${
              confirmReset
                ? 'bg-[#E53E3E] text-white animate-pulse'
                : 'bg-gray-100 text-[#718096] hover:bg-red-50 hover:text-red-600'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{confirmReset ? 'Tap again to confirm reset' : 'Reset to Sample Data'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
