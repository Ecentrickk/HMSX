'use client';

import { signOut } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback, useRef } from 'react';
import { ROLE_CONFIG } from '@/server/services/rbac.service';
import { IconMenu, IconSun, IconMoon, IconBell, IconLogOut, IconCheck, IconSearch, IconBarcode } from '@/client/components/icons';
import { ScannerModal } from '@/client/components/ScannerModal';
import type { Role } from '@prisma/client';

interface StaffNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

interface TopBarProps {
  user: {
    name: string;
    role: Role;
    email?: string | null;
  };
  onToggleSidebar: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  TASK_ASSIGNED: 'Task',
  PRESCRIPTION_ALERT: 'Rx',
  APPOINTMENT_ALERT: 'Appt',
  VITALS_CRITICAL: 'Critical',
  INVENTORY_LOW: 'Stock',
  GENERAL: 'Info',
};

export function TopBar({ user, onToggleSidebar }: TopBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<StaffNotification[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
  };

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications/count');
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count);
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 15000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  const fetchNotifications = useCallback(async () => {
    setLoadingNotifs(true);
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
      }
    } catch { /* silent */ } finally {
      setLoadingNotifs(false);
    }
  }, []);

  const togglePanel = () => {
    if (!showPanel) {
      fetchNotifications();
    }
    setShowPanel(!showPanel);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowPanel(false);
      }
    };
    if (showPanel) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPanel]);

  const markAllRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch { /* silent */ }
  };

  const handleNotifClick = async (notif: StaffNotification) => {
    if (!notif.isRead) {
      try {
        await fetch('/api/notifications', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notificationId: notif.id }),
        });
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch { /* silent */ }
    }
    if (notif.link) {
      setShowPanel(false);
      router.push(notif.link);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const breadcrumbParts = pathname
    .split('/')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1));

  const roleConfig = ROLE_CONFIG[user.role];
  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2);

  // Trigger search palette
  const openSearch = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
  };

  return (
    <header className="topbar">
      <div className="topbar__left">
        <button
          className="topbar__toggle"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
          id="sidebar-toggle"
        >
          <IconMenu size={18} />
        </button>
        <div className="topbar__breadcrumb">
          {breadcrumbParts.map((part, i) => (
            <span key={i}>
              {i > 0 && <span style={{ color: 'var(--text-muted)', margin: '0 8px' }}>/</span>}
              <span style={i === breadcrumbParts.length - 1 ? { color: 'var(--text-primary)', fontWeight: 600 } : undefined}>
                {part}
              </span>
            </span>
          ))}
        </div>
      </div>

      <div className="topbar__right">
        <button className="topbar__search-trigger" onClick={openSearch} title="Global Search (Ctrl+K)">
          <IconSearch size={14} />
          <span>Search...</span>
          <span className="topbar__search-shortcut">⌘K</span>
        </button>

        <button 
          onClick={() => setShowScanner(true)}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 12px', 
            background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success-500)', 
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: '20px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' 
          }}
          title="Manual Barcode Entry"
        >
          <IconBarcode size={14} />
          <span>Scanner Ready</span>
        </button>

        <button
          className="topbar__icon-btn"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          id="theme-toggle"
        >
          {theme === 'dark' ? <IconSun size={16} /> : <IconMoon size={16} />}
        </button>

        <div className="notif-wrapper" ref={panelRef}>
          <button className="topbar__icon-btn" id="notifications-btn" onClick={togglePanel}>
            <IconBell size={16} />
            {unreadCount > 0 && (
              <span className="topbar__notif-badge">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showPanel && (
            <div className="notif-panel">
              <div className="notif-panel__header">
                <h3 className="notif-panel__title">Notifications</h3>
                {unreadCount > 0 && (
                  <button className="notif-panel__mark-all" onClick={markAllRead}>
                    <IconCheck size={12} /> Mark all read
                  </button>
                )}
              </div>
              <div className="notif-panel__body">
                {loadingNotifs ? (
                  <div className="notif-panel__empty">Loading...</div>
                ) : notifications.length === 0 ? (
                  <div className="notif-panel__empty">No notifications</div>
                ) : (
                  notifications.slice(0, 20).map((notif) => (
                    <button
                      key={notif.id}
                      className={`notif-item ${notif.isRead ? '' : 'notif-item--unread'}`}
                      onClick={() => handleNotifClick(notif)}
                    >
                      <div className="notif-item__header">
                        <span className={`notif-item__type notif-item__type--${notif.type.toLowerCase()}`}>
                          {TYPE_LABELS[notif.type] || notif.type}
                        </span>
                        <span className="notif-item__time">{formatTimeAgo(notif.createdAt)}</span>
                      </div>
                      <div className="notif-item__title">{notif.title}</div>
                      <div className="notif-item__message">{notif.message.slice(0, 100)}{notif.message.length > 100 ? '...' : ''}</div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <button
          className="topbar__icon-btn"
          onClick={() => signOut({ callbackUrl: '/' })}
          id="signout-btn"
          title="Sign Out"
        >
          <IconLogOut size={16} />
        </button>
      </div>
      
      <ScannerModal isOpen={showScanner} onClose={() => setShowScanner(false)} />
    </header>
  );
}
