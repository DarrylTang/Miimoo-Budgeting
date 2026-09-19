'use client';

import React from 'react';
import { X, HelpCircle, Lightbulb, Shield, Globe, Smartphone } from 'lucide-react';

interface QAHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QAHelpModal({ isOpen, onClose }: QAHelpModalProps) {
  if (!isOpen) return null;

  const faqs = [
    {
      q: 'How do I quickly log multiple daily expenses?',
      a: 'In the New Entry modal, use the "Save & Continue" button. It instantly saves your entry and clears the amount so you can log the next item in seconds without reopening.',
      icon: <Lightbulb className="w-4 h-4 text-[#F46C6C]" />,
    },
    {
      q: 'How do I track overseas travel spending (e.g. JB food)?',
      a: 'Select "Overseas Card" as the account when adding your entry. You can also tap the quick tags like "JB food" or "Malaysia spenditure" to auto-fill the memo.',
      icon: <Globe className="w-4 h-4 text-[#58B5A7]" />,
    },
    {
      q: 'How does balance privacy masking work?',
      a: 'Tap the eye icon on the Main Account card or in the sidebar. This hides all dollar amounts with $ ••••• so nobody peeking at your screen can see your figures.',
      icon: <Shield className="w-4 h-4 text-[#8B5CF6]" />,
    },
    {
      q: 'Is my financial data stored securely and offline?',
      a: 'Yes! Miimoo is a Progressive Web App (PWA) designed to function offline. All your data is stored securely in your browser and can be exported at any time via Data Center or "Backup Now".',
      icon: <Smartphone className="w-4 h-4 text-[#2C5E6E]" />,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center select-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Modal Box */}
      <div className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl z-10 max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
        {/* Header */}
        <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-gray-100">
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="font-bold text-base text-[#2D3748]">Q&A / Help Center</h2>
          <div className="w-8" />
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 no-scrollbar">
          <div className="text-center py-2">
            <div className="w-12 h-12 rounded-full bg-[#FEF3C7] text-[#D97706] flex items-center justify-center mx-auto mb-2">
              <HelpCircle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm text-[#2D3748]">Frequently Asked Questions</h3>
            <p className="text-xs text-gray-400">Everything you need to know about Miimoo</p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div key={idx} className="p-4 bg-[#F8F9FA] rounded-2xl border border-gray-100 space-y-1.5">
                <div className="flex items-center gap-2">
                  {faq.icon}
                  <h4 className="font-bold text-xs text-[#2D3748]">{faq.q}</h4>
                </div>
                <p className="text-xs text-[#718096] leading-relaxed pl-6">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
