/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PhoneCall, AlertTriangle, ShieldCheck, CheckCircle2, Clock } from 'lucide-react';
import { LabOrder, CriticalCallLog } from '../types/lis';

interface CriticalQueueViewProps {
  orders: LabOrder[];
  criticalCalls: CriticalCallLog[];
  onOpenCallModal: (orderId: string, details: string) => void;
  onOpenReport: (order: LabOrder) => void;
}

export const CriticalQueueView: React.FC<CriticalQueueViewProps> = ({
  orders,
  criticalCalls,
  onOpenCallModal,
  onOpenReport,
}) => {
  // Find all orders with critical result flags
  const criticalOrders = orders.filter((o) =>
    o.items.some((item) =>
      Object.values(item.results).some((r) => r.flag.includes('CRITICAL'))
    )
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <PhoneCall className="w-5 h-5 text-rose-600" />
            Critical Value Escalation Queue & Telephonic Read-Back Log
          </h2>
          <p className="text-xs text-slate-500">
            Mandatory Patient Safety Escalation • Verbal Read-Back Verification Audit • Immediate Notification SLA &lt; 30 Minutes
          </p>
        </div>

        <div className="px-3 py-1.5 bg-rose-50 border border-rose-200 rounded-lg text-xs font-bold text-rose-900 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 animate-bounce" />
          <span>Active Critical Investigations: {criticalOrders.length}</span>
        </div>
      </div>

      {/* Critical Orders Cards */}
      <div className="space-y-4">
        {criticalOrders.map((order) => {
          const matchingCall = criticalCalls.find(
            (c) => c.orderId === order.id && c.readBackConfirmed
          );
          const isCallPending = !matchingCall;

          // Find the specific critical items
          const criticalItems = order.items.filter((item) =>
            Object.values(item.results).some((r) => r.flag.includes('CRITICAL'))
          );

          return (
            <div
              key={order.id}
              className={`p-5 rounded-xl border shadow-sm space-y-4 ${
                isCallPending
                  ? 'bg-rose-50/50 border-rose-300 ring-1 ring-rose-300/40'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-base text-slate-900">
                      {order.patient.name}
                    </span>
                    <span className="font-mono text-xs px-2 py-0.5 bg-slate-200 text-slate-800 rounded font-semibold">
                      {order.accessionNumber}
                    </span>
                    <span className="px-2 py-0.5 rounded font-bold text-xs bg-rose-600 text-white animate-pulse">
                      STAT CRITICAL
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 mt-1">
                    MRN: <strong>{order.patient.mrn}</strong> • {order.patient.ageYears} Y / {order.patient.gender} • Attending Doctor: <strong>{order.referringDoctor}</strong>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {isCallPending ? (
                    <button
                      type="button"
                      onClick={() =>
                        onOpenCallModal(
                          order.id,
                          `Critical finding on ${criticalItems.map((i) => i.testName).join(', ')}.`
                        )
                      }
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      Log Telephonic Read-Back Call
                    </button>
                  ) : (
                    <span className="px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Read-Back Confirmed & Audited
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => onOpenReport(order)}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold"
                  >
                    View Report
                  </button>
                </div>
              </div>

              {/* Critical Values Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {criticalItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-white rounded-lg border border-slate-200 space-y-2"
                  >
                    <div className="font-bold text-slate-800 text-xs">
                      {item.testName} ({item.testCode})
                    </div>
                    <div className="space-y-1">
                      {Object.entries(item.results)
                        .filter(([_, r]) => r.flag.includes('CRITICAL'))
                        .map(([k, r]) => (
                          <div
                            key={k}
                            className="p-2 bg-rose-50 rounded border border-rose-200 font-mono flex justify-between items-center"
                          >
                            <div>
                              <span className="font-bold text-rose-900">{k}: </span>
                              <strong className="text-base text-rose-700 font-black">{r.value}</strong> {r.unit}
                            </div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-600 text-white">
                              {r.flag}
                            </span>
                          </div>
                        ))}
                    </div>
                    {item.techNotes && (
                      <div className="text-[11px] text-slate-600 italic">
                        Tech Note: {item.techNotes}
                      </div>
                    )}
                  </div>
                ))}

                {matchingCall && (
                  <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 space-y-1 text-emerald-950">
                    <div className="font-bold flex items-center gap-1 text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Communication Audit Record:
                    </div>
                    <div>Contacted: <strong>{matchingCall.contactPerson}</strong> ({matchingCall.contactNumber})</div>
                    <div>Caller Staff: <strong>{matchingCall.callerStaff}</strong></div>
                    <div>Call Time: <strong>{new Date(matchingCall.callTimestamp).toLocaleString('en-GB')}</strong></div>
                    <div className="text-[11px] text-slate-600 mt-1 italic font-sans">
                      Remarks: "{matchingCall.notes}"
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Historical Telephonic Call Audit Trail Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
        <h3 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-2">
          Telephonic Read-Back Call History ({criticalCalls.length} Documented Calls)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <th className="p-2.5">Call Timestamp</th>
                <th className="p-2.5">Accession #</th>
                <th className="p-2.5">Patient Name</th>
                <th className="p-2.5">Doctor Contacted</th>
                <th className="p-2.5">Phone Number</th>
                <th className="p-2.5">Verbal Read-Back</th>
                <th className="p-2.5">Caller Technologist</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {criticalCalls.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="p-2.5 font-mono text-slate-600">
                    {new Date(c.callTimestamp).toLocaleString('en-GB')}
                  </td>
                  <td className="p-2.5 font-mono font-bold text-teal-900">{c.accessionNumber}</td>
                  <td className="p-2.5 font-semibold text-slate-800">{c.patientName}</td>
                  <td className="p-2.5 text-slate-800">{c.contactPerson}</td>
                  <td className="p-2.5 font-mono text-slate-700">{c.contactNumber}</td>
                  <td className="p-2.5">
                    <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-emerald-100 text-emerald-800">
                      CONFIRMED
                    </span>
                  </td>
                  <td className="p-2.5 text-slate-600">{c.callerStaff}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
