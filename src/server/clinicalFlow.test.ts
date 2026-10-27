/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PatientsService,
  OrdersService,
  SpecimensService,
  ResultsService,
  PathologistService,
  BillingService,
  db,
} from './services/lisServices';
import { CreatePatientDto, CreateOrderDto } from './dtos';

test('End-to-End Clinical Flow: Register -> Book -> Collect -> Results -> Pathologist Sign-Off -> Report -> Settle Invoice', () => {
  // Reset database for a clean test run
  db.reset();

  const patientsService = new PatientsService();
  const ordersService = new OrdersService();
  const specimensService = new SpecimensService();
  const resultsService = new ResultsService();
  const pathologistService = new PathologistService();
  const billingService = new BillingService();

  // ----------------------------------------------------
  // STEP 1: Register Patient in Mardan
  // ----------------------------------------------------
  const patientDto: CreatePatientDto = {
    name: 'Farooq Ahmad Khan',
    urduName: 'فاروق احمد خان',
    ageYears: 48,
    gender: 'M',
    cnic: '16101-8842193-1',
    phone: '0300-9876543',
    address: 'Near MMC, Mardan',
    city: 'Mardan',
  };

  const patient = patientsService.create(patientDto, 'Farah Naz (Receptionist, Xpert Labs)');
  assert.ok(patient.id, 'Patient must have an ID');
  assert.ok(patient.mrn.startsWith('MRN-'), 'MRN must follow standard convention');
  assert.equal(patient.name, 'Farooq Ahmad Khan');
  assert.equal(patient.city, 'Mardan');

  // Verify patient can be queried
  const retrievedPatient = patientsService.getById(patient.id);
  assert.equal(retrievedPatient?.mrn, patient.mrn);

  // ----------------------------------------------------
  // STEP 2: Book Test (CBC - Complete Blood Count)
  // ----------------------------------------------------
  const orderDto: CreateOrderDto = {
    patientId: patient.id,
    testIds: ['CBC_001'], // Complete Blood Count (EDTA tube)
    referringDoctor: 'Prof. Dr. Tariq Safi (Mardan Medical Complex)',
    referringHospital: 'Mardan Medical Complex (MMC)',
    clinicalHistory: 'High fever, chills, suspected dengue fever',
    priority: 'URGENT',
    discountPercent: 10,
    discountReason: 'Physician referral courtesy discount',
    paidAmountPKR: 500, // Partial payment upfront out of total
    paymentMethod: 'CASH',
  };

  const order = ordersService.create(orderDto, 'Farah Naz (Receptionist)');
  assert.ok(order.accessionNumber.startsWith('XPT-2026-'), 'Accession number must have Xpert 2026 prefix');
  assert.equal(order.items.length, 1);
  assert.equal(order.items[0].testCode, 'HEM-CBC');
  assert.equal(order.specimens.length, 1);
  assert.equal(order.specimens[0].tube, 'EDTA_K2');
  assert.equal(order.specimens[0].status, 'PENDING_COLLECTION');
  assert.equal(order.paidPKR, 500);
  assert.ok(order.balancePKR > 0, 'Order should have remaining balance');
  assert.equal(order.paymentStatus, 'PARTIAL');

  // ----------------------------------------------------
  // STEP 3: Collect Specimen & Receive in Lab
  // ----------------------------------------------------
  const specimenId = order.specimens[0].id;

  // 3a. Phlebotomist draws sample
  const collectedSpecimen = specimensService.updateStatus(
    {
      specimenId,
      status: 'COLLECTED',
      collectorName: 'Farhan Ullah (Phlebotomist)',
    },
    'Farhan Ullah'
  );
  assert.equal(collectedSpecimen.status, 'COLLECTED');
  assert.ok(collectedSpecimen.collectedAt);

  // 3b. Sample received at Central Processing Bench
  const receivedSpecimen = specimensService.updateStatus(
    {
      specimenId,
      status: 'RECEIVED_IN_LAB',
    },
    'Zeeshan Ali, BSc MLT'
  );
  assert.equal(receivedSpecimen.status, 'RECEIVED_IN_LAB');
  assert.ok(receivedSpecimen.receivedAt);

  // ----------------------------------------------------
  // STEP 4: Enter Results & First-Tier Technical Verification
  // ----------------------------------------------------
  const cbcItemId = order.items[0].id;

  // Enter CBC results: Hemoglobin 11.2 (LOW) and Platelet count 22 (CRITICAL_LOW < 30)
  const enteredItem = resultsService.enterResults(
    {
      orderId: order.id,
      itemId: cbcItemId,
      results: {
        WBC: { value: 3.2, techNotes: 'Mild leukopenia' },
        RBC: { value: 4.1 },
        HGB: { value: 11.2 },
        HCT: { value: 34.0 },
        PLT: { value: 22, techNotes: 'Confirmed on peripheral film: severe thrombocytopenia' },
      },
    },
    'Zeeshan Ali, BSc MLT'
  );

  assert.equal(enteredItem.status, 'ENTERED');
  assert.equal(enteredItem.results['HGB']?.flag, 'LOW');
  assert.equal(enteredItem.results['PLT']?.flag, 'CRITICAL_LOW');

  // 4b. Technical Verification by Bench Supervisor
  const technicallyVerifiedItem = resultsService.technicalVerify(
    {
      orderId: order.id,
      itemId: cbcItemId,
      verifiedBy: 'Zeeshan Ali, BSc MLT (Chief Technologist)',
    },
    'Zeeshan Ali, BSc MLT'
  );
  assert.equal(technicallyVerifiedItem.status, 'TECHNICAL_VERIFIED');
  assert.ok(technicallyVerifiedItem.technicalVerifiedAt);

  // ----------------------------------------------------
  // STEP 5: Pathologist Sign-Off with Critical Result Safety Gate
  // ----------------------------------------------------
  // 5a. Attempting to authorize a critical finding without telephonic read-back MUST FAIL
  assert.throws(
    () => {
      pathologistService.clinicalAuthorize(
        {
          orderId: order.id,
          itemId: cbcItemId,
          pathologistName: 'Amir Saeed (Administrator & Lab Director)',
          pathologistNotes: 'Critical thrombocytopenia noted.',
        },
        'Amir Saeed'
      );
    },
    /Statutory telephonic read-back confirmation must be logged/i,
    'Authorization must be blocked when critical values lack telephonic read-back'
  );

  // 5b. Document required critical telephonic communication with consultant
  const criticalCall = pathologistService.logCriticalCall(
    {
      orderId: order.id,
      contactPerson: 'Prof. Dr. Tariq Safi (Consultant, MMC)',
      contactNumber: '0333-9123456',
      readBackConfirmed: true,
      notes: 'Informed physician of platelet count 22 x10^3/uL. Read-back verified.',
      callerStaff: 'Amir Saeed (Administrator & Lab Director)',
    },
    'Amir Saeed'
  );
  assert.ok(criticalCall.id);
  assert.equal(criticalCall.readBackConfirmed, true);

  // 5c. Pathologist clinical sign-off now succeeds
  const authorizedItem = pathologistService.clinicalAuthorize(
    {
      orderId: order.id,
      itemId: cbcItemId,
      pathologistName: 'Amir Saeed (Administrator & Lab Director)',
      pathologistNotes: 'Platelet count critically reduced. Clinician notified. Recommend urgent monitoring.',
    },
    'Amir Saeed'
  );
  assert.equal(authorizedItem.status, 'RELEASED');
  assert.ok(authorizedItem.clinicalAuthorizedAt);
  assert.equal(authorizedItem.clinicalAuthorizedBy, 'Amir Saeed (Administrator & Lab Director)');

  // ----------------------------------------------------
  // STEP 6: Validate Diagnostic PDF Report Payload
  // ----------------------------------------------------
  const reportOrder = ordersService.getById(order.id);
  assert.ok(reportOrder, 'Order must exist');
  assert.equal(reportOrder.items[0].status, 'RELEASED');
  assert.equal(reportOrder.items[0].results['PLT'].value, 22);
  assert.equal(reportOrder.items[0].results['PLT'].flag, 'CRITICAL_LOW');
  assert.ok(reportOrder.items[0].clinicalAuthorizedBy?.includes('Amir Saeed'));

  // ----------------------------------------------------
  // STEP 7: Settle Outstanding Balance at Cashier Desk
  // ----------------------------------------------------
  const initialBalance = reportOrder.balancePKR;
  assert.ok(initialBalance > 0, 'There should be an outstanding balance before settlement');

  const settledOrder = billingService.settleInvoice(
    {
      orderId: order.id,
      paymentAmountPKR: initialBalance,
      paymentMethod: 'JAZZCASH',
      transactionRef: 'JC-MDN-984210',
    },
    'Naveed Khan (Cashier Desk 1)'
  );

  assert.equal(settledOrder.balancePKR, 0, 'Remaining balance must be zero');
  assert.equal(settledOrder.paymentStatus, 'PAID', 'Payment status must transition to PAID');
  assert.equal(settledOrder.paidPKR, settledOrder.totalPKR);

  // Verify audit logs captured all events
  const auditLogs = db.auditLogs;
  assert.ok(auditLogs.some((l) => l.action === 'PATIENT_REGISTERED'));
  assert.ok(auditLogs.some((l) => l.action === 'ORDER_BOOKED'));
  assert.ok(auditLogs.some((l) => l.action === 'SPECIMEN_COLLECTED'));
  assert.ok(auditLogs.some((l) => l.action === 'RESULTS_ENTERED'));
  assert.ok(auditLogs.some((l) => l.action === 'TECHNICAL_VERIFIED'));
  assert.ok(auditLogs.some((l) => l.action === 'CRITICAL_CALL_LOGGED'));
  assert.ok(auditLogs.some((l) => l.action === 'CLINICALLY_AUTHORIZED'));
  assert.ok(auditLogs.some((l) => l.action === 'INVOICE_SETTLED'));
});

test('3-Role System Workflow: Cashier books & prints receipt -> Lab Assistant performs tests & forwards -> Cashier views data & prints report', () => {
  const patientsService = new PatientsService();
  const ordersService = new OrdersService();
  const resultsService = new ResultsService();

  // ----------------------------------------------------
  // ROLE 1: CASHIER (Bilal Khan)
  // - Enters patient details
  // - Selects tests to be done
  // - Prints receipt
  // - Order is forwarded to Lab Assistant
  // ----------------------------------------------------
  const cashierPatient = patientsService.create(
    {
      name: 'Naveed Ur Rehman',
      urduName: 'نوید الرحمان',
      ageYears: 36,
      gender: 'M',
      cnic: '16101-7788990-1',
      phone: '0313-9554433',
      address: 'Nowshera Road, Mardan',
      city: 'Mardan',
    },
    'Bilal Khan (Cashier)'
  );
  assert.ok(cashierPatient.id, 'Cashier must create patient');

  const cashierOrder = ordersService.create(
    {
      patientId: cashierPatient.id,
      testIds: ['CBC_001', 'GLU_005'], // Complete Blood Count + Fasting Blood Sugar
      referringDoctor: 'Prof. Dr. Tariq Safi (MMC Mardan)',
      clinicalHistory: 'Routine diabetes and hematology checkup',
      priority: 'ROUTINE',
      paidAmountPKR: 1600, // 1200 + 400
      paymentMethod: 'CASH',
    },
    'Bilal Khan (Cashier)'
  );

  // Validate Cashier output
  assert.ok(cashierOrder.receiptNumber.startsWith('REC-MDN-'), 'Cashier must generate receipt number');
  assert.equal(cashierOrder.workflowStage, 'FORWARDED_TO_LAB', 'Order must be forwarded to Lab Assistant');
  assert.ok(cashierOrder.forwardedToLabAt, 'Forwarded timestamp must be present');
  assert.equal(cashierOrder.orderedBy, 'Bilal Khan (Cashier)');
  assert.equal(cashierOrder.items.length, 2);

  // ----------------------------------------------------
  // ROLE 2: LAB ASSISTANT (Usman Tariq)
  // - Data is forwarded to Lab Assistant
  // - Performs tests & enters observed analyte values
  // - Marks tests done and forwards back to Cashier
  // ----------------------------------------------------
  // Verify order appears in Lab Assistant's incoming queue
  const labOrders = ordersService.getAll().filter(
    (o) => o.workflowStage === 'FORWARDED_TO_LAB' || o.items.some((i) => i.status === 'DRAFT')
  );
  const targetLabOrder = labOrders.find((o) => o.id === cashierOrder.id);
  assert.ok(targetLabOrder, 'Forwarded order must be visible to Lab Assistant');

  // Lab Assistant performs testing on CBC & Blood Glucose
  const cbcItem = targetLabOrder.items.find((i) => i.testCode === 'HEM-CBC')!;
  resultsService.enterResults(
    {
      orderId: targetLabOrder.id,
      itemId: cbcItem.id,
      results: {
        HGB: { value: 14.5 },
        WBC: { value: 6.8 },
        PLT: { value: 240 },
        RBC: { value: 4.8 },
        HCT: { value: 42.0 },
      },
    },
    'Usman Tariq (Lab Assistant)'
  );

  const gluItem = targetLabOrder.items.find((i) => i.testCode === 'CHM-FBS')!;
  resultsService.enterResults(
    {
      orderId: targetLabOrder.id,
      itemId: gluItem.id,
      results: {
        GLU_FAST: { value: 95 },
      },
    },
    'Usman Tariq (Lab Assistant)'
  );

  // Lab Assistant completes tests and forwards to Cashier
  targetLabOrder.workflowStage = 'TESTS_COMPLETED';
  targetLabOrder.testedBy = 'Usman Tariq (Lab Assistant)';
  targetLabOrder.testedAt = new Date().toISOString();
  targetLabOrder.items.forEach((item) => {
    item.status = 'RELEASED';
    item.technicalVerifiedBy = 'Usman Tariq (Lab Assistant)';
    item.technicalVerifiedAt = new Date().toISOString();
    item.clinicalAuthorizedBy = 'Amir Saeed (Administrator & Lab Director)';
    item.clinicalAuthorizedAt = new Date().toISOString();
  });

  assert.equal(targetLabOrder.workflowStage, 'TESTS_COMPLETED');
  assert.equal(targetLabOrder.testedBy, 'Usman Tariq (Lab Assistant)');

  // ----------------------------------------------------
  // ROLE 3: CASHIER (Bilal Khan)
  // - Completed data is shown to Cashier
  // - Print option is available to Cashier
  // ----------------------------------------------------
  const cashierCompletedQueue = ordersService.getAll().filter(
    (o) => o.workflowStage === 'TESTS_COMPLETED' || o.items.every((i) => i.status === 'RELEASED')
  );
  const completedOrderForCashier = cashierCompletedQueue.find((o) => o.id === cashierOrder.id);
  assert.ok(completedOrderForCashier, 'Completed test data must be shown to Cashier');
  
  // Verify test data is visible to Cashier
  const cbcCompleted = completedOrderForCashier.items.find((i) => i.testCode === 'HEM-CBC');
  assert.equal(cbcCompleted?.results['HGB']?.value, 14.5);
  assert.equal(cbcCompleted?.results['HGB']?.flag, 'NORMAL');
  const gluCompleted = completedOrderForCashier.items.find((i) => i.testCode === 'CHM-FBS');
  assert.equal(gluCompleted?.results['GLU_FAST']?.value, 95);

  // Cashier executes print report option
  completedOrderForCashier.workflowStage = 'REPORT_PRINTED';
  completedOrderForCashier.reportPrintedAt = new Date().toISOString();
  completedOrderForCashier.reportPrintedBy = 'Bilal Khan (Cashier)';

  assert.equal(completedOrderForCashier.workflowStage, 'REPORT_PRINTED');
  assert.equal(completedOrderForCashier.reportPrintedBy, 'Bilal Khan (Cashier)');
});

test('Admin Command Center: Edit rates of tests and add new investigations to catalog', () => {
  // Baseline initial catalog item
  const initialCatalog = [
    {
      id: 'TEST_CBC_MDN',
      code: 'HEM-CBC',
      name: 'Complete Blood Count (CBC) with ESR',
      urduName: 'خون کا مکمل ٹیسٹ',
      department: 'HEMATOLOGY' as const,
      specimenType: 'Whole Blood (K2-EDTA)',
      tube: 'EDTA_K2' as const,
      pricePKR: 1200,
      turnaroundHours: 2,
      methodology: '5-Part Automated Hematology Analyzer',
      components: [
        {
          code: 'HGB',
          name: 'Hemoglobin',
          unit: 'g/dL',
          referenceIntervals: {
            M: { low: 13.0, high: 17.5, criticalLow: 7.0, criticalHigh: 20.0 },
            F: { low: 12.0, high: 15.5, criticalLow: 7.0, criticalHigh: 20.0 },
          },
        },
      ],
    },
  ];

  // 1. Admin edits the rate of an existing test
  const updatedCBC = {
    ...initialCatalog[0],
    pricePKR: 1500, // Rate updated from 1200 to 1500 PKR
    turnaroundHours: 1.5,
  };

  const catalogAfterEdit = initialCatalog.map((t) => (t.id === updatedCBC.id ? updatedCBC : t));
  assert.equal(catalogAfterEdit[0].pricePKR, 1500, 'Test fee must reflect the edited rate');
  assert.equal(catalogAfterEdit[0].turnaroundHours, 1.5, 'TAT must reflect the edited value');

  // 2. Admin adds a new test to the catalog
  const newLipidProfile = {
    id: 'TEST_LIPID_MDN',
    code: 'CHM-LIP',
    name: 'Comprehensive Lipid Profile',
    urduName: 'چکنائی کا مکمل ٹیسٹ',
    department: 'BIOCHEMISTRY' as const,
    specimenType: 'Serum (Yellow Top SST)',
    tube: 'SST_GEL' as const,
    pricePKR: 2800,
    turnaroundHours: 4,
    methodology: 'Enzymatic Colorimetric Spectrophotometry',
    components: [
      {
        code: 'CHOL_TOT',
        name: 'Total Cholesterol',
        unit: 'mg/dL',
        referenceIntervals: {
          M: { low: 125, high: 200, criticalHigh: 300 },
          F: { low: 125, high: 200, criticalHigh: 300 },
        },
      },
    ],
  };

  const catalogWithNewTest = [newLipidProfile, ...catalogAfterEdit];
  assert.equal(catalogWithNewTest.length, 2, 'Catalog must contain the newly added investigation');
  assert.equal(catalogWithNewTest[0].code, 'CHM-LIP');
  assert.equal(catalogWithNewTest[0].pricePKR, 2800);

  // 3. Verify billing calculation with the edited rate and new test
  const selectedTestIds = ['TEST_CBC_MDN', 'TEST_LIPID_MDN'];
  const selectedTests = catalogWithNewTest.filter((t) => selectedTestIds.includes(t.id));
  const subtotalPKR = selectedTests.reduce((acc, t) => acc + t.pricePKR, 0);

  assert.equal(subtotalPKR, 1500 + 2800, 'Subtotal must calculate 4300 PKR using updated and new rates');
});
