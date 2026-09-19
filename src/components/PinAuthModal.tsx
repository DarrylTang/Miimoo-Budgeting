'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Lock, Delete, ShieldCheck, AlertCircle, Sparkles } from 'lucide-react';
import { useBudget } from '@/lib/store';

interface PinAuthModalProps {
  isOpen: boolean;
}

export function PinAuthModal({ isOpen }: PinAuthModalProps) {
  const { unlockApp, userName } = useBudget();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isShaking, setIsShaking] = useState(false);

  // Maximum pin length typically 4 to 6 digits
  const PIN_LENGTH = 4;

  const handleKeyPress = useCallback((val: string) => {
    setError(false);
    setErrorMessage('');
    if (pin.length < 6) {
      const nextPin = pin + val;
      setPin(nextPin);

      // If reached 4 digits, attempt unlock
      if (nextPin.length === PIN_LENGTH) {
        const success = unlockApp(nextPin);
        if (!success) {
          // If 4 digits failed, user might have a 5 or 6 digit pin, so wait unless it was strictly incorrect
          // We can give slight delay then check
          setTimeout(() => {
            if (nextPin.length === 4) {
              const retrySuccess = unlockApp(nextPin);
              if (!retrySuccess) {
                triggerError('Incorrect PIN. Please try again.');
              }
            }
          }, 200);
        }
      } else if (nextPin.length === 6) {
        const success = unlockApp(nextPin);
        if (!success) {
          triggerError('Incorrect Master PIN.');
        }
      }
    }
  }, [pin, unlockApp]);

  const handleDelete = useCallback(() => {
    setError(false);
    setErrorMessage('');
    setPin((prev) => prev.slice(0, -1));
  }, []);

  const handleClear = useCallback(() => {
    setError(false);
    setErrorMessage('');
    setPin('');
  }, []);

  const triggerError = (msg: string) => {
    setError(true);
    setErrorMessage(msg);
    setIsShaking(true);
    setTimeout(() => {
      setIsShaking(false);
      setPin('');
    }, 600);
  };

  const handleManualSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pin) return;
    const success = unlockApp(pin);
    if (!success) {
      triggerError('Incorrect Master PIN.');
    }
  };

  // Keyboard support for desktop/physical keyboards
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Enter') {
        handleManualSubmit();
      } else if (e.key === 'Escape') {
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyPress, handleDelete, handleClear, pin]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-gradient-to-b from-[#FFF0F0] via-[#F7F8FA] to-[#EDF2F7] px-6 pt-12 pb-8 select-none overflow-hidden">
      {/* Subtle background ambient circles */}
      <div className="absolute -top-20 -left-20 w-64 h-64 bg-[#F46C6C]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-20 w-72 h-72 bg-[#58B5A7]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header & Branding */}
      <div className="w-full max-w-xs flex flex-col items-center text-center relative z-10 pt-4">
        {/* Monogram Badge */}
        <div className="relative mb-3">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#FF7676] to-[#F46C6C] p-[3px] shadow-lg ring-4 ring-white">
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
              <span className="font-extrabold text-[#F46C6C] text-2xl tracking-tight">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#2D3748] rounded-full border-2 border-white flex items-center justify-center text-white shadow-xs">
            <Lock className="w-3 h-3 text-amber-300" />
          </div>
        </div>

        <h1 className="font-extrabold text-xl text-[#2D3748] tracking-tight">
          Miimoo Budgeting
        </h1>
        <p className="text-xs text-gray-500 mt-1 font-medium max-w-[240px]">
          Enter your Master Passcode to access your private dashboard
        </p>

        {/* PIN Dots Indicator */}
        <div
          className={`flex items-center gap-3.5 my-7 transition-transform ${
            isShaking ? 'animate-shake' : ''
          }`}
        >
          {Array.from({ length: Math.max(4, pin.length) }).map((_, i) => {
            const isFilled = i < pin.length;
            return (
              <div
                key={i}
                className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                  error
                    ? 'bg-[#EF4444] scale-110 shadow-sm shadow-red-300'
                    : isFilled
                    ? 'bg-[#F46C6C] scale-125 shadow-sm shadow-coral-300'
                    : 'bg-gray-300'
                }`}
              />
            );
          })}
        </div>

        {/* Error Feedback */}
        {error && (
          <div className="flex items-center gap-1.5 text-xs text-[#E53E3E] font-bold animate-in fade-in slide-in-from-top-1 duration-150">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{errorMessage || 'Incorrect Passcode'}</span>
          </div>
        )}
      </div>

      {/* Numeric Keypad */}
      <div className="w-full max-w-xs relative z-10">
        <div className="grid grid-cols-3 gap-3.5 sm:gap-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleKeyPress(digit)}
              className="h-14 sm:h-16 rounded-2xl bg-white hover:bg-gray-50 active:bg-gray-100 text-[#2D3748] font-bold text-xl shadow-xs border border-gray-100/80 flex items-center justify-center transition-all active:scale-95 cursor-pointer"
            >
              {digit}
            </button>
          ))}

          {/* Bottom Row: Clear, 0, Backspace */}
          <button
            type="button"
            onClick={handleClear}
            className="h-14 sm:h-16 rounded-2xl bg-gray-100/70 hover:bg-gray-200/70 active:bg-gray-200 text-gray-500 font-bold text-xs uppercase tracking-wider flex items-center justify-center transition-all active:scale-95 cursor-pointer"
          >
            Clear
          </button>

          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="h-14 sm:h-16 rounded-2xl bg-white hover:bg-gray-50 active:bg-gray-100 text-[#2D3748] font-bold text-xl shadow-xs border border-gray-100/80 flex items-center justify-center transition-all active:scale-95 cursor-pointer"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleDelete}
            aria-label="Backspace"
            className="h-14 sm:h-16 rounded-2xl bg-gray-100/70 hover:bg-gray-200/70 active:bg-gray-200 text-gray-600 flex items-center justify-center transition-all active:scale-95 cursor-pointer"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Security Assurance Badge */}
        <div className="mt-5 text-center flex flex-col items-center justify-center text-[10px] text-gray-400 space-y-1">
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-[#10B981]" />
            <span>Encrypted Perpetual Device Session</span>
          </div>
          <span className="text-[9px] text-gray-400/80">
            Default PIN: <strong className="text-gray-500 font-mono">1234</strong> (or customize in Settings)
          </span>
        </div>
      </div>
    </div>
  );
}
