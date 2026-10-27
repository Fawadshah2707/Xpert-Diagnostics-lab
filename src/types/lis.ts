/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole =
  | 'CASHIER'
  | 'LAB_ASSISTANT'
  | 'ADMINISTRATOR'
  | 'RECEPTIONIST'
  | 'PHLEBOTOMIST'
  | 'LAB_TECHNICIAN'
  | 'DEPARTMENT_SUPERVISOR'
  | 'PATHOLOGIST'
  | 'QUALITY_MANAGER'
  | 'AUDITOR';

export type DepartmentId =
  | 'HEMATOLOGY'
  | 'CHEMISTRY'
  | 'CLINICAL_PATHOLOGY'
  | 'SEROLOGY'
  | 'MICROBIOLOGY'
  | 'COAGULATION'
  | 'HISTOPATHOLOGY'
  | 'ENDOCRINOLOGY'
  | 'REFERRAL';

export type SpecimenTube =
  | 'EDTA_K2' // Purple
  | 'SST_GEL' // Yellow / Gold
  | 'SODIUM_CITRATE' // Light Blue
  | 'SODIUM_FLUORIDE' // Grey
  | 'STERILE_CUP' // Urine/Stool
  | 'HEPARIN' // Green
  | 'PLAIN_RED' // Red
  | 'SWAB_TRANSPORT';

export type SpecimenStatus =
  | 'PENDING_COLLECTION'
  | 'COLLECTED'
  | 'RECEIVED_IN_LAB'
  | 'REJECTED'
  | 'RECOLLECTED';

export type OrderPriority = 'ROUTINE' | 'URGENT' | 'STAT';

export type ResultStatus =
  | 'DRAFT'
  | 'ENTERED'
  | 'TECHNICAL_VERIFIED'
  | 'CLINICALLY_AUTHORIZED'
  | 'RELEASED'
  | 'ON_HOLD'
  | 'REPEAT_REQUIRED'
  | 'CANCELLED';

export type FlagType = 'NORMAL' | 'LOW' | 'HIGH' | 'CRITICAL_LOW' | 'CRITICAL_HIGH' | 'ABNORMAL';

export interface ReferenceInterval {
  gender: 'M' | 'F' | 'ALL';
  ageMinYears?: number;
  ageMaxYears?: number;
  low?: number;
  high?: number;
  criticalLow?: number;
  criticalHigh?: number;
  textInterpretation?: string;
  unit: string;
}

export interface TestCatalogItem {
  id: string;
  code: string;
  name: string;
  urduName?: string;
  department: DepartmentId;
  specimenType: string;
  tube: SpecimenTube;
  pricePKR: number;
  turnaroundHours: number;
  methodology: string;
  isOutsourced?: boolean;
  referenceLabName?: string;
  components: TestComponentDefinition[];
}

export interface TestComponentDefinition {
  key: string;
  name: string;
  unit: string;
  dataType: 'NUMERIC' | 'TEXT' | 'SELECT' | 'MICROBIOLOGY_AST';
  options?: string[];
  refIntervals: ReferenceInterval[];
  decimalPlaces?: number;
  defaultValue?: string | number;
}

export interface Patient {
  id: string;
  mrn: string; // Medical Record Number e.g. MRN-2026-0182
  name: string;
  urduName?: string;
  ageYears: number;
  gender: 'M' | 'F' | 'OTHER';
  cnic: string; // e.g. 37405-1234567-1
  phone: string; // e.g. 0300-1234567
  email?: string;
  address: string;
  city: string;
  registeredAt: string;
  registeredBy: string;
}

export interface OrderItem {
  id: string;
  testId: string;
  testCode: string;
  testName: string;
  department: DepartmentId;
  pricePKR: number;
  status: ResultStatus;
  isOutsourced: boolean;
  referenceLabName?: string;
  referralTrackingNumber?: string;
  referralStatus?: 'DISPATCHED' | 'RECEIVED_BY_REF_LAB' | 'RESULT_INGESTED';
  results: Record<string, {
    value: string | number;
    flag: FlagType;
    unit: string;
    refRangeText: string;
    instrumentId?: string;
    techNotes?: string;
  }>;
  microbiologyData?: {
    organismIsolated: string;
    colonyCount: string;
    antibioticSensitivities: Array<{
      antibiotic: string;
      zoneMm: number;
      interpretation: 'SENSITIVE' | 'INTERMEDIATE' | 'RESISTANT';
    }>;
  };
  technicalVerifiedBy?: string;
  technicalVerifiedAt?: string;
  clinicalAuthorizedBy?: string;
  clinicalAuthorizedAt?: string;
  techNotes?: string;
  pathologistNotes?: string;
}

export interface SpecimenRecord {
  id: string;
  barcode: string; // e.g. ACC-26-8910-E
  tube: SpecimenTube;
  tubeLabel: string;
  department: DepartmentId;
  status: SpecimenStatus;
  collectedAt?: string;
  collectedBy?: string;
  receivedAt?: string;
  receivedBy?: string;
  rejectionReason?: string;
  volumeMl?: number;
}

export interface CriticalCallLog {
  id: string;
  orderId: string;
  accessionNumber: string;
  patientName: string;
  testName: string;
  criticalResultDetails: string;
  contactPerson: string;
  contactNumber: string;
  readBackConfirmed: boolean;
  callTimestamp: string;
  callerStaff: string;
  notes: string;
}

export interface LabOrder {
  id: string;
  accessionNumber: string; // e.g. ACC-2026-0042
  patientId: string;
  patient: Patient;
  referringDoctor: string;
  referringHospital?: string;
  clinicalHistory?: string;
  priority: OrderPriority;
  orderedAt: string;
  orderedBy: string;
  items: OrderItem[];
  specimens: SpecimenRecord[];
  
  // Billing details
  subtotalPKR: number;
  discountPKR: number;
  discountReason?: string;
  discountApprovedBy?: string;
  taxPKR: number;
  totalPKR: number;
  paidPKR: number;
  balancePKR: number;
  paymentMethod: 'CASH' | 'CARD' | 'JAZZCASH' | 'EASYPAISA' | 'CORPORATE_CREDIT';
  paymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID';
  receiptNumber: string;

  // 3-Role Workflow State (Cashier -> Lab Assistant -> Cashier Print)
  workflowStage?: 'FORWARDED_TO_LAB' | 'IN_TESTING' | 'TESTS_COMPLETED' | 'READY_FOR_CASHIER_PRINT' | 'REPORT_PRINTED' | 'DELIVERED';
  forwardedToLabAt?: string;
  testedBy?: string;
  testedAt?: string;
  reportPrintedAt?: string;
  reportPrintedBy?: string;
  deliveredAt?: string;
}

export interface QCResult {
  id: string;
  analyte: string;
  department: DepartmentId;
  controlLot: string;
  level: 'LEVEL_1_NORMAL' | 'LEVEL_2_HIGH' | 'LEVEL_3_LOW';
  targetMean: number;
  sd: number;
  runDate: string;
  measuredValue: number;
  zScore: number;
  westgardRuleTriggered?: 'NONE' | '1-2s' | '1-3s' | '2-2s' | 'R-4s' | '4-1s' | '10-x';
  status: 'ACCEPTABLE' | 'WARNING' | 'OUT_OF_CONTROL';
  testedBy: string;
  reviewedBy?: string;
  correctiveAction?: string;
}

export interface ReagentInventory {
  id: string;
  name: string;
  catalogNumber: string;
  department: DepartmentId;
  lotNumber: string;
  supplier: string;
  expiryDate: string;
  quantityOnHand: number;
  unit: string;
  reorderLevel: number;
  storageCondition: string;
  status: 'IN_USE' | 'QUARANTINED' | 'EXPIRED' | 'RESERVE';
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  actor: string;
  role: UserRole;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  ipAddress?: string;
}

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  title: string;
  department: string;
  email: string;
  licenseNo?: string;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
  loginTime: string;
  expiresAt: number;
}

