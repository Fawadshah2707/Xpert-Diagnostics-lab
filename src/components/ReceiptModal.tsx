/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Printer, X, Receipt, CheckCircle, ShieldCheck, QrCode } from 'lucide-react';
import { LabOrder } from '../types/lis';

interface ReceiptModalProps {
  order: LabOrder;
  onClose: () => void;
  isUrduEnabled?: boolean;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  order,
  onClose,
  isUrduEnabled = false,
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-300 flex flex-col overflow-hidden max-h-[95vh]">
        {/* Modal Toolbar (hidden during print) */}
        <div className="p-3.5 bg-slate-900 text-white flex justify-between items-center print:hidden">
          <div className="flex items-center space-x-2">
            <Receipt className="w-5 h-5 text-teal-400" />
            <span className="font-bold text-sm">
              Cashier Receipt — {order.receiptNumber}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 shadow transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Print Receipt
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-md transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Thermal / Official Cashier Slip */}
        <div id="printable-receipt" className="p-6 overflow-y-auto space-y-4 font-mono text-xs text-slate-800 bg-white">
          {/* Header */}
          <div className="text-center border-b-2 border-dashed border-slate-300 pb-3 space-y-0.5">
            <div className="text-base font-black tracking-wider text-slate-900 uppercase">
              XPERT DIAGNOSTICS LAB
            </div>
            {isUrduEnabled && (
              <div className="text-sm font-semibold text-slate-700">
                ایکسپرٹ ڈائیگنوسٹک لیبارٹریز مردان
              </div>
            )}
            <div className="text-[11px] text-slate-600">
              Near Mardan Medical Complex (MMC), Mardan, KP
            </div>
            <div className="text-[10px] text-slate-500">
              KPHCC Reg: <strong className="text-slate-700">KPHCC-MDN-7721-PLMS</strong>
            </div>
            <div className="text-[10px] text-slate-500">
              Tel: (0937) 861-4200 • WhatsApp: 0300-9876543
            </div>
            <div className="text-[11px] font-bold text-teal-800 pt-1 tracking-wide">
              OFFICIAL CASHIER PAYMENT RECEIPT
            </div>
          </div>

          {/* Forwarded To Lab Banner */}
          <div className="bg-teal-50 border border-teal-200 rounded p-2 text-center text-[11px] text-teal-900 font-sans print:border-slate-400">
            <span className="font-bold">Status:</span> Forwarded to Lab Assistant (Usman Tariq) for testing
          </div>

          {/* Metadata Grid */}
          <div className="space-y-1 pt-1 border-b border-dashed border-slate-300 pb-3">
            <div className="flex justify-between">
              <span className="text-slate-500">Receipt No:</span>
              <span className="font-bold text-slate-900">{order.receiptNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Accession No:</span>
              <span className="font-bold text-teal-800">{order.accessionNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Date & Time:</span>
              <span>{new Date(order.orderedAt).toLocaleString('en-GB', { timeZone: 'Asia/Karachi' })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Cashier:</span>
              <span className="font-medium">{order.orderedBy || 'Bilal Khan (Cashier)'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Patient MRN:</span>
              <span className="font-bold">{order.patient.mrn}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Patient Name:</span>
              <span className="font-bold text-slate-900">{order.patient.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Age / Gender:</span>
              <span>{order.patient.ageYears} Y / {order.patient.gender === 'M' ? 'Male' : order.patient.gender === 'F' ? 'Female' : 'Other'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Contact / Phone:</span>
              <span>{order.patient.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Doctor / Clinic:</span>
              <span className="truncate max-w-[220px]" title={order.referringDoctor}>
                {order.referringDoctor}
              </span>
            </div>
          </div>

          {/* Test Items */}
          <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-3">
            <div className="font-bold text-slate-800 flex justify-between text-[11px]">
              <span>TEST DESCRIPTION</span>
              <span>RATE (PKR)</span>
            </div>
            {order.items.map((item, index) => (
              <div key={item.id || index} className="flex justify-between items-start text-[11px]">
                <div className="pr-2">
                  <div className="font-medium text-slate-900">{item.testName}</div>
                  <div className="text-[10px] text-slate-500">Dept: {item.department}</div>
                </div>
                <div className="font-bold whitespace-nowrap">{item.pricePKR.toLocaleString()}</div>
              </div>
            ))}
          </div>

          {/* Financial Totals */}
          <div className="space-y-1 border-b border-dashed border-slate-300 pb-3 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-600">Gross Subtotal:</span>
              <span className="font-semibold">{order.subtotalPKR.toLocaleString()} PKR</span>
            </div>
            {order.discountPKR > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Discount Applied:</span>
                <span>- {order.discountPKR.toLocaleString()} PKR</span>
              </div>
            )}
            <div className="flex justify-between text-xs font-bold text-slate-900 pt-1 border-t border-slate-200">
              <span>Net Total Amount:</span>
              <span>{order.totalPKR.toLocaleString()} PKR</span>
            </div>
            <div className="flex justify-between text-teal-800 font-bold">
              <span>Paid via {order.paymentMethod}:</span>
              <span>{order.paidPKR.toLocaleString()} PKR</span>
            </div>
            <div className={`flex justify-between font-bold ${order.balancePKR > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
              <span>Balance Due:</span>
              <span>{order.balancePKR.toLocaleString()} PKR</span>
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 pt-0.5">
              <span>Payment Status:</span>
              <span className="font-bold uppercase">{order.paymentStatus}</span>
            </div>
          </div>

          {/* Footer & Notes */}
          <div className="text-center space-y-1 pt-1 text-[10px] text-slate-500">
            <div className="font-semibold text-slate-700">
              * Please present this receipt at the Cashier counter to collect your final diagnostic report *
            </div>
            <div>Computer generated receipt • No signature required</div>
            <div className="text-[9px] text-slate-400">
              Xpert PLMS Core System • Mardan Node • Powered by LIS
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions (hidden during print) */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-medium cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
};
