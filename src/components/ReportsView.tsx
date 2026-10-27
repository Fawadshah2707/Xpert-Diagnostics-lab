/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FileText, Search, Printer, Eye, CheckCircle2, ShieldCheck, Download } from 'lucide-react';
import { LabOrder } from '../types/lis';

interface ReportsViewProps {
  orders: LabOrder[];
  onOpenReport: (order: LabOrder) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ orders, onOpenReport }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterReleasedOnly, setFilterReleasedOnly] = useState(false);

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      searchQuery === '' ||
      o.accessionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.patient.mrn.toLowerCase().includes(searchQuery.toLowerCase());

    const hasReleasedItems = o.items.some((i) => i.status === 'RELEASED');
    const matchesReleased = !filterReleasedOnly || hasReleasedItems;

    return matchesSearch && matchesReleased;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-600" />
            Official Diagnostic Pathology Reports Registry
          </h2>
          <p className="text-xs text-slate-500">
            A4 Print-Ready PDF Generation • Pathologist Authorized Signatures • QR Code Cloud Verification
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={filterReleasedOnly}
              onChange={(e) => setFilterReleasedOnly(e.target.checked)}
              className="rounded text-teal-600 focus:ring-teal-500"
            />
            <span>Released Reports Only</span>
          </label>

          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Accession, MRN, Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>
      </div>

      {/* Reports Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOrders.map((order) => {
          const releasedCount = order.items.filter((i) => i.status === 'RELEASED').length;
          const totalItems = order.items.length;
          const isComplete = releasedCount === totalItems && totalItems > 0;

          return (
            <div
              key={order.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono font-bold text-teal-900 text-sm">
                      {order.accessionNumber}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm mt-0.5">
                      {order.patient.name}
                    </h3>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                      isComplete
                        ? 'bg-emerald-100 text-emerald-800'
                        : releasedCount > 0
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {isComplete ? 'RELEASED' : `${releasedCount}/${totalItems} RELEASED`}
                  </span>
                </div>

                <div className="text-xs text-slate-500 space-y-0.5">
                  <div>MRN: <strong className="text-slate-700 font-mono">{order.patient.mrn}</strong></div>
                  <div>Age/Sex: {order.patient.ageYears} Y / {order.patient.gender}</div>
                  <div>Doctor: {order.referringDoctor}</div>
                  <div>Date: {new Date(order.orderedAt).toLocaleString('en-GB')}</div>
                </div>

                <div className="border-t border-slate-100 pt-2 text-xs">
                  <div className="font-semibold text-slate-700 text-[11px] mb-1">Tests Included:</div>
                  <div className="flex flex-wrap gap-1">
                    {order.items.map((i) => (
                      <span
                        key={i.id}
                        className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          i.status === 'RELEASED'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {i.testCode}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex space-x-2">
                <button
                  type="button"
                  onClick={() => onOpenReport(order)}
                  className="flex-1 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition"
                >
                  <Eye className="w-3.5 h-3.5" />
                  View & Print A4 PDF
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
