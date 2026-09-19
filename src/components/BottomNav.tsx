'use client';

import React from 'react';
import {
  Home,
  BarChart3,
  Plus,
  CreditCard as CreditCardIcon,
  Menu,
} from 'lucide-react';

export type TabType = 'home' | 'analytics' | 'cards' | 'more';

interface BottomNavProps {
  currentTab: TabType;
  onChangeTab: (tab: TabType) => void;
  onOpenNewEntry: () => void;
  onOpenDrawer: () => void;
}

export function BottomNav({
  currentTab,
  onChangeTab,
  onOpenNewEntry,
  onOpenDrawer,
}: BottomNavProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none select-none">
      <div className="max-w-md mx-auto relative pointer-events-auto">
        {/* Floating Center (+) Button */}
        <div className="absolute left-1/2 -top-6 -translate-x-1/2 z-50">
          <button
            type="button"
            onClick={onOpenNewEntry}
            aria-label="Add new transaction entry"
            className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#F46C6C] to-[#FF8787] text-white flex items-center justify-center card-shadow-elevated hover:scale-105 active:scale-95 transition-all ring-4 ring-[#F7F8FA]"
          >
            <Plus className="w-7 h-7 stroke-[2.8]" />
          </button>
        </div>

        {/* Dock Bar */}
        <div className="bg-white/95 backdrop-blur-md border-t border-gray-200/60 px-4 pt-2.5 pb-safe flex items-center justify-between shadow-lg">
          {/* Home Tab */}
          <button
            type="button"
            onClick={() => onChangeTab('home')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
              currentTab === 'home' ? 'text-[#F46C6C]' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Home className="w-5 h-5 stroke-[2.2]" />
            <span className="text-[10px] font-bold mt-1 tracking-tight">Home</span>
          </button>

          {/* Analytics Tab */}
          <button
            type="button"
            onClick={() => onChangeTab('analytics')}
            className={`flex flex-col items-center justify-center flex-1 py-1 mr-4 transition-colors ${
              currentTab === 'analytics' ? 'text-[#F46C6C]' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <BarChart3 className="w-5 h-5 stroke-[2.2]" />
            <span className="text-[10px] font-bold mt-1 tracking-tight">Analytics</span>
          </button>

          {/* Spacer for center button */}
          <div className="w-12 pointer-events-none" />

          {/* Cards Tab */}
          <button
            type="button"
            onClick={() => onChangeTab('cards')}
            className={`flex flex-col items-center justify-center flex-1 py-1 ml-4 transition-colors ${
              currentTab === 'cards' ? 'text-[#F46C6C]' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <CreditCardIcon className="w-5 h-5 stroke-[2.2]" />
            <span className="text-[10px] font-bold mt-1 tracking-tight">Cards</span>
          </button>

          {/* More Tab -> opens Drawer */}
          <button
            type="button"
            onClick={onOpenDrawer}
            className="flex flex-col items-center justify-center flex-1 py-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Menu className="w-5 h-5 stroke-[2.2]" />
            <span className="text-[10px] font-bold mt-1 tracking-tight">More</span>
          </button>
        </div>
      </div>
    </div>
  );
}
