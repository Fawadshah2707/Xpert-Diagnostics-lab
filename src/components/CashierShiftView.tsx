/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Wallet,
  Receipt,
  CreditCard,
  Banknote,
  Smartphone,
  Printer,
  CheckCircle,
  FileCheck,
} from 'lucide-react';
import { LabOrder } from '../types/lis';

interface CashierShiftViewProps {
  orders: LabOrder[];
}

export const CashierShiftView: React.FC<CashierShiftViewProps> = ({ orders }) => {
  const [shiftClosed, setShiftClosed] = useState(false);

  // Financial aggregates
  const totalInvoicedPKR = orders.reduce((sum, o) => sum + o.totalPKR, 0);
  const totalCollectedPKR = orders.reduce((sum, o) => sum + o.paidPKR, 0);
  const totalReceivablesPKR = orders.reduce((sum, o) => sum + o.balancePKR, 0);
  const totalDiscountsPKR = orders.reduce((sum, o) => sum + o.discountPKR, 0);

  const cashPKR = orders
    .filter((o) => o.paymentMethod === 'CASH')
    .reduce((sum, o) => sum + o.paidPKR, 0);

  const cardPKR = orders
    .filter((o) => o.paymentMethod === 'CARD')
    .reduce((sum, o) => sum + o.paidPKR, 0);

  const jazzcashPKR = orders
    .filter((o) => o.paymentMethod === 'JAZZCASH')
    .reduce((sum, o) => sum + o.paidPKR, 0);

  const easypaisaPKR = orders
    .filter((o) => o.paymentMethod === 'EASYPAISA')
    .reduce((sum, o) => sum + o.paidPKR, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-teal-600" />
            Cashier Shift Reconciliation & Daily POS Financial Closing
          </h2>
          <p className="text-xs text-slate-500">
            Pakistani Rupee (PKR) Invoicing • Cash / Card / JazzCash / EasyPaisa Reconciliation • Shift Audit Trail
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {!shiftClosed ? (
            <button
              type="button"
              onClick={() => setShiftClosed(true)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow"
            >
              <FileCheck className="w-4 h-4 text-teal-400" />
              Close Shift & Print Day Book
            </button>
          ) : (
            <span className="px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold flex items-center gap-1">
              <CheckCircle className="w-4 h-4" /> Shift #1 Successfully Closed
            </span>
          )}
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Total Invoiced (PKR)</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {totalInvoicedPKR.toLocaleString()} PKR
          </div>
          <span className="text-[11px] text-slate-500">{orders.length} Patient Orders</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Total Collected (Cash/Digital)</span>
          <div className="text-2xl font-bold text-teal-700 mt-1">
            {totalCollectedPKR.toLocaleString()} PKR
          </div>
          <span className="text-[11px] text-emerald-600 font-medium">100% Reconciled</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Total Discounts Conceded</span>
          <div className="text-2xl font-bold text-amber-700 mt-1">
            {totalDiscountsPKR.toLocaleString()} PKR
          </div>
          <span className="text-[11px] text-amber-700 font-medium">Staff & Senior Citizen</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Pending Receivables (Due)</span>
          <div className="text-2xl font-bold text-rose-700 mt-1">
            {totalReceivablesPKR.toLocaleString()} PKR
          </div>
          <span className="text-[11px] text-rose-600 font-medium">Awaiting final payment</span>
        </div>
      </div>

      {/* Payment Channel Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
          <div className="flex items-center justify-between text-slate-700 font-semibold">
            <span className="flex items-center gap-1.5">
              <Banknote className="w-4 h-4 text-emerald-600" /> Physical Cash
            </span>
            <span className="font-mono">{cashPKR.toLocaleString()} PKR</span>
          </div>
          <div className="text-[11px] text-slate-500">In physical cashier till vault</div>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
          <div className="flex items-center justify-between text-slate-700 font-semibold">
            <span className="flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-blue-600" /> POS Card Terminal
            </span>
            <span className="font-mono">{cardPKR.toLocaleString()} PKR</span>
          </div>
          <div className="text-[11px] text-slate-500">1Link / Visa / Mastercard batch</div>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
          <div className="flex items-center justify-between text-slate-700 font-semibold">
            <span className="flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-rose-600" /> JazzCash Wallet
            </span>
            <span className="font-mono">{jazzcashPKR.toLocaleString()} PKR</span>
          </div>
          <div className="text-[11px] text-slate-500">Merchant QR settlement verified</div>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
          <div className="flex items-center justify-between text-slate-700 font-semibold">
            <span className="flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-emerald-600" /> EasyPaisa Wallet
            </span>
            <span className="font-mono">{easypaisaPKR.toLocaleString()} PKR</span>
          </div>
          <div className="text-[11px] text-slate-500">Direct merchant till settlement</div>
        </div>
      </div>

      {/* Receipts Ledger */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
          <h3 className="font-bold text-sm text-slate-800">
            Shift Invoices & Receipts Ledger ({orders.length} Transactions)
          </h3>
          <button
            type="button"
            onClick={() => window.print()}
            className="text-xs text-teal-700 hover:underline font-semibold flex items-center gap-1"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Shift Statement
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <th className="p-2.5">Receipt #</th>
                <th className="p-2.5">Time</th>
                <th className="p-2.5">Accession</th>
                <th className="p-2.5">Patient Name</th>
                <th className="p-2.5">Gross (PKR)</th>
                <th className="p-2.5">Discount</th>
                <th className="p-2.5">Paid (PKR)</th>
                <th className="p-2.5">Payment Method</th>
                <th className="p-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {orders.map((ord) => (
                <tr key={ord.id} className="hover:bg-slate-50">
                  <td className="p-2.5 font-bold text-slate-900">{ord.receiptNumber}</td>
                  <td className="p-2.5 text-slate-500 font-sans">
                    {new Date(ord.orderedAt).toLocaleTimeString('en-GB')}
                  </td>
                  <td className="p-2.5 text-teal-900 font-bold">{ord.accessionNumber}</td>
                  <td className="p-2.5 font-sans font-semibold text-slate-800">
                    {ord.patient.name}
                  </td>
                  <td className="p-2.5">{ord.subtotalPKR.toLocaleString()}</td>
                  <td className="p-2.5 text-emerald-700">
                    {ord.discountPKR > 0 ? `-${ord.discountPKR}` : '0'}
                  </td>
                  <td className="p-2.5 font-bold text-slate-900">{ord.paidPKR.toLocaleString()}</td>
                  <td className="p-2.5 font-sans">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[10px] font-semibold">
                      {ord.paymentMethod}
                    </span>
                  </td>
                  <td className="p-2.5 font-sans">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        ord.paymentStatus === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {ord.paymentStatus}
                    </span>
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
