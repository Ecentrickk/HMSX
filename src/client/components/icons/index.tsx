'use client';

// Minimal line icons for H1MS — monotone, stroke-based SVGs
// Inspired by Lucide/Feather icons but inline for zero-dependency

interface IconProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
}

const defaultProps: IconProps = { size: 20, strokeWidth: 1.5 };

const svg = (d: string, props: IconProps = {}) => {
  const { size = 20, className = '', strokeWidth = 1.5 } = props;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={d} />
    </svg>
  );
};

// Multi-path SVG helper
const svgMulti = (paths: string[], props: IconProps = {}) => {
  const { size = 20, className = '', strokeWidth = 1.5 } = props;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      {paths.map((d, i) => <path key={i} d={d} />)}
    </svg>
  );
};

// ─── Navigation ──────────────────────────────────────────
export const IconHome = (p: IconProps = {}) => svgMulti(['M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', 'M9 22V12h6v10'], p);
export const IconDashboard = (p: IconProps = {}) => svgMulti(['M3 3h7v7H3z', 'M14 3h7v7h-7z', 'M3 14h7v7H3z', 'M14 14h7v7h-7z'], p);

// ─── Roles ───────────────────────────────────────────────
export const IconStethoscope = (p: IconProps = {}) => svgMulti(['M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6 6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3', 'M8 15v1a6 6 0 0 0 6 6 6 6 0 0 0 6-6v-4', 'M22 10a2 2 0 1 0-4 0 2 2 0 0 0 4 0z'], p);
export const IconNurse = (p: IconProps = {}) => svgMulti(['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z', 'M19 8v6', 'M22 11h-6'], p);
export const IconClipboard = (p: IconProps = {}) => svgMulti(['M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2', 'M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z'], p);
export const IconFlask = (p: IconProps = {}) => svgMulti(['M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2', 'M8.5 2h7'], p);
export const IconShield = (p: IconProps = {}) => svg('M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', p);

// ─── Medical ─────────────────────────────────────────────
export const IconHeart = (p: IconProps = {}) => svg('M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z', p);
export const IconActivity = (p: IconProps = {}) => svg('M22 12h-4l-3 9L9 3l-3 9H2', p);
export const IconPill = (p: IconProps = {}) => svgMulti(['M10.5 1.5L16.5 7.5', 'M2.5 9.5l12-12a4.24 4.24 0 0 1 6 6l-12 12a4.24 4.24 0 0 1-6-6z'], p);
export const IconThermometer = (p: IconProps = {}) => svgMulti(['M14 4.5V16a4 4 0 1 1-4 0V4.5a2 2 0 1 1 4 0z'], p);
export const IconBed = (p: IconProps = {}) => svgMulti(['M2 4v16', 'M2 8h18a2 2 0 0 1 2 2v10', 'M2 17h20', 'M6 8v9'], p);

// ─── Actions ─────────────────────────────────────────────
export const IconSearch = (p: IconProps = {}) => svgMulti(['M11 3a8 8 0 1 0 0 16 8 8 0 0 0 0-16z', 'M21 21l-4.35-4.35'], p);
export const IconPlus = (p: IconProps = {}) => svgMulti(['M12 5v14', 'M5 12h14'], p);
export const IconEdit = (p: IconProps = {}) => svgMulti(['M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7', 'M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z'], p);
export const IconTrash = (p: IconProps = {}) => svgMulti(['M3 6h18', 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2'], p);
export const IconCheck = (p: IconProps = {}) => svg('M20 6L9 17l-5-5', p);
export const IconX = (p: IconProps = {}) => svgMulti(['M18 6L6 18', 'M6 6l12 12'], p);
export const IconFilter = (p: IconProps = {}) => svg('M22 3H2l8 9.46V19l4 2v-8.54L22 3z', p);
export const IconBarcode = (p: IconProps = {}) => svgMulti(['M3 5v14', 'M8 5v14', 'M12 5v14', 'M17 5v14', 'M21 5v14'], p);
export const IconMessageSquare = (p: IconProps = {}) => svg('M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z', p);
export const IconDownload = (p: IconProps = {}) => svgMulti(['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'M7 10l5 5 5-5', 'M12 15V3'], p);

// ─── UI ──────────────────────────────────────────────────
export const IconMenu = (p: IconProps = {}) => svgMulti(['M3 12h18', 'M3 6h18', 'M3 18h18'], p);
export const IconChevronDown = (p: IconProps = {}) => svg('M6 9l6 6 6-6', p);
export const IconChevronRight = (p: IconProps = {}) => svg('M9 18l6-6-6-6', p);
export const IconChevronLeft = (p: IconProps = {}) => svg('M15 18l-6-6 6-6', p);
export const IconBell = (p: IconProps = {}) => svgMulti(['M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9', 'M13.73 21a2 2 0 0 1-3.46 0'], p);
export const IconSun = (p: IconProps = {}) => svgMulti(['M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z', 'M12 1v2', 'M12 21v2', 'M4.22 4.22l1.42 1.42', 'M18.36 18.36l1.42 1.42', 'M1 12h2', 'M21 12h2', 'M4.22 19.78l1.42-1.42', 'M18.36 5.64l1.42-1.42'], p);
export const IconMoon = (p: IconProps = {}) => svg('M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z', p);
export const IconLogOut = (p: IconProps = {}) => svgMulti(['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'M16 17l5-5-5-5', 'M21 12H9'], p);
export const IconSettings = (p: IconProps = {}) => svgMulti(['M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z'], p);
export const IconUser = (p: IconProps = {}) => svgMulti(['M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2', 'M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z'], p);
export const IconUsers = (p: IconProps = {}) => svgMulti(['M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2', 'M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z', 'M23 21v-2a4 4 0 0 0-3-3.87', 'M16 3.13a4 4 0 0 1 0 7.75'], p);

// ─── Data ────────────────────────────────────────────────
export const IconCalendar = (p: IconProps = {}) => svgMulti(['M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z', 'M16 2v4', 'M8 2v4', 'M3 10h18'], p);
export const IconClock = (p: IconProps = {}) => svgMulti(['M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z', 'M12 6v6l4 2'], p);
export const IconTrendingUp = (p: IconProps = {}) => svgMulti(['M23 6l-9.5 9.5-5-5L1 18', 'M17 6h6v6'], p);
export const IconTrendingDown = (p: IconProps = {}) => svgMulti(['M23 18l-9.5-9.5-5 5L1 6', 'M17 18h6v-6'], p);
export const IconBarChart = (p: IconProps = {}) => svgMulti(['M12 20V10', 'M18 20V4', 'M6 20v-4'], p);
export const IconPackage = (p: IconProps = {}) => svgMulti(['M16.5 9.4l-9-5.19', 'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z', 'M3.27 6.96L12 12.01l8.73-5.05', 'M12 22.08V12'], p);
export const IconFileText = (p: IconProps = {}) => svgMulti(['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', 'M14 2v6h6', 'M16 13H8', 'M16 17H8', 'M10 9H8'], p);
export const IconDollarSign = (p: IconProps = {}) => svgMulti(['M12 1v22', 'M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'], p);
export const IconAlertCircle = (p: IconProps = {}) => svgMulti(['M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z', 'M12 8v4', 'M12 16h.01'], p);
export const IconEye = (p: IconProps = {}) => svgMulti(['M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z', 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z'], p);
export const IconLock = (p: IconProps = {}) => svgMulti(['M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z', 'M7 11V7a5 5 0 0 1 10 0v4'], p);
export const IconSend = (p: IconProps = {}) => svgMulti(['M22 2L11 13', 'M22 2l-7 20-4-9-9-4 20-7z'], p);
export const IconPrinter = (p: IconProps = {}) => svgMulti(['M6 9V2h12v7', 'M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2', 'M6 14h12v8H6z'], p);
export const IconRefresh = (p: IconProps = {}) => svgMulti(['M23 4v6h-6', 'M1 20v-6h6', 'M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15'], p);
export const IconZap = (p: IconProps = {}) => svg('M13 2L3 14h9l-1 10 10-12h-9l1-10z', p);
export const IconList = (p: IconProps = {}) => svgMulti(['M8 6h13', 'M8 12h13', 'M8 18h13', 'M3 6h.01', 'M3 12h.01', 'M3 18h.01'], p);
