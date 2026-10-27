/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldCheck, Search, Filter, History, Clock, UserCheck } from 'lucide-react';
import { AuditEvent } from '../types/lis';

interface AuditLogsViewProps {
  auditLogs: AuditEvent[];
}

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({ auditLogs }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('ALL');

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      searchQuery === '' ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entityId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAction =
      selectedAction === 'ALL' || log.action.includes(selectedAction);

    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <History className="w-5 h-5 text-teal-600" />
            Immutable Clinical & Financial Audit Trail
          </h2>
          <p className="text-xs text-slate-500">
            ISO 15189:2022 Statutory Log • Non-Repudiation Security • Every Result Entry & Release Recorded
          </p>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search audit trail by actor or action..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-1.5">
        {[
          { id: 'ALL', label: 'All Audit Events' },
          { id: 'PATIENT', label: 'Patient MPI' },
          { id: 'ORDER', label: 'Order Booking' },
          { id: 'SPECIMEN', label: 'Specimens' },
          { id: 'VERIF', label: 'Technical Verification' },
          { id: 'AUTHORIZ', label: 'Clinical Release' },
          { id: 'CRITICAL', label: 'Critical Calls' },
          { id: 'INVOICE', label: 'Billing & Settle' },
          { id: 'QC', label: 'Quality Control' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setSelectedAction(f.id)}
            className={`px-3 py-1 rounded-md text-xs font-medium transition ${
              selectedAction === f.id
                ? 'bg-slate-800 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                <th className="p-3 w-44">Timestamp (PKT)</th>
                <th className="p-3 w-48">Operator / Role</th>
                <th className="p-3 w-52">Action Event</th>
                <th className="p-3 w-36">Entity</th>
                <th className="p-3">Audit Details & Cryptographic Trace</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="p-3 font-mono text-slate-600">
                    {new Date(log.timestamp).toLocaleString('en-GB')}
                  </td>
                  <td className="p-3">
                    <div className="font-semibold text-slate-900">{log.actor}</div>
                    <span className="text-[10px] text-teal-800 font-mono font-medium">
                      {log.role}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-slate-100 text-slate-800 border border-slate-200">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-slate-500">
                    <span className="font-bold text-slate-700">{log.entityType}</span>
                    <div className="text-[10px] truncate max-w-[120px]">{log.entityId}</div>
                  </td>
                  <td className="p-3 text-slate-700 leading-relaxed font-sans">
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
