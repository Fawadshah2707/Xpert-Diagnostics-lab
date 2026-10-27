/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  Users,
  Activity,
  DollarSign,
  Printer,
  Microscope,
  Receipt,
  FileText,
  Search,
  Filter,
  CheckCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  Settings,
  AlertCircle,
  Eye,
  Plus,
  Pencil,
  Save,
  X,
  Check,
  Layers,
} from 'lucide-react';
import {
  LabOrder,
  Patient,
  AuditEvent,
  TestCatalogItem,
  DepartmentId,
  SpecimenTube,
  ReferenceInterval,
} from '../types/lis';
import { CLINICAL_CATALOG } from '../data/clinicalCatalog';
import { ReceiptModal } from './ReceiptModal';

interface AdminWorkspaceProps {
  orders: LabOrder[];
  patients: Patient[];
  auditLogs: AuditEvent[];
  onPrintReport: (order: LabOrder) => void;
  isUrduEnabled: boolean;
  catalog?: TestCatalogItem[];
  onUpdateTestRate?: (updatedTest: TestCatalogItem) => void;
  onAddNewTest?: (newTest: TestCatalogItem) => void;
}

export const AdminWorkspace: React.FC<AdminWorkspaceProps> = ({
  orders,
  patients,
  auditLogs,
  onPrintReport,
  isUrduEnabled,
  catalog = CLINICAL_CATALOG,
  onUpdateTestRate,
  onAddNewTest,
}) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'ORDERS' | 'RATES' | 'STAFF' | 'AUDIT'>('OVERVIEW');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeReceiptOrder, setActiveReceiptOrder] = useState<LabOrder | null>(null);

  // Rate List Management State
  const [rateSearchQuery, setRateSearchQuery] = useState('');
  const [rateDeptFilter, setRateDeptFilter] = useState<string>('ALL');
  const [editingTest, setEditingTest] = useState<TestCatalogItem | null>(null);
  const [editPricePKR, setEditPricePKR] = useState<number>(0);
  const [editTurnaroundHours, setEditTurnaroundHours] = useState<number>(2);
  const [editMethodology, setEditMethodology] = useState<string>('');
  const [editName, setEditName] = useState<string>('');
  const [editUrduName, setEditUrduName] = useState<string>('');
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Add New Test Modal State
  const [isAddingNewTest, setIsAddingNewTest] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newUrduName, setNewUrduName] = useState('');
  const [newDepartment, setNewDepartment] = useState<DepartmentId>('CHEMISTRY');
  const [newSpecimenType, setNewSpecimenType] = useState('Serum (Venous Blood)');
  const [newTube, setNewTube] = useState<SpecimenTube>('SST_GEL');
  const [newPricePKR, setNewPricePKR] = useState<number>(1500);
  const [newTurnaroundHours, setNewTurnaroundHours] = useState<number>(4);
  const [newMethodology, setNewMethodology] = useState('Automated Spectrophotometry');
  const [newComponentName, setNewComponentName] = useState('Main Observation');
  const [newComponentUnit, setNewComponentUnit] = useState('mg/dL');
  const [newNormalLow, setNewNormalLow] = useState<string>('70');
  const [newNormalHigh, setNewNormalHigh] = useState<string>('110');

  // Local fallback if parent doesn't handle state
  const [internalCatalog, setInternalCatalog] = useState<TestCatalogItem[]>(catalog);

  // Keep internal catalog in sync when prop changes
  const activeCatalog = catalog || internalCatalog;

  // Financial Metrics
  const totalRevenuePKR = orders.reduce((sum, o) => sum + o.totalPKR, 0);
  const totalCollectedPKR = orders.reduce((sum, o) => sum + o.paidPKR, 0);
  const totalOutstandingPKR = orders.reduce((sum, o) => sum + o.balancePKR, 0);

  // Workflow Pipeline Counts
  const pendingLabCount = orders.filter(
    (o) =>
      o.workflowStage === 'FORWARDED_TO_LAB' ||
      o.workflowStage === 'IN_TESTING' ||
      (!o.workflowStage && o.items.some((i) => i.status === 'DRAFT' || i.status === 'ENTERED'))
  ).length;

  const readyForPrintCount = orders.filter(
    (o) =>
      o.workflowStage === 'TESTS_COMPLETED' ||
      o.workflowStage === 'READY_FOR_CASHIER_PRINT' ||
      o.workflowStage === 'REPORT_PRINTED' ||
      o.items.some((i) => i.status === 'RELEASED')
  ).length;

  // Filtered Orders
  const filteredOrders = orders.filter((o) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      o.patient.name.toLowerCase().includes(q) ||
      o.accessionNumber.toLowerCase().includes(q) ||
      o.patient.mrn.toLowerCase().includes(q) ||
      o.receiptNumber.toLowerCase().includes(q)
    );
  });

  // Filtered Catalog for Rates Tab
  const filteredCatalog = activeCatalog.filter((test) => {
    const matchesDept = rateDeptFilter === 'ALL' || test.department === rateDeptFilter;
    const q = rateSearchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      test.name.toLowerCase().includes(q) ||
      test.code.toLowerCase().includes(q) ||
      (test.urduName && test.urduName.includes(q)) ||
      test.department.toLowerCase().includes(q);
    return matchesDept && matchesSearch;
  });

  // Open Edit Rate Modal
  const handleOpenEditRate = (test: TestCatalogItem) => {
    setEditingTest(test);
    setEditPricePKR(test.pricePKR);
    setEditTurnaroundHours(test.turnaroundHours);
    setEditMethodology(test.methodology || '');
    setEditName(test.name);
    setEditUrduName(test.urduName || '');
  };

  // Submit Rate Edit
  const handleSaveRateEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTest) return;

    if (editPricePKR < 0) {
      alert('Fee cannot be negative.');
      return;
    }

    const updated: TestCatalogItem = {
      ...editingTest,
      pricePKR: editPricePKR,
      turnaroundHours: editTurnaroundHours,
      methodology: editMethodology.trim() || editingTest.methodology,
      name: editName.trim() || editingTest.name,
      urduName: editUrduName.trim() || editingTest.urduName,
    };

    if (onUpdateTestRate) {
      onUpdateTestRate(updated);
    } else {
      setInternalCatalog((prev) =>
        prev.map((t) => (t.id === updated.id ? updated : t))
      );
    }

    setEditingTest(null);
    setSuccessBanner(`Rate for ${updated.name} (${updated.code}) updated to ${updated.pricePKR.toLocaleString()} PKR.`);
    setTimeout(() => setSuccessBanner(null), 4000);
  };

  // Submit Add New Test
  const handleSaveNewTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !newName.trim()) {
      alert('Test Code and Test Name are required.');
      return;
    }

    const testId = `TEST_${Date.now()}`;
    const codeFormatted = newCode.toUpperCase().trim();

    // Check duplicate code
    if (activeCatalog.some((t) => t.code.toUpperCase() === codeFormatted)) {
      alert(`A test with code "${codeFormatted}" already exists in the catalog.`);
      return;
    }

    const lowNum = parseFloat(newNormalLow);
    const highNum = parseFloat(newNormalHigh);

    const refIntervals: ReferenceInterval[] = [
      {
        gender: 'ALL',
        low: isNaN(lowNum) ? undefined : lowNum,
        high: isNaN(highNum) ? undefined : highNum,
        unit: newComponentUnit.trim() || 'Units',
      },
    ];

    const newTestItem: TestCatalogItem = {
      id: testId,
      code: codeFormatted,
      name: newName.trim(),
      urduName: newUrduName.trim() || undefined,
      department: newDepartment,
      specimenType: newSpecimenType.trim() || 'Serum',
      tube: newTube,
      pricePKR: Math.max(0, newPricePKR),
      turnaroundHours: Math.max(1, newTurnaroundHours),
      methodology: newMethodology.trim() || 'Standard Automated Analyzer',
      components: [
        {
          key: codeFormatted.replace(/[^A-Z0-9]/g, '_').substring(0, 10) || 'RES',
          name: newComponentName.trim() || newName.trim(),
          unit: newComponentUnit.trim() || '',
          dataType: 'NUMERIC',
          defaultValue: isNaN(lowNum) ? 0 : lowNum,
          refIntervals,
        },
      ],
    };

    if (onAddNewTest) {
      onAddNewTest(newTestItem);
    } else {
      setInternalCatalog((prev) => [newTestItem, ...prev]);
    }

    setIsAddingNewTest(false);
    // Reset form
    setNewCode('');
    setNewName('');
    setNewUrduName('');
    setNewPricePKR(1500);

    setSuccessBanner(`New investigation "${newTestItem.name}" (${newTestItem.code}) added to catalog at ${newTestItem.pricePKR.toLocaleString()} PKR.`);
    setTimeout(() => setSuccessBanner(null), 4000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Admin Hero Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white rounded-xl p-5 shadow-lg border border-slate-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                ROLE: LABORATORY DIRECTOR & ADMINISTRATOR
              </span>
              <span className="text-xs text-slate-400">Amir Saeed</span>
            </div>
            <h2 className="text-xl font-black tracking-tight text-white mt-1">
              Admin Master Control & Operations Center — Xpert Diagnostics Lab
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Comprehensive governance across the 3-role clinical workflow: Cashier Registration $\rightarrow$ Lab Assistant Analytical Testing $\rightarrow$ Cashier Report Dispatch.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-center">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Total Cash Collected</div>
              <div className="text-lg font-bold text-emerald-400">{totalCollectedPKR.toLocaleString()} PKR</div>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-center">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Total Patient Orders</div>
              <div className="text-lg font-bold text-teal-400">{orders.length} Orders</div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successBanner && (
        <div className="bg-teal-900/90 border border-teal-500 text-teal-100 px-4 py-3 rounded-xl flex items-center justify-between shadow-md transition-all animate-fadeIn">
          <div className="flex items-center gap-2.5 text-xs font-medium">
            <CheckCircle className="w-4 h-4 text-teal-300 shrink-0" />
            <span>{successBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessBanner(null)}
            className="text-teal-300 hover:text-white text-xs font-bold px-2 py-0.5 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Admin Sub-Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-4 pt-2 shadow-xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-sm transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'OVERVIEW'
              ? 'border-purple-600 text-purple-700 bg-purple-50/50 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Workflow Overview & 3-Role Pipeline</span>
        </button>

        <button
          onClick={() => setActiveTab('ORDERS')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-sm transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'ORDERS'
              ? 'border-purple-600 text-purple-700 bg-purple-50/50 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>All Orders & Results ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('RATES')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-sm transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'RATES'
              ? 'border-purple-600 text-purple-700 bg-purple-50/50 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Test Catalog & Rate List ({activeCatalog.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('STAFF')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-sm transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'STAFF'
              ? 'border-purple-600 text-purple-700 bg-purple-50/50 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>3-Role Staff Management</span>
        </button>

        <button
          onClick={() => setActiveTab('AUDIT')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-sm transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'AUDIT'
              ? 'border-purple-600 text-purple-700 bg-purple-50/50 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Audit Logs ({auditLogs.length})</span>
        </button>
      </div>

      {/* TAB 1: WORKFLOW OVERVIEW & 3-ROLE STATUS */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          {/* 3-Role Pipeline Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Stage 1: Cashier Front Desk */}
            <div className="bg-white rounded-xl shadow-xs border border-teal-200 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800">
                  STAGE 1: CASHIER DESK
                </span>
                <span className="text-xs text-slate-500 font-mono">Bilal Khan</span>
              </div>
              <h3 className="font-bold text-slate-900 text-base">Booking & Billing Desk</h3>
              <p className="text-xs text-slate-600">
                Patient intake, test selection from standard rate list, cash receipt printing, and order dispatch to laboratory.
              </p>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Total Booked:</span>
                <strong className="text-teal-700 font-bold">{orders.length} Patients</strong>
              </div>
            </div>

            {/* Stage 2: Lab Assistant Bench */}
            <div className="bg-white rounded-xl shadow-xs border border-indigo-200 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">
                  STAGE 2: LAB ASSISTANT
                </span>
                <span className="text-xs text-slate-500 font-mono">Usman Tariq</span>
              </div>
              <h3 className="font-bold text-slate-900 text-base">Bench Testing & Results</h3>
              <p className="text-xs text-slate-600">
                Receives specimen tubes (EDTA, Gel, Fluoride), performs analytical runs on Sysmex & Cobas, enters results, and forwards back.
              </p>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Active at Bench:</span>
                <strong className="text-indigo-700 font-bold">{pendingLabCount} Orders</strong>
              </div>
            </div>

            {/* Stage 3: Cashier Report Dispatch */}
            <div className="bg-white rounded-xl shadow-xs border border-purple-200 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                  STAGE 3: REPORT DISPATCH
                </span>
                <span className="text-xs text-slate-500 font-mono">Cashier Terminal</span>
              </div>
              <h3 className="font-bold text-slate-900 text-base">Completed Tests & Print</h3>
              <p className="text-xs text-slate-600">
                Cashier receives finalized investigation data from Lab Assistant, verifies payment settlement, and prints A4 diagnostic report for patient.
              </p>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Ready to Print:</span>
                <strong className="text-purple-700 font-bold">{readyForPrintCount} Orders</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ALL ORDERS & RESULTS */}
      {activeTab === 'ORDERS' && (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-black text-slate-900 text-base">Master Orders & Results Registry</h3>
              <p className="text-xs text-slate-500">Complete clinical trail of all patient tests across Mardan operations.</p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search MRN, accession, patient..."
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-md bg-slate-50 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="py-2.5 px-3">Accession</th>
                  <th className="py-2.5 px-3">Patient Name & MRN</th>
                  <th className="py-2.5 px-3">Investigations</th>
                  <th className="py-2.5 px-3">3-Role Status</th>
                  <th className="py-2.5 px-3 text-right">Fee (PKR)</th>
                  <th className="py-2.5 px-3 text-right">Paid</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((o) => {
                  const isCompleted =
                    o.workflowStage === 'TESTS_COMPLETED' ||
                    o.workflowStage === 'READY_FOR_CASHIER_PRINT' ||
                    o.workflowStage === 'REPORT_PRINTED';

                  return (
                    <tr key={o.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                        {o.accessionNumber}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900">{o.patient.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {o.patient.mrn} • {o.patient.gender}/{o.patient.ageYears}y
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-800">
                          {o.items.map((i) => i.testCode).join(', ')}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[200px]">
                          {o.items.map((i) => i.testName).join(' + ')}
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        {isCompleted ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Tests Completed
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                            At Lab Bench
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                        {o.totalPKR.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-600">
                        {o.paidPKR.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right space-x-1 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setActiveReceiptOrder(o)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                          title="Print Receipt"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onPrintReport(o)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                          title="Print Diagnostic Report"
                        >
                          <Printer className="w-3 h-3" />
                          <span>Report</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: TEST CATALOG & RATES (WITH EDIT RATES & ADD NEW TEST CAPABILITIES) */}
      {activeTab === 'RATES' && (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-black text-slate-900 text-base">Standard Test Catalog & Rates (PKR)</h3>
              <p className="text-xs text-slate-500">
                Official fee schedule configured for Cashier billing in Mardan. Edit fees or add new laboratory tests.
              </p>
            </div>
            
            {/* Primary Action: Add New Test Button */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsAddingNewTest(true)}
                className="px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Test</span>
              </button>
            </div>
          </div>

          {/* Catalog Filter Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={rateSearchQuery}
                onChange={(e) => setRateSearchQuery(e.target.value)}
                placeholder="Filter by code, test name, or analyte..."
                className="w-full bg-white px-2.5 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-semibold">Department:</span>
              <select
                value={rateDeptFilter}
                onChange={(e) => setRateDeptFilter(e.target.value)}
                className="bg-white px-2.5 py-1 border border-slate-300 rounded font-medium text-slate-700 text-xs focus:ring-1 focus:ring-teal-500"
              >
                <option value="ALL">All Departments ({activeCatalog.length})</option>
                <option value="HEMATOLOGY">Hematology</option>
                <option value="CHEMISTRY">Clinical Chemistry</option>
                <option value="SEROLOGY">Serology / Immunology</option>
                <option value="CLINICAL_PATHOLOGY">Clinical Pathology</option>
                <option value="MICROBIOLOGY">Microbiology</option>
                <option value="COAGULATION">Coagulation</option>
                <option value="ENDOCRINOLOGY">Endocrinology</option>
                <option value="HISTOPATHOLOGY">Histopathology</option>
              </select>
              <span className="text-[11px] text-slate-400 font-mono ml-1">
                Showing {filteredCatalog.length} tests
              </span>
            </div>
          </div>

          {/* Test Catalog Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="py-2.5 px-3">Test Code</th>
                  <th className="py-2.5 px-3">Investigation Name</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Sample Tube</th>
                  <th className="py-2.5 px-3">Turnaround</th>
                  <th className="py-2.5 px-3 text-right">Fee (PKR)</th>
                  <th className="py-2.5 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCatalog.map((test) => (
                  <tr key={test.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-3 font-mono font-bold text-teal-800">
                      {test.code}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-900">{test.name}</div>
                      {test.urduName && (
                        <div className="text-[11px] text-slate-500 font-serif">
                          {test.urduName}
                        </div>
                      )}
                      <div className="text-[10px] text-slate-400 truncate max-w-xs">
                        {test.methodology}
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {test.department}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 font-mono">
                        {test.tube}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 font-mono">
                      {test.turnaroundHours}h
                    </td>
                    <td className="py-2.5 px-3 font-extrabold text-slate-900 text-right font-mono text-sm">
                      {test.pricePKR.toLocaleString()} PKR
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleOpenEditRate(test)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300 text-slate-700 border border-slate-300 rounded text-[11px] font-bold inline-flex items-center gap-1 transition cursor-pointer"
                        title={`Edit rate for ${test.name}`}
                      >
                        <Pencil className="w-3 h-3 text-teal-600" />
                        <span>Edit Rate</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: 3-ROLE STAFF MANAGEMENT */}
      {activeTab === 'STAFF' && (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-black text-slate-900 text-base">Authorized 3-Role Personnel Roster</h3>
            <p className="text-xs text-slate-500">Configured credentials and responsibilities for Xpert Diagnostics Lab.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Cashier Account */}
            <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-200 text-teal-800">
                  ROLE 1: CASHIER
                </span>
                <span className="text-[10px] font-bold text-emerald-600">ACTIVE</span>
              </div>
              <div className="font-black text-slate-900 text-base">Bilal Khan</div>
              <div className="text-xs text-slate-600">Front Desk & Billing Cashier</div>
              <div className="text-xs text-slate-500 pt-1 border-t border-teal-200/60 space-y-1">
                <div>• Registers patient demographics</div>
                <div>• Selects ordered tests & collects payment</div>
                <div>• Prints thermal & standard payment receipts</div>
                <div>• Forwards order to Lab Assistant</div>
                <div>• Receives completed tests & prints final report</div>
              </div>
            </div>

            {/* Lab Assistant Account */}
            <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-200 text-indigo-800">
                  ROLE 2: LAB ASSISTANT
                </span>
                <span className="text-[10px] font-bold text-emerald-600">ACTIVE</span>
              </div>
              <div className="font-black text-slate-900 text-base">Usman Tariq</div>
              <div className="text-xs text-slate-600">Laboratory Bench Technologist</div>
              <div className="text-xs text-slate-500 pt-1 border-t border-indigo-200/60 space-y-1">
                <div>• Receives incoming orders from Cashier</div>
                <div>• Inspects specimen tubes (EDTA, Gel, etc.)</div>
                <div>• Performs manual & automated tests</div>
                <div>• Enters observed analyte values</div>
                <div>• Forwards completed tests back to Cashier</div>
              </div>
            </div>

            {/* Administrator Account */}
            <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-200 text-purple-800">
                  ROLE 3: ADMINISTRATOR
                </span>
                <span className="text-[10px] font-bold text-emerald-600">ACTIVE</span>
              </div>
              <div className="font-black text-slate-900 text-base">Amir Saeed</div>
              <div className="text-xs text-slate-600">Administrator & Lab Director</div>
              <div className="text-xs text-slate-500 pt-1 border-t border-purple-200/60 space-y-1">
                <div>• Master oversight across entire laboratory</div>
                <div>• Sets test catalog fees & reference ranges</div>
                <div>• Monitors financial collections & cashier reconciliations</div>
                <div>• Audits quality control & critical results</div>
                <div>• KPHCC compliance & regulatory governance</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: AUDIT LOGS */}
      {activeTab === 'AUDIT' && (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-4">
          <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
            <div>
              <h3 className="font-black text-slate-900 text-base">Immutable Audit Trail</h3>
              <p className="text-xs text-slate-500">Every clinical action is permanently timestamped for KPHCC inspection.</p>
            </div>
            <span className="text-xs font-mono text-slate-400">Total Events: {auditLogs.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="py-2 px-3">Timestamp</th>
                  <th className="py-2 px-3">Actor & Role</th>
                  <th className="py-2 px-3">Action</th>
                  <th className="py-2 px-3">Target Entity</th>
                  <th className="py-2 px-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-2 px-3 text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-2 px-3 font-sans font-bold text-slate-800">{log.actor}</td>
                    <td className="py-2 px-3">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-600">{log.entityType} ({log.entityId})</td>
                    <td className="py-2 px-3 font-sans text-slate-600 max-w-xs truncate">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: EDIT TEST RATE MODAL */}
      {editingTest && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 space-y-5 my-auto animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-teal-600" />
                  <span>Edit Rate & Test Specifications</span>
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  {editingTest.code} · {editingTest.department}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingTest(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRateEdit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Test Fee (PKR) <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={editPricePKR}
                    onChange={(e) => setEditPricePKR(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                  <div className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">
                    PKR
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  This rate is immediately applied to all subsequent patient order bookings at the Cashier Desk.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Turnaround Time (Hours)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="168"
                    value={editTurnaroundHours}
                    onChange={(e) => setEditTurnaroundHours(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Sample Tube
                  </label>
                  <input
                    type="text"
                    disabled
                    value={editingTest.tube}
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 font-mono cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Test Name (English)
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Urdu Translation Title (Optional)
                </label>
                <input
                  type="text"
                  value={editUrduName}
                  onChange={(e) => setEditUrduName(e.target.value)}
                  placeholder="e.g. خون کا معائنہ"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 font-serif"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Methodology & Analyzer
                </label>
                <input
                  type="text"
                  value={editMethodology}
                  onChange={(e) => setEditMethodology(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingTest(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Updated Rate</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD NEW TEST MODAL */}
      {isAddingNewTest && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full p-6 border border-slate-200 space-y-5 my-auto animate-fadeIn max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Plus className="w-5 h-5 text-teal-600" />
                  <span>Add New Investigation to Catalog</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Configure a new pathology test with fee schedule and laboratory specifications.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingNewTest(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNewTest} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Test Code <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    placeholder="e.g. CHM-LIPID"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Department <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value as DepartmentId)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="HEMATOLOGY">Hematology</option>
                    <option value="CHEMISTRY">Clinical Chemistry</option>
                    <option value="SEROLOGY">Serology / Immunology</option>
                    <option value="CLINICAL_PATHOLOGY">Clinical Pathology</option>
                    <option value="MICROBIOLOGY">Microbiology</option>
                    <option value="COAGULATION">Coagulation</option>
                    <option value="ENDOCRINOLOGY">Endocrinology</option>
                    <option value="HISTOPATHOLOGY">Histopathology</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Test Name (English) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Lipid Profile (Fasting)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Urdu Translation Name (Optional)
                </label>
                <input
                  type="text"
                  value={newUrduName}
                  onChange={(e) => setNewUrduName(e.target.value)}
                  placeholder="e.g. لپڈ پروفائل معائنہ"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 font-serif"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Sample Collection Tube <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={newTube}
                    onChange={(e) => setNewTube(e.target.value as SpecimenTube)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                  >
                    <option value="EDTA_K2">EDTA_K2 (Purple)</option>
                    <option value="SST_GEL">SST_GEL (Yellow/Gold)</option>
                    <option value="SODIUM_CITRATE">SODIUM_CITRATE (Light Blue)</option>
                    <option value="SODIUM_FLUORIDE">SODIUM_FLUORIDE (Grey)</option>
                    <option value="STERILE_CUP">STERILE_CUP (Urine/Stool)</option>
                    <option value="PLAIN_RED">PLAIN_RED (Red Top)</option>
                    <option value="HEPARIN">HEPARIN (Green Top)</option>
                    <option value="SWAB_TRANSPORT">SWAB_TRANSPORT (Swab)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Specimen Material
                  </label>
                  <input
                    type="text"
                    value={newSpecimenType}
                    onChange={(e) => setNewSpecimenType(e.target.value)}
                    placeholder="e.g. Serum, Plasma, Whole Blood"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Fee (PKR) <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="50"
                      value={newPricePKR}
                      onChange={(e) => setNewPricePKR(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
                      required
                    />
                    <div className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">
                      PKR
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Turnaround (Hours)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="168"
                    value={newTurnaroundHours}
                    onChange={(e) => setNewTurnaroundHours(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Analytical Methodology
                </label>
                <input
                  type="text"
                  value={newMethodology}
                  onChange={(e) => setNewMethodology(e.target.value)}
                  placeholder="e.g. Automated CMIA, Spectrophotometry"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Primary Observation Parameter */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2.5">
                <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                  Primary Analyte & Reference Interval
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Analyte Name</label>
                    <input
                      type="text"
                      value={newComponentName}
                      onChange={(e) => setNewComponentName(e.target.value)}
                      placeholder="e.g. Total Cholesterol"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Unit of Measure</label>
                    <input
                      type="text"
                      value={newComponentUnit}
                      onChange={(e) => setNewComponentUnit(e.target.value)}
                      placeholder="e.g. mg/dL, U/L, ng/mL"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Normal Range Low</label>
                    <input
                      type="text"
                      value={newNormalLow}
                      onChange={(e) => setNewNormalLow(e.target.value)}
                      placeholder="e.g. 70"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Normal Range High</label>
                    <input
                      type="text"
                      value={newNormalHigh}
                      onChange={(e) => setNewNormalHigh(e.target.value)}
                      placeholder="e.g. 199"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddingNewTest(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Test to Catalog</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POS Thermal Receipt Modal */}
      {activeReceiptOrder && (
        <ReceiptModal
          order={activeReceiptOrder}
          onClose={() => setActiveReceiptOrder(null)}
          isUrduEnabled={isUrduEnabled}
        />
      )}
    </div>
  );
};
