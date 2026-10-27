/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Package, AlertCircle, Plus, CheckCircle, ShieldAlert, Sparkles } from 'lucide-react';
import { ReagentInventory, DepartmentId } from '../types/lis';

interface InventoryViewProps {
  inventory: ReagentInventory[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onAddNewItem: (item: ReagentInventory) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  inventory,
  onUpdateQuantity,
  onAddNewItem,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [catalogNumber, setCatalogNumber] = useState('');
  const [department, setDepartment] = useState<DepartmentId>('HEMATOLOGY');
  const [lotNumber, setLotNumber] = useState('');
  const [supplier, setSupplier] = useState('Mediquip Pakistan Pvt Ltd');
  const [expiryDate, setExpiryDate] = useState('2027-06-30');
  const [quantityOnHand, setQuantityOnHand] = useState(5);
  const [unit, setUnit] = useState('Kits');
  const [reorderLevel, setReorderLevel] = useState(2);
  const [storageCondition, setStorageCondition] = useState('2°C - 8°C Refrigerator');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const newItem: ReagentInventory = {
      id: `INV_${Date.now()}`,
      name,
      catalogNumber,
      department,
      lotNumber,
      supplier,
      expiryDate,
      quantityOnHand,
      unit,
      reorderLevel,
      storageCondition,
      status: 'IN_USE',
    };
    onAddNewItem(newItem);
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Package className="w-5 h-5 text-teal-600" />
            Reagents, Consumables & Blood Tube Inventory
          </h2>
          <p className="text-xs text-slate-500">
            Lot-Specific Traceability • Cold Chain Verification • Automatic Low Stock Alerts (ISO 15189 Cl. 6.4)
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow transition"
        >
          <Plus className="w-4 h-4" />
          Add Inventory Lot
        </button>
      </div>

      {/* Inventory Grid Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <th className="p-3">Item / Reagent Name</th>
                <th className="p-3">Department</th>
                <th className="p-3">Lot # / Catalog</th>
                <th className="p-3">Supplier (Pakistan)</th>
                <th className="p-3">Storage Temp</th>
                <th className="p-3">Expiry Date</th>
                <th className="p-3">Quantity</th>
                <th className="p-3">Stock Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {inventory.map((item) => {
                const isLowStock = item.quantityOnHand <= item.reorderLevel;

                return (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="p-3 font-semibold text-slate-900">
                      {item.name}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[10px]">
                        {item.department}
                      </span>
                    </td>
                    <td className="p-3 font-mono">
                      <div className="font-bold text-slate-800">{item.lotNumber}</div>
                      <div className="text-[10px] text-slate-400">{item.catalogNumber}</div>
                    </td>
                    <td className="p-3 text-slate-600">{item.supplier}</td>
                    <td className="p-3 text-slate-600 font-medium">{item.storageCondition}</td>
                    <td className="p-3 font-mono text-slate-800">{item.expiryDate}</td>
                    <td className="p-3 font-mono font-bold text-slate-900 text-sm">
                      {item.quantityOnHand} <span className="text-xs text-slate-500 font-normal">{item.unit}</span>
                    </td>
                    <td className="p-3">
                      {isLowStock ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 flex items-center gap-1 w-max">
                          <AlertCircle className="w-3 h-3" /> REORDER REQUIRED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-800">
                          ADEQUATE
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right space-x-1">
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.id, -1)}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-bold text-xs"
                        title="Consume 1 unit"
                      >
                        -1
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.id, 1)}
                        className="px-2 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded font-bold text-xs"
                        title="Add 1 unit"
                      >
                        +1
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-200">
            <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-2">
              Receive New Reagent Lot / Consumable
            </h3>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Item Description *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Roche Cobas ALT Reagent Cassette (200 tests)"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Catalog #</label>
                  <input
                    type="text"
                    value={catalogNumber}
                    onChange={(e) => setCatalogNumber(e.target.value)}
                    placeholder="e.g. ROC-ALT-200"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Lot Number *</label>
                  <input
                    type="text"
                    required
                    value={lotNumber}
                    onChange={(e) => setLotNumber(e.target.value)}
                    placeholder="e.g. LOT-2026-991"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value as DepartmentId)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded"
                  >
                    <option value="HEMATOLOGY">Hematology</option>
                    <option value="CHEMISTRY">Chemistry</option>
                    <option value="SEROLOGY">Serology</option>
                    <option value="MICROBIOLOGY">Microbiology</option>
                    <option value="COAGULATION">Coagulation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Expiry Date *</label>
                  <input
                    type="date"
                    required
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Quantity Received</label>
                  <input
                    type="number"
                    min="1"
                    value={quantityOnHand}
                    onChange={(e) => setQuantityOnHand(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Unit of Measure</label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="Kits / Boxes / Cassettes"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded"
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded font-bold shadow"
                >
                  Save to Inventory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
