/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Users, Search, Plus, UserPlus, Phone, MapPin, Calendar, FileText } from 'lucide-react';
import { Patient, LabOrder } from '../types/lis';
import { useNavigate } from 'react-router-dom';

interface PatientsViewProps {
  patients: Patient[];
  orders: LabOrder[];
  onOpenOrderModal: (patientId?: string) => void;
}

export const PatientsView: React.FC<PatientsViewProps> = ({
  patients,
  orders,
  onOpenOrderModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(patients[0] || null);

  const filteredPatients = patients.filter(
    (p) =>
      searchQuery === '' ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone.includes(searchQuery) ||
      p.mrn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.cnic.includes(searchQuery)
  );

  const patientOrders = selectedPatient
    ? orders.filter((o) => o.patientId === selectedPatient.id)
    : [];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-600" />
            Master Patient Index (MPI) — Xpert Diagnostics Lab
          </h2>
          <p className="text-xs text-slate-500">
            KPK Healthcare Commission (KPHCC) Demographic Registry • CNIC Verification • Patient Longitudinal History
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by MRN, CNIC, Phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <button
            type="button"
            onClick={() => onOpenOrderModal()}
            className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow transition whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4" />
            Register New Patient
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Patients Directory */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
          <div className="border-b border-slate-100 pb-2 flex justify-between items-center text-xs">
            <span className="font-bold text-slate-800">
              Patients Directory ({filteredPatients.length})
            </span>
            <span className="text-[11px] text-slate-500 font-mono">Mardan Division</span>
          </div>

          <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
            {filteredPatients.map((p) => {
              const isSelected = selectedPatient?.id === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPatient(p)}
                  className={`p-3 rounded-lg border cursor-pointer transition text-xs ${
                    isSelected
                      ? 'bg-teal-50/70 border-teal-500 ring-1 ring-teal-500/30'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100/60'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-slate-900 text-sm">{p.name}</span>
                    <span className="font-mono text-[11px] font-bold text-teal-800">{p.mrn}</span>
                  </div>
                  {p.urduName && (
                    <div className="text-[11px] text-teal-800 font-medium" dir="rtl">
                      {p.urduName}
                    </div>
                  )}
                  <div className="text-[11px] text-slate-500 mt-1 flex justify-between">
                    <span>
                      {p.ageYears} Y / {p.gender} • {p.city}
                    </span>
                    <span className="font-mono">{p.phone}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 2 Columns: Selected Patient Profile & Clinical Timeline */}
        {selectedPatient ? (
          <div className="lg:col-span-2 space-y-5">
            {/* Patient Demographic Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                <div>
                  <div className="flex items-center space-x-3">
                    <h3 className="font-bold text-base text-slate-900">
                      {selectedPatient.name}
                    </h3>
                    {selectedPatient.urduName && (
                      <span className="text-sm font-semibold text-teal-900" dir="rtl">
                        ({selectedPatient.urduName})
                      </span>
                    )}
                    <span className="px-2 py-0.5 bg-teal-100 text-teal-800 rounded font-mono font-bold text-xs">
                      {selectedPatient.mrn}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Registered on: {new Date(selectedPatient.registeredAt).toLocaleString('en-GB')} by {selectedPatient.registeredBy}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenOrderModal(selectedPatient.id)}
                  className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow transition self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  Book New Investigation
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Age / Gender</span>
                  <strong className="text-slate-900">{selectedPatient.ageYears} Years / {selectedPatient.gender}</strong>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">CNIC #</span>
                  <strong className="font-mono text-slate-900">{selectedPatient.cnic || 'N/A'}</strong>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Mobile Phone</span>
                  <strong className="font-mono text-slate-900">{selectedPatient.phone}</strong>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Location</span>
                  <strong className="text-slate-900">{selectedPatient.city}</strong>
                </div>

                <div className="col-span-2 sm:col-span-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Residential Address</span>
                  <span className="text-slate-800">{selectedPatient.address}</span>
                </div>
              </div>
            </div>

            {/* Patient Longitudinal Order History */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
              <h4 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-2">
                Diagnostic Investigation History ({patientOrders.length} Orders)
              </h4>

              {patientOrders.length > 0 ? (
                <div className="space-y-3">
                  {patientOrders.map((ord) => (
                    <div
                      key={ord.id}
                      className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 text-xs space-y-2"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-mono font-bold text-teal-900 text-sm">
                            {ord.accessionNumber}
                          </span>
                          <span className="text-slate-500 ml-2">
                            {new Date(ord.orderedAt).toLocaleString('en-GB')}
                          </span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                            ord.paymentStatus === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {ord.paymentStatus} ({ord.totalPKR} PKR)
                        </span>
                      </div>

                      <div className="text-slate-700">
                        <strong>Investigations:</strong>{' '}
                        {ord.items.map((i) => i.testName).join(' • ')}
                      </div>

                      <div className="text-slate-500 flex justify-between items-center text-[11px] pt-1 border-t border-slate-200">
                        <span>Doctor: {ord.referringDoctor}</span>
                        <span>Receipt: {ord.receiptNumber}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No previous investigations on record for this patient. Click "Book New Investigation" to start.
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
