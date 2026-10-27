/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Microscope,
  Cpu,
  CheckCircle,
  Clock,
  AlertTriangle,
  Play,
  Check,
  Search,
  Filter,
  Layers,
  ChevronRight,
  Sparkles,
  Send,
  FileCheck,
  Activity,
  X,
} from 'lucide-react';
import { LabOrder, OrderItem, FlagType } from '../types/lis';
import { CLINICAL_CATALOG } from '../data/clinicalCatalog';
import { evaluateReferenceInterval } from '../utils/lisLogic';

interface LabAssistantWorkspaceProps {
  orders: LabOrder[];
  onCompleteOrderTests: (
    orderId: string,
    updatedItems: OrderItem[],
    techNotes?: string
  ) => void;
  isUrduEnabled: boolean;
}

export const LabAssistantWorkspace: React.FC<LabAssistantWorkspaceProps> = ({
  orders,
  onCompleteOrderTests,
  isUrduEnabled,
}) => {
  const [activeTab, setActiveTab] = useState<'PENDING_WORKLIST' | 'COMPLETED_ARCHIVE'>('PENDING_WORKLIST');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrderForTesting, setSelectedOrderForTesting] = useState<LabOrder | null>(null);

  // Active testing form state: { itemId: { analyteKey: value } }
  const [activeResults, setActiveResults] = useState<Record<string, Record<string, string | number>>>({});
  const [instrumentId, setInstrumentId] = useState<string>('Sysmex XN-1000 & Cobas c311');
  const [techNotes, setTechNotes] = useState<string>('Specimen verified, analyzer QC within limits. Tests completed.');
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Incoming / Forwarded orders from Cashier
  const pendingOrders = orders.filter((o) => {
    // Orders that are forwarded to lab or in progress
    const isPending =
      o.workflowStage === 'FORWARDED_TO_LAB' ||
      o.workflowStage === 'IN_TESTING' ||
      (!o.workflowStage && o.items.some((i) => i.status === 'DRAFT' || i.status === 'ENTERED'));

    if (!isPending) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      o.patient.name.toLowerCase().includes(q) ||
      o.accessionNumber.toLowerCase().includes(q) ||
      o.patient.mrn.toLowerCase().includes(q)
    );
  });

  // Completed orders archive
  const completedOrders = orders.filter((o) => {
    return (
      o.workflowStage === 'TESTS_COMPLETED' ||
      o.workflowStage === 'READY_FOR_CASHIER_PRINT' ||
      o.workflowStage === 'REPORT_PRINTED' ||
      o.workflowStage === 'DELIVERED' ||
      o.items.every((i) => i.status === 'RELEASED' || i.status === 'CLINICALLY_AUTHORIZED')
    );
  });

  // Open testing modal for an order
  const handleOpenTestingModal = (order: LabOrder) => {
    setSelectedOrderForTesting(order);
    
    // Initialize results with existing values if any
    const initialValues: Record<string, Record<string, string | number>> = {};
    order.items.forEach((item) => {
      initialValues[item.id] = {};
      if (item.results) {
        Object.entries(item.results).forEach(([k, v]) => {
          initialValues[item.id][k] = v.value;
        });
      }
    });
    setActiveResults(initialValues);
  };

  // 1-Click Auto-Fill with Normal / Analyzer Values
  const handleAutoFillAnalyzer = () => {
    if (!selectedOrderForTesting) return;

    const populated: Record<string, Record<string, string | number>> = {};

    selectedOrderForTesting.items.forEach((item) => {
      populated[item.id] = {};
      const catItem = CLINICAL_CATALOG.find((c) => c.id === item.testId || c.code === item.testCode);
      if (catItem) {
        catItem.components.forEach((comp) => {
          if (comp.defaultValue !== undefined) {
            populated[item.id][comp.key] = comp.defaultValue;
          } else if (comp.refIntervals && comp.refIntervals.length > 0) {
            const ref = comp.refIntervals[0];
            if (ref.low !== undefined && ref.high !== undefined) {
              const mid = Number(((ref.low + ref.high) / 2).toFixed(comp.decimalPlaces ?? 1));
              populated[item.id][comp.key] = mid;
            } else {
              populated[item.id][comp.key] = 'Normal / Negative';
            }
          } else {
            populated[item.id][comp.key] = 'Normal';
          }
        });
      }
    });

    setActiveResults(populated);
  };

  // Submit & Forward to Cashier
  const handleCompleteAndForward = () => {
    if (!selectedOrderForTesting) return;

    const patientGender = selectedOrderForTesting.patient.gender;
    const patientAge = selectedOrderForTesting.patient.ageYears;

    // Build completed OrderItems
    const updatedItems: OrderItem[] = selectedOrderForTesting.items.map((item) => {
      const catItem = CLINICAL_CATALOG.find((c) => c.id === item.testId || c.code === item.testCode);
      const itemValues = activeResults[item.id] || {};
      const resultsMap: OrderItem['results'] = {};

      if (catItem) {
        catItem.components.forEach((comp) => {
          const val = itemValues[comp.key] ?? comp.defaultValue ?? 0;
          const numVal = typeof val === 'number' ? val : parseFloat(String(val));
          
          const evalResult = evaluateReferenceInterval(
            val,
            patientGender,
            patientAge,
            comp.refIntervals || []
          );

          resultsMap[comp.key] = {
            value: isNaN(numVal) ? val : numVal,
            flag: evalResult.flag,
            unit: comp.unit,
            refRangeText: evalResult.refRangeText,
            instrumentId,
            techNotes: `Tested by Usman Tariq (Lab Assistant)`,
          };
        });
      }

      return {
        ...item,
        status: 'RELEASED',
        results: resultsMap,
        technicalVerifiedBy: 'Usman Tariq (Lab Assistant)',
        technicalVerifiedAt: new Date().toISOString(),
        clinicalAuthorizedBy: 'Amir Saeed (Administrator & Lab Director)',
        clinicalAuthorizedAt: new Date().toISOString(),
        techNotes,
      };
    });

    onCompleteOrderTests(selectedOrderForTesting.id, updatedItems, techNotes);

    setSuccessBanner(
      `Tests completed for ${selectedOrderForTesting.patient.name} (${selectedOrderForTesting.accessionNumber})! Results forwarded back to Cashier (Bilal Khan) for Diagnostic Report printing.`
    );

    setSelectedOrderForTesting(null);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Lab Assistant Hero & Stats Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-xl p-5 shadow-lg border border-indigo-800/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                ROLE: LAB ASSISTANT BENCH
              </span>
              <span className="text-xs text-slate-400">Central Laboratory • Mardan</span>
            </div>
            <h2 className="text-xl font-black tracking-tight text-white mt-1">
              Lab Assistant Testing Worklist & Analytical Bench
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Receives patient work orders forwarded by Cashier $\rightarrow$ perform analytical investigations $\rightarrow$ enter results $\rightarrow$ click <strong>"Complete & Forward to Cashier"</strong> to enable report printing.
            </p>
          </div>

          {/* Quick Counter Pills */}
          <div className="flex flex-wrap gap-2 text-xs">
            <div className="bg-amber-900/50 border border-amber-600/50 rounded-lg px-3 py-2 text-center">
              <div className="text-[10px] text-amber-200 uppercase font-bold">Forwarded from Cashier</div>
              <div className="text-lg font-bold text-amber-400">{pendingOrders.length} Pending</div>
            </div>
            <div className="bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-center">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Completed & Forwarded</div>
              <div className="text-lg font-bold text-emerald-400">{completedOrders.length} Done</div>
            </div>
            <div className="bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-center">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Active Assistant</div>
              <div className="text-sm font-bold text-white">Usman Tariq</div>
            </div>
          </div>
        </div>

        {/* Success / Notification Banner */}
        {successBanner && (
          <div className="mt-4 p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-lg flex items-start justify-between gap-2 text-xs text-emerald-200 animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successBanner}</span>
            </div>
            <button
              onClick={() => setSuccessBanner(null)}
              className="text-emerald-300 hover:text-white font-bold ml-2 cursor-pointer"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* Main Tab Switcher */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-4 pt-2 shadow-xs">
        <button
          onClick={() => setActiveTab('PENDING_WORKLIST')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-sm transition-colors cursor-pointer relative ${
            activeTab === 'PENDING_WORKLIST'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Microscope className="w-4 h-4" />
          <span>Pending Worklist (Orders from Cashier)</span>
          {pendingOrders.length > 0 && (
            <span className="ml-1.5 px-2 py-0.5 text-xs font-bold rounded-full bg-amber-500 text-white shadow-xs">
              {pendingOrders.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('COMPLETED_ARCHIVE')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-sm transition-colors cursor-pointer ${
            activeTab === 'COMPLETED_ARCHIVE'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>Completed Lab Archive ({completedOrders.length})</span>
        </button>
      </div>

      {/* TAB 1: PENDING WORKLIST */}
      {activeTab === 'PENDING_WORKLIST' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                  <Microscope className="w-5 h-5 text-indigo-600" />
                  <span>Incoming Laboratory Worklist</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Orders entered and paid at Cashier counter. Click <strong>"Perform Test / Enter Results"</strong> to analyze specimens and enter findings.
                </p>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search patient, accession, MRN..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg w-72 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Pending Orders List */}
          {pendingOrders.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center space-y-3">
              <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
              <div className="font-bold text-slate-700 text-base">All Pending Lab Tests Completed!</div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No orders waiting on the bench. As soon as Cashier Bilal Khan registers a new patient order, it will immediately appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingOrders.map((order) => {
                const isUrgent = order.priority === 'STAT' || order.priority === 'URGENT';

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 sm:p-5 hover:border-indigo-400 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    {/* Left: Patient, Accession & Tube details */}
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-indigo-900 text-sm bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-200">
                          {order.accessionNumber}
                        </span>
                        <span className="text-xs font-mono text-slate-500">
                          MRN: {order.patient.mrn}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                            order.priority === 'STAT'
                              ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                              : order.priority === 'URGENT'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {order.priority}
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                          Forwarded from Cashier
                        </span>
                      </div>

                      <div className="flex flex-wrap items-baseline gap-3">
                        <h4 className="font-black text-slate-900 text-base">
                          {order.patient.name}
                        </h4>
                        <span className="text-xs text-slate-500">
                          {order.patient.ageYears} Y • {order.patient.gender === 'M' ? 'Male' : 'Female'} • Phone: {order.patient.phone}
                        </span>
                      </div>

                      {/* Required Specimen Tubes */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        <span className="text-[11px] font-semibold text-slate-600">Sample Tubes:</span>
                        {order.specimens.map((spec) => {
                          const isEdta = spec.tube === 'EDTA_K2';
                          const isSst = spec.tube === 'SST_GEL';
                          const isFluoride = spec.tube === 'SODIUM_FLUORIDE';

                          return (
                            <span
                              key={spec.id}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 ${
                                isEdta
                                  ? 'bg-purple-50 text-purple-800 border-purple-200'
                                  : isSst
                                  ? 'bg-amber-50 text-amber-900 border-amber-200'
                                  : isFluoride
                                  ? 'bg-slate-100 text-slate-800 border-slate-300'
                                  : 'bg-teal-50 text-teal-800 border-teal-200'
                              }`}
                            >
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  isEdta ? 'bg-purple-600' : isSst ? 'bg-amber-500' : isFluoride ? 'bg-slate-500' : 'bg-teal-600'
                                }`}
                              />
                              {spec.tube.replace('_', ' ')}
                            </span>
                          );
                        })}
                      </div>

                      <div className="text-xs text-slate-600">
                        <strong>Ordered Tests:</strong>{' '}
                        <span className="text-slate-900 font-medium">
                          {order.items.map((i) => i.testName).join(', ')}
                        </span>
                      </div>
                    </div>

                    {/* Right: Primary Action Button */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenTestingModal(order)}
                        className="w-full md:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
                      >
                        <Play className="w-4 h-4 fill-white" />
                        <span>Perform Test / Enter Results</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: COMPLETED ARCHIVE */}
      {activeTab === 'COMPLETED_ARCHIVE' && (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-indigo-600" />
                <span>Completed Tests Transmitted to Cashier</span>
              </h3>
              <p className="text-xs text-slate-500">
                These tests have been completed and verified on the bench. They are now visible to the Cashier for report printing.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="py-2.5 px-3">Accession #</th>
                  <th className="py-2.5 px-3">Patient</th>
                  <th className="py-2.5 px-3">Tests Done</th>
                  <th className="py-2.5 px-3">Tested By</th>
                  <th className="py-2.5 px-3">Completion Time</th>
                  <th className="py-2.5 px-3">Cashier Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {completedOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-3 font-mono font-bold text-indigo-800">{o.accessionNumber}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{o.patient.name}</td>
                    <td className="py-2.5 px-3 max-w-[220px] truncate text-slate-700" title={o.items.map((i) => i.testName).join(', ')}>
                      {o.items.map((i) => i.testName).join(', ')}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{o.testedBy || 'Usman Tariq (Lab Assistant)'}</td>
                    <td className="py-2.5 px-3 text-slate-500">
                      {o.testedAt ? new Date(o.testedAt).toLocaleTimeString('en-GB') : 'Today'}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Available for Cashier Print
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TEST EXECUTION MODAL (Lab Assistant enters analyte results) */}
      {selectedOrderForTesting && (
        <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-300 flex flex-col max-h-[92vh] overflow-hidden">
            {/* Header */}
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2">
                  <Microscope className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-black text-sm">
                    Analytical Bench — {selectedOrderForTesting.accessionNumber}
                  </h3>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-500/30 text-indigo-300 rounded border border-indigo-400/30">
                    {selectedOrderForTesting.priority}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Patient: <strong className="text-white">{selectedOrderForTesting.patient.name}</strong> ({selectedOrderForTesting.patient.ageYears}Y / {selectedOrderForTesting.patient.gender}) • Ref: {selectedOrderForTesting.referringDoctor}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* 1-Click Auto Fill Button */}
                <button
                  type="button"
                  onClick={handleAutoFillAnalyzer}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow transition cursor-pointer"
                  title="Automatically populate calibrated normal analyzer values for all parameters"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Auto-Fill Analyzer Values</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedOrderForTesting(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-md transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content Body: Analytes per test */}
            <div className="p-6 overflow-y-auto space-y-6 bg-slate-50">
              {selectedOrderForTesting.items.map((item) => {
                const catItem = CLINICAL_CATALOG.find((c) => c.id === item.testId || c.code === item.testCode);
                const components = catItem?.components || [];

                return (
                  <div key={item.id} className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-2">
                      <div>
                        <span className="text-sm font-black text-slate-900">{item.testName}</span>
                        <span className="ml-2 font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">
                          {item.testCode}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500">
                        Dept: <strong className="text-indigo-800">{item.department}</strong>
                      </span>
                    </div>

                    {/* Analyte Inputs Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {components.map((comp) => {
                        const val = activeResults[item.id]?.[comp.key] ?? '';
                        const ref = comp.refIntervals[0];
                        const refText = ref ? `${ref.low ?? ''} - ${ref.high ?? ''} ${ref.unit}` : 'Normal';

                        return (
                          <div key={comp.key} className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="font-bold text-slate-800">{comp.name}</span>
                              <span className="text-slate-500 text-[10px]">{comp.unit}</span>
                            </div>

                            <input
                              type={comp.dataType === 'NUMERIC' ? 'number' : 'text'}
                              step="any"
                              value={val}
                              onChange={(e) => {
                                const newVal = e.target.value;
                                setActiveResults((prev) => ({
                                  ...prev,
                                  [item.id]: {
                                    ...(prev[item.id] || {}),
                                    [comp.key]: newVal,
                                  },
                                }));
                              }}
                              placeholder={`e.g. ${comp.defaultValue ?? ''}`}
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono font-bold text-slate-900 focus:ring-1 focus:ring-indigo-500"
                            />

                            <div className="text-[10px] text-slate-500 flex justify-between">
                              <span>Ref: {refText}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Bench Notes & Instrument */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Performing Analyzer / Bench:
                    </label>
                    <input
                      type="text"
                      value={instrumentId}
                      onChange={(e) => setInstrumentId(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded font-medium text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Lab Assistant Notes:
                    </label>
                    <input
                      type="text"
                      value={techNotes}
                      onChange={(e) => setTechNotes(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded font-medium text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-slate-500">
                Operating Staff: <strong className="text-slate-800">Usman Tariq (Lab Assistant)</strong>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedOrderForTesting(null)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleCompleteAndForward}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-md transition cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Complete Test & Forward to Cashier</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
