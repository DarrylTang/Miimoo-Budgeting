'use client';

import React, { useState } from 'react';
import {
  X,
  Plus,
  ArrowRightLeft,
  Edit2,
  Wallet,
  CreditCard,
  Building2,
  Coins,
  Check,
} from 'lucide-react';
import { useBudget } from '@/lib/store';
import { Account, AccountType } from '@/types';

interface ManageAccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ManageAccountsModal({ isOpen, onClose }: ManageAccountsModalProps) {
  const { accounts, addAccount, updateAccount, transferMoney } = useBudget();

  // Mode: 'list' | 'add' | 'adjust' | 'transfer'
  const [subView, setSubView] = useState<'list' | 'add' | 'adjust' | 'transfer'>('list');

  // Add Account state
  const [newAccName, setNewAccName] = useState('');
  const [newAccType, setNewAccType] = useState<AccountType>('local');
  const [newAccBalance, setNewAccBalance] = useState('');
  const [newAccCurrency, setNewAccCurrency] = useState('SGD');

  // Adjust Balance state
  const [selectedAccForAdjust, setSelectedAccForAdjust] = useState<Account | null>(null);
  const [adjustedBalance, setAdjustedBalance] = useState('');

  // Transfer state
  const [transferFromId, setTransferFromId] = useState(accounts[0]?.id || '');
  const [transferToId, setTransferToId] = useState(accounts[1]?.id || '');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferNote, setTransferNote] = useState('');

  if (!isOpen) return null;

  const handleCreateAccount = () => {
    if (!newAccName.trim()) return;
    const initialBal = parseFloat(newAccBalance) || 0;
    addAccount({
      name: newAccName.trim(),
      type: newAccType,
      currency: newAccCurrency,
      balance: initialBal,
      color: newAccType === 'overseas' ? '#58B5A7' : '#F46C6C',
    });
    setNewAccName('');
    setNewAccBalance('');
    setSubView('list');
  };

  const handleSaveAdjustedBalance = () => {
    if (!selectedAccForAdjust) return;
    const newBal = parseFloat(adjustedBalance) || 0;
    updateAccount(selectedAccForAdjust.id, { balance: newBal });
    setSelectedAccForAdjust(null);
    setSubView('list');
  };

  const handleExecuteTransfer = () => {
    const amount = parseFloat(transferAmount);
    if (!amount || amount <= 0 || transferFromId === transferToId) return;
    transferMoney(transferFromId, transferToId, amount, transferNote);
    setTransferAmount('');
    setTransferNote('');
    setSubView('list');
  };

  const getAccountIcon = (type: AccountType) => {
    switch (type) {
      case 'overseas':
        return <CreditCard className="w-5 h-5 text-[#58B5A7]" />;
      case 'local':
      default:
        return <Building2 className="w-5 h-5 text-[#F46C6C]" />;
    }
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
            onClick={() => {
              if (subView !== 'list') setSubView('list');
              else onClose();
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="font-bold text-base text-[#2D3748]">
            {subView === 'list' && 'Manage Accounts'}
            {subView === 'add' && 'New Account'}
            {subView === 'adjust' && 'Adjust Balance'}
            {subView === 'transfer' && 'Transfer Money'}
          </h2>
          <div className="w-8" />
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 no-scrollbar">
          {subView === 'list' && (
            <>
              {/* Action Buttons: Transfer & Add Account */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSubView('transfer')}
                  className="py-2.5 px-3 bg-[#E8F8F5] hover:bg-[#d6f2ed] text-[#4EABA0] rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>Transfer Funds</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSubView('add')}
                  className="py-2.5 px-3 bg-[#FFF0F0] hover:bg-[#ffe2e2] text-[#F46C6C] rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Account</span>
                </button>
              </div>

              {/* Accounts List */}
              <div className="space-y-3">
                {accounts.map((acc) => (
                  <div
                    key={acc.id}
                    className="p-4 bg-white rounded-2xl border border-gray-100 card-shadow flex items-center justify-between hover:border-gray-200 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-gray-50 flex items-center justify-center shadow-2xs">
                        {getAccountIcon(acc.type)}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-[#2D3748]">{acc.name}</h4>
                        <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
                          {acc.type} • {acc.currency}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="font-extrabold text-sm text-[#2D3748] block">
                          ${acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAccForAdjust(acc);
                            setAdjustedBalance(acc.balance.toString());
                            setSubView('adjust');
                          }}
                          className="text-[10px] font-bold text-[#58B5A7] hover:underline"
                        >
                          Adjust
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Subview: Add Account */}
          {subView === 'add' && (
            <div className="space-y-3 animate-in fade-in">
              <div>
                <label className="text-xs font-bold text-[#718096] block mb-1">
                  Account Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Overseas Card, Maybank, DBS"
                  value={newAccName}
                  onChange={(e) => setNewAccName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-[#2D3748] outline-hidden focus:border-[#F46C6C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#718096] block mb-1">
                    Type
                  </label>
                  <select
                    value={newAccType}
                    onChange={(e) => setNewAccType(e.target.value as AccountType)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-[#2D3748] outline-hidden"
                  >
                    <option value="local">Local</option>
                    <option value="overseas">Overseas</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#718096] block mb-1">
                    Currency
                  </label>
                  <select
                    value={newAccCurrency}
                    onChange={(e) => setNewAccCurrency(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-[#2D3748] outline-hidden"
                  >
                    <option value="SGD">SGD ($)</option>
                    <option value="MYR">MYR (RM)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#718096] block mb-1">
                  Initial Balance
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={newAccBalance}
                  onChange={(e) => setNewAccBalance(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-[#2D3748] outline-hidden"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setSubView('list')}
                  className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateAccount}
                  className="flex-1 py-2.5 rounded-xl bg-[#F46C6C] text-white font-bold text-xs hover:bg-[#E05A5A]"
                >
                  Save Account
                </button>
              </div>
            </div>
          )}

          {/* Subview: Adjust Balance */}
          {subView === 'adjust' && selectedAccForAdjust && (
            <div className="space-y-3 animate-in fade-in">
              <div className="p-3 bg-gray-50 rounded-xl text-xs text-gray-600">
                Adjusting balance for{' '}
                <strong className="text-[#2D3748]">{selectedAccForAdjust.name}</strong>
              </div>

              <div>
                <label className="text-xs font-bold text-[#718096] block mb-1">
                  Actual Current Balance ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={adjustedBalance}
                  onChange={(e) => setAdjustedBalance(e.target.value)}
                  autoFocus
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-[#2D3748] outline-hidden focus:border-[#58B5A7]"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setSubView('list')}
                  className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveAdjustedBalance}
                  className="flex-1 py-2.5 rounded-xl bg-[#58B5A7] text-white font-bold text-xs hover:bg-[#4EABA0]"
                >
                  Update Balance
                </button>
              </div>
            </div>
          )}

          {/* Subview: Transfer */}
          {subView === 'transfer' && (
            <div className="space-y-3 animate-in fade-in">
              <div>
                <label className="text-xs font-bold text-[#718096] block mb-1">
                  From Account
                </label>
                <select
                  value={transferFromId}
                  onChange={(e) => setTransferFromId(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#2D3748] outline-hidden"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} (${a.balance.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#718096] block mb-1">
                  To Account
                </label>
                <select
                  value={transferToId}
                  onChange={(e) => setTransferToId(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#2D3748] outline-hidden"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} (${a.balance.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#718096] block mb-1">
                  Amount ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-[#2D3748] outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#718096] block mb-1">
                  Memo / Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Card top-up, currency conversion"
                  value={transferNote}
                  onChange={(e) => setTransferNote(e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-[#2D3748] outline-hidden"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setSubView('list')}
                  className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteTransfer}
                  className="flex-1 py-2.5 rounded-xl bg-[#2C5E6E] text-white font-bold text-xs hover:bg-[#234C59]"
                >
                  Complete Transfer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
