/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FlagType, ReferenceInterval, ResultStatus, UserRole } from '../types/lis';

/**
 * Generates unique human-readable accession number e.g. ACC-2026-0042
 */
export function generateAccessionNumber(sequence: number, year = 2026): string {
  const padded = String(Math.max(1, sequence)).padStart(4, '0');
  return `ACC-${year}-${padded}`;
}

/**
 * Generates unique Patient MRN e.g. MRN-2026-0182
 */
export function generateMRN(sequence: number, year = 2026): string {
  const padded = String(Math.max(1, sequence)).padStart(4, '0');
  return `MRN-${year}-${padded}`;
}

/**
 * Evaluates a numeric or categorical test observation against clinical reference intervals
 */
export function evaluateReferenceInterval(
  value: number | string,
  gender: 'M' | 'F' | 'OTHER',
  ageYears: number,
  refIntervals: ReferenceInterval[]
): { flag: FlagType; refRangeText: string } {
  if (refIntervals.length === 0) {
    return { flag: 'NORMAL', refRangeText: 'N/A' };
  }

  // Match the most specific interval (gender match or ALL)
  const matchedInterval =
    refIntervals.find(
      (r) =>
        (r.gender === 'ALL' || r.gender === gender) &&
        (r.ageMinYears === undefined || ageYears >= r.ageMinYears) &&
        (r.ageMaxYears === undefined || ageYears <= r.ageMaxYears)
    ) || refIntervals[0];

  // If text or qualitative
  if (typeof value === 'string' || isNaN(Number(value))) {
    const strVal = String(value).toUpperCase().trim();
    const isExplicitNegative =
      strVal.includes('NON-REACTIVE') ||
      strVal.includes('NON REACTIVE') ||
      strVal.includes('NOT DETECTED') ||
      strVal.includes('NEGATIVE') ||
      strVal.includes('NORMAL') ||
      strVal.includes('CLEAR') ||
      strVal.includes('NIL');

    if (isExplicitNegative) {
      return { flag: 'NORMAL', refRangeText: matchedInterval.textInterpretation || 'Negative / Non-Reactive' };
    }

    if (strVal.includes('POSITIVE') || strVal.includes('REACTIVE') || strVal.includes('DETECTED') || strVal.includes('ABNORMAL')) {
      return { flag: 'ABNORMAL', refRangeText: matchedInterval.textInterpretation || 'Non-Reactive / Negative' };
    }
    return { flag: 'NORMAL', refRangeText: matchedInterval.textInterpretation || 'Negative / Normal' };
  }

  const numVal = Number(value);
  const low = matchedInterval.low;
  const high = matchedInterval.high;
  const critLow = matchedInterval.criticalLow;
  const critHigh = matchedInterval.criticalHigh;

  const rangeDisplay =
    low !== undefined && high !== undefined
      ? `${low} - ${high} ${matchedInterval.unit}`
      : matchedInterval.textInterpretation || `${matchedInterval.unit}`;

  // Check critical limits first
  if (critLow !== undefined && numVal <= critLow) {
    return { flag: 'CRITICAL_LOW', refRangeText: rangeDisplay };
  }
  if (critHigh !== undefined && numVal >= critHigh) {
    return { flag: 'CRITICAL_HIGH', refRangeText: rangeDisplay };
  }

  // Check normal reference interval
  if (low !== undefined && numVal < low) {
    return { flag: 'LOW', refRangeText: rangeDisplay };
  }
  if (high !== undefined && numVal > high) {
    return { flag: 'HIGH', refRangeText: rangeDisplay };
  }

  return { flag: 'NORMAL', refRangeText: rangeDisplay };
}

/**
 * Westgard Multirule Evaluation:
 * Evaluates current QC run against target mean, SD, and preceding run Z-scores
 * 1-2s (Warning)
 * 1-3s (Reject)
 * 2-2s (Reject)
 * R-4s (Reject - range between consecutive runs exceeds 4 SD)
 * 4-1s (Reject - 4 consecutive runs on one side of mean > 1 SD)
 * 10-x (Reject - 10 consecutive runs on one side of mean)
 */
export function evaluateWestgard(
  measuredValue: number,
  targetMean: number,
  sd: number,
  historicalZScores: number[] = []
): {
  zScore: number;
  status: 'ACCEPTABLE' | 'WARNING' | 'OUT_OF_CONTROL';
  rule: 'NONE' | '1-2s' | '1-3s' | '2-2s' | 'R-4s' | '4-1s' | '10-x';
  description: string;
} {
  if (sd <= 0) {
    return { zScore: 0, status: 'ACCEPTABLE', rule: 'NONE', description: 'SD cannot be zero or negative.' };
  }

  const z = Number(((measuredValue - targetMean) / sd).toFixed(2));
  const absZ = Math.abs(z);

  // 1-3s check (Random error - Out of control)
  if (absZ >= 3.0) {
    return {
      zScore: z,
      status: 'OUT_OF_CONTROL',
      rule: '1-3s',
      description: `1-3s Rule Violation: Value deviates by ${z} SD (threshold > 3.0). Testing must be held.`,
    };
  }

  // Check with previous run (if available)
  const prevZ = historicalZScores.length > 0 ? historicalZScores[historicalZScores.length - 1] : null;

  // 2-2s check (Systematic error - 2 consecutive values > 2 SD on same side)
  if (absZ >= 2.0 && prevZ !== null && Math.abs(prevZ) >= 2.0 && Math.sign(z) === Math.sign(prevZ)) {
    return {
      zScore: z,
      status: 'OUT_OF_CONTROL',
      rule: '2-2s',
      description: '2-2s Rule Violation: 2 consecutive runs exceeded 2 SD in the same direction.',
    };
  }

  // R-4s check (Random error - Range between current and previous run > 4 SD)
  if (prevZ !== null && Math.abs(z - prevZ) >= 4.0) {
    return {
      zScore: z,
      status: 'OUT_OF_CONTROL',
      rule: 'R-4s',
      description: 'R-4s Rule Violation: Difference between consecutive control runs exceeds 4 SD.',
    };
  }

  // 4-1s check (Systematic error - 4 consecutive runs > 1 SD on same side)
  if (absZ >= 1.0 && historicalZScores.length >= 3) {
    const last3 = historicalZScores.slice(-3);
    const allExceed1 = last3.every((v) => Math.abs(v) >= 1.0 && Math.sign(v) === Math.sign(z));
    if (allExceed1) {
      return {
        zScore: z,
        status: 'OUT_OF_CONTROL',
        rule: '4-1s',
        description: '4-1s Rule Violation: 4 consecutive runs exceeded 1 SD in same direction.',
      };
    }
  }

  // 10-x check (10 consecutive runs on same side of mean)
  if (historicalZScores.length >= 9) {
    const last9 = historicalZScores.slice(-9);
    const allSameSide = last9.every((v) => Math.sign(v) === Math.sign(z));
    if (allSameSide) {
      return {
        zScore: z,
        status: 'OUT_OF_CONTROL',
        rule: '10-x',
        description: '10-x Rule Violation: 10 consecutive runs fell on the same side of the mean.',
      };
    }
  }

  // 1-2s warning check
  if (absZ >= 2.0) {
    return {
      zScore: z,
      status: 'WARNING',
      rule: '1-2s',
      description: '1-2s Warning Rule: Control exceeds 2 SD. Inspect reagent lot and instrument calibration.',
    };
  }

  return {
    zScore: z,
    status: 'ACCEPTABLE',
    rule: 'NONE',
    description: 'Control value within acceptable limits (±2 SD). Analytical run validated.',
  };
}

/**
 * Calculates financial billing breakdown in PKR
 */
export function calculateBilling(
  items: { pricePKR: number }[],
  discountPercent = 0,
  discountFixedPKR = 0,
  paidAmountPKR = 0,
  taxRatePercent = 0
): {
  subtotalPKR: number;
  discountPKR: number;
  taxPKR: number;
  totalPKR: number;
  paidPKR: number;
  balancePKR: number;
  paymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID';
} {
  const subtotalPKR = items.reduce((acc, curr) => acc + (curr.pricePKR || 0), 0);
  
  let discountPKR = 0;
  if (discountPercent > 0) {
    discountPKR = Math.round((subtotalPKR * discountPercent) / 100);
  } else if (discountFixedPKR > 0) {
    discountPKR = Math.min(subtotalPKR, discountFixedPKR);
  }

  const taxableAmount = Math.max(0, subtotalPKR - discountPKR);
  const taxPKR = Math.round((taxableAmount * taxRatePercent) / 100);
  const totalPKR = taxableAmount + taxPKR;
  const paidPKR = Math.max(0, paidAmountPKR);
  const balancePKR = Math.max(0, totalPKR - paidPKR);

  let paymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID' = 'UNPAID';
  if (balancePKR <= 0 && totalPKR > 0) {
    paymentStatus = 'PAID';
  } else if (paidPKR > 0 && balancePKR > 0) {
    paymentStatus = 'PARTIAL';
  }

  return {
    subtotalPKR,
    discountPKR,
    taxPKR,
    totalPKR,
    paidPKR,
    balancePKR,
    paymentStatus,
  };
}

/**
 * Enforces LIS Clinical State-Transition Rules:
 * Strict separation between Technical Verification (by Lab Technologist)
 * and Clinical Authorization (by Consultant Pathologist).
 * Also enforces that failed QC or unacknowledged critical calls block release.
 */
export function canTransitionResult(
  currentStatus: ResultStatus,
  targetStatus: ResultStatus,
  role: UserRole,
  isQcFailed = false,
  hasCriticalUnacknowledged = false
): { allowed: boolean; reason?: string } {
  // Admin can do emergency transitions
  if (role === 'ADMINISTRATOR') {
    return { allowed: true };
  }

  if (currentStatus === targetStatus) {
    return { allowed: true };
  }

  // DRAFT -> ENTERED
  if (currentStatus === 'DRAFT' && targetStatus === 'ENTERED') {
    if (['LAB_TECHNICIAN', 'DEPARTMENT_SUPERVISOR', 'PATHOLOGIST'].includes(role)) {
      return { allowed: true };
    }
    return { allowed: false, reason: 'Only laboratory technical staff can enter analytical results.' };
  }

  // ENTERED -> TECHNICAL_VERIFIED
  if (currentStatus === 'ENTERED' && targetStatus === 'TECHNICAL_VERIFIED') {
    if (!['DEPARTMENT_SUPERVISOR', 'PATHOLOGIST', 'LAB_TECHNICIAN'].includes(role)) {
      return { allowed: false, reason: 'Requires Supervisor or Senior Technologist technical review.' };
    }
    if (isQcFailed) {
      return { allowed: false, reason: 'Technical verification blocked: Active QC failure in this department.' };
    }
    return { allowed: true };
  }

  // TECHNICAL_VERIFIED -> CLINICALLY_AUTHORIZED
  if (currentStatus === 'TECHNICAL_VERIFIED' && targetStatus === 'CLINICALLY_AUTHORIZED') {
    if (role !== 'PATHOLOGIST') {
      return { allowed: false, reason: 'Only a Consultant Pathologist (MBBS, FCPS/M.Phil) can clinically authorize results.' };
    }
    if (hasCriticalUnacknowledged) {
      return { allowed: false, reason: 'Clinical authorization blocked: Critical result must have documented telephonic read-back communication.' };
    }
    return { allowed: true };
  }

  // Cannot jump straight from ENTERED to CLINICALLY_AUTHORIZED without technical verification
  if (currentStatus === 'ENTERED' && targetStatus === 'CLINICALLY_AUTHORIZED') {
    return { allowed: false, reason: 'Two-tier verification protocol: Technical verification by bench technologist is mandatory prior to clinical authorization.' };
  }

  // CLINICALLY_AUTHORIZED -> RELEASED
  if (currentStatus === 'CLINICALLY_AUTHORIZED' && targetStatus === 'RELEASED') {
    if (['PATHOLOGIST', 'DEPARTMENT_SUPERVISOR', 'RECEPTIONIST'].includes(role)) {
      return { allowed: true };
    }
    return { allowed: false, reason: 'User not authorized to release diagnostic reports.' };
  }

  // Allowed holds / repeats
  if (targetStatus === 'ON_HOLD' || targetStatus === 'REPEAT_REQUIRED') {
    if (['LAB_TECHNICIAN', 'DEPARTMENT_SUPERVISOR', 'PATHOLOGIST'].includes(role)) {
      return { allowed: true };
    }
  }

  return { allowed: false, reason: `Invalid clinical state transition from ${currentStatus} to ${targetStatus}.` };
}

/**
 * Parses raw analyzer output text (e.g., Sysmex XN / Mindray / Cobas export)
 * Format can be CSV or key-value ASTM/HL7-like segment
 */
export function parseAnalyzerOutput(rawText: string): Record<string, number | string> {
  const results: Record<string, number | string> = {};
  const lines = rawText.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    // Support CSV: "PARAM,VALUE,UNIT"
    if (trimmed.includes(',')) {
      const parts = trimmed.split(',').map((p) => p.trim());
      if (parts.length >= 2) {
        const key = parts[0];
        const val = isNaN(Number(parts[1])) ? parts[1] : Number(parts[1]);
        results[key] = val;
      }
    } else if (trimmed.includes(':') || trimmed.includes('=')) {
      // Support KEY: VALUE or KEY = VALUE
      const delimiter = trimmed.includes(':') ? ':' : '=';
      const [key, val] = trimmed.split(delimiter).map((s) => s.trim());
      if (key && val) {
        results[key] = isNaN(Number(val)) ? val : Number(val);
      }
    }
  }

  return results;
}
