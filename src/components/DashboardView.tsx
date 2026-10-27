/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Users,
  TestTubes,
  Microscope,
  CheckCircle2,
  FileText,
  AlertTriangle,
  Wallet,
  Clock,
  ArrowRight,
  ShieldCheck,
  Building,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';
import { LabOrder, QCResult, ReagentInventory, CriticalCallLog } from '../types/lis';

interface DashboardViewProps {
  orders: LabOrder[];
  qcResults: QCResult[];
  inventory: ReagentInventory[];
  criticalCalls: CriticalCallLog[];
  onNavigateTab: (tabId: string) => void;
  onOpenReport: (order: LabOrder) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  orders,
  qcResults,
  inventory,
  criticalCalls,
  onNavigateTab,
  onOpenReport,
}) => {
  // Aggregate Operational KPIs
  const totalOrders = orders.length;

  let pendingCollection = 0;
  let inTesting = 0;
  let pendingTechVerification = 0;
  let pendingPathologistAuth = 0;
  let releasedReports = 0;
  let statPriorityCount = 0;

  orders.forEach((order) => {
    if (order.priority === 'STAT' || order.priority === 'URGENT') {
      statPriorityCount += 1;
    }

    // Check specimen state
    const hasUncollectedSpecimen = order.specimens.some(
      (s) => s.status === 'PENDING_COLLECTION'
    );
    if (hasUncollectedSpecimen) {
      pendingCollection += 1;
    }

    order.items.forEach((item) => {
      if (item.status === 'DRAFT' || item.status === 'ENTERED') {
        inTesting += 1;
      } else if (item.status === 'TECHNICAL_VERIFIED') {
        pendingPathologistAuth += 1;
      } else if (item.status === 'RELEASED') {
        releasedReports += 1;
      }
    });
  });

  const totalRevenuePKR = orders.reduce((sum, ord) => sum + (ord.paidPKR || 0), 0);
  const totalReceivablesPKR = orders.reduce((sum, ord) => sum + (ord.balancePKR || 0), 0);
  const pendingCriticalCount = criticalCalls.filter((c) => !c.readBackConfirmed).length;
  const qcOutOfControlCount = qcResults.filter((q) => q.status === 'OUT_OF_CONTROL').length;

  return (
    <div className="space-y-6">
      {/* Critical Value STAT Banner */}
      {pendingCriticalCount > 0 && (
        <div className="bg-rose-950/80 border border-rose-800 text-rose-100 p-4 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center space-x-3">
            <div className="p-2 bg-rose-600 rounded-lg text-white shrink-0 mt-0.5 sm:mt-0">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white tracking-wide">
                  STAT CRITICAL VALUE READ-BACK REQUIRED
                </h3>
                <span className="text-[10px] font-mono font-bold bg-rose-700/80 text-white px-2 py-0.5 rounded">
                  {pendingCriticalCount} PENDING
                </span>
              </div>
              <p className="text-xs text-rose-200 mt-0.5">
                Immediate laboratory finding necessitates urgent telephonic read-back confirmation with attending physician per clinical safety guidelines.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('CRITICAL_QUEUE')}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg shadow-sm transition whitespace-nowrap self-start sm:self-auto cursor-pointer"
          >
            Open Critical Queue →
          </button>
        </div>
      )}

      {/* Primary Clinical Pipeline Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Today's Accessions */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold text-slate-600">Accessioned Orders</span>
            <Users className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">{totalOrders}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
            <span>Active Census</span>
            {statPriorityCount > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-rose-600 font-semibold">{statPriorityCount} STAT</span>
              </>
            )}
          </div>
        </div>

        {/* Phlebotomy Queue */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold text-slate-600">Phlebotomy Draw</span>
            <TestTubes className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">{pendingCollection}</div>
          <div className="text-[11px] text-amber-700 font-medium mt-1">
            Awaiting Sample Draw
          </div>
        </div>

        {/* Bench Analytical Processing */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold text-slate-600">Bench Analytics</span>
            <Microscope className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">{inTesting}</div>
          <div className="text-[11px] text-indigo-700 font-medium mt-1">
            In Analytical Run
          </div>
        </div>

        {/* Consultant Review / Release */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold text-slate-600">Pathologist Review</span>
            <ShieldCheck className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">{pendingPathologistAuth}</div>
          <div className="text-[11px] text-purple-700 font-medium mt-1">
            Verified, Ready for Sign-Off
          </div>
        </div>

        {/* Released Diagnostic Reports */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold text-slate-600">Reports Released</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">{releasedReports}</div>
          <div className="text-[11px] text-emerald-700 font-medium mt-1">
            A4 Print Ready
          </div>
        </div>

        {/* Cash Receipts */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold text-slate-600">Collections (PKR)</span>
            <Wallet className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
            {totalRevenuePKR.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span>Bal: PKR {totalReceivablesPKR.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Two-Column Operational Architecture */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Cols: Departmental Workload & Real Time Turnaround */}
        <div className="lg:col-span-8 space-y-6">
          {/* Department Analyzer Throughput */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Department Workload & Turnaround Time (TAT)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Analytical instrument efficiency from phlebotomy acceptance to final release
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Active Benches</span>
              </div>
            </div>

            <div className="space-y-3">
              {[
                {
                  dept: 'Hematology',
                  analyzer: 'Sysmex XN-1000 Automated Analyzer',
                  activeCount: 4,
                  avgTat: '1.2h',
                  targetTat: '2.0h',
                  status: 'OPTIMAL',
                  progress: 60,
                  barColor: 'bg-teal-600',
                },
                {
                  dept: 'Clinical Chemistry',
                  analyzer: 'Roche Cobas c311 Spectrophotometer',
                  activeCount: 3,
                  avgTat: '2.4h',
                  targetTat: '4.0h',
                  status: 'OPTIMAL',
                  progress: 62,
                  barColor: 'bg-teal-600',
                },
                {
                  dept: 'Serology / Immunology',
                  analyzer: 'Abbott Architect CMIA System',
                  activeCount: 2,
                  avgTat: '2.1h',
                  targetTat: '3.0h',
                  status: 'OPTIMAL',
                  progress: 70,
                  barColor: 'bg-indigo-600',
                },
                {
                  dept: 'Clinical Pathology',
                  analyzer: 'Urisys 1100 & Manual Microscopy',
                  activeCount: 2,
                  avgTat: '1.0h',
                  targetTat: '2.0h',
                  status: 'OPTIMAL',
                  progress: 50,
                  barColor: 'bg-teal-600',
                },
                {
                  dept: 'Microbiology & AST',
                  analyzer: 'Bactec Blood Culture & Kirby-Bauer Sensitivity',
                  activeCount: 1,
                  avgTat: '36.0h',
                  targetTat: '48.0h',
                  status: 'INCUBATING',
                  progress: 75,
                  barColor: 'bg-amber-500',
                },
              ].map((d) => (
                <div key={d.dept} className="p-3 bg-slate-50/70 rounded-lg border border-slate-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1 mb-1.5">
                    <div>
                      <span className="font-bold text-slate-900">{d.dept}</span>
                      <span className="text-slate-500 ml-2 text-[11px] hidden sm:inline">
                        ({d.analyzer})
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-600 font-mono text-[11px]">
                      <span>Active: <strong className="text-slate-900">{d.activeCount}</strong></span>
                      <span>TAT: <strong className="text-teal-700">{d.avgTat}</strong> / {d.targetTat}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        d.status === 'OPTIMAL' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {d.status}
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-200/80 rounded-full h-1.5">
                    <div className={`${d.barColor} h-1.5 rounded-full`} style={{ width: `${d.progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Orders Roster */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Active Clinical Accessions & Diagnostic Stage
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  End-to-end trace: Patient $\rightarrow$ Sample $\rightarrow$ Observation $\rightarrow$ Authorized Report
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('ORDERS')}
                className="text-xs font-semibold text-teal-700 hover:text-teal-800 cursor-pointer"
              >
                View All Orders ({orders.length}) →
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Accession</th>
                    <th className="py-2.5 px-3">Patient</th>
                    <th className="py-2.5 px-3">Test Request</th>
                    <th className="py-2.5 px-3 text-center">Specimen</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.slice(0, 5).map((ord) => {
                    const isAllReleased = ord.items.every((i) => i.status === 'RELEASED');
                    const hasCollectedSpecimen = ord.specimens.every(
                      (s) => s.status === 'COLLECTED' || s.status === 'RECEIVED_IN_LAB'
                    );

                    return (
                      <tr key={ord.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                          {ord.accessionNumber}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-900">{ord.patient.name}</div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {ord.patient.gender}/{ord.patient.ageYears}y · {ord.patient.mrn}
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="text-slate-800 font-medium truncate max-w-[200px]">
                            {ord.items.map((i) => i.testCode).join(', ')}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Dr. {ord.referringDoctor}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {hasCollectedSpecimen ? (
                            <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              Received in Lab
                            </span>
                          ) : (
                            <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              Pending Draw
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {isAllReleased ? (
                            <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                              Released (A4)
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                              In Processing
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => onOpenReport(ord)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded text-[11px] font-semibold shadow-2xs transition cursor-pointer"
                          >
                            <FileText className="w-3 h-3" />
                            <span>Preview</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Quick Actions & QC Overview */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick Laboratory Workstation Links */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900">Quick Clinical Actions</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Direct workstations for connected lab workflow
              </p>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => onNavigateTab('REGISTRATION')}
                className="w-full flex items-center justify-between p-3 rounded-lg bg-teal-50/70 hover:bg-teal-100/70 border border-teal-200 text-teal-950 transition text-left group cursor-pointer"
              >
                <div>
                  <div className="text-xs font-bold text-teal-900">1. Patient Registration & Order Billing</div>
                  <div className="text-[11px] text-teal-700">MRN generation, test selection & cash receipt</div>
                </div>
                <ArrowRight className="w-4 h-4 text-teal-600 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('PHLEBOTOMY')}
                className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-900 transition text-left group cursor-pointer"
              >
                <div>
                  <div className="text-xs font-bold text-slate-800">2. Phlebotomy & Barcode Accessioning</div>
                  <div className="text-[11px] text-slate-500">Specimen tube labels & acceptance checklist</div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('WORKLISTS')}
                className="w-full flex items-center justify-between p-3 rounded-lg bg-indigo-50/70 hover:bg-indigo-100/70 border border-indigo-200 text-indigo-950 transition text-left group cursor-pointer"
              >
                <div>
                  <div className="text-xs font-bold text-indigo-900">3. Bench Worklists & Result Entry</div>
                  <div className="text-[11px] text-indigo-700">Analyzer imports & first-tier technical verification</div>
                </div>
                <ArrowRight className="w-4 h-4 text-indigo-600 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('PATHOLOGIST')}
                className="w-full flex items-center justify-between p-3 rounded-lg bg-purple-50/70 hover:bg-purple-100/70 border border-purple-200 text-purple-950 transition text-left group cursor-pointer"
              >
                <div>
                  <div className="text-xs font-bold text-purple-900">4. Pathologist Review & Sign-Off</div>
                  <div className="text-[11px] text-purple-700">Consultant clinical authorization & A4 release</div>
                </div>
                <ArrowRight className="w-4 h-4 text-purple-600 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Quality Control & Analyzer Status */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Westgard Quality Control</h2>
                <p className="text-xs text-slate-500 mt-0.5">Daily multi-rule validation</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                100% PASS
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <div>
                  <div className="font-bold text-slate-800">Hematology Control (Level 2)</div>
                  <div className="text-[11px] text-slate-500 font-mono">Lot #CBC-2601 · Mean: 13.8 g/dL</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-slate-700 font-semibold">13.9 g/dL</div>
                  <span className="text-[10px] text-emerald-600 font-bold">Z: +0.25 (Pass)</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <div>
                  <div className="font-bold text-slate-800">Chemistry Control (Level 1)</div>
                  <div className="text-[11px] text-slate-500 font-mono">Lot #CHM-889 · Glucose Target: 95</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-slate-700 font-semibold">96.2 mg/dL</div>
                  <span className="text-[10px] text-emerald-600 font-bold">Z: +0.40 (Pass)</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigateTab('QC')}
              className="w-full mt-2 py-2 text-center text-xs font-semibold text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100/80 rounded-lg transition cursor-pointer"
            >
              View Westgard Levey-Jennings Charts →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
