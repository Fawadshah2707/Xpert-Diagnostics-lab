/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Database,
  Layers,
  ShieldCheck,
  GitBranch,
  AlertOctagon,
  FileSpreadsheet,
  CheckCircle,
  Network,
  Cpu,
} from 'lucide-react';
import { DATABASE_ENTITIES, ROLE_PERMISSIONS_MATRIX, PHC_COMPLIANCE_CHECKLIST } from '../data/dossierData';

export const ArchitectureDossierView: React.FC = () => {
  const [activeSection, setActiveSection] = useState<
    'ARCHITECTURE' | 'ER_SCHEMA' | 'ROLE_MATRIX' | 'STATE_MACHINE' | 'RISK_REGISTER' | 'COMPLIANCE'
  >('ARCHITECTURE');

  const [selectedEntityCategory, setSelectedEntityCategory] = useState<string>('ALL');

  const filteredEntities =
    selectedEntityCategory === 'ALL'
      ? DATABASE_ENTITIES
      : DATABASE_ENTITIES.filter((e) => e.category === selectedEntityCategory);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Layers className="w-5 h-5 text-teal-600" />
            System Architecture, 48-Table ER Schema & Regulatory Dossier
          </h2>
          <p className="text-xs text-slate-500">
            Section 25 Engineering Specification • Hybrid LAN/Cloud Outbox • Khyber Pakhtunkhwa Healthcare Commission (KPHCC) & ISO 15189
          </p>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex flex-wrap gap-1.5 text-xs font-semibold">
          {[
            { id: 'ARCHITECTURE', label: '1. Architecture & LAN/Cloud' },
            { id: 'ER_SCHEMA', label: '2. 48-Table ER Schema' },
            { id: 'ROLE_MATRIX', label: '3. Role-Permission Matrix' },
            { id: 'STATE_MACHINE', label: '4. Clinical State Machine' },
            { id: 'RISK_REGISTER', label: '5. Clinical Risk Register' },
            { id: 'COMPLIANCE', label: '6. PHC / ISO 15189 Matrix' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeSection === tab.id
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 1. Component Architecture & Hybrid Cloud Section */}
      {activeSection === 'ARCHITECTURE' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <Network className="w-5 h-5 text-teal-600" />
              Hybrid Local Area Network (LAN) & Cloud Sync Architecture
            </h3>

            <p className="text-xs text-slate-600 leading-relaxed">
              Diagnostic pathology laboratories in Pakistan experience frequent internet service disruptions and power grid events.
              To guarantee 100% operational continuity, Al-Shafi PLMS is architected as a <strong>Local Monolith Authoritative Node</strong> running
              on an on-premise industrial server inside the laboratory LAN, coupled with an asynchronous <strong>Transactional Outbox Pattern</strong> to
              stream audited clinical reports and billing telemetry to the central cloud repository.
            </p>

            {/* Architecture Flow Diagram */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 bg-teal-50/60 rounded-xl border border-teal-200 space-y-3">
                <div className="flex items-center space-x-2 text-teal-900 font-bold text-xs">
                  <div className="p-1.5 bg-teal-600 text-white rounded">LAN</div>
                  <span>1. Local Laboratory Server</span>
                </div>
                <ul className="text-xs text-slate-700 space-y-1.5 list-disc pl-4">
                  <li>Authoritative PostgreSQL database for all clinical and financial transactions.</li>
                  <li>Zero dependency on internet for patient registration, barcode printing, and testing.</li>
                  <li>Direct RS-232 / TCP-IP driver interfaces for Sysmex, Roche Cobas, and Mindray analyzers.</li>
                </ul>
              </div>

              <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200 space-y-3">
                <div className="flex items-center space-x-2 text-blue-900 font-bold text-xs">
                  <div className="p-1.5 bg-blue-600 text-white rounded">SYNC</div>
                  <span>2. Transactional Outbox Engine</span>
                </div>
                <ul className="text-xs text-slate-700 space-y-1.5 list-disc pl-4">
                  <li>Local business commits atomically write to <code>outbox_events</code> table.</li>
                  <li>Background sync daemon polls and batches events with exponential retry backoff.</li>
                  <li>Idempotent SHA-256 event identifiers prevent duplicate billing or result releases.</li>
                </ul>
              </div>

              <div className="p-4 bg-purple-50/60 rounded-xl border border-purple-200 space-y-3">
                <div className="flex items-center space-x-2 text-purple-900 font-bold text-xs">
                  <div className="p-1.5 bg-purple-600 text-white rounded">CLOUD</div>
                  <span>3. Secured Cloud Repository</span>
                </div>
                <ul className="text-xs text-slate-700 space-y-1.5 list-disc pl-4">
                  <li>Encrypted off-site disaster recovery backups (AES-256).</li>
                  <li>Online Patient & Referring Physician Report Verification Portal (QR Code).</li>
                  <li>Reference lab electronic data interchange (Chughtai, SKMCH, Shifa integrations).</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. 48-Table ER Schema Dictionary */}
      {activeSection === 'ER_SCHEMA' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Database className="w-4 h-4 text-teal-600" />
                  Normalized PostgreSQL Schema Dictionary ({DATABASE_ENTITIES.length} Entities)
                </h3>
                <p className="text-xs text-slate-500">
                  Meets Section 19 relational integrity constraints: UUID PKs, versioned clinical rules, and immutable audit events
                </p>
              </div>

              <div className="flex flex-wrap gap-1 text-xs">
                {['ALL', 'CORE_IDENTITY', 'CLINICAL', 'OPERATIONS', 'QUALITY', 'FINANCE', 'SYSTEM'].map(
                  (cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedEntityCategory(cat)}
                      className={`px-2.5 py-1 rounded transition text-[11px] font-semibold ${
                        selectedEntityCategory === cat
                          ? 'bg-slate-800 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredEntities.map((ent) => (
                <div
                  key={ent.name}
                  className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-2 hover:border-slate-300 transition"
                >
                  <div className="flex justify-between items-start">
                    <span className="font-mono font-bold text-slate-900 text-sm">{ent.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-semibold">
                      {ent.category}
                    </span>
                  </div>

                  <p className="text-slate-600 text-[11px]">{ent.description}</p>

                  <div className="border-t border-slate-200 pt-1.5 space-y-0.5">
                    <div className="font-semibold text-slate-700 text-[10px]">Key Fields:</div>
                    <div className="font-mono text-[10px] text-teal-800 truncate">
                      {ent.keyFields.join(' | ')}
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-1 space-y-0.5">
                    <div className="font-semibold text-slate-700 text-[10px]">Foreign Keys / Rel:</div>
                    <div className="text-[10px] text-slate-500">
                      {ent.relationships.join(', ')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. Role-Permission Matrix */}
      {activeSection === 'ROLE_MATRIX' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              Role-Based Access Control (RBAC) & Privilege Separation Matrix
            </h3>
            <p className="text-xs text-slate-500">
              Strictly enforces segregation of duties: Technicians cannot authorize their own results, and cashiers cannot release clinical reports.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                  <th className="p-3 w-48">Role Identifier</th>
                  <th className="p-3 w-64">Designation / Profile</th>
                  <th className="p-3">Clinical & Administrative Responsibilities</th>
                  <th className="p-3">Authorized Permissions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ROLE_PERMISSIONS_MATRIX.map((r) => (
                  <tr key={r.role} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-teal-900">{r.role}</td>
                    <td className="p-3 font-semibold text-slate-800">{r.title}</td>
                    <td className="p-3 text-slate-600">{r.desc}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {r.permissions.map((p) => (
                          <span
                            key={p}
                            className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-medium"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Clinical State Machine */}
      {activeSection === 'STATE_MACHINE' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-teal-600" />
              Laboratory Order & Diagnostic Result State-Transition Map
            </h3>
            <p className="text-xs text-slate-500">
              Dual-stage authorization engine preventing premature report release
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="font-bold text-slate-800">
                A. Standard In-House Diagnostic Workflow Transition Path:
              </div>
              <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
                <span className="px-3 py-1.5 bg-slate-200 rounded font-bold">1. DRAFT</span>
                <span>→</span>
                <span className="px-3 py-1.5 bg-blue-100 text-blue-900 rounded font-bold">
                  2. ENTERED (Technologist)
                </span>
                <span>→</span>
                <span className="px-3 py-1.5 bg-purple-100 text-purple-900 rounded font-bold">
                  3. TECHNICAL_VERIFIED (Supervisor)
                </span>
                <span>→</span>
                <span className="px-3 py-1.5 bg-amber-100 text-amber-900 rounded font-bold">
                  4. CLINICALLY_AUTHORIZED (Pathologist)
                </span>
                <span>→</span>
                <span className="px-3 py-1.5 bg-emerald-600 text-white rounded font-bold">
                  5. RELEASED (Print Ready)
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="font-bold text-slate-800">
                B. External Referral / Outsourced Specimen Pathway:
              </div>
              <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
                <span className="px-3 py-1.5 bg-slate-200 rounded font-bold">COLLECTED</span>
                <span>→</span>
                <span className="px-3 py-1.5 bg-purple-100 text-purple-900 rounded font-bold">
                  DISPATCHED (Cold Chain Manifest)
                </span>
                <span>→</span>
                <span className="px-3 py-1.5 bg-blue-100 text-blue-900 rounded font-bold">
                  RECEIVED_BY_REF_LAB
                </span>
                <span>→</span>
                <span className="px-3 py-1.5 bg-emerald-100 text-emerald-900 rounded font-bold">
                  RESULT_INGESTED & RELEASED
                </span>
              </div>
            </div>

            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-xs">
                <AlertOctagon className="w-4 h-4 text-rose-600" />
                Hard Gate Rules Enforced by LIS Engine:
              </div>
              <ul className="list-disc pl-5 space-y-1 text-[11px] text-rose-800">
                <li>No direct jump from <code>ENTERED</code> to <code>RELEASED</code> without documented first-tier technical verification.</li>
                <li>Failed internal quality control (Westgard 1-3s, 2-2s, R-4s) strictly locks technical verification.</li>
                <li>Critical findings (Platelets &lt; 30k, K+ &gt; 6.2) block clinical release until telephonic read-back communication is recorded.</li>
                <li>Released reports are immutable; revisions require an amended report with preservation of prior snapshots.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 5. Clinical Risk Register */}
      {activeSection === 'RISK_REGISTER' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-rose-600" />
              Clinical Configuration Risk Register & Mitigation Strategy
            </h3>
            <p className="text-xs text-slate-500">Pre-analytical, analytical, and post-analytical risk controls</p>
          </div>

          <div className="space-y-3 text-xs">
            {[
              {
                phase: 'Pre-Analytical',
                risk: 'Sample mix-up or tube misidentification during phlebotomy',
                severity: 'CRITICAL',
                mitigation: 'System generates unique accession barcode at the phlebotomy chair before venipuncture. Tube label includes patient name, MRN, and color-coded cap indicators.',
              },
              {
                phase: 'Pre-Analytical',
                risk: 'Testing on hemolyzed, clotted, or insufficient quantity (QNS) specimen',
                severity: 'HIGH',
                mitigation: 'Mandatory specimen receiving check in LIS. Rejection reasons prompt immediate automatic recollection order without duplicate billing.',
              },
              {
                phase: 'Analytical',
                risk: 'Analyzer optical drift or reagent degradation producing skewed values',
                severity: 'CRITICAL',
                mitigation: 'Automated Westgard multirule engine (1-2s warning, 1-3s reject). Testing hold automatically locks verification if QC run is out of control.',
              },
              {
                phase: 'Post-Analytical',
                risk: 'Delayed notification of life-threatening critical results to clinician',
                severity: 'CRITICAL',
                mitigation: 'Critical alert queue with statutory telephonic read-back confirmation logger. Report release is blocked until clinician acknowledgment is documented.',
              },
              {
                phase: 'Post-Analytical',
                risk: 'Silent modification of released diagnostic reports',
                severity: 'HIGH',
                mitigation: 'Released reports are cryptographically locked. Any addendum or correction generates a versioned amended report with full audit trail.',
              },
            ].map((r, idx) => (
              <div key={idx} className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800 text-xs">{r.phase}: {r.risk}</span>
                  <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-rose-100 text-rose-800">
                    {r.severity}
                  </span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  <strong>Mitigation Control:</strong> {r.mitigation}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Khyber Pakhtunkhwa Healthcare Commission (KPHCC) & ISO 15189 Matrix */}
      {activeSection === 'COMPLIANCE' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              Khyber Pakhtunkhwa Healthcare Commission (KPHCC) & ISO 15189:2022 Traceability Matrix
            </h3>
            <p className="text-xs text-slate-500">
              Statutory verification criteria for clinical pathology laboratories in Khyber Pakhtunkhwa (Mardan Division)
            </p>
          </div>

          <div className="space-y-3">
            {PHC_COMPLIANCE_CHECKLIST.map((c, idx) => (
              <div
                key={idx}
                className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-bold text-slate-900 text-sm">{c.standard}</span>
                    <span className="text-[11px] text-slate-500 block">{c.clause}</span>
                  </div>
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px]">
                    {c.status}
                  </span>
                </div>
                <p className="text-slate-600 text-[11px] mt-1">{c.details}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
