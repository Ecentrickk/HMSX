'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useState } from 'react';
import { Sidebar } from '@/client/components/layout/Sidebar';
import { TopBar } from '@/client/components/layout/TopBar';
import { CommandPalette } from '@/client/components/layout/CommandPalette';
import { KeyboardShortcuts } from '@/client/components/layout/KeyboardShortcuts';
import { GlobalBarcodeScanner } from '@/client/components/GlobalBarcodeScanner';
import '@/client/styles/dashboard.css';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (status === 'loading') {
    return (
      <div className="dashboard-loading">
        <div className="dashboard-loading__spinner" />
        <p>Loading H1MS...</p>
      </div>
    );
  }

  if (!session) {
    redirect('/');
  }

  return (
    <div className="dashboard-layout">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        role={session.user.role}
        userName={session.user.name}
      />
      <main className={`dashboard-main ${sidebarCollapsed ? 'dashboard-main--collapsed' : ''}`}>
        <TopBar
          user={session.user}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <div className="dashboard-content">
          {children}
        </div>
      </main>
      <CommandPalette />
      <KeyboardShortcuts />
      <GlobalBarcodeScanner />
    </div>
  );
}
