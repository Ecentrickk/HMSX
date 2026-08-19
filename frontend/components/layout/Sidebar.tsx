'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ROLE_NAV_ITEMS } from '@/server/services/rbac.service';
import {
  IconActivity, IconUsers, IconFileText, IconBed, IconPill,
  IconHeart, IconCalendar, IconUser, IconDollarSign, IconPackage,
  IconBarChart, IconList, IconDashboard, IconLogOut
} from '@/client/components/icons';
import type { Role } from '@prisma/client';

// Map icon keys to SVG components
const ICON_MAP: Record<string, (p?: any) => JSX.Element> = {
  activity: IconActivity,
  users: IconUsers,
  fileText: IconFileText,
  bed: IconBed,
  pill: IconPill,
  heart: IconHeart,
  calendar: IconCalendar,
  user: IconUser,
  dollarSign: IconDollarSign,
  package: IconPackage,
  barChart: IconBarChart,
  list: IconList,
  dashboard: IconDashboard,
};

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  role: Role;
  userName: string;
}

export function Sidebar({ collapsed, onToggle, role, userName }: SidebarProps) {
  const pathname = usePathname();
  const navItems = ROLE_NAV_ITEMS[role] || [];

  const roleLabel = role.charAt(0) + role.slice(1).toLowerCase();
  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2);

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>
      {/* Logo */}
      <div className="sidebar__header">
        <div className="sidebar__brand">
          <IconActivity size={24} />
          <div>
            <span className="sidebar__brand-name">
              H<span className="text-gradient">1</span>MS
            </span>
            <span className="sidebar__brand-sub">Hospital System</span>
          </div>
        </div>
      </div>

      {/* User Profile Card */}
      <div className="sidebar__profile">
        <div className="avatar">{initials}</div>
        <div className="sidebar__profile-info">
          <span className="sidebar__profile-name">{userName}</span>
          <span className="sidebar__profile-role">{roleLabel}</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar__nav">
        {navItems.map((item) => {
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href);
          const IconComponent = ICON_MAP[item.iconKey];

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}
            >
              <span className="sidebar__link-icon">
                {IconComponent ? <IconComponent size={18} /> : null}
              </span>
              <span className="sidebar__link-text">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer - Logout */}
      <div className="sidebar__footer">
        <Link href="/" className="sidebar__logout">
          <IconLogOut size={18} />
          <span>Log Out</span>
        </Link>
      </div>
    </aside>
  );
}
