/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateAccessionNumber,
  generateMRN,
  evaluateReferenceInterval,
  evaluateWestgard,
  calculateBilling,
  canTransitionResult,
  parseAnalyzerOutput,
} from './lisLogic';
import { ReferenceInterval } from '../types/lis';

test('Accession and MRN generation follow Pakistani LIS conventions', () => {
  assert.equal(generateAccessionNumber(1, 2026), 'ACC-2026-0001');
  assert.equal(generateAccessionNumber(42, 2026), 'ACC-2026-0042');
  assert.equal(generateMRN(182, 2026), 'MRN-2026-0182');
});

test('Reference interval evaluation flags normal, low, high, and critical levels', () => {
  const hbIntervals: ReferenceInterval[] = [
    {
      gender: 'M',
      ageMinYears: 15,
      low: 13.5,
      high: 17.5,
      criticalLow: 7.0,
      criticalHigh: 20.0,
      unit: 'g/dL',
    },
  ];

  // Normal male Hb
  const normalRes = evaluateReferenceInterval(14.8, 'M', 35, hbIntervals);
  assert.equal(normalRes.flag, 'NORMAL');
  assert.equal(normalRes.refRangeText, '13.5 - 17.5 g/dL');

  // Mildly low Hb (anemia)
  const lowRes = evaluateReferenceInterval(11.5, 'M', 35, hbIntervals);
  assert.equal(lowRes.flag, 'LOW');

  // Severe / Critical low Hb (life-threatening)
  const critLowRes = evaluateReferenceInterval(6.2, 'M', 35, hbIntervals);
  assert.equal(critLowRes.flag, 'CRITICAL_LOW');

  // Critical high Hb
  const critHighRes = evaluateReferenceInterval(21.4, 'M', 35, hbIntervals);
  assert.equal(critHighRes.flag, 'CRITICAL_HIGH');

  // Qualitative test (e.g. Hepatitis B Surface Antigen)
  const qualIntervals: ReferenceInterval[] = [
    {
      gender: 'ALL',
      textInterpretation: 'Non-Reactive (Negative)',
      unit: 'index',
    },
  ];

  const posRes = evaluateReferenceInterval('Reactive / Positive', 'F', 28, qualIntervals);
  assert.equal(posRes.flag, 'ABNORMAL');

  const negRes = evaluateReferenceInterval('Non-Reactive', 'F', 28, qualIntervals);
  assert.equal(negRes.flag, 'NORMAL');
});

test('Westgard Multirule Evaluation catches 1-3s, 2-2s, R-4s, and 1-2s warnings', () => {
  const targetMean = 100;
  const sd = 5;

  // Run 1: Acceptable (102 mg/dL = +0.4 SD)
  const res1 = evaluateWestgard(102, targetMean, sd, []);
  assert.equal(res1.status, 'ACCEPTABLE');
  assert.equal(res1.rule, 'NONE');

  // Run 2: 1-2s Warning (111 mg/dL = +2.2 SD)
  const res2 = evaluateWestgard(111, targetMean, sd, [0.4]);
  assert.equal(res2.status, 'WARNING');
  assert.equal(res2.rule, '1-2s');

  // Run 3: 1-3s Reject (116 mg/dL = +3.2 SD)
  const res3 = evaluateWestgard(116, targetMean, sd, [0.4, 2.2]);
  assert.equal(res3.status, 'OUT_OF_CONTROL');
  assert.equal(res3.rule, '1-3s');

  // Run 4: 2-2s Reject (consecutive runs > 2.0 SD in same direction)
  const res4 = evaluateWestgard(112, targetMean, sd, [2.1]);
  assert.equal(res4.status, 'OUT_OF_CONTROL');
  assert.equal(res4.rule, '2-2s');

  // Run 5: R-4s Reject (current = +2.5 SD, previous = -2.1 SD => range = 4.6 SD)
  const res5 = evaluateWestgard(112.5, targetMean, sd, [-2.1]);
  assert.equal(res5.status, 'OUT_OF_CONTROL');
  assert.equal(res5.rule, 'R-4s');
});

test('Billing logic correctly calculates PKR subtotal, discounts, tax, and balances', () => {
  const items = [
    { pricePKR: 1200 }, // Complete Blood Count
    { pricePKR: 800 },  // Liver Function Tests
    { pricePKR: 500 },  // Blood Glucose Fasting
  ];
  // Subtotal = 2500 PKR

  // Scenario 1: 10% senior citizen discount, full cash payment
  const bill1 = calculateBilling(items, 10, 0, 2250, 0);
  assert.equal(bill1.subtotalPKR, 2500);
  assert.equal(bill1.discountPKR, 250);
  assert.equal(bill1.totalPKR, 2250);
  assert.equal(bill1.paidPKR, 2250);
  assert.equal(bill1.balancePKR, 0);
  assert.equal(bill1.paymentStatus, 'PAID');

  // Scenario 2: Partial payment
  const bill2 = calculateBilling(items, 0, 500, 1000, 0);
  assert.equal(bill2.subtotalPKR, 2500);
  assert.equal(bill2.discountPKR, 500);
  assert.equal(bill2.totalPKR, 2000);
  assert.equal(bill2.paidPKR, 1000);
  assert.equal(bill2.balancePKR, 1000);
  assert.equal(bill2.paymentStatus, 'PARTIAL');
});

test('LIS two-tier clinical state machine strictly enforces verification before authorization', () => {
  // Technician can enter draft results
  const t1 = canTransitionResult('DRAFT', 'ENTERED', 'LAB_TECHNICIAN');
  assert.equal(t1.allowed, true);

  // Receptionist CANNOT enter analytical results
  const t2 = canTransitionResult('DRAFT', 'ENTERED', 'RECEPTIONIST');
  assert.equal(t2.allowed, false);

  // Technician CANNOT jump directly from ENTERED to CLINICALLY_AUTHORIZED
  const t3 = canTransitionResult('ENTERED', 'CLINICALLY_AUTHORIZED', 'LAB_TECHNICIAN');
  assert.equal(t3.allowed, false);

  // Supervisor can perform Technical Verification if QC is passing
  const t4 = canTransitionResult('ENTERED', 'TECHNICAL_VERIFIED', 'DEPARTMENT_SUPERVISOR', false);
  assert.equal(t4.allowed, true);

  // Supervisor CANNOT verify if active QC is failed
  const t5 = canTransitionResult('ENTERED', 'TECHNICAL_VERIFIED', 'DEPARTMENT_SUPERVISOR', true);
  assert.equal(t5.allowed, false);

  // Pathologist CANNOT authorize if critical call is unacknowledged
  const t6 = canTransitionResult('TECHNICAL_VERIFIED', 'CLINICALLY_AUTHORIZED', 'PATHOLOGIST', false, true);
  assert.equal(t6.allowed, false);

  // Pathologist CAN authorize once critical result is confirmed and QC passes
  const t7 = canTransitionResult('TECHNICAL_VERIFIED', 'CLINICALLY_AUTHORIZED', 'PATHOLOGIST', false, false);
  assert.equal(t7.allowed, true);
});

test('Analyzer parser converts CSV or key-value instrument feeds into analyte map', () => {
  const csvRaw = `
# Sysmex XN-1000 Automated Hematology Analyzer
WBC,7.4,10^3/uL
RBC,4.82,10^6/uL
HGB,14.2,g/dL
HCT,42.5,%
PLT,245,10^3/uL
  `;

  const parsed = parseAnalyzerOutput(csvRaw);
  assert.equal(parsed['WBC'], 7.4);
  assert.equal(parsed['HGB'], 14.2);
  assert.equal(parsed['PLT'], 245);
});
