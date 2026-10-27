/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  TestTube2,
  Barcode,
  Printer,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { LabOrder, SpecimenRecord, SpecimenStatus, SpecimenTube } from '../types/lis';

interface PhlebotomyBarcodeViewProps {
  orders: LabOrder[];
  onUpdateSpecimenStatus: (
    orderId: string,
    specimenId: string,
    newStatus: SpecimenStatus,
    rejectionReason?: string
  ) => void;
}

export const PhlebotomyBarcodeView: React.FC<PhlebotomyBarcodeViewProps> = ({
  orders,
  onUpdateSpecimenStatus,
}) => {
  // Active selected specimen for Barcode Preview
  const [selectedSpecimen, setSelectedSpecimen] = useState<{
    order: LabOrder;
    specimen: SpecimenRecord;
  } | null>(null);

  // Rejection modal state
  const [rejectionTarget, setRejectionTarget] = useState<{
    orderId: string;
    specimenId: string;
  } | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('HEMOLYZED');
  const [rejectionNotes, setRejectionNotes] = useState<string>('');

  const tubeColorMap: Record<SpecimenTube, { bg: string; text: string; border: string }> = {
    EDTA_K2: { bg: 'bg-purple-100', text: 'text-purple-900', border: 'border-purple-300' },
    SST_GEL: { bg: 'bg-amber-100', text: 'text-amber-900', border: 'border-amber-300' },
    SODIUM_CITRATE: { bg: 'bg-sky-100', text: 'text-sky-900', border: 'border-sky-300' },
    SODIUM_FLUORIDE: { bg: 'bg-slate-200', text: 'text-slate-800', border: 'border-slate-400' },
    STERILE_CUP: { bg: 'bg-teal-100', text: 'text-teal-900', border: 'border-teal-300' },
    HEPARIN: { bg: 'bg-emerald-100', text: 'text-emerald-900', border: 'border-emerald-300' },
    PLAIN_RED: { bg: 'bg-rose-100', text: 'text-rose-900', border: 'border-rose-300' },
    SWAB_TRANSPORT: { bg: 'bg-indigo-100', text: 'text-indigo-900', border: 'border-indigo-300' },
  };

  const handleCollectAndPrint = (order: LabOrder, specimen: SpecimenRecord) => {
    onUpdateSpecimenStatus(order.id, specimen.id, 'COLLECTED');
    setSelectedSpecimen({ order, specimen: { ...specimen, status: 'COLLECTED' } });
  };

  const handleReceiveInLab = (order: LabOrder, specimen: SpecimenRecord) => {
    onUpdateSpecimenStatus(order.id, specimen.id, 'RECEIVED_IN_LAB');
  };

  const handleConfirmRejection = () => {
    if (!rejectionTarget) return;
    const fullReason = `${rejectionReason}${rejectionNotes ? ` - ${rejectionNotes}` : ''}`;
    onUpdateSpecimenStatus(
      rejectionTarget.orderId,
      rejectionTarget.specimenId,
      'REJECTED',
      fullReason
    );
    setRejectionTarget(null);
    setRejectionNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Phlebotomy Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <TestTube2 className="w-5 h-5 text-teal-600" />
            Phlebotomy Station & Barcode Accessioning Worklist
          </h2>
          <p className="text-xs text-slate-500">
            Chain of Custody Tracking • Specimen Acceptance / Rejection Criteria • 2-Inch Thermal Barcode Labels
          </p>
        </div>

        {/* Tube Legend */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className="font-semibold text-slate-600 mr-1">Tubes:</span>
          <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-900 border border-purple-300 font-semibold">
            EDTA (Purple)
          </span>
          <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 font-semibold">
            SST Gel (Yellow)
          </span>
          <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-900 border border-sky-300 font-semibold">
            Citrate (Blue)
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800 border border-slate-400 font-semibold">
            Fluoride (Grey)
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Specimen Worklist by Order */}
        <div className="lg:col-span-2 space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-2.5 gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-slate-900">
                      {order.patient.name}
                    </span>
                    <span className="text-xs font-mono text-slate-500">
                      ({order.patient.mrn})
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full font-mono font-medium">
                      {order.accessionNumber}
                    </span>
                    {order.priority === 'STAT' && (
                      <span className="text-xs px-2 py-0.5 bg-rose-600 text-white rounded-full font-bold animate-pulse">
                        STAT EMERGENCY
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {order.patient.ageYears} Y / {order.patient.gender} • Dr: {order.referringDoctor}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-500">
                    Ordered: {new Date(order.orderedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {/* Specimens list for this order */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {order.specimens.map((specimen) => {
                  const tubeStyle = tubeColorMap[specimen.tube] || {
                    bg: 'bg-slate-100',
                    text: 'text-slate-800',
                    border: 'border-slate-300',
                  };

                  return (
                    <div
                      key={specimen.id}
                      className={`p-3 rounded-lg border ${tubeStyle.border} ${tubeStyle.bg} flex flex-col justify-between space-y-2`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className={`font-bold text-xs ${tubeStyle.text}`}>
                            {specimen.tubeLabel}
                          </div>
                          <div className="font-mono text-[11px] text-slate-700 font-semibold mt-0.5">
                            Barcode: {specimen.barcode}
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            specimen.status === 'RECEIVED_IN_LAB'
                              ? 'bg-emerald-600 text-white'
                              : specimen.status === 'COLLECTED'
                              ? 'bg-blue-600 text-white'
                              : specimen.status === 'REJECTED'
                              ? 'bg-rose-600 text-white'
                              : 'bg-amber-500 text-white'
                          }`}
                        >
                          {specimen.status.replace(/_/g, ' ')}
                        </span>
                      </div>

                      {specimen.rejectionReason && (
                        <div className="text-[11px] text-rose-700 bg-rose-50 p-1.5 rounded border border-rose-200 font-medium">
                          Rejected: {specimen.rejectionReason}
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex items-center space-x-2 pt-1 border-t border-slate-200/60">
                        {specimen.status === 'PENDING_COLLECTION' && (
                          <button
                            type="button"
                            onClick={() => handleCollectAndPrint(order, specimen)}
                            className="flex-1 py-1 px-2 bg-teal-600 hover:bg-teal-700 text-white rounded text-xs font-semibold flex items-center justify-center gap-1 shadow-xs"
                          >
                            <Barcode className="w-3.5 h-3.5" />
                            Collect & Print Label
                          </button>
                        )}

                        {specimen.status === 'COLLECTED' && (
                          <button
                            type="button"
                            onClick={() => handleReceiveInLab(order, specimen)}
                            className="flex-1 py-1 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold flex items-center justify-center gap-1 shadow-xs"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Receive in Lab
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setSelectedSpecimen({ order, specimen })}
                          className="py-1 px-2 bg-white hover:bg-slate-50 text-slate-700 rounded border border-slate-300 text-xs font-medium flex items-center gap-1"
                          title="Preview thermal barcode label"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Label
                        </button>

                        {specimen.status !== 'REJECTED' && (
                          <button
                            type="button"
                            onClick={() =>
                              setRejectionTarget({ orderId: order.id, specimenId: specimen.id })
                            }
                            className="py-1 px-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded border border-rose-200 text-xs font-medium flex items-center gap-1"
                            title="Reject specimen if hemolyzed, clotted, or insufficient"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Reject
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Right Column: High-Fidelity Barcode Label Simulator */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-2 flex justify-between items-center">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
              <Barcode className="w-4 h-4 text-teal-600" />
              Thermal Tube Barcode Label Preview
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">50mm x 25mm</span>
          </div>

          {selectedSpecimen ? (
            <div className="space-y-4">
              {/* Simulated 2x1 Inch Thermal Tube Label */}
              <div className="bg-white p-3 rounded-lg border-2 border-dashed border-slate-400 font-mono text-slate-900 shadow-sm space-y-1 text-xs">
                <div className="flex justify-between items-start font-bold border-b border-slate-300 pb-1">
                  <span className="text-[11px] truncate max-w-[170px]">
                    {selectedSpecimen.order.patient.name.toUpperCase()}
                  </span>
                  <span className="text-[10px]">
                    {selectedSpecimen.order.patient.ageYears}Y / {selectedSpecimen.order.patient.gender}
                  </span>
                </div>

                <div className="flex justify-between text-[10px] text-slate-700">
                  <span>MRN: {selectedSpecimen.order.patient.mrn}</span>
                  <span className="font-bold text-teal-900">{selectedSpecimen.order.priority}</span>
                </div>

                <div className="text-[10px] text-slate-800 font-bold truncate">
                  {selectedSpecimen.specimen.tubeLabel.toUpperCase()}
                </div>

                {/* SVG Code 128 Barcode Simulation */}
                <div className="py-1 flex flex-col items-center justify-center">
                  <svg className="w-full h-12" viewBox="0 0 200 45">
                    {/* Barcode line patterns */}
                    <rect x="10" y="0" width="3" height="35" fill="black" />
                    <rect x="15" y="0" width="2" height="35" fill="black" />
                    <rect x="20" y="0" width="5" height="35" fill="black" />
                    <rect x="28" y="0" width="2" height="35" fill="black" />
                    <rect x="33" y="0" width="4" height="35" fill="black" />
                    <rect x="40" y="0" width="2" height="35" fill="black" />
                    <rect x="45" y="0" width="6" height="35" fill="black" />
                    <rect x="54" y="0" width="2" height="35" fill="black" />
                    <rect x="60" y="0" width="4" height="35" fill="black" />
                    <rect x="68" y="0" width="3" height="35" fill="black" />
                    <rect x="74" y="0" width="6" height="35" fill="black" />
                    <rect x="83" y="0" width="2" height="35" fill="black" />
                    <rect x="88" y="0" width="5" height="35" fill="black" />
                    <rect x="96" y="0" width="3" height="35" fill="black" />
                    <rect x="102" y="0" width="4" height="35" fill="black" />
                    <rect x="110" y="0" width="2" height="35" fill="black" />
                    <rect x="115" y="0" width="5" height="35" fill="black" />
                    <rect x="123" y="0" width="3" height="35" fill="black" />
                    <rect x="130" y="0" width="4" height="35" fill="black" />
                    <rect x="138" y="0" width="2" height="35" fill="black" />
                    <rect x="144" y="0" width="5" height="35" fill="black" />
                    <rect x="152" y="0" width="3" height="35" fill="black" />
                    <rect x="158" y="0" width="6" height="35" fill="black" />
                    <rect x="168" y="0" width="2" height="35" fill="black" />
                    <rect x="174" y="0" width="4" height="35" fill="black" />
                    <rect x="182" y="0" width="3" height="35" fill="black" />
                    <rect x="188" y="0" width="2" height="35" fill="black" />
                  </svg>
                  <span className="text-[11px] font-bold tracking-widest text-slate-900">
                    {selectedSpecimen.specimen.barcode}
                  </span>
                </div>

                <div className="flex justify-between text-[9px] text-slate-500 border-t border-slate-200 pt-1">
                  <span>Xpert Lab (Mardan)</span>
                  <span>{new Date().toLocaleTimeString('en-GB')}</span>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow"
                >
                  <Printer className="w-4 h-4" />
                  Print Barcode on Zebra Printer
                </button>
                <p className="text-[11px] text-slate-500 text-center">
                  Direct thermal ZPL / EPL output for standard laboratory specimen tubes.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-lg">
              <Barcode className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              Click "Label" or "Collect & Print" on any specimen tube to inspect the thermal barcode format.
            </div>
          )}

          {/* Specimen Integrity Standards Box */}
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 space-y-1">
            <div className="font-bold flex items-center gap-1">
              <ShieldAlert className="w-4 h-4 text-amber-700" />
              Specimen Acceptance Criteria (PHC Standard):
            </div>
            <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-amber-800">
              <li>EDTA tubes must be gently inverted 8-10 times to prevent microclots.</li>
              <li>Sodium Citrate (Blue) requires exact 1:9 blood-to-anticoagulant ratio.</li>
              <li>Grossly hemolyzed or lipemic specimens must be rejected immediately.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Specimen Rejection Modal */}
      {rejectionTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-200">
            <div className="flex justify-between items-start border-b border-slate-100 pb-2">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 text-rose-600">
                  <AlertTriangle className="w-4 h-4" />
                  Reject Laboratory Specimen
                </h3>
                <p className="text-xs text-slate-500">
                  Mandatory documentation of pre-analytical rejection reason
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Clinical Rejection Cause *
                </label>
                <select
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md font-medium"
                >
                  <option value="HEMOLYZED">Grossly Hemolyzed (RBC Lysis / Free Hb Interference)</option>
                  <option value="CLOTTED">Clotted Whole Blood in EDTA (Platelet Clump / Fibrin)</option>
                  <option value="LIPEMIC">Severely Lipemic / Turbid Specimen</option>
                  <option value="INSUFFICIENT_VOLUME_QNS">Insufficient Volume (QNS - Quantity Not Sufficient)</option>
                  <option value="INCORRECT_TUBE">Incorrect Container / Anticoagulant Tube</option>
                  <option value="LABEL_MISMATCH">Barcode / Patient Identity Mismatch</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Additional Notes & Recollection Instructions
                </label>
                <textarea
                  rows={3}
                  value={rejectionNotes}
                  onChange={(e) => setRejectionNotes(e.target.value)}
                  placeholder="e.g. In vitro hemolysis due to traumatic venipuncture. Recollection requested."
                  className="w-full px-3 py-2 border border-slate-300 rounded-md"
                />
              </div>
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setRejectionTarget(null)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRejection}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow"
              >
                Confirm Rejection & Request Recollect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
