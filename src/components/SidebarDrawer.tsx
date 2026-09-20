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
  Eye,
  EyeOff,
  ChevronRight,
  ShieldCheck,
  Tag,
  Lock,
  Cloud,
  RefreshCw,
  AlertCircle,
  WifiOff,
} from 'lucide-react';
import { useBudget } from '@/lib/store';

function getRelativeTimeString(timestamp: number | null): string {
  if (!timestamp) return 'Never';
  const diff = Math.max(0, Date.now() - timestamp);
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

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
    lockApp,
    isBalanceHidden,
    toggleBalanceHidden,
    accounts,
    transactions,
    categories,
    isSyncing,
    lastSyncedAt,
    syncStatus,
    syncError,
    syncNow,
  } = useBudget();

  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(userName);
  const [syncToast, setSyncToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  if (!isOpen) return null;

  const handleManualSync = async () => {
    try {
      const res = await syncNow();
      setSyncToast({
        message: res.message,
        type: res.success ? 'success' : 'error',
      });
      setTimeout(() => setSyncToast(null), 3500);
    } catch (err: any) {
      setSyncToast({
        message: err?.message || 'Sync failed',
        type: 'error',
      });
      setTimeout(() => setSyncToast(null), 3500);
    }
  };

  const handleSaveName = () => {
    if (tempName.trim()) {
      setUserName(tempName.trim());
    }
    setIsEditingName(false);
  };

  const handleBackupNow = () => {
    exportJSON();
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

            {/* Cloud Sync Section */}
            <div className="mt-4 p-3.5 bg-white rounded-2xl border border-gray-100 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#E0F4F1] flex items-center justify-center text-[#2C5E6E]">
                    <Cloud className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#2D3748] block">Cloud Sync</span>
                    <span className="text-[10px] text-gray-400">Auto 2-hr &amp; focus pull</span>
                  </div>
                </div>

                {/* Status Badges */}
                {isSyncing || syncStatus === 'syncing' ? (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200 shadow-2xs">
                    <RefreshCw className="w-3 h-3 animate-spin text-sky-600 shrink-0" />
                    <span>Syncing...</span>
                  </span>
                ) : syncStatus === 'offline' ? (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
                    <WifiOff className="w-3 h-3 text-amber-600 shrink-0" />
                    <span>Offline (Local Storage)</span>
                  </span>
                ) : syncStatus === 'error' ? (
                  <span
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200 shadow-2xs max-w-[130px] truncate"
                    title={syncError || 'Sync failed'}
                  >
                    <AlertCircle className="w-3 h-3 text-red-500 shrink-0" />
                    <span className="truncate">{syncError || 'Error'}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <span>Cloud Synced ({getRelativeTimeString(lastSyncedAt)})</span>
                  </span>
                )}
              </div>

              {/* Action Buttons: Sync Now & Backup Now */}
              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={handleManualSync}
                  disabled={isSyncing}
                  className="py-2 px-3 bg-[#2C5E6E] hover:bg-[#234C59] active:scale-[0.98] disabled:opacity-60 text-white rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{syncStatus === 'error' ? 'Retry Sync' : isSyncing ? 'Syncing...' : 'Sync Now'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleBackupNow}
                  className="py-2 px-3 bg-gray-100 hover:bg-gray-200 active:scale-[0.98] text-[#2D3748] rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-gray-500" />
                  <span>Backup JSON</span>
                </button>
              </div>

              {/* Sync Toast Feedback */}
              {syncToast && (
                <div
                  className={`text-[11px] font-medium text-center p-1.5 rounded-lg transition-all animate-in fade-in duration-150 ${
                    syncToast.type === 'error'
                      ? 'bg-red-50 text-red-700 border border-red-100'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                  }`}
                >
                  {syncToast.message}
                </div>
              )}
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

            {/* Lock App */}
            <button
              onClick={() => {
                onClose();
                lockApp();
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-red-50 active:bg-red-100 transition-colors text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#FFF0F0] flex items-center justify-center text-[#F46C6C]">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-semibold text-sm text-[#E53E3E] block">Lock App</span>
                  <span className="text-[11px] text-gray-400">Require Master PIN to re-enter</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-red-400" />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 pb-safe">
          <div className="flex items-center justify-center gap-1 text-[11px] text-gray-400">
            <ShieldCheck className="w-3.5 h-3.5 text-[#58B5A7]" />
            <span>Miimoo Budgeting v1.0 • Offline Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
}
