/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  PhoneCall,
  CheckCircle,
  AlertTriangle,
  FileText,
  Lock,
  UserCheck,
  Send,
  Eye,
} from 'lucide-react';
import { LabOrder, OrderItem, UserRole, CriticalCallLog } from '../types/lis';

interface PathologistReviewViewProps {
  orders: LabOrder[];
  criticalCalls: CriticalCallLog[];
  currentRole: UserRole;
  onAuthorizeAndRelease: (
    orderId: string,
    itemId: string,
    pathologistNotes: string
  ) => void;
  onOpenCriticalModal: (orderId?: string, defaultDetails?: string) => void;
  onViewDiagnosticReport: (order: LabOrder) => void;
}

export const PathologistReviewView: React.FC<PathologistReviewViewProps> = ({
  orders,
  criticalCalls,
  currentRole,
  onAuthorizeAndRelease,
  onOpenCriticalModal,
  onViewDiagnosticReport,
}) => {
  const [selectedOrderId, setSelectedOrderId] = useState<string>(orders[0]?.id || '');
  const [pathologistNotes, setPathologistNotes] = useState<Record<string, string>>({
    ITEM_001: 'Severe thrombocytopenia verified on peripheral smear review. Telephonic alert communicated to Dr. Rehman.',
  });

  const selectedOrder = orders.find((o) => o.id === selectedOrderId) || orders[0];

  const isPathologist = currentRole === 'PATHOLOGIST' || currentRole === 'ADMINISTRATOR';

  // Check if this order contains any critical flags
  const hasCriticalResults = selectedOrder?.items.some((item) =>
    Object.values(item.results).some(
      (r) => r.flag === 'CRITICAL_LOW' || r.flag === 'CRITICAL_HIGH'
    )
  );

  // Check if critical call was logged and read back confirmed for this order
  const matchingCall = criticalCalls.find(
    (c) => c.orderId === selectedOrder?.id && c.readBackConfirmed
  );
  const criticalCallPending = hasCriticalResults && !matchingCall;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-purple-600" />
            Pathologist Clinical Authorization & Critical Communication
          </h2>
          <p className="text-xs text-slate-500">
            Second-Tier Clinical Review • Mandatory Telephonic Read-Back Audit • Consultant Sign-off (MBBS, FCPS)
          </p>
        </div>

        <div className="px-3 py-1.5 bg-teal-50 rounded-lg border border-teal-200 text-xs text-teal-900 flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-teal-700" />
          <span>
            Clinical Sign-Off: <strong>Amir Saeed</strong> (Administrator & Lab Director)
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Orders Queue for Pathologist */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="border-b border-slate-100 pb-2 flex justify-between items-center">
            <h3 className="font-bold text-sm text-slate-800">
              Orders Queue ({orders.length})
            </h3>
            <span className="text-[11px] text-slate-500">Select order to review</span>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {orders.map((order) => {
              const hasCritical = order.items.some((item) =>
                Object.values(item.results).some(
                  (r) => r.flag === 'CRITICAL_LOW' || r.flag === 'CRITICAL_HIGH'
                )
              );
              const isFullyReleased = order.items.every((i) => i.status === 'RELEASED');
              const isSelected = order.id === selectedOrderId;

              return (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrderId(order.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition text-xs ${
                    isSelected
                      ? 'bg-purple-50/70 border-purple-500 ring-1 ring-purple-500/30'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100/60'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="font-bold text-slate-900">{order.patient.name}</div>
                    <span className="font-mono text-[11px] text-teal-800 font-semibold">
                      {order.accessionNumber}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {order.patient.ageYears} Y / {order.patient.gender} • {order.items.map((i) => i.testCode).join(', ')}
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-200/60">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isFullyReleased
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {isFullyReleased ? 'RELEASED' : 'AWAITING AUTH'}
                    </span>

                    {hasCritical && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-600 text-white animate-pulse">
                        CRITICAL ALERT
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 2 Columns: Selected Order Clinical Review & Sign-Off */}
        {selectedOrder ? (
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-5">
            {/* Order Header Summary */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 gap-2">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-base text-slate-900">
                    {selectedOrder.patient.name}
                  </h3>
                  <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-mono">
                    {selectedOrder.accessionNumber}
                  </span>
                  <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-mono">
                    {selectedOrder.patient.mrn}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Age: {selectedOrder.patient.ageYears} Y • Sex: {selectedOrder.patient.gender} • Doctor: {selectedOrder.referringDoctor}
                  {selectedOrder.clinicalHistory && ` • History: ${selectedOrder.clinicalHistory}`}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onViewDiagnosticReport(selectedOrder)}
                className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm self-start sm:self-auto"
              >
                <Eye className="w-3.5 h-3.5" />
                Preview Full A4 Diagnostic Report
              </button>
            </div>

            {/* Critical Alert Warning & Call Log Trigger */}
            {hasCriticalResults && (
              <div
                className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                  criticalCallPending
                    ? 'bg-rose-50 border-rose-300 text-rose-900'
                    : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <AlertTriangle
                    className={`w-5 h-5 shrink-0 ${
                      criticalCallPending ? 'text-rose-600 animate-bounce' : 'text-emerald-600'
                    }`}
                  />
                  <div>
                    <div className="font-bold">
                      {criticalCallPending
                        ? 'CRITICAL VALUE ESCALATION: Telephonic Read-Back Required'
                        : 'CRITICAL VALUE READ-BACK COMPLETED & AUDITED'}
                    </div>
                    <div className="text-[11px] mt-0.5">
                      {criticalCallPending
                        ? 'Statutory patient safety requirement: A consultant pathologist or technologist must call the physician and confirm read-back.'
                        : `Confirmed with: ${matchingCall?.contactPerson} at ${new Date(
                            matchingCall?.callTimestamp || ''
                          ).toLocaleTimeString('en-GB')} by ${matchingCall?.callerStaff}.`}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onOpenCriticalModal(
                      selectedOrder.id,
                      `Platelet count 18,000 /µL (Critical low, severe bleeding risk in acute dengue).`
                    )
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold shadow-xs whitespace-nowrap self-start sm:self-auto ${
                    criticalCallPending
                      ? 'bg-rose-600 hover:bg-rose-700 text-white'
                      : 'bg-white border border-emerald-300 text-emerald-900 hover:bg-emerald-100'
                  }`}
                >
                  <PhoneCall className="w-3.5 h-3.5 inline mr-1" />
                  {criticalCallPending ? 'Log Critical Phone Call Now' : 'View Communication Audit Log'}
                </button>
              </div>
            )}

            {/* Items and Analytes Review */}
            <div className="space-y-4">
              {selectedOrder.items.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3"
                >
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <div>
                      <span className="font-bold text-sm text-slate-800">{item.testName}</span>
                      <span className="text-xs text-slate-500 ml-2 font-mono">({item.testCode})</span>
                    </div>

                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                        item.status === 'RELEASED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.status === 'TECHNICAL_VERIFIED'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {/* Analytes Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left bg-white border border-slate-200 rounded">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                          <th className="p-2">Analyte</th>
                          <th className="p-2">Measured Value</th>
                          <th className="p-2">Unit</th>
                          <th className="p-2">Reference Range</th>
                          <th className="p-2">Status / Flag</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {Object.entries(item.results).map(([key, res]) => (
                          <tr key={key} className={res.flag.includes('CRITICAL') ? 'bg-rose-50/80 font-bold' : ''}>
                            <td className="p-2 font-medium text-slate-800">{key}</td>
                            <td className="p-2 font-mono text-sm">
                              {res.value}
                            </td>
                            <td className="p-2 text-slate-500">{res.unit}</td>
                            <td className="p-2 text-slate-600 font-mono text-[11px]">{res.refRangeText}</td>
                            <td className="p-2">
                              {res.flag === 'CRITICAL_LOW' || res.flag === 'CRITICAL_HIGH' ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white">
                                  CRITICAL [{res.flag.split('_')[1]}]
                                </span>
                              ) : res.flag === 'LOW' ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                  LOW [L]
                                </span>
                              ) : res.flag === 'HIGH' ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                                  HIGH [H]
                                </span>
                              ) : (
                                <span className="text-[10px] text-emerald-700 font-medium">NORMAL</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {item.technicalVerifiedBy && (
                    <div className="text-[11px] text-slate-600 flex justify-between pt-1">
                      <span>
                        Technical Verification by: <strong>{item.technicalVerifiedBy}</strong>
                      </span>
                      <span>{new Date(item.technicalVerifiedAt || '').toLocaleString('en-GB')}</span>
                    </div>
                  )}

                  {/* Pathologist Clinical Interpretation & Sign-Off Box */}
                  <div className="pt-2 border-t border-slate-200 space-y-2">
                    <label className="block text-slate-700 font-bold text-xs">
                      Consultant Pathologist Clinical Impression / Note:
                    </label>
                    <textarea
                      rows={2}
                      value={pathologistNotes[item.id] || item.pathologistNotes || ''}
                      onChange={(e) =>
                        setPathologistNotes((prev) => ({ ...prev, [item.id]: e.target.value }))
                      }
                      placeholder="e.g. Findings correlate with acute infection. Repeat hemogram advised in 48 hours."
                      className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs bg-white"
                    />

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                      <div className="text-[11px] text-slate-500 italic">
                        Digital Sign-off: Amir Saeed, Administrator & Lab Director
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          onAuthorizeAndRelease(
                            selectedOrder.id,
                            item.id,
                            pathologistNotes[item.id] || item.pathologistNotes || 'Report clinically reviewed and authorized.'
                          )
                        }
                        disabled={criticalCallPending || item.status === 'RELEASED'}
                        className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition ${
                          criticalCallPending || item.status === 'RELEASED'
                            ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                            : 'bg-purple-700 hover:bg-purple-800 text-white'
                        }`}
                      >
                        <ShieldCheck className="w-4 h-4" />
                        {item.status === 'RELEASED'
                          ? 'Report Already Released'
                          : 'Clinically Authorize & Release Diagnostic Report'}
                      </button>
                    </div>

                    {criticalCallPending && (
                      <p className="text-[11px] text-rose-600 font-semibold">
                        * Authorization locked until telephonic read-back communication is documented.
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 p-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
            Select an order from the queue to perform pathologist review.
          </div>
        )}
      </div>
    </div>
  );
};
