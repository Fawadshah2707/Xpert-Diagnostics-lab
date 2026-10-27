/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Activity,
  PhoneCall,
  Clock,
  UserCheck,
  LogOut,
  Building2,
  Lock,
  Shield,
  User,
} from 'lucide-react';
import { UserRole, AuthUser } from '../types/lis';
import { useNavigate, useLocation } from 'react-router-dom';

interface HeaderProps {
  currentRole: UserRole;
  onRoleChange?: (role: UserRole) => void;
  pendingCriticalCallsCount: number;
  onOpenCriticalModal: () => void;
  isUrduEnabled: boolean;
  onToggleUrdu: () => void;
  pendingLabCount?: number;
  readyForCashierPrintCount?: number;
  activeUser?: AuthUser | null;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onRoleChange,
  pendingCriticalCallsCount,
  onOpenCriticalModal,
  isUrduEnabled,
  onToggleUrdu,
  pendingLabCount = 0,
  readyForCashierPrintCount = 0,
  activeUser,
  onLogout,
}) => {
  const [pakistanTime, setPakistanTime] = useState<string>('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Karachi',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(now);
      setPakistanTime(timeStr);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Strict Role-Based Navigation: Only show features allowed for the authenticated user
  const getRoutesForRole = () => {
    if (currentRole === 'CASHIER') {
      return [
        { path: '/cashier', label: 'Cashier Desk (Booking & Reports)' },
        { path: '/cashier-reports', label: `Completed Tests — Print Reports (${readyForCashierPrintCount})` },
        { path: '/invoices', label: 'Invoices & Receipts' },
        { path: '/patients', label: 'Patient Directory' },
      ];
    } else if (currentRole === 'LAB_ASSISTANT') {
      return [
        { path: '/lab-assistant', label: `Pending Worklist from Cashier (${pendingLabCount})` },
        { path: '/benches', label: 'Analytical Benches' },
        { path: '/lab-completed', label: 'Completed Lab Tests' },
        { path: '/qc', label: 'Quality Control (QC)' },
      ];
    } else {
      // ADMINISTRATOR (Executive clinical oversight across all departments)
      return [
        { path: '/admin', label: 'Admin Command Center' },
        { path: '/dashboard', label: 'Operations Dashboard' },
        { path: '/orders', label: 'All Orders Pipeline' },
        { path: '/cashier', label: 'Cashier Terminal' },
        { path: '/lab-assistant', label: 'Lab Bench Terminal' },
        { path: '/invoices', label: 'Invoices' },
        { path: '/qc', label: 'QC' },
        { path: '/audit-logs', label: 'Audit Trail' },
        { path: '/dossier', label: 'Compliance Dossier' },
      ];
    }
  };

  const navigationRoutes = getRoutesForRole();
  const currentPath = location.pathname === '/' 
    ? (currentRole === 'CASHIER' ? '/cashier' : currentRole === 'LAB_ASSISTANT' ? '/lab-assistant' : '/admin') 
    : location.pathname;

  const roleBadgeColor = currentRole === 'CASHIER' 
    ? 'bg-teal-500/20 text-teal-300 border-teal-500/40' 
    : currentRole === 'LAB_ASSISTANT' 
    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' 
    : 'bg-purple-500/20 text-purple-300 border-purple-500/40';

  const roleIndicatorDot = currentRole === 'CASHIER' 
    ? 'bg-teal-400' 
    : currentRole === 'LAB_ASSISTANT' 
    ? 'bg-indigo-400' 
    : 'bg-purple-400';

  const roleTitle = currentRole === 'CASHIER' 
    ? 'Cashier' 
    : currentRole === 'LAB_ASSISTANT' 
    ? 'Lab Assistant' 
    : 'Administrator';

  const staffName = activeUser?.name || (currentRole === 'CASHIER' ? 'Bilal Khan' : currentRole === 'LAB_ASSISTANT' ? 'Usman Tariq' : 'Amir Saeed');

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-sm">
      {/* Top Bar with Lab Identification and Status */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Logo and Brand */}
          <div
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => {
              if (currentRole === 'CASHIER') navigate('/cashier');
              else if (currentRole === 'LAB_ASSISTANT') navigate('/lab-assistant');
              else navigate('/admin');
            }}
          >
            <div className="w-10 h-10 rounded-lg bg-teal-600 flex items-center justify-center text-white shadow-inner shrink-0">
              <Activity className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                  <span>Xpert Diagnostics Lab</span>
                  <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold text-teal-300 bg-teal-950/80 border border-teal-800 rounded">
                    LIS / PLMS Core
                  </span>
                </h1>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 flex-wrap">
                <span>Near MMC, Mardan (KP)</span>
                <span aria-hidden="true">·</span>
                <span>Reg: <strong className="text-slate-300">KPHCC-MDN-7721-PLMS</strong></span>
              </p>
            </div>
          </div>

          {/* Controls: Workstation Identity & System Status */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
            {/* Asia/Karachi Time */}
            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800/90 rounded-md border border-slate-700 text-slate-300 font-mono text-[11px]">
              <Clock className="w-3.5 h-3.5 text-teal-400" />
              <span>{pakistanTime || 'Asia/Karachi'} (PKT)</span>
            </div>

            {/* Critical Alert Button */}
            {pendingCriticalCallsCount > 0 && (
              <button
                type="button"
                onClick={() => navigate('/critical-queue')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-md shadow-sm transition animate-bounce cursor-pointer"
                title="Immediate critical clinical values require telephonic read-back log"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>{pendingCriticalCallsCount} Critical Alert</span>
              </button>
            )}

            {/* Urdu Toggle */}
            <button
              type="button"
              onClick={onToggleUrdu}
              className={`px-2.5 py-1.5 font-semibold rounded-md border transition cursor-pointer text-xs ${
                isUrduEnabled
                  ? 'bg-amber-600 border-amber-500 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
              title="Toggle Urdu script titles on test results and receipts"
            >
              {isUrduEnabled ? 'Urdu (ON)' : 'Urdu (OFF)'}
            </button>

            {/* Authenticated Staff Station Identity (Replacing arbitrary toggle with secure authenticated persona) */}
            <div className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-800/95 rounded-lg border border-slate-700">
              <span className={`w-2 h-2 rounded-full shrink-0 ${roleIndicatorDot}`}></span>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="font-bold text-white whitespace-nowrap">
                  {staffName}
                </span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${roleBadgeColor}`}>
                  {roleTitle}
                </span>
              </div>
            </div>

            {/* Logout / Lock Station Button */}
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 border border-slate-700 hover:border-rose-800 text-slate-300 text-xs font-medium transition cursor-pointer"
                title="End clinical session and return to workstation login"
              >
                <LogOut className="w-3.5 h-3.5 text-slate-400 hover:text-rose-400" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Role Navigation Bar */}
      <div className="bg-slate-950 border-t border-slate-800 overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-1.5">
            <nav className="flex space-x-1 sm:space-x-2" aria-label="Tabs">
              {navigationRoutes.map((tab) => {
                const isActive = currentPath === tab.path;
                return (
                  <button
                    key={tab.path}
                    onClick={() => navigate(tab.path)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                      isActive
                        ? currentRole === 'CASHIER'
                          ? 'bg-teal-600 text-white shadow-xs font-bold'
                          : currentRole === 'LAB_ASSISTANT'
                          ? 'bg-indigo-600 text-white shadow-xs font-bold'
                          : 'bg-purple-600 text-white shadow-xs font-bold'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </nav>

            {/* Authorized Department Information */}
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 font-medium">
              <span>Department:</span>
              <span className="text-slate-200 font-semibold">
                {currentRole === 'CASHIER'
                  ? 'Patient Registration & Cashier Desk'
                  : currentRole === 'LAB_ASSISTANT'
                  ? 'Analytical Laboratory Benches'
                  : 'Diagnostic Directorate & Quality Oversight'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
