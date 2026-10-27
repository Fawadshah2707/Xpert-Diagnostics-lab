/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Activity,
  ShieldCheck,
  Lock,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  Building2,
  CheckCircle2,
  KeyRound,
  FileCheck,
} from 'lucide-react';
import { AuthUser, AuthSession } from '../types/lis';
import { CLINICAL_USERS, authenticateClinicalUser, createSessionForUser } from '../utils/auth';

interface LoginPageProps {
  onLoginSuccess: (session: AuthSession) => void;
  isUrduEnabled?: boolean;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  isUrduEnabled = false,
}) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!username.trim()) {
      setErrorMessage('Please enter your staff username or clinical email.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your workstation password.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const user = authenticateClinicalUser(username, password);
      if (user) {
        const session = createSessionForUser(user);
        onLoginSuccess(session);
      } else {
        setErrorMessage('Invalid clinical credentials. Please verify your username and password, or select a quick workstation role below.');
        setIsLoading(false);
      }
    }, 350);
  };

  const handleQuickLogin = (roleKey: 'admin' | 'cashier' | 'lab') => {
    setErrorMessage(null);
    const target = CLINICAL_USERS[roleKey];
    if (target) {
      setUsername(target.username);
      setPassword(target.passwordHash);
      setIsLoading(true);
      setTimeout(() => {
        const { passwordHash: _, ...authUser } = target;
        const session = createSessionForUser(authUser);
        onLoginSuccess(session);
      }, 250);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-teal-500 selection:text-white">
      {/* Top Banner / Brand Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-900/50">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-white">
                  Xpert Diagnostics Lab
                </span>
                <span className="px-2 py-0.5 text-[11px] font-semibold text-teal-300 bg-teal-950 border border-teal-800 rounded">
                  LIS / PLMS Core
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Near Mardan Medical Complex (MMC), Mardan, Khyber Pakhtunkhwa
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-teal-400" />
              <span>Reg: <strong className="text-slate-300">KPHCC-MDN-7721-PLMS</strong></span>
            </div>
            <span className="text-slate-700">|</span>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Diagnostic Security Protocol Active</span>
            </div>
          </div>
        </div>
      </header>

      {/* Center Login Area */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Context & Workflow Overview */}
          <div className="lg:col-span-5 space-y-6 text-left hidden md:block">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-950/80 border border-teal-800 text-teal-300 rounded-md text-xs font-semibold">
              <Lock className="w-3.5 h-3.5 text-teal-400" />
              <span>Authenticated Access Gate</span>
            </div>

            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white leading-tight">
                Clinical Pathology & Laboratory Operations
              </h1>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                Integrated diagnostic platform connecting patient registration, barcode accessioning,
                automated bench analyzers, Westgard quality control, and clinical pathologist report release.
              </p>
            </div>

            {/* Workflow Milestones */}
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <div className="w-7 h-7 rounded bg-teal-950 text-teal-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 border border-teal-800/60">
                  1
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Patient & Front Desk Cashier</h4>
                  <p className="text-[11px] text-slate-400">
                    MRN generation, test billing, cash & digital receipts, sample dispatch.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <div className="w-7 h-7 rounded bg-indigo-950 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 border border-indigo-800/60">
                  2
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Medical Technologist Bench</h4>
                  <p className="text-[11px] text-slate-400">
                    Analytical run, reference range verification, critical alert escalation.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <div className="w-7 h-7 rounded bg-purple-950 text-purple-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 border border-purple-800/60">
                  3
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Administrator & Pathologist Review</h4>
                  <p className="text-[11px] text-slate-400">
                    Consultant digital sign-off, quality audit trail, final A4 report generation.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Login Card */}
          <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm space-y-6">
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Staff Station Sign In
                </h2>
                <span className="text-xs text-slate-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Mardan Node Online
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Enter your authorized credentials to access your designated laboratory workstation.
              </p>
            </div>

            {errorMessage && (
              <div className="p-3.5 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-200 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Staff Username or Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. admin, cashier, or lab"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950/80 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Password
                  </label>
                  <span className="text-[11px] text-teal-400 hover:text-teal-300 cursor-pointer">
                    Station Help & Policy
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter workstation password"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-950/80 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-teal-600 focus:ring-teal-500"
                  />
                  <span>Keep session active on this station</span>
                </label>
                <span className="text-slate-500">Auto-lock after 12h</span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg shadow-md shadow-teal-900/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Authenticating Station...</span>
                ) : (
                  <>
                    <span>Sign In to Workstation</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick 1-Click Role Logins for seamless evaluation and operation */}
            <div className="pt-4 border-t border-slate-800">
              <div className="text-xs font-semibold text-slate-400 mb-2.5 flex items-center justify-between">
                <span>Select Workstation Persona (One-Click Sign In):</span>
                <span className="text-[10px] text-teal-400 font-normal">Active Profiles</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {/* Admin: Amir Saeed */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin')}
                  className="p-2.5 bg-slate-950 hover:bg-slate-800/80 border border-slate-700/80 hover:border-purple-500 rounded-lg text-left transition group cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">
                      Administrator
                    </span>
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                  </div>
                  <div className="font-bold text-xs text-white group-hover:text-purple-300">
                    Amir Saeed
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    Lab Director & Review
                  </div>
                </button>

                {/* Cashier: Bilal Khan */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin('cashier')}
                  className="p-2.5 bg-slate-950 hover:bg-slate-800/80 border border-slate-700/80 hover:border-teal-500 rounded-lg text-left transition group cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider">
                      Cashier
                    </span>
                    <User className="w-3.5 h-3.5 text-teal-400" />
                  </div>
                  <div className="font-bold text-xs text-white group-hover:text-teal-300">
                    Bilal Khan
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    Front Desk & Invoicing
                  </div>
                </button>

                {/* Lab Assistant: Usman Tariq */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin('lab')}
                  className="p-2.5 bg-slate-950 hover:bg-slate-800/80 border border-slate-700/80 hover:border-indigo-500 rounded-lg text-left transition group cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                      Technologist
                    </span>
                    <Activity className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                  <div className="font-bold text-xs text-white group-hover:text-indigo-300">
                    Usman Tariq
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    Bench & Test Analytics
                  </div>
                </button>
              </div>
            </div>

            {/* Regulatory Footer Note */}
            <div className="text-[11px] text-slate-500 text-center pt-2">
              <span>Restricted Clinical System • All diagnostic and audit entries are logged with ISO 15189 compliance</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Bar */}
      <footer className="border-t border-slate-800/80 py-3 px-6 text-center text-xs text-slate-500 bg-slate-950">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; {new Date().getFullYear()} Xpert Diagnostics Lab. All rights reserved.</span>
          <span className="text-slate-400">
            Near MMC, Mardan (KP) • Laboratory Information System (LIS/PLMS)
          </span>
        </div>
      </footer>
    </div>
  );
};
