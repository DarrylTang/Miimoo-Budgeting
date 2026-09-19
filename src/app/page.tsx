'use client';

import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { SidebarDrawer } from '@/components/SidebarDrawer';
import { HomeDashboard } from '@/components/HomeDashboard';
import { AnalyticsView } from '@/components/AnalyticsView';
import { NewEntryModal } from '@/components/NewEntryModal';
import { ManageAccountsModal } from '@/components/ManageAccountsModal';
import { RecurringModal } from '@/components/RecurringModal';
import { DataCenterModal } from '@/components/DataCenterModal';
import { QAHelpModal } from '@/components/QAHelpModal';
import { BottomNav, TabType } from '@/components/BottomNav';
import { Transaction } from '@/types';

export default function App() {
  // Navigation tabs: 'home' | 'analytics' | 'accounts' | 'more'
  const [currentTab, setCurrentTab] = useState<TabType>('home');

  // Drawer and Modal toggles
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNewEntryOpen, setIsNewEntryOpen] = useState(false);
  const [isAccountsOpen, setIsAccountsOpen] = useState(false);
  const [isRecurringOpen, setIsRecurringOpen] = useState(false);
  const [isDataCenterOpen, setIsDataCenterOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Edit transaction state
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const handleOpenEdit = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsNewEntryOpen(true);
  };

  const handleCloseNewEntry = () => {
    setIsNewEntryOpen(false);
    setEditingTransaction(null);
  };

  const handleTabChange = (tab: TabType) => {
    if (tab === 'accounts') {
      setIsAccountsOpen(true);
    } else {
      setCurrentTab(tab);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#2D3748] flex flex-col justify-between">
      {/* Mobile container centered on larger screens */}
      <div className="w-full max-w-md mx-auto min-h-screen flex flex-col bg-[#F7F8FA] relative shadow-xs">
        {/* Curved Header */}
        <Header
          onOpenDrawer={() => setIsDrawerOpen(true)}
          isSearchOpen={isSearchOpen}
          onToggleSearch={() => setIsSearchOpen((prev) => !prev)}
        />

        {/* Main Content Area */}
        <main className="flex-1 w-full pt-2">
          {currentTab === 'home' && (
            <HomeDashboard
              onOpenNewEntry={() => {
                setEditingTransaction(null);
                setIsNewEntryOpen(true);
              }}
              onOpenAccounts={() => setIsAccountsOpen(true)}
              isSearchOpen={isSearchOpen}
              onEditTransaction={handleOpenEdit}
            />
          )}

          {currentTab === 'analytics' && <AnalyticsView />}
        </main>

        {/* Fixed Mobile Bottom Dock Navigation */}
        <BottomNav
          currentTab={currentTab}
          onChangeTab={handleTabChange}
          onOpenNewEntry={() => {
            setEditingTransaction(null);
            setIsNewEntryOpen(true);
          }}
          onOpenDrawer={() => setIsDrawerOpen(true)}
        />
      </div>

      {/* Slide-over Sidebar Drawer */}
      <SidebarDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onOpenAccounts={() => setIsAccountsOpen(true)}
        onOpenRecurring={() => setIsRecurringOpen(true)}
        onOpenDataCenter={() => setIsDataCenterOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      {/* New / Edit Transaction Modal */}
      <NewEntryModal
        isOpen={isNewEntryOpen}
        onClose={handleCloseNewEntry}
        editingTransaction={editingTransaction}
      />

      {/* Manage Accounts Modal */}
      <ManageAccountsModal
        isOpen={isAccountsOpen}
        onClose={() => setIsAccountsOpen(false)}
      />

      {/* Recurring Rules Modal */}
      <RecurringModal
        isOpen={isRecurringOpen}
        onClose={() => setIsRecurringOpen(false)}
      />

      {/* Data Center Modal */}
      <DataCenterModal
        isOpen={isDataCenterOpen}
        onClose={() => setIsDataCenterOpen(false)}
      />

      {/* Q&A / Help Modal */}
      <QAHelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </div>
  );
}
