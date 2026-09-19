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
    resetToSampleData,
    loadDemoData,
    resetToCleanState,
    transactions,
    accounts,
    categories,
    recurring,
  } = useBudget();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

          {/* Reset & Demo data buttons */}
          <div className="pt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                loadDemoData();
                setStatusMsg({ type: 'success', text: 'Loaded demo transactions for Sep 2026.' });
                setTimeout(() => setStatusMsg(null), 3000);
              }}
              className="py-2.5 px-3 rounded-xl bg-gray-100 text-[#4A5568] hover:bg-gray-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Load Demo Data</span>
            </button>

            <button
              type="button"
              onClick={() => {
                resetToCleanState();
                setStatusMsg({ type: 'success', text: 'All data cleared to fresh personal clean state.' });
                setTimeout(() => setStatusMsg(null), 3000);
              }}
              className="py-2.5 px-3 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Clear to Fresh Slate</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
