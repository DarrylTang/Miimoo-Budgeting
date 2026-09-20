'use client';

import React, { useRef, useState } from 'react';
import {
  X,
  Download,
  Upload,
  FileSpreadsheet,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  HardDrive,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { useBudget } from '@/lib/store';

interface DataCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DataCenterModal({ isOpen, onClose }: DataCenterModalProps) {
  const {
    exportJSON,
    exportCSV,
    importJSON,
    loadDemoData,
    resetToCleanState,
    transactions,
    accounts,
    categories,
    recurring,
  } = useBudget();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const ok = importJSON(content);
        if (ok) {
          setStatusMsg({ type: 'success', text: 'Backup restored successfully!' });
        } else {
          setStatusMsg({ type: 'error', text: 'Invalid backup file format.' });
        }
        setTimeout(() => setStatusMsg(null), 4000);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center select-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl z-10 max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
        {/* Header */}
        <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-gray-100">
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="font-bold text-base text-[#2D3748]">Data Center</h2>
          <div className="w-8" />
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 no-scrollbar">
          {/* Notification feedback */}
          {statusMsg && (
            <div
              className={`p-3 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in ${
                statusMsg.type === 'success'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {statusMsg.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600" />
              )}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* Database Summary Info Card */}
          <div className="p-4 bg-[#F8F9FA] rounded-2xl border border-gray-100">
            <div className="flex items-center gap-2 mb-2 text-[#718096]">
              <HardDrive className="w-4 h-4 text-[#58B5A7]" />
              <span className="text-xs font-bold uppercase tracking-wider">Local Storage Stats</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
              <div>
                <span className="text-gray-400 block">Transactions:</span>
                <span className="font-bold text-[#2D3748]">{transactions.length} records</span>
              </div>
              <div>
                <span className="text-gray-400 block">Accounts:</span>
                <span className="font-bold text-[#2D3748]">{accounts.length} accounts</span>
              </div>
              <div>
                <span className="text-gray-400 block">Categories:</span>
                <span className="font-bold text-[#2D3748]">{categories.length} active</span>
              </div>
              <div>
                <span className="text-gray-400 block">Recurring Rules:</span>
                <span className="font-bold text-[#2D3748]">{recurring.length} rules</span>
              </div>
            </div>
          </div>

          {/* Actions List */}
          <div className="space-y-2.5">
            {/* Dark Teal Backup Now (JSON) */}
            <button
              type="button"
              onClick={exportJSON}
              className="w-full p-4 bg-[#2C5E6E] hover:bg-[#234C59] active:scale-[0.98] text-white rounded-2xl font-bold text-xs flex items-center justify-between shadow-sm transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                  <Download className="w-4 h-4 text-white" />
                </div>
                <div className="text-left">
                  <span className="block text-sm font-bold">Backup Now (JSON)</span>
                  <span className="text-[11px] font-normal text-white/80">
                    Full backup of all records & categories
                  </span>
                </div>
              </div>
            </button>

            {/* Export CSV */}
            <button
              type="button"
              onClick={exportCSV}
              className="w-full p-4 bg-white border border-gray-200 hover:border-gray-300 active:scale-[0.98] text-[#2D3748] rounded-2xl font-bold text-xs flex items-center justify-between card-shadow transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#E8F8F5] text-[#58B5A7] flex items-center justify-center">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="block text-sm font-bold">Export to CSV</span>
                  <span className="text-[11px] font-normal text-gray-400">
                    Spreadsheet format for Excel or Google Sheets
                  </span>
                </div>
              </div>
            </button>

            {/* Restore from JSON */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-4 bg-white border border-gray-200 hover:border-gray-300 active:scale-[0.98] text-[#2D3748] rounded-2xl font-bold text-xs flex items-center justify-between card-shadow transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#FFF0F0] text-[#F46C6C] flex items-center justify-center">
                  <Upload className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="block text-sm font-bold">Restore Backup</span>
                  <span className="text-[11px] font-normal text-gray-400">
                    Import transactions and accounts from JSON
                  </span>
                </div>
              </div>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {/* Sample Data & Reset Dedicated Section */}
          <div className="pt-2 border-t border-gray-100 space-y-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#A0AEC0]">
                Sample Data & Reset
              </h3>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Populate demo transactions or wipe everything to start fresh
              </p>
            </div>

            <div className="space-y-2.5">
              {/* Load Demo Data */}
              <div className="p-3.5 bg-gray-50 hover:bg-gray-100/80 rounded-2xl border border-gray-200/70 flex items-center justify-between gap-3 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-white border border-gray-200 text-[#4A5568] flex items-center justify-center shrink-0 shadow-2xs">
                    <RotateCcw className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-xs font-bold text-[#2D3748]">Load Demo Data</span>
                    <span className="text-[11px] text-gray-500 block truncate">
                      Sample accounts & Sep 2026 records
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    loadDemoData();
                    setStatusMsg({ type: 'success', text: 'Loaded demo transactions for Sep 2026.' });
                    setTimeout(() => setStatusMsg(null), 3500);
                  }}
                  className="px-3.5 py-2 bg-white hover:bg-gray-50 active:scale-95 text-[#2D3748] text-xs font-semibold rounded-xl border border-gray-200 shadow-2xs shrink-0 transition-all cursor-pointer"
                >
                  Load Demo
                </button>
              </div>

              {/* Clear to Fresh Slate */}
              <div className="p-3.5 bg-red-50/60 hover:bg-red-50 rounded-2xl border border-red-100 flex items-center justify-between gap-3 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-red-100 text-[#E53E3E] flex items-center justify-center shrink-0 shadow-2xs">
                    <Trash2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-xs font-bold text-[#E53E3E]">Clear to Fresh Slate</span>
                    <span className="text-[11px] text-red-600/70 block truncate">
                      Permanently wipe all records & accounts
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(true)}
                  className="px-3.5 py-2 bg-[#E53E3E] hover:bg-[#C53030] active:scale-95 text-white text-xs font-semibold rounded-xl shadow-2xs shrink-0 transition-all cursor-pointer"
                >
                  Clear Slate
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Clear Slate */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 border border-gray-100">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-100 text-[#E53E3E] flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-sm text-[#2D3748]">Reset to Fresh Slate?</h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  This will permanently delete all your accounts, transactions, recurring rules, and custom categories from local storage.
                </p>
                <div className="mt-2.5 p-2.5 bg-amber-50 rounded-xl border border-amber-200/60 text-[11px] text-amber-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>Recommendation: Use <strong>Backup Now (JSON)</strong> before clearing if you wish to restore later.</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="py-2.5 px-3 rounded-xl border border-gray-200 text-xs font-semibold text-[#4A5568] hover:bg-gray-50 active:scale-95 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  resetToCleanState();
                  setShowClearConfirm(false);
                  setStatusMsg({ type: 'success', text: 'All data cleared to fresh clean state.' });
                  setTimeout(() => setStatusMsg(null), 3500);
                }}
                className="py-2.5 px-3 rounded-xl bg-[#E53E3E] hover:bg-[#C53030] text-xs font-semibold text-white active:scale-95 shadow-xs transition-all cursor-pointer"
              >
                Yes, Clear All Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
