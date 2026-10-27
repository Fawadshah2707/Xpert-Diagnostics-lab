/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  FileText,
  Search,
  Filter,
  CreditCard,
  Barcode,
  Eye,
  CheckCircle,
  Plus,
} from 'lucide-react';
import { LabOrder, OrderPriority } from '../types/lis';
import { useNavigate } from 'react-router-dom';

interface OrdersViewProps {
  orders: LabOrder[];
  onOpenReport: (order: LabOrder) => void;
  onOpenOrderModal: () => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  orders,
  onOpenReport,
  onOpenOrderModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const navigate = useNavigate();

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      searchQuery === '' ||
      o.accessionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.patient.mrn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.items.some((i) => i.testName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesPriority =
      selectedPriority === 'ALL' || o.priority === selectedPriority;

    return matchesSearch && matchesPriority;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-600" />
            Clinical Laboratory Orders & Requisitions
          </h2>
          <p className="text-xs text-slate-500">
            Accession Number Tracking • Multi-Panel Test Bookings • STAT Emergency Prioritization
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by accession, patient, or test..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <button
            type="button"
            onClick={onOpenOrderModal}
            className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow transition whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Book New Order
          </button>
        </div>
      </div>

      {/* Priority Filters */}
      <div className="flex space-x-2 text-xs">
        {['ALL', 'ROUTINE', 'URGENT', 'STAT'].map((p) => (
          <button
            key={p}
            onClick={() => setSelectedPriority(p)}
            className={`px-3 py-1 rounded-md font-semibold transition ${
              selectedPriority === p
                ? 'bg-slate-800 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            {p === 'ALL' ? 'All Priorities' : p}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                <th className="p-3">Accession #</th>
                <th className="p-3">Date / Time</th>
                <th className="p-3">Patient Details</th>
                <th className="p-3">Ordered Investigations</th>
                <th className="p-3">Priority</th>
                <th className="p-3">Billing (PKR)</th>
                <th className="p-3 text-right">Workstation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.map((ord) => (
                <tr key={ord.id} className="hover:bg-slate-50">
                  <td className="p-3 font-mono font-bold text-teal-900 text-sm">
                    {ord.accessionNumber}
                  </td>
                  <td className="p-3 text-slate-500 font-mono">
                    {new Date(ord.orderedAt).toLocaleString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="p-3">
                    <div className="font-bold text-slate-900">{ord.patient.name}</div>
                    <div className="text-[11px] text-slate-500">
                      {ord.patient.mrn} • {ord.patient.ageYears}Y / {ord.patient.gender}
                    </div>
                  </td>
                  <td className="p-3 text-slate-700">
                    <div className="font-medium">
                      {ord.items.map((i) => i.testCode).join(', ')}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {ord.items.length} Test Item(s)
                    </div>
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        ord.priority === 'STAT'
                          ? 'bg-rose-600 text-white animate-pulse'
                          : ord.priority === 'URGENT'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {ord.priority}
                    </span>
                  </td>
                  <td className="p-3 font-mono">
                    <div className="font-bold text-slate-900">{ord.totalPKR} PKR</div>
                    <div
                      className={`text-[10px] font-semibold ${
                        ord.balancePKR > 0 ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {ord.balancePKR > 0 ? `Due: ${ord.balancePKR} PKR` : 'PAID'}
                    </div>
                  </td>
                  <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => navigate('/phlebotomy')}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold"
                      title="View Specimen Barcodes"
                    >
                      <Barcode className="w-3.5 h-3.5 inline mr-1" />
                      Barcode
                    </button>

                    <button
                      type="button"
                      onClick={() => navigate('/benches')}
                      className="px-2 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded text-[11px] font-semibold"
                      title="Access Bench Result Entry"
                    >
                      Bench
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenReport(ord)}
                      className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded text-[11px] font-semibold"
                      title="View Diagnostic Report"
                    >
                      <Eye className="w-3.5 h-3.5 inline mr-1" />
                      Report
                    </button>
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
