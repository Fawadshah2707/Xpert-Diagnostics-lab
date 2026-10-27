/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { OrderPriority, SpecimenStatus, SpecimenTube, UserRole } from '../../types/lis';

// PATIENTS DTOs
export interface CreatePatientDto {
  name: string;
  urduName?: string;
  ageYears: number;
  gender: 'M' | 'F' | 'OTHER';
  cnic: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  referringDoctor?: string;
}

export interface UpdatePatientDto extends Partial<CreatePatientDto> {}

// ORDERS DTOs
export interface CreateOrderDto {
  patientId: string;
  testIds: string[];
  priority: OrderPriority;
  referringDoctor: string;
  referringHospital?: string;
  clinicalHistory?: string;
  discountPercent?: number;
  discountFixedPKR?: number;
  discountReason?: string;
  paymentMethod: 'CASH' | 'CARD' | 'JAZZCASH' | 'EASYPAISA' | 'CORPORATE_CREDIT';
  paidAmountPKR: number;
}

// SPECIMENS DTOs
export interface UpdateSpecimenStatusDto {
  specimenId: string;
  status: SpecimenStatus;
  rejectionReason?: string;
  collectorName?: string;
  volumeMl?: number;
}

// RESULTS DTOs
export interface EnterResultsDto {
  orderId: string;
  itemId: string;
  results: Record<string, {
    value: string | number;
    techNotes?: string;
    instrumentId?: string;
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
  technologistName?: string;
}

export interface TechnicalVerifyDto {
  orderId: string;
  itemId: string;
  verifiedBy: string;
}

export interface ClinicalAuthorizeDto {
  orderId: string;
  itemId: string;
  pathologistName: string;
  pathologistNotes: string;
}

// BILLING DTOs
export interface SettleInvoiceDto {
  orderId: string;
  paymentAmountPKR: number;
  paymentMethod: 'CASH' | 'CARD' | 'JAZZCASH' | 'EASYPAISA' | 'CORPORATE_CREDIT';
  settledBy?: string;
  transactionRef?: string;
  notes?: string;
}

// QUALITY CONTROL DTOs
export interface CreateQcDto {
  analyte: string;
  department: string;
  controlLot: string;
  level: 'LEVEL_1_NORMAL' | 'LEVEL_2_HIGH' | 'LEVEL_3_LOW';
  targetMean: number;
  sd: number;
  measuredValue: number;
  testedBy: string;
  correctiveAction?: string;
}

// CRITICAL CALL DTOs
export interface LogCriticalCallDto {
  orderId: string;
  contactPerson: string;
  contactNumber: string;
  readBackConfirmed: boolean;
  callerStaff: string;
  notes: string;
}
