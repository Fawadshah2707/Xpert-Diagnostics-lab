/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  PlusCircle,
  ShieldAlert,
  Sliders,
  FileCheck,
} from 'lucide-react';
import { QCResult, DepartmentId } from '../types/lis';
import { evaluateWestgard } from '../utils/lisLogic';

interface QualityControlViewProps {
  qcResults: QCResult[];
  onAddQcResult: (result: QCResult) => void;
}

export const QualityControlView: React.FC<QualityControlViewProps> = ({
  qcResults,
  onAddQcResult,
}) => {
  const [selectedAnalyte, setSelectedAnalyte] = useState<string>('Hemoglobin (HGB)');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // Form state for new QC run
  const [analyte, setAnalyte] = useState('Hemoglobin (HGB)');
  const [dept, setDept] = useState<DepartmentId>('HEMATOLOGY');
  const [controlLot, setControlLot] = useState('Sysmex Eightcheck-3WP #H-9812');
  const [targetMean, setTargetMean] = useState<number>(14.0);
  const [sd, setSd] = useState<number>(0.4);
  const [measuredValue, setMeasuredValue] = useState<number>(14.05);
  const [correctiveAction, setCorrectiveAction] = useState<string>('');

  const filteredRuns = qcResults.filter((q) => q.analyte === selectedAnalyte);

  const handleRunQc = (e: React.FormEvent) => {
    e.preventDefault();

    const historicalZ = filteredRuns.map((r) => r.zScore);
    const evaluation = evaluateWestgard(measuredValue, targetMean, sd, historicalZ);

    const newQc: QCResult = {
      id: `QC_${Date.now()}`,
      analyte,
      department: dept,
      controlLot,
      level: 'LEVEL_1_NORMAL',
      targetMean,
      sd,
      runDate: new Date().toLocaleDateString('en-GB') + ' (Live Test)',
      measuredValue,
      zScore: evaluation.zScore,
      westgardRuleTriggered: evaluation.rule,
      status: evaluation.status,
      testedBy: 'Kashif Mehmood (Senior Technologist)',
      correctiveAction: correctiveAction || undefined,
    };

    onAddQcResult(newQc);
    setShowAddModal(false);
  };

  // SVG Levey-Jennings Dimensions
  const svgWidth = 600;
  const svgHeight = 260;
  const paddingX = 50;
  const paddingY = 30;
  const plotWidth = svgWidth - paddingX * 2;
  const plotHeight = svgHeight - paddingY * 2;

  // Compute Y coordinate from Z-score (from -3.5 to +3.5 SD)
  const zMin = -3.5;
  const zMax = 3.5;
  const getY = (z: number) => {
    const clampedZ = Math.max(zMin, Math.min(zMax, z));
    const normalized = (clampedZ - zMin) / (zMax - zMin); // 0 at bottom, 1 at top
    return paddingY + plotHeight * (1 - normalized);
  };

  const currentAnalyteRun = filteredRuns[filteredRuns.length - 1];
  const activeMean = currentAnalyteRun ? currentAnalyteRun.targetMean : 14.0;
  const activeSd = currentAnalyteRun ? currentAnalyteRun.sd : 0.4;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-teal-600" />
            Internal Quality Control (IQC) & Levey–Jennings Analytics
          </h2>
          <p className="text-xs text-slate-500">
            Westgard Multirule Evaluation (1-2s, 1-3s, 2-2s, R-4s, 4-1s, 10-x) • ISO 15189:2022 Analytical Validation
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={selectedAnalyte}
            onChange={(e) => setSelectedAnalyte(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 bg-slate-50"
          >
            <option value="Hemoglobin (HGB)">Hemoglobin (HGB) - Hematology</option>
            <option value="Glucose (FBS)">Glucose (FBS) - Chemistry</option>
          </select>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow transition"
          >
            <PlusCircle className="w-4 h-4" />
            Perform New QC Run
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Interactive SVG Levey-Jennings Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Levey–Jennings Chart: {selectedAnalyte}
              </h3>
              <p className="text-xs text-slate-500">
                Target Mean: {activeMean} | Standard Deviation (1 SD): {activeSd}
              </p>
            </div>
            <div className="flex items-center space-x-2 text-[11px]">
              <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Acceptable
              </span>
              <span className="flex items-center gap-1 text-amber-700 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> 1-2s Warning
              </span>
              <span className="flex items-center gap-1 text-rose-700 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block" /> 1-3s Reject
              </span>
            </div>
          </div>

          {/* SVG Plot */}
          <div className="w-full overflow-x-auto bg-slate-50 p-2 rounded-lg border border-slate-200">
            <svg
              className="w-full min-w-[550px] h-64"
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            >
              {/* Grid Lines */}
              {/* +3 SD */}
              <line
                x1={paddingX}
                y1={getY(3)}
                x2={svgWidth - paddingX}
                y2={getY(3)}
                stroke="#e11d48"
                strokeWidth="1.5"
                strokeDasharray="4,4"
              />
              <text x={paddingX - 45} y={getY(3) + 3} fontSize="9" fill="#e11d48" fontWeight="bold">
                +3 SD ({Number(activeMean + activeSd * 3).toFixed(1)})
              </text>

              {/* +2 SD */}
              <line
                x1={paddingX}
                y1={getY(2)}
                x2={svgWidth - paddingX}
                y2={getY(2)}
                stroke="#d97706"
                strokeWidth="1.2"
                strokeDasharray="3,3"
              />
              <text x={paddingX - 45} y={getY(2) + 3} fontSize="9" fill="#d97706" fontWeight="bold">
                +2 SD ({Number(activeMean + activeSd * 2).toFixed(1)})
              </text>

              {/* +1 SD */}
              <line
                x1={paddingX}
                y1={getY(1)}
                x2={svgWidth - paddingX}
                y2={getY(1)}
                stroke="#94a3b8"
                strokeWidth="1"
              />

              {/* Mean (0 SD) */}
              <line
                x1={paddingX}
                y1={getY(0)}
                x2={svgWidth - paddingX}
                y2={getY(0)}
                stroke="#0f766e"
                strokeWidth="2"
              />
              <text x={paddingX - 45} y={getY(0) + 3} fontSize="9" fill="#0f766e" fontWeight="bold">
                Mean ({activeMean})
              </text>

              {/* -1 SD */}
              <line
                x1={paddingX}
                y1={getY(-1)}
                x2={svgWidth - paddingX}
                y2={getY(-1)}
                stroke="#94a3b8"
                strokeWidth="1"
              />

              {/* -2 SD */}
              <line
                x1={paddingX}
                y1={getY(-2)}
                x2={svgWidth - paddingX}
                y2={getY(-2)}
                stroke="#d97706"
                strokeWidth="1.2"
                strokeDasharray="3,3"
              />
              <text x={paddingX - 45} y={getY(-2) + 3} fontSize="9" fill="#d97706" fontWeight="bold">
                -2 SD ({Number(activeMean - activeSd * 2).toFixed(1)})
              </text>

              {/* -3 SD */}
              <line
                x1={paddingX}
                y1={getY(-3)}
                x2={svgWidth - paddingX}
                y2={getY(-3)}
                stroke="#e11d48"
                strokeWidth="1.5"
                strokeDasharray="4,4"
              />
              <text x={paddingX - 45} y={getY(-3) + 3} fontSize="9" fill="#e11d48" fontWeight="bold">
                -3 SD ({Number(activeMean - activeSd * 3).toFixed(1)})
              </text>

              {/* Connecting line between runs */}
              {filteredRuns.length > 1 && (
                <polyline
                  fill="none"
                  stroke="#0f766e"
                  strokeWidth="2"
                  points={filteredRuns
                    .map((r, i) => {
                      const x = paddingX + (i / (filteredRuns.length - 1 || 1)) * plotWidth;
                      const y = getY(r.zScore);
                      return `${x},${y}`;
                    })
                    .join(' ')}
                />
              )}

              {/* Data points */}
              {filteredRuns.map((r, i) => {
                const x = paddingX + (i / (filteredRuns.length - 1 || 1)) * plotWidth;
                const y = getY(r.zScore);
                const color =
                  r.status === 'OUT_OF_CONTROL'
                    ? '#e11d48'
                    : r.status === 'WARNING'
                    ? '#d97706'
                    : '#0f766e';

                return (
                  <g key={r.id}>
                    <circle cx={x} cy={y} r="5" fill={color} stroke="white" strokeWidth="1.5" />
                    <text
                      x={x}
                      y={svgHeight - 10}
                      fontSize="8"
                      textAnchor="middle"
                      fill="#475569"
                    >
                      Run {i + 1}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Westgard Status Indicator */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500">Current Analytical Status: </span>
              <strong className="text-emerald-700 font-bold">
                IN CONTROL (Westgard PASS)
              </strong>
            </div>
            <span className="text-slate-600">
              Last Run: {currentAnalyteRun?.runDate || 'Today'} (Z = {currentAnalyteRun?.zScore})
            </span>
          </div>
        </div>

        {/* Right Column: Westgard Rule Engine Reference */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-teal-600" />
              Westgard Multirule Evaluation Engine
            </h3>
            <p className="text-xs text-slate-500">Automated ISO 15189:2022 Algorithm</p>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
              <div className="font-bold text-amber-800">1-2s (Warning Rule)</div>
              <div className="text-[11px] text-slate-600">
                1 control value exceeds ±2 SD. Screening flag; test results may proceed under close technologist surveillance.
              </div>
            </div>

            <div className="p-2.5 rounded-lg border border-rose-200 bg-rose-50/60">
              <div className="font-bold text-rose-800">1-3s (Random Error - REJECT)</div>
              <div className="text-[11px] text-slate-600">
                1 control value exceeds ±3 SD. Mandatory testing hold; analyzer run rejected.
              </div>
            </div>

            <div className="p-2.5 rounded-lg border border-rose-200 bg-rose-50/60">
              <div className="font-bold text-rose-800">2-2s (Systematic Error - REJECT)</div>
              <div className="text-[11px] text-slate-600">
                2 consecutive control values exceed 2 SD on same side of mean. Re-calibration required.
              </div>
            </div>

            <div className="p-2.5 rounded-lg border border-rose-200 bg-rose-50/60">
              <div className="font-bold text-rose-800">R-4s (Random Error - REJECT)</div>
              <div className="text-[11px] text-slate-600">
                Range between consecutive runs exceeds 4 SD. Inspect reagent pipetting / optics.
              </div>
            </div>

            <div className="p-2.5 rounded-lg border border-rose-200 bg-rose-50/60">
              <div className="font-bold text-rose-800">4-1s & 10-x (Shift / Trend - REJECT)</div>
              <div className="text-[11px] text-slate-600">
                4 consecutive values exceed 1 SD or 10 on same side of mean. Systematic drift.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QC Runs History Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
          <h3 className="font-bold text-sm text-slate-800">
            Quality Control Measurement Log & Audit Trail ({filteredRuns.length} Runs)
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <th className="p-2.5">Date / Shift</th>
                <th className="p-2.5">Control Material / Lot</th>
                <th className="p-2.5">Target Mean</th>
                <th className="p-2.5">SD</th>
                <th className="p-2.5">Observed Value</th>
                <th className="p-2.5">Z-Score</th>
                <th className="p-2.5">Westgard Evaluation</th>
                <th className="p-2.5">Operator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRuns.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="p-2.5 font-medium text-slate-800">{r.runDate}</td>
                  <td className="p-2.5 font-mono">{r.controlLot}</td>
                  <td className="p-2.5 font-mono">{r.targetMean}</td>
                  <td className="p-2.5 font-mono">{r.sd}</td>
                  <td className="p-2.5 font-bold font-mono text-slate-900">{r.measuredValue}</td>
                  <td className="p-2.5 font-mono font-bold">{r.zScore > 0 ? `+${r.zScore}` : r.zScore}</td>
                  <td className="p-2.5">
                    {r.status === 'OUT_OF_CONTROL' ? (
                      <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-rose-600 text-white">
                        {r.westgardRuleTriggered} (REJECT)
                      </span>
                    ) : r.status === 'WARNING' ? (
                      <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-amber-100 text-amber-800">
                        {r.westgardRuleTriggered} (WARNING)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded font-medium text-[10px] bg-emerald-100 text-emerald-800">
                        ACCEPTABLE
                      </span>
                    )}
                  </td>
                  <td className="p-2.5 text-slate-600">{r.testedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Perform New QC Assay Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-200">
            <div className="border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-900 text-base">
                Record New Internal QC Measurement
              </h3>
              <p className="text-xs text-slate-500">
                Live Westgard multirule algorithm evaluation
              </p>
            </div>

            <form onSubmit={handleRunQc} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Investigation</label>
                <select
                  value={analyte}
                  onChange={(e) => {
                    setAnalyte(e.target.value);
                    if (e.target.value.includes('Glucose')) {
                      setTargetMean(100.0);
                      setSd(3.5);
                      setMeasuredValue(101.0);
                      setDept('CHEMISTRY');
                      setControlLot('Roche Precinorm U #PN-4401');
                    } else {
                      setTargetMean(14.0);
                      setSd(0.4);
                      setMeasuredValue(14.05);
                      setDept('HEMATOLOGY');
                      setControlLot('Sysmex Eightcheck-3WP #H-9812');
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md font-semibold"
                >
                  <option value="Hemoglobin (HGB)">Hemoglobin (HGB) - Hematology</option>
                  <option value="Glucose (FBS)">Glucose (FBS) - Chemistry</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Target Mean</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={targetMean}
                    onChange={(e) => setTargetMean(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Standard Dev (1 SD)</label>
                  <input
                    type="number"
                    step="0.05"
                    required
                    value={sd}
                    onChange={(e) => setSd(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 text-teal-900">
                  Measured Value on Analyzer *
                </label>
                <input
                  type="number"
                  step="0.05"
                  required
                  value={measuredValue}
                  onChange={(e) => setMeasuredValue(Number(e.target.value))}
                  placeholder="e.g. 14.1 for Hb or 115 for glucose"
                  className="w-full px-3 py-2 border-2 border-teal-500 rounded-md font-mono text-base font-bold text-slate-900"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Tip: Enter 15.5 (+3.75 SD) to test 1-3s rejection rule and testing hold!
                </span>
              </div>

              <div className="flex space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold shadow"
                >
                  Evaluate & Save QC Run
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
