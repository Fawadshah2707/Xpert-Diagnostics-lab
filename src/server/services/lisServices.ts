/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Patient,
  LabOrder,
  OrderItem,
  SpecimenRecord,
  QCResult,
  CriticalCallLog,
  AuditEvent,
  SpecimenStatus,
  UserRole,
} from '../../types/lis';
import {
  CreatePatientDto,
  CreateOrderDto,
  UpdateSpecimenStatusDto,
  EnterResultsDto,
  TechnicalVerifyDto,
  ClinicalAuthorizeDto,
  SettleInvoiceDto,
  CreateQcDto,
  LogCriticalCallDto,
} from '../dtos';
import { MARDAN_PATIENTS, MARDAN_INITIAL_ORDERS } from '../seed/seedData';
import { INITIAL_QC_RESULTS, INITIAL_INVENTORY, INITIAL_CRITICAL_CALLS, INITIAL_AUDIT_LOGS } from '../../data/initialData';
import { CLINICAL_CATALOG } from '../../data/clinicalCatalog';
import {
  generateAccessionNumber,
  generateMRN,
  calculateBilling,
  evaluateReferenceInterval,
  evaluateWestgard,
  canTransitionResult,
} from '../../utils/lisLogic';

/**
 * In-memory repository with thread-safe atomic mutations for the local node
 */
class InMemoryDatabase {
  patients: Patient[] = [...MARDAN_PATIENTS];
  orders: LabOrder[] = [...MARDAN_INITIAL_ORDERS];
  qcResults: QCResult[] = [...INITIAL_QC_RESULTS];
  criticalCalls: CriticalCallLog[] = [...INITIAL_CRITICAL_CALLS];
  auditLogs: AuditEvent[] = [...INITIAL_AUDIT_LOGS];

  reset() {
    this.patients = [...MARDAN_PATIENTS];
    this.orders = [...MARDAN_INITIAL_ORDERS];
    this.qcResults = [...INITIAL_QC_RESULTS];
    this.criticalCalls = [...INITIAL_CRITICAL_CALLS];
    this.auditLogs = [...INITIAL_AUDIT_LOGS];
  }
}

export const db = new InMemoryDatabase();

// 1. PATIENTS SERVICE
export class PatientsService {
  getAll(): Patient[] {
    return db.patients;
  }

  getById(id: string): Patient | undefined {
    return db.patients.find((p) => p.id === id);
  }

  search(query: string): Patient[] {
    const q = query.toLowerCase().trim();
    if (!q) return db.patients;
    return db.patients.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        p.mrn.toLowerCase().includes(q) ||
        p.cnic.includes(q)
    );
  }

  create(dto: CreatePatientDto, operator = 'Receptionist (Xpert Labs Mardan)'): Patient {
    const sequence = db.patients.length + 405;
    const mrn = generateMRN(sequence, 2026);

    const newPatient: Patient = {
      id: `PAT_MDN_${Date.now()}`,
      mrn,
      name: dto.name.trim(),
      urduName: dto.urduName?.trim() || undefined,
      ageYears: dto.ageYears,
      gender: dto.gender,
      cnic: dto.cnic.trim(),
      phone: dto.phone.trim(),
      email: dto.email?.trim() || undefined,
      address: dto.address.trim(),
      city: dto.city.trim() || 'Mardan',
      registeredAt: new Date().toISOString(),
      registeredBy: operator,
    };

    db.patients.unshift(newPatient);
    AuditService.log('PATIENT_REGISTERED', 'Patient', newPatient.id, `Registered patient ${newPatient.name} (${newPatient.mrn}).`, operator);
    return newPatient;
  }
}

// 2. ORDERS SERVICE
export class OrdersService {
  getAll(): LabOrder[] {
    return db.orders;
  }

  getById(id: string): LabOrder | undefined {
    return db.orders.find((o) => o.id === id);
  }

  getByAccession(accession: string): LabOrder | undefined {
    return db.orders.find((o) => o.accessionNumber.toUpperCase() === accession.toUpperCase());
  }

  create(dto: CreateOrderDto, operator = 'Receptionist (Xpert Labs Mardan)'): LabOrder {
    const patient = db.patients.find((p) => p.id === dto.patientId);
    if (!patient) {
      throw new Error(`Patient with ID ${dto.patientId} does not exist.`);
    }

    const selectedTests = CLINICAL_CATALOG.filter((t) => dto.testIds.includes(t.id));
    if (selectedTests.length === 0) {
      throw new Error('At least one valid laboratory test must be selected.');
    }

    const accessionSeq = db.orders.length + 104;
    const accessionNumber = `XPT-2026-${String(accessionSeq).padStart(4, '0')}`;

    // Billing calculation
    const billing = calculateBilling(
      selectedTests.map((t) => ({ pricePKR: t.pricePKR })),
      dto.discountPercent || 0,
      dto.discountFixedPKR || 0,
      dto.paidAmountPKR || 0
    );

    // Group required specimens
    const requiredTubes = new Set(selectedTests.map((t) => t.tube));
    const specimens: SpecimenRecord[] = Array.from(requiredTubes).map((tube, idx) => ({
      id: `SPEC_${Date.now()}_${idx}`,
      barcode: `${accessionNumber}-${tube.split('_')[0]}`,
      tube,
      tubeLabel: `${tube.replace('_', ' ')} (${selectedTests.find((t) => t.tube === tube)?.specimenType || 'Specimen'})`,
      department: selectedTests.find((t) => t.tube === tube)?.department || 'HEMATOLOGY',
      status: 'PENDING_COLLECTION',
    }));

    const items: OrderItem[] = selectedTests.map((t, idx) => ({
      id: `ITEM_${Date.now()}_${idx}`,
      testId: t.id,
      testCode: t.code,
      testName: t.name,
      department: t.department,
      pricePKR: t.pricePKR,
      status: 'DRAFT',
      isOutsourced: Boolean(t.isOutsourced),
      referenceLabName: t.referenceLabName,
      results: {},
    }));

    const newOrder: LabOrder = {
      id: `ORD_MDN_${Date.now()}`,
      accessionNumber,
      patientId: patient.id,
      patient,
      referringDoctor: dto.referringDoctor || 'Self Referred / Consultant Physician',
      referringHospital: dto.referringHospital || 'Mardan Medical Complex',
      clinicalHistory: dto.clinicalHistory,
      priority: dto.priority || 'ROUTINE',
      orderedAt: new Date().toISOString(),
      orderedBy: operator,
      items,
      specimens,
      subtotalPKR: billing.subtotalPKR,
      discountPKR: billing.discountPKR,
      discountReason: dto.discountReason,
      taxPKR: billing.taxPKR,
      totalPKR: billing.totalPKR,
      paidPKR: dto.paidAmountPKR,
      balancePKR: billing.balancePKR,
      paymentMethod: dto.paymentMethod,
      paymentStatus: billing.paymentStatus,
      receiptNumber: `REC-MDN-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      workflowStage: 'FORWARDED_TO_LAB',
      forwardedToLabAt: new Date().toISOString(),
    };

    db.orders.unshift(newOrder);
    AuditService.log('ORDER_BOOKED', 'LabOrder', newOrder.id, `Booked order ${newOrder.accessionNumber} for ${patient.name}. Gross: ${billing.subtotalPKR} PKR, Paid: ${dto.paidAmountPKR} PKR.`, operator);
    return newOrder;
  }
}

// 3. SPECIMENS SERVICE
export class SpecimensService {
  updateStatus(dto: UpdateSpecimenStatusDto, operator = 'Farhan Ullah (Phlebotomist)'): SpecimenRecord {
    let targetSpecimen: SpecimenRecord | undefined;
    let targetOrder: LabOrder | undefined;

    for (const order of db.orders) {
      const match = order.specimens.find((s) => s.id === dto.specimenId);
      if (match) {
        targetSpecimen = match;
        targetOrder = order;
        break;
      }
    }

    if (!targetSpecimen || !targetOrder) {
      throw new Error(`Specimen with ID ${dto.specimenId} not found.`);
    }

    targetSpecimen.status = dto.status;
    if (dto.rejectionReason) {
      targetSpecimen.rejectionReason = dto.rejectionReason;
    }
    if (dto.status === 'COLLECTED') {
      targetSpecimen.collectedAt = new Date().toISOString();
      targetSpecimen.collectedBy = dto.collectorName || operator;
    } else if (dto.status === 'RECEIVED_IN_LAB') {
      targetSpecimen.receivedAt = new Date().toISOString();
      targetSpecimen.receivedBy = operator;
    }

    AuditService.log(
      `SPECIMEN_${dto.status}`,
      'Specimen',
      targetSpecimen.id,
      `Specimen ${targetSpecimen.barcode} transition to ${dto.status}.${dto.rejectionReason ? ` Reason: ${dto.rejectionReason}` : ''}`,
      operator
    );

    return targetSpecimen;
  }
}

// 4. RESULTS SERVICE
export class ResultsService {
  enterResults(dto: EnterResultsDto, operator = 'Zeeshan Ali, BSc MLT (Chief Technologist)'): OrderItem {
    const order = db.orders.find((o) => o.id === dto.orderId);
    if (!order) throw new Error(`Order ${dto.orderId} not found.`);

    const item = order.items.find((i) => i.id === dto.itemId);
    if (!item) throw new Error(`Test item ${dto.itemId} not found.`);

    const catalogTest = CLINICAL_CATALOG.find((t) => t.id === item.testId);

    // Calculate reference intervals and flags
    const formattedResults: OrderItem['results'] = {};
    for (const [key, raw] of Object.entries(dto.results)) {
      const componentDef = catalogTest?.components.find((c) => c.key === key);
      const evalRes = evaluateReferenceInterval(
        raw.value,
        order.patient.gender as 'M' | 'F',
        order.patient.ageYears,
        componentDef?.refIntervals || []
      );

      formattedResults[key] = {
        value: raw.value,
        flag: evalRes.flag,
        unit: componentDef?.unit || '',
        refRangeText: evalRes.refRangeText,
        instrumentId: raw.instrumentId || catalogTest?.methodology.split('(')[1]?.replace(')', '') || 'Manual Bench',
        techNotes: raw.techNotes,
      };
    }

    item.results = formattedResults;
    if (dto.microbiologyData) {
      item.microbiologyData = dto.microbiologyData;
    }
    item.status = 'ENTERED';

    AuditService.log('RESULTS_ENTERED', 'OrderItem', item.id, `Results entered for ${item.testName} on ${order.accessionNumber}.`, operator);
    return item;
  }

  technicalVerify(dto: TechnicalVerifyDto, operator = 'Zeeshan Ali, BSc MLT (Supervisor)'): OrderItem {
    const order = db.orders.find((o) => o.id === dto.orderId);
    if (!order) throw new Error(`Order ${dto.orderId} not found.`);

    const item = order.items.find((i) => i.id === dto.itemId);
    if (!item) throw new Error(`Test item ${dto.itemId} not found.`);

    const transitionCheck = canTransitionResult(item.status, 'TECHNICAL_VERIFIED', 'DEPARTMENT_SUPERVISOR');
    if (!transitionCheck.allowed) {
      throw new Error(transitionCheck.reason || 'Technical verification not allowed.');
    }

    item.status = 'TECHNICAL_VERIFIED';
    item.technicalVerifiedBy = dto.verifiedBy || operator;
    item.technicalVerifiedAt = new Date().toISOString();

    AuditService.log('TECHNICAL_VERIFIED', 'OrderItem', item.id, `First-tier technical verification signed by ${item.technicalVerifiedBy}.`, operator);
    return item;
  }
}

// 5. PATHOLOGIST SERVICE
export class PathologistService {
  clinicalAuthorize(dto: ClinicalAuthorizeDto, operator = 'Amir Saeed (Administrator & Lab Director)'): OrderItem {
    const order = db.orders.find((o) => o.id === dto.orderId);
    if (!order) throw new Error(`Order ${dto.orderId} not found.`);

    const item = order.items.find((i) => i.id === dto.itemId);
    if (!item) throw new Error(`Item ${dto.itemId} not found.`);

    // Check critical flags
    const hasCritical = Object.values(item.results).some(
      (r) => r.flag === 'CRITICAL_LOW' || r.flag === 'CRITICAL_HIGH'
    );

    const callLogged = db.criticalCalls.some(
      (c) => c.orderId === order.id && c.readBackConfirmed
    );

    if (hasCritical && !callLogged) {
      throw new Error('Clinical authorization locked: Statutory telephonic read-back confirmation must be logged for critical findings before release.');
    }

    item.status = 'RELEASED';
    item.clinicalAuthorizedBy = dto.pathologistName || operator;
    item.clinicalAuthorizedAt = new Date().toISOString();
    item.pathologistNotes = dto.pathologistNotes;

    AuditService.log('CLINICALLY_AUTHORIZED', 'OrderItem', item.id, `Consultant Pathologist clinically authorized and released report for ${item.testName}.`, operator);
    return item;
  }

  logCriticalCall(dto: LogCriticalCallDto, operator = 'Staff Technologist'): CriticalCallLog {
    const order = db.orders.find((o) => o.id === dto.orderId);
    if (!order) throw new Error(`Order ${dto.orderId} not found.`);

    const newLog: CriticalCallLog = {
      id: `CALL_MDN_${Date.now()}`,
      orderId: order.id,
      accessionNumber: order.accessionNumber,
      patientName: order.patient.name,
      testName: order.items.map((i) => i.testName).join(', '),
      criticalResultDetails: 'Critical finding reported immediately to physician.',
      contactPerson: dto.contactPerson,
      contactNumber: dto.contactNumber,
      readBackConfirmed: dto.readBackConfirmed,
      callTimestamp: new Date().toISOString(),
      callerStaff: dto.callerStaff || operator,
      notes: dto.notes,
    };

    db.criticalCalls.unshift(newLog);
    AuditService.log('CRITICAL_CALL_LOGGED', 'CriticalCallLog', newLog.id, `Documented telephonic read-back with ${dto.contactPerson} for ${order.accessionNumber}.`, operator);
    return newLog;
  }
}

// 6. BILLING SERVICE
export class BillingService {
  settleInvoice(dto: SettleInvoiceDto, operator = 'Cashier (Xpert Labs Mardan)'): LabOrder {
    const order = db.orders.find((o) => o.id === dto.orderId);
    if (!order) throw new Error(`Order with ID ${dto.orderId} not found.`);

    const additionalPaid = Math.max(0, dto.paymentAmountPKR);
    order.paidPKR += additionalPaid;
    order.balancePKR = Math.max(0, order.totalPKR - order.paidPKR);

    if (order.balancePKR === 0) {
      order.paymentStatus = 'PAID';
    } else {
      order.paymentStatus = 'PARTIAL';
    }

    AuditService.log('INVOICE_SETTLED', 'LabOrder', order.id, `Received ${additionalPaid} PKR via ${dto.paymentMethod}. Remaining balance: ${order.balancePKR} PKR.`, operator);
    return order;
  }

  getShiftSummary() {
    const totalInvoiced = db.orders.reduce((sum, o) => sum + o.totalPKR, 0);
    const totalCollected = db.orders.reduce((sum, o) => sum + o.paidPKR, 0);
    const totalReceivables = db.orders.reduce((sum, o) => sum + o.balancePKR, 0);
    const totalDiscounts = db.orders.reduce((sum, o) => sum + o.discountPKR, 0);

    const cash = db.orders.filter((o) => o.paymentMethod === 'CASH').reduce((sum, o) => sum + o.paidPKR, 0);
    const card = db.orders.filter((o) => o.paymentMethod === 'CARD').reduce((sum, o) => sum + o.paidPKR, 0);
    const jazzcash = db.orders.filter((o) => o.paymentMethod === 'JAZZCASH').reduce((sum, o) => sum + o.paidPKR, 0);
    const easypaisa = db.orders.filter((o) => o.paymentMethod === 'EASYPAISA').reduce((sum, o) => sum + o.paidPKR, 0);

    return {
      totalInvoicedPKR: totalInvoiced,
      totalCollectedPKR: totalCollected,
      totalReceivablesPKR: totalReceivables,
      totalDiscountsPKR: totalDiscounts,
      channels: {
        cashPKR: cash,
        cardPKR: card,
        jazzcashPKR: jazzcash,
        easypaisaPKR: easypaisa,
      },
      orderCount: db.orders.length,
    };
  }
}

// 7. QUALITY CONTROL SERVICE
export class QualityControlService {
  getAll(): QCResult[] {
    return db.qcResults;
  }

  recordRun(dto: CreateQcDto, operator = 'Zeeshan Ali (Technologist)'): QCResult {
    const historicalZ = db.qcResults
      .filter((q) => q.analyte === dto.analyte)
      .map((q) => q.zScore);

    const evaluation = evaluateWestgard(dto.measuredValue, dto.targetMean, dto.sd, historicalZ);

    const newQc: QCResult = {
      id: `QC_MDN_${Date.now()}`,
      analyte: dto.analyte,
      department: dto.department as any,
      controlLot: dto.controlLot,
      level: dto.level,
      targetMean: dto.targetMean,
      sd: dto.sd,
      runDate: new Date().toLocaleDateString('en-GB') + ' (Run)',
      measuredValue: dto.measuredValue,
      zScore: evaluation.zScore,
      status: evaluation.status,
      westgardRuleTriggered: evaluation.rule,
      testedBy: dto.testedBy || operator,
      correctiveAction: dto.correctiveAction,
    };

    db.qcResults.unshift(newQc);
    AuditService.log('QC_RECORDED', 'QCResult', newQc.id, `Recorded QC for ${newQc.analyte} (Z = ${newQc.zScore}, Status: ${newQc.status}).`, operator);
    return newQc;
  }
}

// 8. DASHBOARD SERVICE
export class DashboardService {
  getMetrics() {
    let pendingCollection = 0;
    let inTesting = 0;
    let pendingPathologistAuth = 0;
    let releasedReports = 0;

    db.orders.forEach((ord) => {
      if (ord.specimens.some((s) => s.status === 'PENDING_COLLECTION')) {
        pendingCollection += 1;
      }
      ord.items.forEach((it) => {
        if (it.status === 'DRAFT' || it.status === 'ENTERED') inTesting += 1;
        else if (it.status === 'TECHNICAL_VERIFIED') pendingPathologistAuth += 1;
        else if (it.status === 'RELEASED') releasedReports += 1;
      });
    });

    const pendingCritical = db.orders.filter((o) =>
      o.items.some((item) =>
        Object.values(item.results).some((r) => r.flag.includes('CRITICAL'))
      ) &&
      !db.criticalCalls.some((c) => c.orderId === o.id && c.readBackConfirmed)
    ).length;

    return {
      totalOrders: db.orders.length,
      pendingCollection,
      inTesting,
      pendingPathologistAuth,
      releasedReports,
      pendingCriticalCalls: pendingCritical,
      totalRevenuePKR: db.orders.reduce((sum, o) => sum + o.paidPKR, 0),
      totalReceivablesPKR: db.orders.reduce((sum, o) => sum + o.balancePKR, 0),
    };
  }
}

// 9. AUDIT SERVICE
export class AuditService {
  static log(action: string, entityType: string, entityId: string, details: string, actor = 'System'): AuditEvent {
    const event: AuditEvent = {
      id: `AUD_MDN_${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor,
      role: 'ADMINISTRATOR',
      action,
      entityType,
      entityId,
      details,
    };
    db.auditLogs.unshift(event);
    return event;
  }

  static getAll(): AuditEvent[] {
    return db.auditLogs;
  }
}
