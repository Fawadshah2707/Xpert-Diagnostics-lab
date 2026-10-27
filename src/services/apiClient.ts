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
} from '../types/lis';
import {
  CreatePatientDto,
  CreateOrderDto,
  EnterResultsDto,
  TechnicalVerifyDto,
  ClinicalAuthorizeDto,
  SettleInvoiceDto,
  CreateQcDto,
  LogCriticalCallDto,
} from '../server/dtos';

const BASE_URL = '/api/v1';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.error || `HTTP error ${res.status}`);
  }

  return res.json();
}

export const ApiClient = {
  // DASHBOARD
  getDashboard: () => fetchJson<{
    totalOrders: number;
    pendingCollection: number;
    inTesting: number;
    pendingPathologistAuth: number;
    releasedReports: number;
    pendingCriticalCalls: number;
    totalRevenuePKR: number;
    totalReceivablesPKR: number;
  }>('/dashboard'),

  // PATIENTS
  getPatients: (search?: string) =>
    fetchJson<Patient[]>(search ? `/patients?q=${encodeURIComponent(search)}` : '/patients'),
  getPatientById: (id: string) => fetchJson<Patient>(`/patients/${id}`),
  createPatient: (dto: CreatePatientDto) =>
    fetchJson<Patient>('/patients', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  // ORDERS
  getOrders: () => fetchJson<LabOrder[]>('/orders'),
  getOrderById: (id: string) => fetchJson<LabOrder>(`/orders/${id}`),
  createOrder: (dto: CreateOrderDto) =>
    fetchJson<LabOrder>('/orders', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  // SPECIMENS
  updateSpecimenStatus: (
    specimenId: string,
    status: SpecimenStatus,
    rejectionReason?: string,
    collectorName?: string
  ) =>
    fetchJson<SpecimenRecord>(`/specimens/${specimenId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, rejectionReason, collectorName }),
    }),

  // RESULTS
  enterResults: (dto: EnterResultsDto) =>
    fetchJson<OrderItem>('/results/enter', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),
  technicalVerify: (dto: TechnicalVerifyDto) =>
    fetchJson<OrderItem>('/results/verify', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),
  clinicalAuthorize: (dto: ClinicalAuthorizeDto) =>
    fetchJson<OrderItem>('/results/authorize', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),
  logCriticalCall: (dto: LogCriticalCallDto) =>
    fetchJson<CriticalCallLog>('/results/critical-call', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  // REPORTS
  getReportData: (orderId: string) =>
    fetchJson<{
      laboratory: string;
      license: string;
      location: string;
      order: LabOrder;
    }>(`/reports/${orderId}`),

  // BILLING
  settleInvoice: (dto: SettleInvoiceDto) =>
    fetchJson<LabOrder>('/billing/settle', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),
  getBillingSummary: () =>
    fetchJson<{
      totalInvoicedPKR: number;
      totalCollectedPKR: number;
      totalReceivablesPKR: number;
      totalDiscountsPKR: number;
      channels: {
        cashPKR: number;
        cardPKR: number;
        jazzcashPKR: number;
        easypaisaPKR: number;
      };
      orderCount: number;
    }>('/billing/summary'),

  // QC
  getQcHistory: () => fetchJson<QCResult[]>('/qc'),
  recordQcRun: (dto: CreateQcDto) =>
    fetchJson<QCResult>('/qc', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  // AUDIT LOGS
  getAuditLogs: () => fetchJson<AuditEvent[]>('/audit-logs'),

  // SEED
  resetSeedData: () =>
    fetchJson<{
      message: string;
      doctorsCount: number;
      patientsCount: number;
      ordersCount: number;
    }>('/seed/reset', { method: 'POST' }),
};
