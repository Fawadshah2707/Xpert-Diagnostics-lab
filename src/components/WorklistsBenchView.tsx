/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Microscope,
  Cpu,
  CheckCircle,
  AlertTriangle,
  FileCheck,
  RefreshCw,
  Search,
  ChevronDown,
  ChevronUp,
  FileText,
  BadgeAlert,
} from 'lucide-react';
import {
  DepartmentId,
  LabOrder,
  OrderItem,
  UserRole,
  FlagType,
} from '../types/lis';
import { CLINICAL_CATALOG } from '../data/clinicalCatalog';
import { evaluateReferenceInterval, canTransitionResult, parseAnalyzerOutput } from '../utils/lisLogic';

interface WorklistsBenchViewProps {
  orders: LabOrder[];
  currentRole: UserRole;
  isQcFailed: boolean;
  onUpdateItemResults: (
    orderId: string,
    itemId: string,
    results: OrderItem['results'],
    microbiologyData?: OrderItem['microbiologyData'],
    techNotes?: string
  ) => void;
  onPerformTechnicalVerification: (orderId: string, itemId: string) => void;
  isUrduEnabled: boolean;
}

export const WorklistsBenchView: React.FC<WorklistsBenchViewProps> = ({
  orders,
  currentRole,
  isQcFailed,
  onUpdateItemResults,
  onPerformTechnicalVerification,
  isUrduEnabled,
}) => {
  const [selectedDept, setSelectedDept] = useState<DepartmentId | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  // Local draft results for active editing
  const [draftValues, setDraftValues] = useState<Record<string, Record<string, string | number>>>({});
  const [draftTechNotes, setDraftTechNotes] = useState<Record<string, string>>({});

  const departments: { id: DepartmentId | 'ALL'; label: string }[] = [
    { id: 'ALL', label: 'All Departments' },
    { id: 'HEMATOLOGY', label: 'Hematology (Sysmex)' },
    { id: 'CHEMISTRY', label: 'Clinical Chemistry (Cobas)' },
    { id: 'CLINICAL_PATHOLOGY', label: 'Urinalysis / Fluids' },
    { id: 'SEROLOGY', label: 'Serology / Immunology' },
    { id: 'MICROBIOLOGY', label: 'Microbiology & AST' },
    { id: 'COAGULATION', label: 'Coagulation (PT/INR)' },
    { id: 'HISTOPATHOLOGY', label: 'Histopathology' },
    { id: 'ENDOCRINOLOGY', label: 'Endocrinology' },
    { id: 'REFERRAL', label: 'Referral Outsourced' },
  ];

  // Flatten items with order context
  const allBenchItems = orders.flatMap((order) =>
    order.items.map((item) => ({
      order,
      item,
      catalogTest: CLINICAL_CATALOG.find((t) => t.id === item.testId),
    }))
  );

  const filteredItems = allBenchItems.filter(({ order, item }) => {
    const matchesDept = selectedDept === 'ALL' || item.department === selectedDept;
    const matchesSearch =
      searchQuery === '' ||
      order.patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.accessionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.testName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesSearch;
  });

  const getFieldValue = (itemId: string, key: string, defaultValue?: string | number) => {
    if (draftValues[itemId] && draftValues[itemId][key] !== undefined) {
      return draftValues[itemId][key];
    }
    // Check if item already has results
    const item = allBenchItems.find((b) => b.item.id === itemId)?.item;
    if (item && item.results[key] && item.results[key].value !== undefined) {
      return item.results[key].value;
    }
    return defaultValue !== undefined ? defaultValue : '';
  };

  const handleFieldChange = (itemId: string, key: string, val: string | number) => {
    setDraftValues((prev) => ({
      ...prev,
      [itemId]: {
        ...(prev[itemId] || {}),
        [key]: val,
      },
    }));
  };

  // Analyzer Simulation Trigger
  const handleSimulateAnalyzerImport = (order: LabOrder, item: OrderItem) => {
    const catalog = CLINICAL_CATALOG.find((t) => t.id === item.testId);
    if (!catalog) return;

    let simulatedRaw = '';
    if (catalog.id === 'CBC_001') {
      simulatedRaw = `
# Sysmex XN-1000 Automated Hematology Output
HGB,13.8,g/dL
WBC,6.9,x10^3/uL
RBC,4.72,x10^6/uL
HCT,41.2,%
MCV,87.3,fL
PLT,215,x10^3/uL
NEUT,64,%
LYMPH,28,%
EOS,3,%
      `;
    } else if (catalog.id === 'LFT_003') {
      simulatedRaw = `
# Roche Cobas c311 Photometric Analyzer Output
TBIL,0.85,mg/dL
ALT,31,U/L
AST,26,U/L
ALP,105,U/L
TP,7.3,g/dL
ALB,4.4,g/dL
      `;
    } else if (catalog.id === 'GLU_005') {
      simulatedRaw = `
# Hexokinase Enzymatic Run
FBS,96,mg/dL
      `;
    } else {
      // Default fill from catalog defaults
      const autoVals: Record<string, number | string> = {};
      catalog.components.forEach((c) => {
        if (c.defaultValue !== undefined) {
          autoVals[c.key] = c.defaultValue;
        }
      });
      setDraftValues((prev) => ({
        ...prev,
        [item.id]: autoVals,
      }));
      return;
    }

    const parsed = parseAnalyzerOutput(simulatedRaw);
    setDraftValues((prev) => ({
      ...prev,
      [item.id]: {
        ...(prev[item.id] || {}),
        ...parsed,
      },
    }));
  };

  const handleSaveAndVerify = (order: LabOrder, item: OrderItem) => {
    const catalog = CLINICAL_CATALOG.find((t) => t.id === item.testId);
    if (!catalog) return;

    // Build results object with flag evaluations
    const updatedResults: OrderItem['results'] = {};

    catalog.components.forEach((comp) => {
      const val = getFieldValue(item.id, comp.key, comp.defaultValue);
      const evalRes = evaluateReferenceInterval(
        val,
        order.patient.gender as 'M' | 'F',
        order.patient.ageYears,
        comp.refIntervals
      );

      updatedResults[comp.key] = {
        value: val,
        flag: evalRes.flag,
        unit: comp.unit,
        refRangeText: evalRes.refRangeText,
        instrumentId: catalog.methodology.split('(')[1]?.replace(')', '') || 'Manual Bench',
        techNotes: draftTechNotes[item.id] || '',
      };
    });

    onUpdateItemResults(
      order.id,
      item.id,
      updatedResults,
      item.microbiologyData,
      draftTechNotes[item.id]
    );

    // Transition to technical verified
    onPerformTechnicalVerification(order.id, item.id);
  };

  const getFlagBadge = (flag: FlagType) => {
    switch (flag) {
      case 'CRITICAL_LOW':
      case 'CRITICAL_HIGH':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white animate-pulse">
            CRITICAL
          </span>
        );
      case 'LOW':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
            LOW [L]
          </span>
        );
      case 'HIGH':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
            HIGH [H]
          </span>
        );
      case 'ABNORMAL':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white">
            ABNORMAL
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700">
            NORMAL
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Filter */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Microscope className="w-5 h-5 text-teal-600" />
              Departmental Worklists & Analytical Bench
            </h2>
            <p className="text-xs text-slate-500">
              Direct Analyzer Interface Simulator • Real-time Age/Gender Reference Range Flagging • First-Tier Technical Verification
            </p>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search patient, accession, or test..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        {/* Department Filter Tabs */}
        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
          {departments.map((d) => (
            <button
              key={d.id}
              onClick={() => setSelectedDept(d.id)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                selectedDept === d.id
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* QC Warning Banner if QC Failed */}
      {isQcFailed && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-3 text-rose-900 text-xs font-semibold">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <div>
            <strong>QC ALERT / TESTING HOLD ACTIVE:</strong> Active internal quality control run in this department
            has triggered a Westgard rule violation (1-3s). Result verification is locked until corrective action is documented.
          </div>
        </div>
      )}

      {/* Bench Items List */}
      <div className="space-y-4">
        {filteredItems.map(({ order, item, catalogTest }) => {
          if (!catalogTest) return null;
          const isExpanded = expandedItemId === item.id || filteredItems.length === 1;

          return (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
            >
              {/* Item Summary Bar */}
              <div
                onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                className="p-4 bg-slate-50 hover:bg-slate-100/70 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-slate-900">{catalogTest.name}</span>
                    <span className="text-xs px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md font-mono">
                      {item.testCode}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-teal-100 text-teal-800 rounded font-semibold">
                      {item.department}
                    </span>
                    {order.priority === 'STAT' && (
                      <span className="text-xs px-2 py-0.5 bg-rose-600 text-white rounded font-bold animate-pulse">
                        STAT
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex items-center space-x-3">
                    <span>
                      Patient: <strong className="text-slate-800">{order.patient.name}</strong> ({order.patient.ageYears}Y / {order.patient.gender})
                    </span>
                    <span>•</span>
                    <span>Accession: <strong className="text-teal-900 font-mono">{order.accessionNumber}</strong></span>
                    <span>•</span>
                    <span>Specimen: {catalogTest.tube.replace('_', ' ')}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${
                      item.status === 'RELEASED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : item.status === 'TECHNICAL_VERIFIED'
                        ? 'bg-purple-100 text-purple-800'
                        : item.status === 'ENTERED'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {item.status.replace(/_/g, ' ')}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  )}
                </div>
              </div>

              {/* Expanded Result Entry Sheet */}
              {isExpanded && (
                <div className="p-5 space-y-5 bg-white">
                  {/* Actions Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div className="text-xs text-slate-600">
                      Methodology: <strong className="text-slate-800">{catalogTest.methodology}</strong>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => handleSimulateAnalyzerImport(order, item)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-xs transition"
                      >
                        <Cpu className="w-3.5 h-3.5" />
                        Simulate Analyzer Import (ASTM / CSV)
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSaveAndVerify(order, item)}
                        disabled={isQcFailed || item.status === 'RELEASED'}
                        className={`px-4 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 shadow-sm transition ${
                          isQcFailed || item.status === 'RELEASED'
                            ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                            : 'bg-teal-600 hover:bg-teal-700 text-white'
                        }`}
                      >
                        <CheckCircle className="w-4 h-4" />
                        First-Tier Technical Verification
                      </button>
                    </div>
                  </div>

                  {/* Standard Analytes Table */}
                  {catalogTest.components.length > 0 && catalogTest.components[0].dataType !== 'MICROBIOLOGY_AST' && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                            <th className="p-2.5">Investigation / Analyte</th>
                            <th className="p-2.5 w-44">Observed Result</th>
                            <th className="p-2.5 w-24">Unit</th>
                            <th className="p-2.5">Biological Reference Interval</th>
                            <th className="p-2.5 w-32">Flag Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {catalogTest.components.map((comp) => {
                            const currentVal = getFieldValue(item.id, comp.key, comp.defaultValue);
                            const evalRes = evaluateReferenceInterval(
                              currentVal,
                              order.patient.gender as 'M' | 'F',
                              order.patient.ageYears,
                              comp.refIntervals
                            );

                            return (
                              <tr key={comp.key} className="hover:bg-slate-50/60">
                                <td className="p-2.5 font-semibold text-slate-800">
                                  {comp.name}
                                </td>
                                <td className="p-2.5">
                                  {comp.dataType === 'SELECT' && comp.options ? (
                                    <select
                                      value={String(currentVal)}
                                      onChange={(e) => handleFieldChange(item.id, comp.key, e.target.value)}
                                      className="w-full px-2 py-1 border border-slate-300 rounded font-medium text-slate-800"
                                    >
                                      {comp.options.map((opt) => (
                                        <option key={opt} value={opt}>
                                          {opt}
                                        </option>
                                      ))}
                                    </select>
                                  ) : comp.dataType === 'TEXT' ? (
                                    <textarea
                                      rows={2}
                                      value={String(currentVal)}
                                      onChange={(e) => handleFieldChange(item.id, comp.key, e.target.value)}
                                      className="w-full px-2 py-1 border border-slate-300 rounded font-mono text-xs"
                                    />
                                  ) : (
                                    <input
                                      type="number"
                                      step={comp.decimalPlaces ? 1 / 10 ** comp.decimalPlaces : 0.1}
                                      value={currentVal}
                                      onChange={(e) => handleFieldChange(item.id, comp.key, e.target.value)}
                                      className="w-full px-2.5 py-1 border border-slate-300 rounded font-bold text-slate-900 focus:ring-2 focus:ring-teal-500"
                                    />
                                  )}
                                </td>
                                <td className="p-2.5 text-slate-500 font-medium">{comp.unit}</td>
                                <td className="p-2.5 text-slate-600 font-mono text-[11px]">
                                  {evalRes.refRangeText}
                                </td>
                                <td className="p-2.5">{getFlagBadge(evalRes.flag)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Microbiology Culture & AST Specialized Table */}
                  {item.microbiologyData && (
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                      <div className="font-bold text-xs text-slate-800 flex items-center justify-between">
                        <span>Antimicrobial Susceptibility Testing (AST - Kirby-Bauer Disk Diffusion):</span>
                        <span className="text-[11px] text-teal-700">CLSI M100 Performance Standards</span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <label className="text-slate-600 font-medium">Organism Isolated:</label>
                          <div className="font-bold text-slate-900 italic">
                            {item.microbiologyData.organismIsolated}
                          </div>
                        </div>
                        <div>
                          <label className="text-slate-600 font-medium">Colony Count:</label>
                          <div className="font-bold text-slate-900">
                            {item.microbiologyData.colonyCount}
                          </div>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left bg-white border border-slate-200 rounded">
                          <thead>
                            <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                              <th className="p-2">Antimicrobial Agent</th>
                              <th className="p-2">Zone Diameter (mm)</th>
                              <th className="p-2">CLSI Interpretation</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {item.microbiologyData.antibioticSensitivities.map((ast, idx) => (
                              <tr key={idx}>
                                <td className="p-2 font-medium text-slate-800">{ast.antibiotic}</td>
                                <td className="p-2 font-mono">{ast.zoneMm} mm</td>
                                <td className="p-2">
                                  <span
                                    className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                                      ast.interpretation === 'SENSITIVE'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : ast.interpretation === 'INTERMEDIATE'
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-rose-100 text-rose-800'
                                    }`}
                                  >
                                    {ast.interpretation}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Technologist Notes */}
                  <div>
                    <label className="block text-slate-700 font-medium text-xs mb-1">
                      Technologist Bench Remarks / Slide Morphology
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Platelet count verified by manual counting chamber. No clumping seen."
                      value={draftTechNotes[item.id] || ''}
                      onChange={(e) =>
                        setDraftTechNotes((prev) => ({ ...prev, [item.id]: e.target.value }))
                      }
                      className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs"
                    />
                  </div>

                  {item.technicalVerifiedBy && (
                    <div className="text-[11px] text-purple-700 bg-purple-50 p-2 rounded border border-purple-200 flex items-center justify-between">
                      <span>Verified by: <strong>{item.technicalVerifiedBy}</strong></span>
                      <span>{new Date(item.technicalVerifiedAt || '').toLocaleString('en-GB')}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
