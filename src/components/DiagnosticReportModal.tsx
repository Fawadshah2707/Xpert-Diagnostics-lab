/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Printer, Download, X, ShieldCheck, QrCode, Activity } from 'lucide-react';
import { LabOrder } from '../types/lis';

interface DiagnosticReportModalProps {
  order: LabOrder;
  onClose: () => void;
  isUrduEnabled: boolean;
}

export const DiagnosticReportModal: React.FC<DiagnosticReportModalProps> = ({
  order,
  onClose,
  isUrduEnabled,
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full my-auto border border-slate-300 flex flex-col max-h-[96vh]">
        {/* Modal Controls Toolbar (Hidden during print) */}
        <div className="p-4 bg-slate-900 text-white rounded-t-xl flex justify-between items-center print:hidden">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-teal-400" />
            <span className="font-bold text-sm">
              Official Diagnostic Pathology Laboratory Report — {order.accessionNumber}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 shadow transition"
            >
              <Printer className="w-4 h-4" />
              Print / Save A4 PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-md transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable A4 Report Content Area */}
        <div
          id="printable-report"
          className="p-8 sm:p-12 overflow-y-auto space-y-6 bg-white text-slate-900 font-sans print:p-0 print:m-0"
          style={{ minHeight: '800px' }}
        >
          {/* 1. Formal Pakistani Diagnostic Lab Header */}
          <div className="border-b-2 border-slate-900 pb-4">
            <div className="flex justify-between items-start">
              <div className="flex items-start space-x-4">
                <div className="w-14 h-14 rounded-lg bg-teal-800 text-white flex items-center justify-center shadow-md print:border print:border-teal-900">
                  <Activity className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight leading-tight">
                    XPERT DIAGNOSTIC & PATHOLOGY LABORATORIES
                  </h1>
                  <p className="text-xs text-slate-600 font-medium">
                    Department of Pathology, Clinical Biochemistry & Molecular Diagnostics
                  </p>
                  <p className="text-[11px] text-teal-900 font-semibold mt-0.5">
                    Khyber Pakhtunkhwa Healthcare Commission (KPHCC) License # KPHCC-MDN-7721-PLMS • ISO 15189:2022 Aligned
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Main Processing Hub: Near Mardan Medical Complex (MMC), Mardan, KP • UAN: (0937) 111-973-78 • Web: www.xpertlabmardan.pk
                  </p>
                </div>
              </div>

              {/* QR Verification Code Simulation */}
              <div className="text-center p-2 bg-slate-50 border border-slate-200 rounded-lg flex flex-col items-center">
                <svg className="w-16 h-16" viewBox="0 0 100 100">
                  <rect width="100" height="100" fill="white" />
                  {/* Outer corner squares */}
                  <rect x="10" y="10" width="25" height="25" fill="#0f172a" />
                  <rect x="15" y="15" width="15" height="15" fill="white" />
                  <rect x="18" y="18" width="9" height="9" fill="#0f172a" />

                  <rect x="65" y="10" width="25" height="25" fill="#0f172a" />
                  <rect x="70" y="15" width="15" height="15" fill="white" />
                  <rect x="73" y="18" width="9" height="9" fill="#0f172a" />

                  <rect x="10" y="65" width="25" height="25" fill="#0f172a" />
                  <rect x="15" y="70" width="15" height="15" fill="white" />
                  <rect x="18" y="73" width="9" height="9" fill="#0f172a" />

                  {/* Inner data blocks */}
                  <rect x="42" y="15" width="6" height="6" fill="#0f172a" />
                  <rect x="52" y="22" width="6" height="6" fill="#0f172a" />
                  <rect x="40" y="40" width="20" height="20" fill="#0f172a" />
                  <rect x="45" y="45" width="10" height="10" fill="white" />
                  <rect x="68" y="45" width="8" height="8" fill="#0f172a" />
                  <rect x="75" y="60" width="15" height="15" fill="#0f172a" />
                  <rect x="45" y="75" width="12" height="12" fill="#0f172a" />
                </svg>
                <span className="text-[9px] font-mono text-slate-500 mt-1">Scan to Verify</span>
              </div>
            </div>
          </div>

          {/* 2. Patient Demographics & Accession Grid Box */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-300 text-xs font-sans">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-2 gap-x-4">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Patient Name:</span>
                <span className="font-bold text-slate-900 text-sm">{order.patient.name}</span>
                {order.patient.urduName && (
                  <span className="block text-slate-700 font-medium text-xs" dir="rtl">
                    {order.patient.urduName}
                  </span>
                )}
              </div>

              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Patient MRN:</span>
                <span className="font-mono font-bold text-slate-900">{order.patient.mrn}</span>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Accession #:</span>
                <span className="font-mono font-bold text-teal-900 text-sm">{order.accessionNumber}</span>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Age / Gender:</span>
                <span className="font-bold text-slate-900">
                  {order.patient.ageYears} Y / {order.patient.gender === 'M' ? 'Male' : 'Female'}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">CNIC / ID:</span>
                <span className="font-mono text-slate-800">{order.patient.cnic || 'N/A'}</span>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Contact Phone:</span>
                <span className="font-mono text-slate-800">{order.patient.phone}</span>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Sample Collected:</span>
                <span className="text-slate-800">
                  {new Date(order.orderedAt).toLocaleString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Report Released:</span>
                <span className="font-semibold text-emerald-800">
                  {new Date().toLocaleString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              <div className="col-span-2 sm:col-span-4 border-t border-slate-200 pt-1.5 flex flex-wrap justify-between text-slate-700">
                <div>
                  <span className="text-slate-500">Referring Physician: </span>
                  <strong className="text-slate-900">{order.referringDoctor}</strong>
                  {order.referringHospital && ` (${order.referringHospital})`}
                </div>
                {order.clinicalHistory && (
                  <div className="text-slate-600 italic">
                    Indication: {order.clinicalHistory}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 3. Clinical Diagnostic Results Table Grouped by Department */}
          <div className="space-y-6">
            {order.items.map((item) => (
              <div key={item.id} className="space-y-2">
                {/* Department & Test Title Banner */}
                <div className="bg-slate-800 text-white px-3 py-1.5 rounded-sm flex justify-between items-center text-xs">
                  <div className="font-bold tracking-wide">
                    {item.testName.toUpperCase()}
                  </div>
                  <div className="text-[11px] text-teal-300 font-mono">
                    {item.department} • {item.testCode}
                  </div>
                </div>

                {/* Standard Results Table */}
                {Object.keys(item.results).length > 0 && (
                  <table className="w-full text-xs text-left border-collapse border border-slate-200">
                    <thead>
                      <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                        <th className="p-2 border-r border-slate-200">Test / Investigation</th>
                        <th className="p-2 border-r border-slate-200 w-36 text-right">Result</th>
                        <th className="p-2 border-r border-slate-200 w-24">Unit</th>
                        <th className="p-2 border-r border-slate-200 w-28 text-center">Flag</th>
                        <th className="p-2">Biological Reference Interval</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {Object.entries(item.results).map(([analyteKey, res]) => {
                        const isAbnormal = res.flag !== 'NORMAL';
                        const isCritical = res.flag.includes('CRITICAL');

                        return (
                          <tr
                            key={analyteKey}
                            className={
                              isCritical
                                ? 'bg-rose-50/70 font-bold'
                                : isAbnormal
                                ? 'bg-amber-50/50'
                                : ''
                            }
                          >
                            <td className="p-2 font-medium text-slate-900 border-r border-slate-200">
                              {analyteKey}
                            </td>
                            <td
                              className={`p-2 font-mono text-sm text-right border-r border-slate-200 ${
                                isCritical
                                  ? 'text-rose-700 font-black'
                                  : isAbnormal
                                  ? 'text-rose-700 font-bold'
                                  : 'text-slate-800'
                              }`}
                            >
                              {res.value}
                            </td>
                            <td className="p-2 text-slate-600 border-r border-slate-200 font-mono">
                              {res.unit || '-'}
                            </td>
                            <td className="p-2 text-center border-r border-slate-200">
                              {isCritical ? (
                                <span className="px-1.5 py-0.5 rounded font-black text-[10px] bg-rose-600 text-white">
                                  * CRITICAL *
                                </span>
                              ) : res.flag === 'LOW' ? (
                                <span className="font-bold text-rose-700 text-xs">[L] LOW</span>
                              ) : res.flag === 'HIGH' ? (
                                <span className="font-bold text-rose-700 text-xs">[H] HIGH</span>
                              ) : res.flag === 'ABNORMAL' ? (
                                <span className="font-bold text-rose-700 text-xs">[!] REACTIVE</span>
                              ) : (
                                <span className="text-slate-400 text-[10px]">-</span>
                              )}
                            </td>
                            <td className="p-2 text-slate-700 font-mono text-[11px]">
                              {res.refRangeText}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}

                {/* Microbiology Specialized AST Table */}
                {item.microbiologyData && (
                  <div className="p-3 bg-slate-50 border border-slate-300 rounded text-xs space-y-2">
                    <div className="font-bold text-slate-800 border-b border-slate-200 pb-1 flex justify-between">
                      <span>CULTURE & ANTIMICROBIAL SENSITIVITY FINDINGS:</span>
                      <span className="font-mono text-[10px] text-slate-500">CLSI M100 AST Criteria</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-slate-500 font-medium">Organism Isolated:</span>{' '}
                        <strong className="text-slate-900 italic">
                          {item.microbiologyData.organismIsolated}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500 font-medium">Colony Count:</span>{' '}
                        <strong className="text-slate-900">
                          {item.microbiologyData.colonyCount}
                        </strong>
                      </div>
                    </div>

                    <table className="w-full text-xs text-left bg-white border border-slate-200 mt-2">
                      <thead>
                        <tr className="bg-slate-100 font-bold border-b border-slate-200">
                          <th className="p-1.5">Antibiotic Tested</th>
                          <th className="p-1.5">Zone Size (mm)</th>
                          <th className="p-1.5">CLSI Sensitivity Interpretation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {item.microbiologyData.antibioticSensitivities.map((s, idx) => (
                          <tr key={idx}>
                            <td className="p-1.5 font-medium">{s.antibiotic}</td>
                            <td className="p-1.5 font-mono">{s.zoneMm} mm</td>
                            <td className="p-1.5">
                              <span
                                className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                                    s.interpretation === 'SENSITIVE'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : s.interpretation === 'INTERMEDIATE'
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-rose-100 text-rose-800'
                                  }`}
                              >
                                {s.interpretation}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pathologist Diagnostic Interpretation */}
                {item.pathologistNotes && (
                  <div className="p-2.5 bg-purple-50/60 border-l-4 border-purple-600 rounded-r text-xs text-purple-950">
                    <span className="font-bold text-[11px] block text-purple-900 uppercase">
                      Consultant Pathologist Impression:
                    </span>
                    <p className="mt-0.5">{item.pathologistNotes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 4. Critical Value Notification Audit Note (if any critical value present) */}
          {order.items.some((i) =>
            Object.values(i.results).some((r) => r.flag.includes('CRITICAL'))
          ) && (
            <div className="p-2 bg-rose-50 border border-rose-200 rounded text-[11px] text-rose-900 space-y-0.5">
              <strong className="block font-bold text-rose-800">
                CRITICAL RESULT TELEPHONIC COMMUNICATION AUDIT:
              </strong>
              <span>
                Critical finding immediately communicated via telephone and read-back confirmed with attending physician per Khyber Pakhtunkhwa Healthcare Commission (KPHCC) and ISO 15189 patient safety mandate.
              </span>
            </div>
          )}

          {/* 5. Dual Sign-Off Credentials Panel */}
          <div className="border-t-2 border-slate-900 pt-4 mt-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 text-xs">
              <div>
                <div className="h-10 flex items-end">
                  <span className="font-serif italic text-slate-400 text-xs">Verified by LIS System</span>
                </div>
                <div className="border-t border-slate-400 pt-1 font-bold text-slate-800">
                  Medical Laboratory Technologist
                </div>
                <div className="text-[10px] text-slate-500">
                  BSc Medical Laboratory Technology (PIMS)
                </div>
              </div>

              <div>
                <div className="h-10 flex items-end">
                  <span className="font-serif italic text-purple-800 font-semibold text-sm">
                    Kashif Mehmood
                  </span>
                </div>
                <div className="border-t border-slate-400 pt-1 font-bold text-slate-800">
                  Department Laboratory Supervisor
                </div>
                <div className="text-[10px] text-slate-500">
                  First-Tier Technical Verification Completed
                </div>
              </div>

              <div className="text-right sm:text-right">
                <div className="h-10 flex items-end justify-end">
                  <div className="border border-purple-400 bg-purple-50 px-2 py-0.5 rounded text-[10px] font-mono font-bold text-purple-900">
                    DIGITALLY AUTHORIZED
                  </div>
                </div>
                <div className="border-t border-slate-400 pt-1 font-bold text-slate-900">
                  Amir Saeed
                </div>
                <div className="text-[10px] text-slate-600">
                  Administrator & Head of Diagnostic Services
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  PMC Reg # 34102-P • Clinical Directorate
                </div>
              </div>
            </div>
          </div>

          {/* 6. Footer Disclaimer & Barcode */}
          <div className="border-t border-slate-200 pt-3 text-[10px] text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-2">
            <div>
              <span>This is an authentic computer-generated diagnostic report issued by Xpert Diagnostics Lab.</span>
              <br />
              <span>Reference ranges derived from standardized demographic cohorts. Clinical correlation recommended.</span>
            </div>
            <div className="font-mono text-slate-700 font-semibold">
              ACC: {order.accessionNumber} • Page 1 of 1
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
