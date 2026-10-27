/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Receipt,
  Search,
  CreditCard,
  Banknote,
  Smartphone,
  CheckCircle,
  Clock,
  Printer,
  DollarSign,
  X,
} from 'lucide-react';
import { LabOrder } from '../types/lis';

interface InvoicesViewProps {
  orders: LabOrder[];
  onSettleInvoice: (
    orderId: string,
    amountPKR: number,
    paymentMethod: 'CASH' | 'CARD' | 'JAZZCASH' | 'EASYPAISA' | 'CORPORATE_CREDIT'
  ) => void;
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({
  orders,
  onSettleInvoice,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'UNSETTLED' | 'PAID'>('ALL');

  // Settle Invoice Modal State
  const [settlingOrder, setSettlingOrder] = useState<LabOrder | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'JAZZCASH' | 'EASYPAISA' | 'CORPORATE_CREDIT'>('CASH');

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      searchQuery === '' ||
      o.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.accessionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.patient.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      selectedFilter === 'ALL' ||
      (selectedFilter === 'UNSETTLED' && o.balancePKR > 0) ||
      (selectedFilter === 'PAID' && o.balancePKR === 0);

    return matchesSearch && matchesFilter;
  });

  const handleOpenSettleModal = (order: LabOrder) => {
    setSettlingOrder(order);
    setPaymentAmount(order.balancePKR);
    setPaymentMethod('CASH');
  };

  const handleConfirmSettle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settlingOrder) return;
    onSettleInvoice(settlingOrder.id, paymentAmount, paymentMethod);
    setSettlingOrder(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-teal-600" />
            Billing Invoices & Patient Account Settlements (PKR)
          </h2>
          <p className="text-xs text-slate-500">
            Invoice Reconciliation • Partial Payments • Real-Time Balance Clearance • Thermal POS Receipts
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Receipt #, Accession..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 text-xs">
        {[
          { id: 'ALL', label: 'All Invoices' },
          { id: 'UNSETTLED', label: 'Outstanding Due (Unsettled)' },
          { id: 'PAID', label: 'Fully Settled (Paid)' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setSelectedFilter(f.id as any)}
            className={`px-3 py-1 rounded-md font-semibold transition ${
              selectedFilter === f.id
                ? 'bg-slate-800 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                <th className="p-3">Receipt / Invoice #</th>
                <th className="p-3">Accession</th>
                <th className="p-3">Patient Name</th>
                <th className="p-3">Gross Subtotal</th>
                <th className="p-3">Discount</th>
                <th className="p-3">Net Total</th>
                <th className="p-3">Paid (PKR)</th>
                <th className="p-3">Balance Due</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredOrders.map((ord) => (
                <tr key={ord.id} className="hover:bg-slate-50">
                  <td className="p-3 font-bold text-slate-900">{ord.receiptNumber}</td>
                  <td className="p-3 text-teal-900 font-semibold">{ord.accessionNumber}</td>
                  <td className="p-3 font-sans font-semibold text-slate-800">
                    {ord.patient.name}
                  </td>
                  <td className="p-3">{ord.subtotalPKR.toLocaleString()} PKR</td>
                  <td className="p-3 text-emerald-700">
                    {ord.discountPKR > 0 ? `-${ord.discountPKR.toLocaleString()} PKR` : '0'}
                  </td>
                  <td className="p-3 font-bold text-slate-900">{ord.totalPKR.toLocaleString()} PKR</td>
                  <td className="p-3 font-semibold text-teal-800">{ord.paidPKR.toLocaleString()} PKR</td>
                  <td className="p-3 font-bold">
                    {ord.balancePKR > 0 ? (
                      <span className="text-rose-600">{ord.balancePKR.toLocaleString()} PKR</span>
                    ) : (
                      <span className="text-slate-400">0 PKR</span>
                    )}
                  </td>
                  <td className="p-3 font-sans">
                    <span
                      className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        ord.balancePKR === 0
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800 animate-pulse'
                      }`}
                    >
                      {ord.paymentStatus}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    {ord.balancePKR > 0 ? (
                      <button
                        type="button"
                        onClick={() => handleOpenSettleModal(ord)}
                        className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded font-sans text-xs font-bold shadow-xs transition"
                      >
                        Settle Invoice
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-sans text-xs font-medium"
                      >
                        <Printer className="w-3.5 h-3.5 inline mr-1" />
                        Receipt
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Settle Invoice Modal */}
      {settlingOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-200">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Settle Outstanding Invoice Balance
                </h3>
                <p className="text-xs text-slate-500">
                  {settlingOrder.accessionNumber} • {settlingOrder.patient.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSettlingOrder(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmSettle} className="space-y-3.5 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1 font-mono">
                <div className="flex justify-between">
                  <span>Net Invoice Amount:</span>
                  <strong>{settlingOrder.totalPKR.toLocaleString()} PKR</strong>
                </div>
                <div className="flex justify-between">
                  <span>Previously Paid:</span>
                  <span className="text-emerald-700">{settlingOrder.paidPKR.toLocaleString()} PKR</span>
                </div>
                <div className="flex justify-between text-sm font-bold border-t border-slate-200 pt-1 text-rose-700">
                  <span>Outstanding Balance Due:</span>
                  <span>{settlingOrder.balancePKR.toLocaleString()} PKR</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Settlement Amount Received Now (PKR) *
                </label>
                <input
                  type="number"
                  min="1"
                  max={settlingOrder.balancePKR}
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border-2 border-teal-500 rounded font-mono font-bold text-slate-900 text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'CASH', label: 'Cash (PKR)' },
                    { id: 'CARD', label: 'Debit / Credit Card' },
                    { id: 'JAZZCASH', label: 'JazzCash Wallet' },
                    { id: 'EASYPAISA', label: 'EasyPaisa Wallet' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id as any)}
                      className={`p-2 rounded border text-left font-medium transition ${
                        paymentMethod === m.id
                          ? 'bg-teal-600 text-white border-teal-600 font-bold shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setSettlingOrder(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold shadow flex items-center justify-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  Confirm & Clear Balance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
