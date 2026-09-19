'use client';

import React from 'react';
import { Menu, Search, X } from 'lucide-react';
import { useBudget } from '@/lib/store';

interface HeaderProps {
  onOpenDrawer: () => void;
  isSearchOpen: boolean;
  onToggleSearch: () => void;
}

export function Header({ onOpenDrawer, isSearchOpen, onToggleSearch }: HeaderProps) {
  const { userName } = useBudget();

  return (
    <header className="relative w-full bg-gradient-to-b from-[#FFF2F0] via-[#FFEAE7] to-[#FFE3DF] pt-safe shadow-xs select-none">
      <div className="max-w-md mx-auto px-4 pt-3 pb-5 flex items-center justify-between relative z-10">
        {/* Left: Hamburger menu */}
        <button
          type="button"
          onClick={onOpenDrawer}
          aria-label="Open navigation menu"
          className="w-10 h-10 rounded-full flex items-center justify-center text-[#4A5568] hover:bg-black/5 active:scale-95 transition-all"
        >
          <Menu className="w-6 h-6 text-[#2D3748]" strokeWidth={2.2} />
        </button>

        {/* Center: Darryl Profile Avatar Badge */}
        <div className="flex items-center gap-2">
          <div className="relative group cursor-pointer" onClick={onOpenDrawer}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF8787] to-[#F46C6C] p-[2px] shadow-sm ring-2 ring-white/80 transition-transform group-hover:scale-105">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                {/* Darryl Monogram Badge */}
                <div className="w-full h-full bg-gradient-to-tr from-[#FFF0F0] to-[#FFE4E4] flex items-center justify-center font-bold text-[#F46C6C] text-sm tracking-tight">
                  {userName.charAt(0).toUpperCase()}
                </div>
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-[#48BB78] rounded-full border-2 border-white" />
          </div>
          <span className="font-semibold text-sm text-[#2D3748] tracking-tight">
            {userName}
          </span>
        </div>

        {/* Right: Search Toggle */}
        <button
          type="button"
          onClick={onToggleSearch}
          aria-label={isSearchOpen ? 'Close search' : 'Open search'}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95 ${
            isSearchOpen ? 'bg-white text-[#F46C6C] shadow-xs' : 'text-[#4A5568] hover:bg-black/5'
          }`}
        >
          {isSearchOpen ? (
            <X className="w-5 h-5 text-[#F46C6C]" strokeWidth={2.3} />
          ) : (
            <Search className="w-5 h-5 text-[#2D3748]" strokeWidth={2.2} />
          )}
        </button>
      </div>

      {/* Signature curved bottom wave transition */}
      <div className="w-full overflow-hidden leading-none -mb-[1px]">
        <svg
          className="relative block w-full h-3.5 text-[#F7F8FA]"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path
            d="M0,0 C150,90 350,-40 600,50 C850,140 1050,10 1200,60 L1200,120 L0,120 Z"
            fill="currentColor"
          />
        </svg>
      </div>
    </header>
  );
}
