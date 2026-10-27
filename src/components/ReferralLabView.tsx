/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Truck, CheckCircle2, Building, ShieldCheck, ThermometerSnowflake, FileText } from 'lucide-react';
import { LabOrder } from '../types/lis';

interface ReferralLabViewProps {
  orders: LabOrder[];
  onUpdateReferralStatus: (
    orderId: string,
    itemId: string,
    newStatus: 'DISPATCHED' | 'RECEIVED_BY_REF_LAB' | 'RESULT_INGESTED',
    trackingNumber: string
  ) => void;
}

export const ReferralLabView: React.FC<ReferralLabViewProps> = ({
  orders,
  onUpdateReferralStatus,
}) => {
  // Find all outsourced items across orders
  const referralItems = orders.flatMap((order) =>
    order.items
      .filter((i) => i.isOutsourced || i.department === 'REFERRAL')
      .map((item) => ({ order, item }))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Truck className="w-5 h-5 text-purple-600" />
            External Referral & Specialized Reference Laboratories
          </h2>
          <p className="text-xs text-slate-500">
            Cold-Chain Biological Transport (-20°C Dry Ice) • Dispatch Manifest • Automated Ingestion Tracking
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-semibold">
          <span className="px-2.5 py-1 bg-purple-50 text-purple-900 border border-purple-200 rounded-md">
            Approved Partners: Chughtai Lab (LHR) • SKMCH (Lahore) • Shifa International (ISB)
          </span>
        </div>
      </div>

      {/* Referral Items List */}
      <div className="space-y-4">
        {referralItems.map(({ order, item }) => (
          <div
            key={item.id}
            className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-sm text-slate-900">{item.testName}</span>
                  <span className="text-xs font-mono text-slate-500">({item.testCode})</span>
                  <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-800 rounded font-semibold">
                    OUTSOURCED
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Patient: <strong className="text-slate-800">{order.patient.name}</strong> • Accession: <strong className="text-teal-900 font-mono">{order.accessionNumber}</strong>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-amber-100 text-amber-800">
                  {item.referralStatus || 'DISPATCHED'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <span className="text-slate-500 font-medium">Reference Lab:</span>
                <div className="font-bold text-slate-800">
                  {item.referenceLabName || 'Chughtai National Reference Laboratory'}
                </div>
                <div className="text-[11px] text-slate-500">Lahore Central Diagnostic Hub</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <span className="text-slate-500 font-medium">Biological Transport Protocol:</span>
                <div className="font-semibold text-slate-800 flex items-center gap-1">
                  <ThermometerSnowflake className="w-4 h-4 text-teal-600" />
                  Frozen Serum (-20°C Cold Chain)
                </div>
                <div className="text-[11px] text-slate-500">Dry ice gel pack manifest verified</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <span className="text-slate-500 font-medium">Courier Manifest Tracking:</span>
                <div className="font-mono font-bold text-teal-900">
                  {item.referralTrackingNumber || 'CHG-COURIER-PK-98124'}
                </div>
                <div className="text-[11px] text-slate-500">Dedicated laboratory courier dispatch</div>
              </div>
            </div>

            {/* Ingested Results Preview */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <div className="font-bold text-xs text-slate-800 flex justify-between">
                <span>Ingested Reference Lab Findings:</span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Direct Result Ingestion Verified
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                {Object.entries(item.results).map(([k, r]) => (
                  <div key={k} className="p-2 bg-white rounded border border-slate-200">
                    <span className="text-slate-500 block text-[10px]">{k}</span>
                    <strong className="text-slate-900 text-sm">{r.value}</strong> {r.unit}
                    <div className="text-[10px] text-slate-500 mt-0.5">{r.refRangeText}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Status change actions */}
            <div className="flex items-center space-x-2 pt-2 border-t border-slate-100 text-xs">
              <span className="text-slate-500 font-medium mr-2">Update Manifest Status:</span>
              <button
                type="button"
                onClick={() =>
                  onUpdateReferralStatus(
                    order.id,
                    item.id,
                    'DISPATCHED',
                    item.referralTrackingNumber || 'CHG-COURIER-PK-98124'
                  )
                }
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium"
              >
                Dispatched
              </button>
              <button
                type="button"
                onClick={() =>
                  onUpdateReferralStatus(
                    order.id,
                    item.id,
                    'RECEIVED_BY_REF_LAB',
                    item.referralTrackingNumber || 'CHG-COURIER-PK-98124'
                  )
                }
                className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded font-medium"
              >
                Received at Ref Lab
              </button>
              <button
                type="button"
                onClick={() =>
                  onUpdateReferralStatus(
                    order.id,
                    item.id,
                    'RESULT_INGESTED',
                    item.referralTrackingNumber || 'CHG-COURIER-PK-98124'
                  )
                }
                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded font-medium"
              >
                Result Ingested
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
