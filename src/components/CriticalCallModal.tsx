/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PhoneCall, ShieldAlert, CheckCircle2, X } from 'lucide-react';
import { CriticalCallLog } from '../types/lis';

interface CriticalCallModalProps {
  orderId?: string;
  accessionNumber?: string;
  patientName?: string;
  testName?: string;
  defaultDetails?: string;
  onClose: () => void;
  onSaveCallLog: (log: CriticalCallLog) => void;
}

export const CriticalCallModal: React.FC<CriticalCallModalProps> = ({
  orderId = 'ORD_001',
  accessionNumber = 'ACC-2026-0038',
  patientName = 'Tariq Mehmood',
  testName = 'Complete Blood Count (CBC)',
  defaultDetails = 'Platelet count critically low at 18,000 /µL. Immediate risk of spontaneous hemorrhagic complications.',
  onClose,
  onSaveCallLog,
}) => {
  const [contactPerson, setContactPerson] = useState('Dr. A. Rehman (Consultant Hematologist)');
  const [contactNumber, setContactNumber] = useState('0300-5551234');
  const [readBackConfirmed, setReadBackConfirmed] = useState(true);
  const [callerStaff, setCallerStaff] = useState('Amir Saeed / Usman Tariq');
  const [notes, setNotes] = useState(
    'Telephonic communication conducted. Clinician verified result and acknowledged read-back.'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!readBackConfirmed) {
      alert('Statutory mandate: Clinician telephonic read-back confirmation must be obtained.');
      return;
    }

    const newLog: CriticalCallLog = {
      id: `CALL_${Date.now()}`,
      orderId,
      accessionNumber,
      patientName,
      testName,
      criticalResultDetails: defaultDetails,
      contactPerson,
      contactNumber,
      readBackConfirmed,
      callTimestamp: new Date().toISOString(),
      callerStaff,
      notes,
    };

    onSaveCallLog(newLog);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-rose-300">
        <div className="flex justify-between items-start border-b border-rose-100 pb-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-rose-600 rounded-lg shadow-sm text-white">
              <PhoneCall className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Critical Value Telephonic Read-Back Audit
              </h3>
              <p className="text-xs text-rose-700 font-semibold">
                PHC Standard 3.2 • Immediate Clinical Escalation Mandate
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="p-3 bg-rose-50 rounded-lg border border-rose-200 text-rose-900 space-y-1">
            <div className="flex justify-between">
              <span>Patient: <strong>{patientName}</strong></span>
              <span className="font-mono font-bold">{accessionNumber}</span>
            </div>
            <div>Test: <strong>{testName}</strong></div>
            <div className="text-[11px] font-semibold text-rose-950 mt-1">
              Critical Finding: {defaultDetails}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Attending Clinician Contacted *
              </label>
              <input
                type="text"
                required
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Direct Contact Phone # *
              </label>
              <input
                type="text"
                required
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">
              Laboratory Operator / Caller Identity *
            </label>
            <input
              type="text"
              required
              value={callerStaff}
              onChange={(e) => setCallerStaff(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">
              Call Communication Remarks
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded"
            />
          </div>

          {/* Mandatory Checkbox */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-start space-x-2">
            <input
              type="checkbox"
              id="readback"
              required
              checked={readBackConfirmed}
              onChange={(e) => setReadBackConfirmed(e.target.checked)}
              className="mt-0.5 rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
            />
            <label htmlFor="readback" className="text-slate-800 font-bold text-xs cursor-pointer">
              I certify that the clinician repeated back the patient's name, accession number, and exact critical test value (verbal read-back verification confirmed).
            </label>
          </div>

          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold shadow flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              Document Read-Back & Unlock Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
