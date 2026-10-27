/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  UserPlus,
  Receipt,
  Search,
  CheckCircle,
  AlertCircle,
  FileText,
  CreditCard,
  Printer,
  X,
} from 'lucide-react';
import { Patient, LabOrder, OrderPriority, TestCatalogItem, SpecimenRecord, SpecimenTube } from '../types/lis';
import { CLINICAL_CATALOG } from '../data/clinicalCatalog';
import { generateAccessionNumber, generateMRN, calculateBilling } from '../utils/lisLogic';

interface RegistrationBillingViewProps {
  patients: Patient[];
  orders: LabOrder[];
  onOrderCreated: (newOrder: LabOrder, newPatient?: Patient) => void;
  isUrduEnabled: boolean;
  catalog?: TestCatalogItem[];
}

export const RegistrationBillingView: React.FC<RegistrationBillingViewProps> = ({
  patients,
  orders,
  onOrderCreated,
  isUrduEnabled,
  catalog = CLINICAL_CATALOG,
}) => {
  const activeCatalog = catalog || CLINICAL_CATALOG;

  // Existing Patient Search vs New
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<string>('NEW');

  // Patient Demographic Fields
  const [patientName, setPatientName] = useState('');
  const [patientUrduName, setPatientUrduName] = useState('');
  const [ageYears, setAgeYears] = useState<number>(35);
  const [gender, setGender] = useState<'M' | 'F'>('M');
  const [cnic, setCnic] = useState('16101-');
  const [phone, setPhone] = useState('0300-');
  const [city, setCity] = useState('Mardan');
  const [address, setAddress] = useState('Near MMC, Mardan');

  // Order Details
  const [referringDoctor, setReferringDoctor] = useState('Prof. Dr. Tariq Safi (MMC Mardan)');
  const [clinicalHistory, setClinicalHistory] = useState('Routine investigation');
  const [priority, setPriority] = useState<OrderPriority>('ROUTINE');
  const [selectedTestIds, setSelectedTestIds] = useState<string[]>(['CBC_001']);

  // Financial fields
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [discountReason, setDiscountReason] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'JAZZCASH' | 'EASYPAISA' | 'CORPORATE_CREDIT'>('CASH');
  const [paidAmountPKR, setPaidAmountPKR] = useState<number>(1200);

  // Success state / Thermal Receipt Modal
  const [lastCreatedOrder, setLastCreatedOrder] = useState<LabOrder | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Filtered patients for search
  const filteredPatients = searchQuery.trim()
    ? patients.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.phone.includes(searchQuery) ||
          p.mrn.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.cnic.includes(searchQuery)
      )
    : [];

  const handleSelectExistingPatient = (patient: Patient) => {
    setSelectedPatientId(patient.id);
    setPatientName(patient.name);
    setPatientUrduName(patient.urduName || '');
    setAgeYears(patient.ageYears);
    setGender(patient.gender as 'M' | 'F');
    setCnic(patient.cnic);
    setPhone(patient.phone);
    setCity(patient.city);
    setAddress(patient.address);
  };

  const handleResetToNewPatient = () => {
    setSelectedPatientId('NEW');
    setPatientName('');
    setPatientUrduName('');
    setAgeYears(30);
    setGender('M');
    setCnic('16101-');
    setPhone('0300-');
    setCity('Mardan');
    setAddress('Near MMC, Mardan');
  };

  const handleToggleTest = (testId: string) => {
    if (selectedTestIds.includes(testId)) {
      setSelectedTestIds(selectedTestIds.filter((id) => id !== testId));
    } else {
      setSelectedTestIds([...selectedTestIds, testId]);
    }
  };

  // Calculate bill live
  const selectedTests = activeCatalog.filter((t) => selectedTestIds.includes(t.id));
  const billing = calculateBilling(
    selectedTests.map((t) => ({ pricePKR: t.pricePKR })),
    discountPercent,
    0,
    paidAmountPKR
  );

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();

    if (!patientName.trim()) {
      alert('Patient name is required.');
      return;
    }
    if (selectedTestIds.length === 0) {
      alert('Please select at least one laboratory investigation.');
      return;
    }

    // Determine or build patient
    let patientObj: Patient;
    let isNewPatient = false;

    if (selectedPatientId !== 'NEW') {
      const existing = patients.find((p) => p.id === selectedPatientId);
      if (!existing) return;
      patientObj = existing;
    } else {
      isNewPatient = true;
      const newMrn = generateMRN(patients.length + 184);
      patientObj = {
        id: `PAT_${Date.now()}`,
        mrn: newMrn,
        name: patientName.trim(),
        urduName: patientUrduName.trim() || undefined,
        ageYears,
        gender,
        cnic,
        phone,
        city,
        address,
        registeredAt: new Date().toISOString(),
        registeredBy: 'Asma Riaz (Receptionist)',
      };
    }

    // Generate accession number
    const newAccession = generateAccessionNumber(orders.length + 42);

    // Group required specimens
    const requiredTubes = new Set<SpecimenTube>();
    selectedTests.forEach((t) => requiredTubes.add(t.tube));

    const specimens: SpecimenRecord[] = Array.from(requiredTubes).map((tube, idx) => {
      let label = 'Standard Collection Tube';
      let dept = selectedTests.find((t) => t.tube === tube)?.department || 'HEMATOLOGY';
      if (tube === 'EDTA_K2') label = 'K2-EDTA (Purple Top - Whole Blood)';
      if (tube === 'SST_GEL') label = 'SST Gel Separator (Yellow Top - Serum)';
      if (tube === 'SODIUM_CITRATE') label = 'Sodium Citrate (Blue Top - Plasma)';
      if (tube === 'SODIUM_FLUORIDE') label = 'Sodium Fluoride (Grey Top - Plasma)';
      if (tube === 'STERILE_CUP') label = 'Sterile Specimen Container';

      return {
        id: `SPEC_${Date.now()}_${idx}`,
        barcode: `${newAccession}-${tube.split('_')[0]}`,
        tube,
        tubeLabel: label,
        department: dept,
        status: 'PENDING_COLLECTION',
      };
    });

    const orderItems = selectedTests.map((t, idx) => ({
      id: `ITEM_${Date.now()}_${idx}`,
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

    const newOrder: LabOrder = {
      id: `ORD_${Date.now()}`,
      accessionNumber: newAccession,
      patientId: patientObj.id,
      patient: patientObj,
      referringDoctor,
      clinicalHistory,
      priority,
      orderedAt: new Date().toISOString(),
      orderedBy: 'Asma Riaz (Receptionist)',
      items: orderItems,
      specimens,
      subtotalPKR: billing.subtotalPKR,
      discountPKR: billing.discountPKR,
      discountReason: discountReason || undefined,
      taxPKR: billing.taxPKR,
      totalPKR: billing.totalPKR,
      paidPKR: paidAmountPKR,
      balancePKR: billing.balancePKR,
      paymentMethod,
      paymentStatus: billing.paymentStatus,
      receiptNumber: `REC-2026-${String(Math.floor(Math.random() * 9000) + 1000)}`,
    };

    onOrderCreated(newOrder, isNewPatient ? patientObj : undefined);
    setLastCreatedOrder(newOrder);
    setShowReceiptModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-teal-600" />
            Patient Registration & Point-of-Sale (POS) Billing
          </h2>
          <p className="text-xs text-slate-500">
            Pakistan Master Patient Index (MPI) • Unique Accession Numbering • Direct Cashier Receipt
          </p>
        </div>

        {/* Existing Patient Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by MRN, Phone, or Name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />

          {filteredPatients.length > 0 && (
            <div className="absolute top-10 left-0 right-0 bg-white border border-slate-200 shadow-lg rounded-lg z-20 max-h-48 overflow-y-auto">
              {filteredPatients.map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    handleSelectExistingPatient(p);
                    setSearchQuery('');
                  }}
                  className="p-2 hover:bg-teal-50 cursor-pointer border-b border-slate-100 text-xs"
                >
                  <div className="font-semibold text-slate-800">
                    {p.name} {p.urduName ? `(${p.urduName})` : ''}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {p.mrn} • {p.phone} • {p.cnic}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Patient Demographic Information */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="font-bold text-sm text-slate-800">
              {selectedPatientId === 'NEW' ? '1. New Patient Demographics' : '1. Existing Patient (Verified)'}
            </h3>
            {selectedPatientId !== 'NEW' && (
              <button
                type="button"
                onClick={handleResetToNewPatient}
                className="text-xs text-teal-600 hover:underline font-semibold"
              >
                + Register Different Patient
              </button>
            )}
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Full Name (English) *
              </label>
              <input
                type="text"
                required
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="e.g. Tariq Mehmood"
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1 flex items-center justify-between">
                <span>Local Language / Urdu Name (اردو نام)</span>
                <span className="text-[10px] text-slate-400">Optional</span>
              </label>
              <input
                type="text"
                dir="rtl"
                value={patientUrduName}
                onChange={(e) => setPatientUrduName(e.target.value)}
                placeholder="مثال: طارق محمود"
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-right font-medium focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Age (Years) *</label>
                <input
                  type="number"
                  min="0"
                  max="120"
                  required
                  value={ageYears}
                  onChange={(e) => setAgeYears(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Gender *</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as 'M' | 'F')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500"
                >
                  <option value="M">Male (مرد)</option>
                  <option value="F">Female (عورت)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-medium mb-1">CNIC (National ID)</label>
                <input
                  type="text"
                  value={cnic}
                  onChange={(e) => setCnic(e.target.value)}
                  placeholder="37405-1234567-1"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Mobile Contact *</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0300-1234567"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-medium mb-1">City / Region</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as OrderPriority)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md font-semibold text-slate-800"
                >
                  <option value="ROUTINE">Routine</option>
                  <option value="URGENT">Urgent (Express)</option>
                  <option value="STAT">STAT / Emergency (Immediate)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Referring Consultant / Clinic</label>
              <input
                type="text"
                value={referringDoctor}
                onChange={(e) => setReferringDoctor(e.target.value)}
                placeholder="e.g. Prof. Dr. A. Rehman (Consultant Hematologist)"
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Clinical Indication / History</label>
              <textarea
                rows={2}
                value={clinicalHistory}
                onChange={(e) => setClinicalHistory(e.target.value)}
                placeholder="e.g. Fever, petechial rash, suspected dengue"
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
        </div>

        {/* Center Column: Test Selection from Clinical Catalog */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="font-bold text-sm text-slate-800">
              2. Clinical Test Requisition ({selectedTestIds.length} Selected)
            </h3>
            <span className="text-[11px] text-teal-700 font-medium bg-teal-50 px-2 py-0.5 rounded">
              All 8 Departments
            </span>
          </div>

          <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
            {activeCatalog.map((test) => {
              const isSelected = selectedTestIds.includes(test.id);
              return (
                <div
                  key={test.id}
                  onClick={() => handleToggleTest(test.id)}
                  className={`p-3 rounded-lg border text-xs cursor-pointer transition ${
                    isSelected
                      ? 'bg-teal-50/70 border-teal-500 shadow-sm ring-1 ring-teal-500/30'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // handled by parent onClick
                        className="rounded text-teal-600 focus:ring-teal-500"
                      />
                      <div>
                        <div className="font-semibold text-slate-900">
                          {test.name}
                        </div>
                        {isUrduEnabled && test.urduName && (
                          <div className="text-[11px] text-teal-800 font-medium" dir="rtl">
                            {test.urduName}
                          </div>
                        )}
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {test.department} • Tube: <strong className="text-slate-700">{test.tube.replace('_', ' ')}</strong>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900">{test.pricePKR.toLocaleString()} PKR</div>
                      <div className="text-[10px] text-slate-500">TAT: {test.turnaroundHours}h</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Billing, Discounts & Payment */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-teal-600" />
                3. Invoice & Payment Details (PKR)
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              {/* Discount Selector */}
              <div>
                <label className="block text-slate-700 font-medium mb-1">Discount Concession</label>
                <select
                  value={discountPercent}
                  onChange={(e) => {
                    const pct = Number(e.target.value);
                    setDiscountPercent(pct);
                    if (pct === 10) setDiscountReason('Senior Citizen 10%');
                    else if (pct === 15) setDiscountReason('Corporate Referral 15%');
                    else if (pct === 20) setDiscountReason('Doctor Family 20%');
                    else setDiscountReason('');
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md font-medium"
                >
                  <option value={0}>No Discount (0%)</option>
                  <option value={10}>Senior Citizen / Pensioner (10%)</option>
                  <option value={15}>Corporate / Hospital Staff (15%)</option>
                  <option value={20}>Doctor Privilege Card (20%)</option>
                </select>
              </div>

              {discountPercent > 0 && (
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Discount Reason / Approval</label>
                  <input
                    type="text"
                    value={discountReason}
                    onChange={(e) => setDiscountReason(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md"
                  />
                </div>
              )}

              {/* Payment Method */}
              <div>
                <label className="block text-slate-700 font-medium mb-1">Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'CASH', label: 'Cash (PKR)' },
                    { id: 'CARD', label: 'Debit / Credit Card' },
                    { id: 'JAZZCASH', label: 'JazzCash Wallet' },
                    { id: 'EASYPAISA', label: 'EasyPaisa Wallet' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id as any)}
                      className={`p-2 rounded border text-left font-medium transition ${
                        paymentMethod === m.id
                          ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount Paid */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-slate-700 font-medium">Amount Received Now (PKR)</label>
                  <button
                    type="button"
                    onClick={() => setPaidAmountPKR(billing.totalPKR)}
                    className="text-[10px] text-teal-600 font-semibold hover:underline"
                  >
                    Pay Full Net Total
                  </button>
                </div>
                <input
                  type="number"
                  min="0"
                  value={paidAmountPKR}
                  onChange={(e) => setPaidAmountPKR(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md font-bold text-slate-900"
                />
              </div>

              {/* Financial Summary Card */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5 font-mono">
                <div className="flex justify-between text-slate-600">
                  <span>Gross Subtotal:</span>
                  <span>{billing.subtotalPKR.toLocaleString()} PKR</span>
                </div>
                {billing.discountPKR > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Discount ({discountPercent}%):</span>
                    <span>- {billing.discountPKR.toLocaleString()} PKR</span>
                  </div>
                )}
                <div className="border-t border-slate-200 pt-1 flex justify-between font-bold text-sm text-slate-900">
                  <span>Net Payable:</span>
                  <span className="text-teal-700">{billing.totalPKR.toLocaleString()} PKR</span>
                </div>
                <div className="flex justify-between text-xs text-slate-700">
                  <span>Amount Paid:</span>
                  <span className="font-semibold">{paidAmountPKR.toLocaleString()} PKR</span>
                </div>
                <div className="flex justify-between text-xs text-rose-700 font-bold border-t border-dashed border-slate-200 pt-1">
                  <span>Balance Due:</span>
                  <span>{billing.balancePKR.toLocaleString()} PKR</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action button */}
          <div className="pt-4">
            <button
              type="submit"
              className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-lg shadow-md transition flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              Register Order & Issue Accession Number
            </button>
          </div>
        </div>
      </form>

      {/* Thermal Receipt Modal */}
      {showReceiptModal && lastCreatedOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-200">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  Order Requisition Registered Successfully!
                </h3>
                <p className="text-xs text-slate-500">
                  Thermal Cash Receipt Voucher Generated
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowReceiptModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Simulated POS Thermal Receipt */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 font-mono text-xs space-y-2">
              <div className="text-center border-b border-dashed border-slate-300 pb-2">
                <div className="font-bold text-slate-900 text-sm">XPERT DIAGNOSTICS LAB</div>
                <div className="text-[10px] text-slate-500">KPHCC Reg: KPHCC-MDN-7721-PLMS • Near MMC, Mardan</div>
                <div className="text-[10px] text-slate-500">UAN: (0937) 111-973-78</div>
              </div>

              <div className="flex justify-between pt-1">
                <span>Accession #:</span>
                <span className="font-bold text-teal-800">{lastCreatedOrder.accessionNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Patient MRN:</span>
                <span className="font-semibold">{lastCreatedOrder.patient.mrn}</span>
              </div>
              <div className="flex justify-between">
                <span>Name:</span>
                <span className="font-bold text-slate-800">{lastCreatedOrder.patient.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Age / Sex:</span>
                <span>{lastCreatedOrder.patient.ageYears} Y / {lastCreatedOrder.patient.gender}</span>
              </div>
              <div className="flex justify-between">
                <span>Receipt #:</span>
                <span>{lastCreatedOrder.receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Date:</span>
                <span>{new Date(lastCreatedOrder.orderedAt).toLocaleString('en-GB')}</span>
              </div>

              <div className="border-t border-dashed border-slate-300 my-2 pt-2 space-y-1">
                <div className="font-bold text-slate-700">TEST ITEMS:</div>
                {lastCreatedOrder.items.map((it) => (
                  <div key={it.id} className="flex justify-between">
                    <span>{it.testName.substring(0, 24)}</span>
                    <span>{it.pricePKR} PKR</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-300 pt-2 space-y-1">
                <div className="flex justify-between">
                  <span>Gross Total:</span>
                  <span>{lastCreatedOrder.subtotalPKR} PKR</span>
                </div>
                {lastCreatedOrder.discountPKR > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount:</span>
                    <span>- {lastCreatedOrder.discountPKR} PKR</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-slate-900 text-sm">
                  <span>Net Amount:</span>
                  <span>{lastCreatedOrder.totalPKR} PKR</span>
                </div>
                <div className="flex justify-between">
                  <span>Paid ({lastCreatedOrder.paymentMethod}):</span>
                  <span>{lastCreatedOrder.paidPKR} PKR</span>
                </div>
                <div className="flex justify-between font-bold text-rose-700">
                  <span>Balance Due:</span>
                  <span>{lastCreatedOrder.balancePKR} PKR</span>
                </div>
              </div>

              <div className="text-center border-t border-dashed border-slate-300 pt-2 text-[10px] text-slate-500">
                Please bring this receipt for report collection.
                <br />Reports online: reports.alshafilab.pk
              </div>
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                Print Cash Receipt
              </button>
              <button
                type="button"
                onClick={() => setShowReceiptModal(false)}
                className="flex-1 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
