/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  UserPlus,
  Receipt,
  Printer,
  CheckCircle,
  Clock,
  Search,
  Filter,
  CreditCard,
  Banknote,
  Smartphone,
  ChevronDown,
  ChevronUp,
  FileText,
  AlertCircle,
  Eye,
  Check,
  Send,
  UserCheck,
  DollarSign,
  Activity,
} from 'lucide-react';
import { LabOrder, Patient, OrderPriority, SpecimenTube, SpecimenRecord, TestCatalogItem } from '../types/lis';
import { CLINICAL_CATALOG } from '../data/clinicalCatalog';
import { generateAccessionNumber, generateMRN, calculateBilling } from '../utils/lisLogic';
import { MARDAN_DOCTORS } from '../server/seed/seedData';
import { ReceiptModal } from './ReceiptModal';

interface CashierWorkspaceProps {
  orders: LabOrder[];
  patients: Patient[];
  onOrderCreated: (newOrder: LabOrder, newPatient?: Patient) => void;
  onPrintReport: (order: LabOrder) => void;
  onUpdateOrderStatus?: (orderId: string, stage: LabOrder['workflowStage']) => void;
  isUrduEnabled: boolean;
  catalog?: TestCatalogItem[];
}

export const CashierWorkspace: React.FC<CashierWorkspaceProps> = ({
  orders,
  patients,
  onOrderCreated,
  onPrintReport,
  onUpdateOrderStatus,
  isUrduEnabled,
  catalog = CLINICAL_CATALOG,
}) => {
  const activeCatalog = catalog || CLINICAL_CATALOG;
  const [activeTab, setActiveTab] = useState<'BOOKING' | 'COMPLETED_TESTS' | 'INVOICES'>('BOOKING');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Registration Form State
  const [patientMode, setPatientMode] = useState<'NEW' | 'EXISTING'>('NEW');
  const [selectedExistingPatientId, setSelectedExistingPatientId] = useState<string>('');
  const [patientName, setPatientName] = useState('');
  const [patientUrduName, setPatientUrduName] = useState('');
  const [ageYears, setAgeYears] = useState<number>(32);
  const [gender, setGender] = useState<'M' | 'F' | 'OTHER'>('M');
  const [phone, setPhone] = useState('0300-9876543');
  const [cnic, setCnic] = useState('16101-1234567-1');
  const [address, setAddress] = useState('Near MMC, Mardan');
  const [city, setCity] = useState('Mardan');

  // Order & Clinical Details
  const [referringDoctor, setReferringDoctor] = useState('Prof. Dr. Tariq Safi (MMC Mardan)');
  const [customDoctor, setCustomDoctor] = useState('');
  const [clinicalHistory, setClinicalHistory] = useState('Routine diagnostic workup');
  const [priority, setPriority] = useState<OrderPriority>('ROUTINE');
  const [selectedTestIds, setSelectedTestIds] = useState<string[]>(['CBC_001']);
  const [testSearch, setTestSearch] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('ALL');

  // Billing Details
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [discountReason, setDiscountReason] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'JAZZCASH' | 'EASYPAISA' | 'CARD' | 'CORPORATE_CREDIT'>('CASH');
  const [paidAmountPKR, setPaidAmountPKR] = useState<number>(1200);

  // Modals & Inspection State
  const [activeReceiptOrder, setActiveReceiptOrder] = useState<LabOrder | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Selected Tests Calculations
  const selectedTests = activeCatalog.filter((t) => selectedTestIds.includes(t.id));
  const subtotalPKR = selectedTests.reduce((acc, t) => acc + t.pricePKR, 0);
  const discountPKR = Math.round((subtotalPKR * discountPercent) / 100);
  const totalPKR = Math.max(0, subtotalPKR - discountPKR);
  const balancePKR = Math.max(0, totalPKR - paidAmountPKR);

  // Filtered Test Catalog
  const filteredCatalog = activeCatalog.filter((t) => {
    const matchesDept = selectedDeptFilter === 'ALL' || t.department === selectedDeptFilter;
    const matchesSearch =
      t.name.toLowerCase().includes(testSearch.toLowerCase()) ||
      t.code.toLowerCase().includes(testSearch.toLowerCase()) ||
      (t.urduName && t.urduName.includes(testSearch));
    return matchesDept && matchesSearch;
  });

  // Completed tests list: Tests that have been completed by the Lab Assistant
  const completedOrders = orders.filter((o) => {
    const isCompleted =
      o.workflowStage === 'TESTS_COMPLETED' ||
      o.workflowStage === 'READY_FOR_CASHIER_PRINT' ||
      o.workflowStage === 'REPORT_PRINTED' ||
      o.workflowStage === 'DELIVERED' ||
      o.items.some((i) => i.status === 'RELEASED' || i.status === 'CLINICALLY_AUTHORIZED');

    if (!isCompleted) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      o.patient.name.toLowerCase().includes(q) ||
      o.accessionNumber.toLowerCase().includes(q) ||
      o.patient.mrn.toLowerCase().includes(q) ||
      o.patient.phone.includes(q)
    );
  });

  // Forwarded to Lab tests count
  const pendingLabCount = orders.filter(
    (o) =>
      o.workflowStage === 'FORWARDED_TO_LAB' ||
      o.workflowStage === 'IN_TESTING' ||
      (!o.workflowStage && o.items.some((i) => i.status === 'DRAFT' || i.status === 'ENTERED'))
  ).length;

  // Handle Existing Patient Selection
  const handleSelectExistingPatient = (patientId: string) => {
    setSelectedExistingPatientId(patientId);
    const p = patients.find((pat) => pat.id === patientId);
    if (p) {
      setPatientName(p.name);
      setPatientUrduName(p.urduName || '');
      setAgeYears(p.ageYears);
      setGender(p.gender);
      setPhone(p.phone);
      setCnic(p.cnic);
      setAddress(p.address);
      setCity(p.city);
    }
  };

  // Toggle Test Selection
  const toggleTest = (testId: string) => {
    setSelectedTestIds((prev) => {
      const exists = prev.includes(testId);
      const updated = exists ? prev.filter((id) => id !== testId) : [...prev, testId];
      // update default paid amount to match new total if previously in sync
      const newSelected = activeCatalog.filter((t) => updated.includes(t.id));
      const newSub = newSelected.reduce((sum, t) => sum + t.pricePKR, 0);
      const newDisc = Math.round((newSub * discountPercent) / 100);
      setPaidAmountPKR(newSub - newDisc);
      return updated;
    });
  };

  // Submit Order & Print Receipt
  const handleSaveAndPrintReceipt = (e: React.FormEvent) => {
    e.preventDefault();

    if (patientMode === 'NEW' && !patientName.trim()) {
      alert('Please enter patient name.');
      return;
    }

    if (selectedTestIds.length === 0) {
      alert('Please select at least one laboratory test.');
      return;
    }

    // Determine Patient Record
    let patientObj: Patient;
    const isNew = patientMode === 'NEW' || !selectedExistingPatientId;

    if (isNew) {
      const newMrn = generateMRN(patients.length + 101);
      patientObj = {
        id: `PAT_MDN_${Date.now()}`,
        mrn: newMrn,
        name: patientName.trim(),
        urduName: patientUrduName.trim() || undefined,
        ageYears: Number(ageYears) || 30,
        gender,
        cnic: cnic.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        registeredAt: new Date().toISOString(),
        registeredBy: 'Bilal Khan (Cashier)',
      };
    } else {
      patientObj = patients.find((p) => p.id === selectedExistingPatientId)!;
    }

    // Accession Number
    const newAccession = generateAccessionNumber(orders.length + 101);

    // Group required specimens by collection tube
    const requiredTubes = new Set<SpecimenTube>();
    selectedTests.forEach((t) => requiredTubes.add(t.tube));

    const specimens: SpecimenRecord[] = Array.from(requiredTubes).map((tube, idx) => {
      let label = 'Standard Collection Tube';
      const dept = selectedTests.find((t) => t.tube === tube)?.department || 'HEMATOLOGY';
      if (tube === 'EDTA_K2') label = 'K2-EDTA (Purple Top - Whole Blood)';
      if (tube === 'SST_GEL') label = 'SST Gel Separator (Yellow Top - Serum)';
      if (tube === 'SODIUM_CITRATE') label = 'Sodium Citrate (Blue Top - Plasma)';
      if (tube === 'SODIUM_FLUORIDE') label = 'Sodium Fluoride (Grey Top - Plasma)';
      if (tube === 'STERILE_CUP') label = 'Sterile Container (Urine/Stool)';
      if (tube === 'PLAIN_RED') label = 'Plain Clot Activator (Red Top - Serum)';

      return {
        id: `SPEC_MDN_${Date.now()}_${idx}`,
        barcode: `${newAccession}-${tube.split('_')[0]}`,
        tube,
        tubeLabel: label,
        department: dept,
        status: 'PENDING_COLLECTION',
      };
    });

    // Create Order Items with initial status DRAFT
    const orderItems = selectedTests.map((t, idx) => ({
      id: `ITEM_MDN_${Date.now()}_${idx}`,
      testId: t.id,
      testCode: t.code,
      testName: t.name,
      department: t.department,
      pricePKR: t.pricePKR,
      status: 'DRAFT' as const,
      isOutsourced: Boolean(t.isOutsourced),
      referenceLabName: t.referenceLabName,
      results: {},
    }));

    const finalDoctor = referringDoctor === 'OTHER' ? customDoctor || 'Self / Walk-in' : referringDoctor;
    const paymentStatus = balancePKR === 0 ? 'PAID' : paidAmountPKR > 0 ? 'PARTIAL' : 'UNPAID';

    const newOrder: LabOrder = {
      id: `ORD_MDN_${Date.now()}`,
      accessionNumber: newAccession,
      patientId: patientObj.id,
      patient: patientObj,
      referringDoctor: finalDoctor,
      clinicalHistory: clinicalHistory.trim(),
      priority,
      orderedAt: new Date().toISOString(),
      orderedBy: 'Bilal Khan (Cashier)',
      items: orderItems,
      specimens,
      subtotalPKR,
      discountPKR,
      discountReason: discountReason || undefined,
      taxPKR: 0,
      totalPKR,
      paidPKR: paidAmountPKR,
      balancePKR,
      paymentMethod,
      paymentStatus,
      receiptNumber: `REC-MDN-${String(Math.floor(Math.random() * 9000) + 1000)}`,

      // 3-Role Workflow: Cashier forwards directly to Lab Assistant
      workflowStage: 'FORWARDED_TO_LAB',
      forwardedToLabAt: new Date().toISOString(),
    };

    onOrderCreated(newOrder, isNew ? patientObj : undefined);
    setActiveReceiptOrder(newOrder);

    // Show prominent confirmation toast
    setSuccessBanner(
      `Order ${newOrder.accessionNumber} saved and receipt printed! The order is now forwarded to Lab Assistant (Usman Tariq) for testing.`
    );

    // Reset fields for next registration
    if (patientMode === 'NEW') {
      setPatientName('');
      setPatientUrduName('');
      setCnic('16101-');
      setPhone('0300-');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Cashier Desk Hero & Stats Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white rounded-xl p-5 shadow-lg border border-teal-800/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                ROLE: CASHIER DESK
              </span>
              <span className="text-xs text-slate-400">Shift A • Counter 1</span>
            </div>
            <h2 className="text-xl font-black tracking-tight text-white mt-1">
              Cashier & Billing Terminal — Xpert Diagnostic Labs
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Enter patient info and tests $\rightarrow$ print payment receipt $\rightarrow$ order forwards automatically to Lab Assistant.
              Once testing is completed, view test data and print final diagnostic report.
            </p>
          </div>

          {/* Quick Counter Pills */}
          <div className="flex flex-wrap gap-2 text-xs">
            <div className="bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-center">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Forwarded to Lab</div>
              <div className="text-lg font-bold text-amber-400">{pendingLabCount} In-Testing</div>
            </div>
            <div className="bg-teal-900/60 border border-teal-600/50 rounded-lg px-3 py-2 text-center">
              <div className="text-[10px] text-teal-200 uppercase font-bold">Ready to Print Report</div>
              <div className="text-lg font-bold text-emerald-300">{completedOrders.length} Completed</div>
            </div>
            <div className="bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-center">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Active Cashier</div>
              <div className="text-sm font-bold text-white">Bilal Khan</div>
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
          onClick={() => setActiveTab('BOOKING')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-sm transition-colors cursor-pointer ${
            activeTab === 'BOOKING'
              ? 'border-teal-600 text-teal-700 bg-teal-50/50 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>New Patient Booking & Print Receipt</span>
        </button>

        <button
          onClick={() => setActiveTab('COMPLETED_TESTS')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-sm transition-colors cursor-pointer relative ${
            activeTab === 'COMPLETED_TESTS'
              ? 'border-teal-600 text-teal-700 bg-teal-50/50 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Printer className="w-4 h-4" />
          <span>Completed Tests — Ready to Print Report</span>
          {completedOrders.length > 0 && (
            <span className="ml-1.5 px-2 py-0.5 text-xs font-bold rounded-full bg-emerald-500 text-white shadow-xs">
              {completedOrders.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('INVOICES')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-sm transition-colors cursor-pointer ${
            activeTab === 'INVOICES'
              ? 'border-teal-600 text-teal-700 bg-teal-50/50 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Invoices & Daily Shift</span>
        </button>
      </div>

      {/* TAB 1: NEW PATIENT BOOKING & RECEIPT PRINT */}
      {activeTab === 'BOOKING' && (
        <form onSubmit={handleSaveAndPrintReceipt} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Patient Demographics & Test Selector (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Patient Mode Card */}
            <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-teal-600" />
                  <span>1. Patient Registration & Demographics</span>
                </h3>

                <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs">
                  <button
                    type="button"
                    onClick={() => setPatientMode('NEW')}
                    className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
                      patientMode === 'NEW' ? 'bg-white text-teal-700 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    New Patient
                  </button>
                  <button
                    type="button"
                    onClick={() => setPatientMode('EXISTING')}
                    className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
                      patientMode === 'EXISTING' ? 'bg-white text-teal-700 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Select Existing
                  </button>
                </div>
              </div>

              {/* Existing Patient Search Select */}
              {patientMode === 'EXISTING' && (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Search Registered Mardan Patient:
                  </label>
                  <select
                    value={selectedExistingPatientId}
                    onChange={(e) => handleSelectExistingPatient(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium"
                  >
                    <option value="">-- Choose Existing Patient --</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.mrn}) • Age: {p.ageYears}Y • Phone: {p.phone} • CNIC: {p.cnic}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Demographic Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Patient Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="e.g. Farooq Ahmad"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-teal-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Age (Years) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    required
                    value={ageYears}
                    onChange={(e) => setAgeYears(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-teal-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Gender <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as 'M' | 'F' | 'OTHER')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-teal-500 font-medium bg-white"
                  >
                    <option value="M">Male (مرد)</option>
                    <option value="F">Female (عورت)</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Phone / Mobile (WhatsApp) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0300-1234567"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-teal-500 font-medium font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    CNIC / B-Form
                  </label>
                  <input
                    type="text"
                    value={cnic}
                    onChange={(e) => setCnic(e.target.value)}
                    placeholder="16101-1234567-1"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-teal-500 font-medium font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Urdu Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={patientUrduName}
                    onChange={(e) => setPatientUrduName(e.target.value)}
                    placeholder="فاروق احمد"
                    dir="rtl"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-teal-500 font-medium"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Address / Area
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Near MMC, Mardan"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-teal-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-teal-500 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Test Selection Card */}
            <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <Activity className="w-4 h-4 text-teal-600" />
                    <span>2. Select Diagnostic Tests to be Done</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Selected tests will be billed and forwarded to Lab Assistant (Usman Tariq).
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Search test name or code..."
                    value={testSearch}
                    onChange={(e) => setTestSearch(e.target.value)}
                    className="px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-teal-500 w-48"
                  />
                </div>
              </div>

              {/* Department Filter Pills */}
              <div className="flex flex-wrap gap-1.5 text-[11px]">
                {['ALL', 'HEMATOLOGY', 'CHEMISTRY', 'CLINICAL_PATHOLOGY', 'SEROLOGY', 'MICROBIOLOGY'].map((dept) => (
                  <button
                    key={dept}
                    type="button"
                    onClick={() => setSelectedDeptFilter(dept)}
                    className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                      selectedDeptFilter === dept
                        ? 'bg-teal-700 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {dept.replace('_', ' ')}
                  </button>
                ))}
              </div>

              {/* Test Catalog Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto p-1">
                {filteredCatalog.map((test) => {
                  const isSelected = selectedTestIds.includes(test.id);
                  return (
                    <div
                      key={test.id}
                      onClick={() => toggleTest(test.id)}
                      className={`p-3 rounded-lg border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-teal-600 bg-teal-50/60 shadow-xs ring-1 ring-teal-500'
                          : 'border-slate-200 bg-white hover:border-teal-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            {test.code}
                          </span>
                          <span
                            className={`w-4 h-4 rounded flex items-center justify-center text-white ${
                              isSelected ? 'bg-teal-600' : 'border border-slate-300'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </span>
                        </div>
                        <div className="font-bold text-xs text-slate-900 mt-1 line-clamp-2">
                          {test.name}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Sample: {test.specimenType} ({test.tube.split('_')[0]})
                        </div>
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-[10px] text-slate-500">{test.turnaroundHours}h TAT</span>
                        <span className="font-bold text-teal-800">{test.pricePKR.toLocaleString()} PKR</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Selected Tests Summary Pill */}
              <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-slate-600">
                  <strong>{selectedTests.length}</strong> test(s) selected:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedTests.map((t) => (
                    <span
                      key={t.id}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-teal-100 text-teal-800 rounded font-semibold text-[11px]"
                    >
                      {t.name.substring(0, 22)}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTest(t.id);
                        }}
                        className="text-teal-600 hover:text-rose-600 ml-1 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Doctor Referral & Billing Calculator (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Clinical & Doctor Card */}
            <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-4">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
                <FileText className="w-4 h-4 text-teal-600" />
                <span>3. Referring Consultant & Urgency</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Referring Doctor / Clinic:
                  </label>
                  <select
                    value={referringDoctor}
                    onChange={(e) => setReferringDoctor(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-teal-500 font-medium bg-white"
                  >
                    {MARDAN_DOCTORS.map((d) => (
                      <option key={d.id} value={`${d.name} (${d.affiliation})`}>
                        {d.name} • {d.affiliation}
                      </option>
                    ))}
                    <option value="Prof. Dr. Tariq Safi (MMC Mardan)">Prof. Dr. Tariq Safi (MMC Mardan)</option>
                    <option value="Self / Walk-in Patient">Self / Walk-in Patient</option>
                    <option value="OTHER">Other Physician / Hospital...</option>
                  </select>
                </div>

                {referringDoctor === 'OTHER' && (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Enter Physician Name & Hospital:
                    </label>
                    <input
                      type="text"
                      value={customDoctor}
                      onChange={(e) => setCustomDoctor(e.target.value)}
                      placeholder="e.g. Dr. Khalid Khan (Civil Hospital)"
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs font-medium"
                    />
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Priority / Urgency:</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['ROUTINE', 'URGENT', 'STAT'] as OrderPriority[]).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPriority(p)}
                        className={`py-1.5 text-center text-xs font-bold rounded-md border transition cursor-pointer ${
                          priority === p
                            ? p === 'STAT'
                              ? 'bg-rose-600 text-white border-rose-600'
                              : p === 'URGENT'
                              ? 'bg-amber-600 text-white border-amber-600'
                              : 'bg-teal-700 text-white border-teal-700'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Clinical Brief / Indications:
                  </label>
                  <textarea
                    rows={2}
                    value={clinicalHistory}
                    onChange={(e) => setClinicalHistory(e.target.value)}
                    placeholder="Routine checkup, fever, etc."
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Financial Settlement & Print Receipt Action */}
            <div className="bg-white rounded-xl shadow-xs border border-teal-600/40 p-5 space-y-4">
              <h3 className="font-bold text-slate-800 text-sm flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-teal-600" />
                  <span>4. Payment & Receipt</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-teal-100 text-teal-800 rounded font-bold">
                  PKR
                </span>
              </h3>

              {/* Financial Calculation Breakdown */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Gross Test Fees:</span>
                  <span className="font-semibold">{subtotalPKR.toLocaleString()} PKR</span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-600">Discount (%):</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={discountPercent}
                      onChange={(e) => {
                        const val = Math.min(100, Math.max(0, Number(e.target.value)));
                        setDiscountPercent(val);
                        const disc = Math.round((subtotalPKR * val) / 100);
                        setPaidAmountPKR(subtotalPKR - disc);
                      }}
                      className="w-16 px-2 py-1 text-right border border-slate-300 rounded text-xs font-bold"
                    />
                    <span className="text-slate-500">%</span>
                  </div>
                </div>

                {discountPercent > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Discount Amount:</span>
                    <span>- {discountPKR.toLocaleString()} PKR</span>
                  </div>
                )}

                <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                  <span>Net Amount Payable:</span>
                  <span className="text-teal-800">{totalPKR.toLocaleString()} PKR</span>
                </div>

                {/* Payment Method Selector */}
                <div className="pt-2">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Payment Method:
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                    {[
                      { id: 'CASH', label: 'Cash' },
                      { id: 'JAZZCASH', label: 'JazzCash' },
                      { id: 'EASYPAISA', label: 'EasyPaisa' },
                    ].map((pm) => (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => setPaymentMethod(pm.id as any)}
                        className={`py-1.5 px-2 rounded font-bold border transition cursor-pointer text-center ${
                          paymentMethod === pm.id
                            ? 'bg-teal-700 text-white border-teal-700'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {pm.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Paid Amount Input */}
                <div className="pt-1">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Amount Received (PKR):
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={paidAmountPKR}
                    onChange={(e) => setPaidAmountPKR(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md font-bold text-slate-900 text-sm focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                <div className="flex justify-between text-xs pt-1">
                  <span className="text-slate-600">Balance Remaining:</span>
                  <span className={`font-black ${balancePKR > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                    {balancePKR.toLocaleString()} PKR
                  </span>
                </div>
              </div>

              {/* Action Button: Save & Print Receipt */}
              <div className="pt-3">
                <button
                  type="submit"
                  className="w-full py-3.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Save Order & Print Receipt</span>
                </button>
                <div className="text-[10px] text-center text-slate-500 mt-2">
                  Order auto-forwards to Lab Assistant (Usman Tariq) upon printing receipt.
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* TAB 2: COMPLETED TESTS — READY FOR CASHIER TO PRINT REPORT */}
      {activeTab === 'COMPLETED_TESTS' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                  <Printer className="w-5 h-5 text-teal-600" />
                  <span>Completed Tests — Ready to Print Diagnostic Report</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  The Lab Assistant has completed analytical testing for these orders. Review test findings and print the official diagnostic report for the patient.
                </p>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter by patient name, MRN, accession..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg w-72 focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Orders List */}
          {completedOrders.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center space-y-3">
              <Clock className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="font-bold text-slate-700 text-base">No Completed Reports Pending Print</div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                When the Lab Assistant completes testing on orders, they immediately appear in this list with a green "Print Diagnostic Report" button.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {completedOrders.map((order) => {
                const isExpanded = expandedOrderId === order.id;
                const isDelivered = order.workflowStage === 'DELIVERED';

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden transition-all hover:border-teal-400"
                  >
                    <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Left: Patient & Order Details */}
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono font-bold text-teal-800 text-sm bg-teal-50 px-2.5 py-0.5 rounded border border-teal-200">
                            {order.accessionNumber}
                          </span>
                          <span className="text-xs font-mono text-slate-500">
                            MRN: {order.patient.mrn}
                          </span>
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            Testing Done by Lab Assistant
                          </span>
                          {isDelivered && (
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-800">
                              Report Delivered to Patient
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-baseline gap-3">
                          <h4 className="font-black text-slate-900 text-base">
                            {order.patient.name}
                          </h4>
                          <span className="text-xs text-slate-500">
                            {order.patient.ageYears} Y • {order.patient.gender === 'M' ? 'Male' : 'Female'} • Phone: {order.patient.phone}
                          </span>
                        </div>

                        <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-4 gap-y-1">
                          <span>
                            <strong>Tests:</strong> {order.items.map((i) => i.testName).join(', ')}
                          </span>
                          <span>•</span>
                          <span>
                            <strong>Ref:</strong> {order.referringDoctor}
                          </span>
                          <span>•</span>
                          <span>
                            <strong>Tested By:</strong> {order.testedBy || 'Usman Tariq (Lab Assistant)'}
                          </span>
                        </div>
                      </div>

                      {/* Right: Actions (Print Diagnostic Report, View Results, Reprint Receipt) */}
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Toggle Result Values Preview */}
                        <button
                          type="button"
                          onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                          className="px-3 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>{isExpanded ? 'Hide Values' : 'View Values'}</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>

                        {/* Reprint Receipt */}
                        <button
                          type="button"
                          onClick={() => setActiveReceiptOrder(order)}
                          className="px-3 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                          title="Reprint Cashier Receipt"
                        >
                          <Receipt className="w-3.5 h-3.5 text-slate-500" />
                          <span>Receipt</span>
                        </button>

                        {/* Primary Action: PRINT DIAGNOSTIC REPORT */}
                        <button
                          type="button"
                          onClick={() => {
                            if (onUpdateOrderStatus && order.workflowStage !== 'DELIVERED') {
                              onUpdateOrderStatus(order.id, 'REPORT_PRINTED');
                            }
                            onPrintReport(order);
                          }}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm transition cursor-pointer"
                        >
                          <Printer className="w-4 h-4" />
                          <span>Print Diagnostic Report</span>
                        </button>

                        {/* Mark Delivered */}
                        {!isDelivered && onUpdateOrderStatus && (
                          <button
                            type="button"
                            onClick={() => {
                              onUpdateOrderStatus(order.id, 'DELIVERED');
                              setSuccessBanner(`Report for ${order.patient.name} marked as handed over to patient.`);
                            }}
                            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
                            title="Mark as delivered to patient"
                          >
                            Mark Delivered
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Expandable Test Values Drawer */}
                    {isExpanded && (
                      <div className="bg-slate-50 border-t border-slate-200 p-4 space-y-3">
                        <div className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center justify-between">
                          <span>Laboratory Test Results entered by Lab Assistant:</span>
                          <span className="text-[11px] font-normal text-slate-500">
                            Verified on Mardan Central Analyzer Bench
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {order.items.map((item) => (
                            <div key={item.id} className="bg-white rounded-lg p-3 border border-slate-200 shadow-2xs space-y-2">
                              <div className="font-bold text-xs text-teal-800 border-b border-slate-100 pb-1 flex justify-between">
                                <span>{item.testName}</span>
                                <span className="text-[10px] text-slate-500 font-mono">{item.testCode}</span>
                              </div>

                              {Object.keys(item.results || {}).length > 0 ? (
                                <div className="space-y-1 text-xs">
                                  {Object.entries(item.results).map(([key, val]) => (
                                    <div key={key} className="flex justify-between items-center py-0.5 border-b border-slate-50">
                                      <span className="text-slate-600 font-medium">{key}:</span>
                                      <div className="flex items-center gap-2">
                                        <span className="font-mono font-bold text-slate-900">
                                          {val.value} {val.unit}
                                        </span>
                                        {val.flag !== 'NORMAL' && (
                                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-100 text-rose-700">
                                            {val.flag}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-[11px] text-slate-400 italic">No values entered yet.</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: INVOICES & DAILY SHIFT */}
      {activeTab === 'INVOICES' && (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <Receipt className="w-5 h-5 text-teal-600" />
                <span>Cashier Invoices & Daily Shift Register</span>
              </h3>
              <p className="text-xs text-slate-500">
                Shift A • Cashier: Bilal Khan • Xpert Diagnostic Labs Mardan
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-teal-50 border border-teal-200 rounded-lg text-xs font-bold text-teal-800">
                Total Orders: {orders.length}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="py-2.5 px-3">Receipt #</th>
                  <th className="py-2.5 px-3">Accession #</th>
                  <th className="py-2.5 px-3">Patient</th>
                  <th className="py-2.5 px-3">Tests Ordered</th>
                  <th className="py-2.5 px-3">Total (PKR)</th>
                  <th className="py-2.5 px-3">Paid (PKR)</th>
                  <th className="py-2.5 px-3">Balance</th>
                  <th className="py-2.5 px-3">Method</th>
                  <th className="py-2.5 px-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{o.receiptNumber}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-teal-700">{o.accessionNumber}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900">{o.patient.name}</div>
                      <div className="text-[10px] text-slate-500">{o.patient.mrn}</div>
                    </td>
                    <td className="py-2.5 px-3 max-w-[200px] truncate text-slate-700" title={o.items.map((i) => i.testName).join(', ')}>
                      {o.items.map((i) => i.testName).join(', ')}
                    </td>
                    <td className="py-2.5 px-3 font-bold">{o.totalPKR.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-emerald-700 font-semibold">{o.paidPKR.toLocaleString()}</td>
                    <td className="py-2.5 px-3 font-bold text-rose-600">
                      {o.balancePKR > 0 ? `${o.balancePKR.toLocaleString()} PKR` : <span className="text-emerald-600">Clear</span>}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {o.paymentMethod}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <button
                        type="button"
                        onClick={() => setActiveReceiptOrder(o)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Printer className="w-3 h-3" />
                        Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
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
