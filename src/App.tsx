/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import {
  UserRole,
  LabOrder,
  Patient,
  QCResult,
  ReagentInventory,
  CriticalCallLog,
  AuditEvent,
  SpecimenStatus,
  OrderItem,
  AuthSession,
  TestCatalogItem,
} from './types/lis';
import { CLINICAL_CATALOG } from './data/clinicalCatalog';
import {
  MARDAN_PATIENTS,
  MARDAN_INITIAL_ORDERS,
} from './server/seed/seedData';
import {
  INITIAL_QC_RESULTS,
  INITIAL_INVENTORY,
  INITIAL_CRITICAL_CALLS,
  INITIAL_AUDIT_LOGS,
} from './data/initialData';
import {
  getActiveSession,
  persistSession,
  clearActiveSession,
  CLINICAL_USERS,
} from './utils/auth';
import { Header } from './components/Header';
import { LoginPage } from './components/LoginPage';
import { DashboardView } from './components/DashboardView';
import { PatientsView } from './components/PatientsView';
import { OrdersView } from './components/OrdersView';
import { PhlebotomyBarcodeView } from './components/PhlebotomyBarcodeView';
import { WorklistsBenchView } from './components/WorklistsBenchView';
import { PathologistReviewView } from './components/PathologistReviewView';
import { CriticalQueueView } from './components/CriticalQueueView';
import { ReportsView } from './components/ReportsView';
import { InvoicesView } from './components/InvoicesView';
import { InventoryView } from './components/InventoryView';
import { QualityControlView } from './components/QualityControlView';
import { AuditLogsView } from './components/AuditLogsView';
import { ArchitectureDossierView } from './components/ArchitectureDossierView';
import { RegistrationBillingView } from './components/RegistrationBillingView';
import { DiagnosticReportModal } from './components/DiagnosticReportModal';
import { CriticalCallModal } from './components/CriticalCallModal';
import { CashierWorkspace } from './components/CashierWorkspace';
import { LabAssistantWorkspace } from './components/LabAssistantWorkspace';
import { AdminWorkspace } from './components/AdminWorkspace';

/**
 * Route Guard Component: Prevents unauthenticated access via direct links
 */
interface ProtectedRouteProps {
  session: AuthSession | null;
  allowedRoles?: UserRole[];
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ session, allowedRoles, children }) => {
  if (!session) {
    return <Navigate to="/login" replace />;
  }
  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    // If not authorized for this specific role, redirect to user's assigned role workspace
    const fallbackPath =
      session.user.role === 'CASHIER'
        ? '/cashier'
        : session.user.role === 'LAB_ASSISTANT'
        ? '/lab-assistant'
        : '/admin';
    return <Navigate to={fallbackPath} replace />;
  }
  return <>{children}</>;
};

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // Authentication & Workstation Session
  const [session, setSession] = useState<AuthSession | null>(() => getActiveSession());

  // Role is strictly governed by the authenticated user's session
  const currentRole: UserRole = session?.user.role || 'CASHIER';

  const [isUrduEnabled, setIsUrduEnabled] = useState<boolean>(false);

  // Persistent Clinical Data
  const [patients, setPatients] = useState<Patient[]>(() => {
    const saved = localStorage.getItem('xpert_patients_mardan');
    return saved ? JSON.parse(saved) : MARDAN_PATIENTS;
  });

  const [orders, setOrders] = useState<LabOrder[]>(() => {
    const saved = localStorage.getItem('xpert_orders_mardan');
    return saved ? JSON.parse(saved) : MARDAN_INITIAL_ORDERS;
  });

  const [qcResults, setQcResults] = useState<QCResult[]>(() => {
    const saved = localStorage.getItem('xpert_qc_mardan');
    return saved ? JSON.parse(saved) : INITIAL_QC_RESULTS;
  });

  const [inventory, setInventory] = useState<ReagentInventory[]>(() => {
    const saved = localStorage.getItem('xpert_inventory_mardan');
    return saved ? JSON.parse(saved) : INITIAL_INVENTORY;
  });

  const [criticalCalls, setCriticalCalls] = useState<CriticalCallLog[]>(() => {
    const saved = localStorage.getItem('xpert_critical_calls_mardan');
    return saved ? JSON.parse(saved) : INITIAL_CRITICAL_CALLS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>(() => {
    const saved = localStorage.getItem('xpert_audit_logs_mardan');
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  const [catalog, setCatalog] = useState<TestCatalogItem[]>(() => {
    const saved = localStorage.getItem('xpert_catalog_mardan');
    return saved ? JSON.parse(saved) : CLINICAL_CATALOG;
  });

  // Modal Dialogs
  const [viewingReportOrder, setViewingReportOrder] = useState<LabOrder | null>(null);
  const [showCriticalModal, setShowCriticalModal] = useState<boolean>(false);
  const [showBookOrderModal, setShowBookOrderModal] = useState<boolean>(false);
  const [criticalModalContext, setCriticalModalContext] = useState<{
    orderId?: string;
    details?: string;
  }>({});

  // Local Storage Synchronization
  useEffect(() => {
    localStorage.setItem('xpert_patients_mardan', JSON.stringify(patients));
  }, [patients]);

  useEffect(() => {
    localStorage.setItem('xpert_orders_mardan', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('xpert_qc_mardan', JSON.stringify(qcResults));
  }, [qcResults]);

  useEffect(() => {
    localStorage.setItem('xpert_inventory_mardan', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem('xpert_critical_calls_mardan', JSON.stringify(criticalCalls));
  }, [criticalCalls]);

  useEffect(() => {
    localStorage.setItem('xpert_audit_logs_mardan', JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem('xpert_catalog_mardan', JSON.stringify(catalog));
  }, [catalog]);

  // Log Audit Event Helper
  const logAudit = (
    action: string,
    entityType: string,
    entityId: string,
    details: string
  ) => {
    const actorName = session?.user.name
      ? `${session.user.name} (${session.user.title})`
      : currentRole === 'ADMINISTRATOR'
      ? 'Amir Saeed (Administrator)'
      : currentRole === 'CASHIER'
      ? 'Bilal Khan (Cashier)'
      : 'Usman Tariq (Lab Assistant)';

    const newEvent: AuditEvent = {
      id: `AUD_MDN_${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: actorName,
      role: currentRole,
      action,
      entityType,
      entityId,
      details,
    };
    setAuditLogs((prev) => [newEvent, ...prev]);
  };

  // Session Handlers
  const handleLoginSuccess = (newSession: AuthSession) => {
    persistSession(newSession, true);
    setSession(newSession);

    logAudit(
      'USER_LOGIN',
      'AuthSession',
      newSession.user.id,
      `Workstation session authenticated for ${newSession.user.name} (${newSession.user.title}).`
    );

    // Navigate to role workspace
    if (newSession.user.role === 'CASHIER') {
      navigate('/cashier');
    } else if (newSession.user.role === 'LAB_ASSISTANT') {
      navigate('/lab-assistant');
    } else {
      navigate('/admin');
    }
  };

  const handleLogout = () => {
    if (session) {
      logAudit(
        'USER_LOGOUT',
        'AuthSession',
        session.user.id,
        `Clinical workstation locked and signed out by ${session.user.name}.`
      );
    }
    clearActiveSession();
    setSession(null);
    navigate('/login');
  };

  // 1. Order Created Handler
  const handleOrderCreated = (newOrder: LabOrder, newPatient?: Patient) => {
    if (newPatient) {
      setPatients((prev) => [newPatient, ...prev]);
      logAudit(
        'PATIENT_REGISTERED',
        'Patient',
        newPatient.id,
        `Registered new patient ${newPatient.name} (MRN: ${newPatient.mrn}).`
      );
    }
    setOrders((prev) => [newOrder, ...prev]);
    logAudit(
      'ORDER_CREATED',
      'LabOrder',
      newOrder.id,
      `Booked order ${newOrder.accessionNumber} for ${newOrder.patient.name}. Paid: ${newOrder.paidPKR} PKR.`
    );
    setShowBookOrderModal(false);
  };

  // 2. Specimen Status Handler
  const handleUpdateSpecimenStatus = (
    orderId: string,
    specimenId: string,
    newStatus: SpecimenStatus,
    rejectionReason?: string
  ) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id !== orderId) return ord;
        return {
          ...ord,
          specimens: ord.specimens.map((spec) => {
            if (spec.id !== specimenId) return spec;
            return {
              ...spec,
              status: newStatus,
              rejectionReason: rejectionReason || spec.rejectionReason,
              collectedAt:
                newStatus === 'COLLECTED' ? new Date().toISOString() : spec.collectedAt,
              receivedAt:
                newStatus === 'RECEIVED_IN_LAB' ? new Date().toISOString() : spec.receivedAt,
            };
          }),
        };
      })
    );

    logAudit(
      `SPECIMEN_${newStatus}`,
      'Specimen',
      specimenId,
      `Specimen ${specimenId} status changed to ${newStatus}.${
        rejectionReason ? ` Reason: ${rejectionReason}` : ''
      }`
    );
  };

  // 3. Technical Results Entry
  const handleUpdateItemResults = (
    orderId: string,
    itemId: string,
    results: OrderItem['results'],
    microbiologyData?: OrderItem['microbiologyData'],
    techNotes?: string
  ) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id !== orderId) return ord;
        return {
          ...ord,
          items: ord.items.map((it) => {
            if (it.id !== itemId) return it;
            return {
              ...it,
              status: 'ENTERED',
              results,
              microbiologyData: microbiologyData || it.microbiologyData,
              techNotes: techNotes || it.techNotes,
            };
          }),
        };
      })
    );

    logAudit(
      'RESULTS_ENTERED',
      'OrderItem',
      itemId,
      `Observation values recorded for order item ${itemId}.`
    );
  };

  // 4. First-tier Technical Verification
  const handlePerformTechnicalVerification = (orderId: string, itemId: string) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id !== orderId) return ord;
        return {
          ...ord,
          items: ord.items.map((it) => {
            if (it.id !== itemId) return it;
            return {
              ...it,
              status: 'TECHNICAL_VERIFIED',
              technicalVerifiedBy: session?.user?.name || 'Usman Tariq (Lab Assistant)',
              technicalVerifiedAt: new Date().toISOString(),
            };
          }),
        };
      })
    );

    logAudit(
      'TECHNICAL_VERIFIED',
      'OrderItem',
      itemId,
      `Laboratory supervisor technically verified analyzer results for item ${itemId}.`
    );
  };

  // 5. Clinical Pathologist Authorization & Release
  const handleAuthorizeAndRelease = (
    orderId: string,
    itemId: string,
    pathologistNotes?: string
  ) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id !== orderId) return ord;
        return {
          ...ord,
          items: ord.items.map((it) => {
            if (it.id !== itemId) return it;
            return {
              ...it,
              status: 'RELEASED',
              clinicalAuthorizedBy: 'Amir Saeed (Administrator & Lab Director)',
              clinicalAuthorizedAt: new Date().toISOString(),
              pathologistNotes,
            };
          }),
        };
      })
    );

    logAudit(
      'REPORT_RELEASED',
      'OrderItem',
      itemId,
      `Clinical Administrator / Pathologist clinically authorized and released report item ${itemId}.`
    );
  };

  // 6. Invoice Settlement Handler
  const handleSettleInvoice = (
    orderId: string,
    amountPKR: number,
    method: 'CASH' | 'CARD' | 'JAZZCASH' | 'EASYPAISA' | 'CORPORATE_CREDIT'
  ) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id !== orderId) return ord;
        const newPaid = ord.paidPKR + amountPKR;
        const newBal = Math.max(0, ord.totalPKR - newPaid);
        return {
          ...ord,
          paidPKR: newPaid,
          balancePKR: newBal,
          paymentMethod: method,
          paymentStatus: newBal === 0 ? 'PAID' : 'PARTIAL',
        };
      })
    );

    logAudit(
      'INVOICE_SETTLED',
      'LabOrder',
      orderId,
      `Settled PKR ${amountPKR} via ${method}.`
    );
  };

  // 7. Westgard QC Result Entry
  const handleAddQcResult = (newQc: QCResult) => {
    setQcResults((prev) => [newQc, ...prev]);
    logAudit(
      'QC_RUN_LOGGED',
      'QCResult',
      newQc.id,
      `Analyte ${newQc.analyte} measured at ${newQc.measuredValue} (Z-Score: ${newQc.zScore}). Status: ${newQc.status}.`
    );
  };

  // 8. Critical Telephonic Read-Back Log
  const handleSaveCriticalCallLog = (log: CriticalCallLog) => {
    setCriticalCalls((prev) => [log, ...prev]);
    logAudit(
      'CRITICAL_CALL_LOGGED',
      'CriticalCallLog',
      log.id,
      `Read-back confirmed by ${log.contactPerson} (${log.contactNumber}) for ${log.patientName}.`
    );
    setShowCriticalModal(false);
  };

  // 9. Reset to Initial Mardan Seed Data
  const handleResetSeedData = () => {
    if (
      window.confirm(
        'Reset all patient, order, QC, and test rate catalog data to factory baseline for Xpert Diagnostics Lab (Mardan)?'
      )
    ) {
      setPatients(MARDAN_PATIENTS);
      setOrders(MARDAN_INITIAL_ORDERS);
      setQcResults(INITIAL_QC_RESULTS);
      setInventory(INITIAL_INVENTORY);
      setCriticalCalls(INITIAL_CRITICAL_CALLS);
      setAuditLogs(INITIAL_AUDIT_LOGS);
      setCatalog(CLINICAL_CATALOG);
      localStorage.removeItem('xpert_patients_mardan');
      localStorage.removeItem('xpert_orders_mardan');
      localStorage.removeItem('xpert_qc_mardan');
      localStorage.removeItem('xpert_inventory_mardan');
      localStorage.removeItem('xpert_critical_calls_mardan');
      localStorage.removeItem('xpert_audit_logs_mardan');
      localStorage.removeItem('xpert_catalog_mardan');
      logAudit(
        'DATABASE_RESET',
        'System',
        'ALL',
        'Factory seed dataset and test catalog restored for Mardan clinical instance.'
      );
    }
  };

  // 10. Update Test Rate / Fee
  const handleUpdateTestRate = (updatedTest: TestCatalogItem) => {
    setCatalog((prev) =>
      prev.map((t) => (t.id === updatedTest.id ? updatedTest : t))
    );
    logAudit(
      'TEST_RATE_UPDATED',
      'TestCatalogItem',
      updatedTest.id,
      `Fee for "${updatedTest.name}" (${updatedTest.code}) adjusted to PKR ${updatedTest.pricePKR.toLocaleString()}. TAT: ${updatedTest.turnaroundHours}h.`
    );
  };

  // 11. Add New Test to Clinical Catalog
  const handleAddNewTest = (newTest: TestCatalogItem) => {
    setCatalog((prev) => [newTest, ...prev]);
    logAudit(
      'TEST_CATALOG_CREATED',
      'TestCatalogItem',
      newTest.id,
      `New investigation "${newTest.name}" (${newTest.code}) added to ${newTest.department} department at PKR ${newTest.pricePKR.toLocaleString()}.`
    );
  };

  // 10. Lab Assistant complete and forward to cashier
  const handleCompleteOrderTests = (
    orderId: string,
    updatedItems: OrderItem[],
    techNotes?: string
  ) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id !== orderId) return ord;
        return {
          ...ord,
          workflowStage: 'READY_FOR_CASHIER_PRINT',
          testedBy: session?.user?.name || 'Usman Tariq (Lab Assistant)',
          testedAt: new Date().toISOString(),
          items: updatedItems,
        };
      })
    );

    logAudit(
      'LAB_TESTS_COMPLETED',
      'LabOrder',
      orderId,
      `Lab Assistant tested and completed all investigation items. Forwarded to Cashier for print.`
    );
  };

  // 11. Update Order Workflow Status
  const handleUpdateOrderStatus = (
    orderId: string,
    stage?: 'FORWARDED_TO_LAB' | 'IN_TESTING' | 'TESTS_COMPLETED' | 'READY_FOR_CASHIER_PRINT' | 'REPORT_PRINTED' | 'DELIVERED',
    notes?: string
  ) => {
    if (!stage) return;
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id !== orderId) return ord;
        const now = new Date().toISOString();
        return {
          ...ord,
          workflowStage: stage,
          ...(stage === 'REPORT_PRINTED'
            ? { reportPrintedAt: now, reportPrintedBy: session?.user?.name || 'Bilal Khan (Cashier)' }
            : {}),
          ...(stage === 'DELIVERED' ? { deliveredAt: now } : {}),
        };
      })
    );

    logAudit(
      `ORDER_STATUS_${stage}`,
      'LabOrder',
      orderId,
      `Order status advanced to ${stage}.${notes ? ` ${notes}` : ''}`
    );
  };

  // Check QC status
  const isQcFailed = qcResults.some((q) => q.status === 'OUT_OF_CONTROL');
  const pendingCriticalCount = criticalCalls.filter((c) => !c.readBackConfirmed).length;

  const pendingLabCount = orders.filter(
    (o) =>
      o.workflowStage === 'FORWARDED_TO_LAB' ||
      (!o.workflowStage && o.items.some((i) => i.status === 'DRAFT' || i.status === 'ENTERED'))
  ).length;

  const readyForCashierPrintCount = orders.filter(
    (o) =>
      o.workflowStage === 'TESTS_COMPLETED' ||
      o.workflowStage === 'READY_FOR_CASHIER_PRINT' ||
      o.workflowStage === 'REPORT_PRINTED' ||
      o.items.some((i) => i.status === 'RELEASED')
  ).length;

  const isLoginPage = location.pathname === '/login' || !session;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Universal Header with Navigation, User Session & 3-Role Switcher */}
      {!isLoginPage && session && (
        <Header
          currentRole={currentRole}
          pendingCriticalCallsCount={pendingCriticalCount}
          onOpenCriticalModal={() => {
            setCriticalModalContext({});
            setShowCriticalModal(true);
          }}
          isUrduEnabled={isUrduEnabled}
          onToggleUrdu={() => setIsUrduEnabled(!isUrduEnabled)}
          pendingLabCount={pendingLabCount}
          readyForCashierPrintCount={readyForCashierPrintCount}
          activeUser={session.user}
          onLogout={handleLogout}
        />
      )}

      {/* Main Content Router */}
      <main className={isLoginPage ? 'flex-1 flex flex-col' : 'flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6'}>
        <Routes>
          {/* Public Login Route */}
          <Route
            path="/login"
            element={
              session ? (
                <Navigate
                  to={
                    currentRole === 'CASHIER'
                      ? '/cashier'
                      : currentRole === 'LAB_ASSISTANT'
                      ? '/lab-assistant'
                      : '/admin'
                  }
                  replace
                />
              ) : (
                <LoginPage
                  onLoginSuccess={handleLoginSuccess}
                  isUrduEnabled={isUrduEnabled}
                />
              )
            }
          />

          {/* Root Path: Redirects to /login if unauthenticated, or to Role Workspace */}
          <Route
            path="/"
            element={
              !session ? (
                <Navigate to="/login" replace />
              ) : (
                <Navigate
                  to={
                    currentRole === 'CASHIER'
                      ? '/cashier'
                      : currentRole === 'LAB_ASSISTANT'
                      ? '/lab-assistant'
                      : '/admin'
                  }
                  replace
                />
              )
            }
          />

          {/* 1. Cashier Role: Enter Patient, Tests, Print Receipt, View Completed Tests, Print Report */}
          <Route
            path="/cashier"
            element={
              <ProtectedRoute session={session} allowedRoles={['CASHIER', 'ADMINISTRATOR']}>
                <CashierWorkspace
                  orders={orders}
                  patients={patients}
                  onOrderCreated={handleOrderCreated}
                  onPrintReport={(order) => setViewingReportOrder(order)}
                  onUpdateOrderStatus={handleUpdateOrderStatus}
                  isUrduEnabled={isUrduEnabled}
                  catalog={catalog}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cashier-reports"
            element={
              <ProtectedRoute session={session} allowedRoles={['CASHIER', 'ADMINISTRATOR']}>
                <CashierWorkspace
                  orders={orders}
                  patients={patients}
                  onOrderCreated={handleOrderCreated}
                  onPrintReport={(order) => setViewingReportOrder(order)}
                  onUpdateOrderStatus={handleUpdateOrderStatus}
                  isUrduEnabled={isUrduEnabled}
                  catalog={catalog}
                />
              </ProtectedRoute>
            }
          />

          {/* 2. Lab Assistant Role: View Forwarded Data, Perform Tests, Forward to Cashier */}
          <Route
            path="/lab-assistant"
            element={
              <ProtectedRoute session={session} allowedRoles={['LAB_ASSISTANT', 'ADMINISTRATOR']}>
                <LabAssistantWorkspace
                  orders={orders}
                  onCompleteOrderTests={handleCompleteOrderTests}
                  isUrduEnabled={isUrduEnabled}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/lab-completed"
            element={
              <ProtectedRoute session={session} allowedRoles={['LAB_ASSISTANT', 'ADMINISTRATOR']}>
                <LabAssistantWorkspace
                  orders={orders}
                  onCompleteOrderTests={handleCompleteOrderTests}
                  isUrduEnabled={isUrduEnabled}
                />
              </ProtectedRoute>
            }
          />

          {/* 3. Admin Role: Governance, Rates, All Orders, Staff, Audit */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute session={session} allowedRoles={['ADMINISTRATOR']}>
                <AdminWorkspace
                  orders={orders}
                  patients={patients}
                  auditLogs={auditLogs}
                  onPrintReport={(order) => setViewingReportOrder(order)}
                  isUrduEnabled={isUrduEnabled}
                  catalog={catalog}
                  onUpdateTestRate={handleUpdateTestRate}
                  onAddNewTest={handleAddNewTest}
                />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute session={session} allowedRoles={['ADMINISTRATOR']}>
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">
                      Xpert Diagnostics Lab • Near MMC, Mardan (KP) • KPHCC Reg #KPHCC-MDN-7721-PLMS
                    </span>
                    <button
                      type="button"
                      onClick={handleResetSeedData}
                      className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded font-semibold transition cursor-pointer"
                      title="Reload Mardan doctors, patients, and initial CBC orders"
                    >
                      Reset & Populate Mardan Seed Data
                    </button>
                  </div>
                  <DashboardView
                    orders={orders}
                    qcResults={qcResults}
                    inventory={inventory}
                    criticalCalls={criticalCalls}
                    onNavigateTab={(tab) => {
                      const routeMap: Record<string, string> = {
                        REGISTRATION: '/patients',
                        PHLEBOTOMY: '/phlebotomy',
                        WORKLISTS: '/benches',
                        PATHOLOGIST: '/pathologist-review',
                        ORDERS: '/orders',
                        CRITICAL_QUEUE: '/critical-queue',
                        QC: '/qc',
                      };
                      navigate(routeMap[tab] || '/dashboard');
                    }}
                    onOpenReport={(order) => setViewingReportOrder(order)}
                  />
                </div>
              </ProtectedRoute>
            }
          />

          <Route
            path="/patients"
            element={
              <ProtectedRoute session={session} allowedRoles={['CASHIER', 'ADMINISTRATOR']}>
                <PatientsView
                  patients={patients}
                  orders={orders}
                  onOpenOrderModal={() => setShowBookOrderModal(true)}
                />
              </ProtectedRoute>
            }
          />

          <Route
            path="/orders"
            element={
              <ProtectedRoute session={session} allowedRoles={['ADMINISTRATOR']}>
                <OrdersView
                  orders={orders}
                  onOpenReport={(order) => setViewingReportOrder(order)}
                  onOpenOrderModal={() => setShowBookOrderModal(true)}
                />
              </ProtectedRoute>
            }
          />

          <Route
            path="/phlebotomy"
            element={
              <ProtectedRoute session={session} allowedRoles={['LAB_ASSISTANT', 'ADMINISTRATOR']}>
                <PhlebotomyBarcodeView
                  orders={orders}
                  onUpdateSpecimenStatus={handleUpdateSpecimenStatus}
                />
              </ProtectedRoute>
            }
          />

          <Route
            path="/benches"
            element={
              <ProtectedRoute session={session} allowedRoles={['LAB_ASSISTANT', 'ADMINISTRATOR']}>
                <WorklistsBenchView
                  orders={orders}
                  currentRole={currentRole}
                  isQcFailed={isQcFailed}
                  onUpdateItemResults={handleUpdateItemResults}
                  onPerformTechnicalVerification={handlePerformTechnicalVerification}
                  isUrduEnabled={isUrduEnabled}
                />
              </ProtectedRoute>
            }
          />

          <Route
            path="/result-entry"
            element={
              <ProtectedRoute session={session} allowedRoles={['LAB_ASSISTANT', 'ADMINISTRATOR']}>
                <WorklistsBenchView
                  orders={orders}
                  currentRole={currentRole}
                  isQcFailed={isQcFailed}
                  onUpdateItemResults={handleUpdateItemResults}
                  onPerformTechnicalVerification={handlePerformTechnicalVerification}
                  isUrduEnabled={isUrduEnabled}
                />
              </ProtectedRoute>
            }
          />

          <Route
            path="/pathologist-review"
            element={
              <ProtectedRoute session={session} allowedRoles={['ADMINISTRATOR']}>
                <PathologistReviewView
                  orders={orders}
                  criticalCalls={criticalCalls}
                  currentRole={currentRole}
                  onAuthorizeAndRelease={handleAuthorizeAndRelease}
                  onOpenCriticalModal={(orderId, defaultDetails) => {
                    setCriticalModalContext({ orderId, details: defaultDetails });
                    setShowCriticalModal(true);
                  }}
                  onViewDiagnosticReport={(order) => setViewingReportOrder(order)}
                />
              </ProtectedRoute>
            }
          />

          <Route
            path="/critical-queue"
            element={
              <ProtectedRoute session={session} allowedRoles={['ADMINISTRATOR']}>
                <CriticalQueueView
                  orders={orders}
                  criticalCalls={criticalCalls}
                  onOpenCallModal={(orderId, details) => {
                    setCriticalModalContext({ orderId, details });
                    setShowCriticalModal(true);
                  }}
                  onOpenReport={(order) => setViewingReportOrder(order)}
                />
              </ProtectedRoute>
            }
          />

          <Route
            path="/reports"
            element={
              <ProtectedRoute session={session} allowedRoles={['CASHIER', 'ADMINISTRATOR']}>
                <ReportsView
                  orders={orders}
                  onOpenReport={(order) => setViewingReportOrder(order)}
                />
              </ProtectedRoute>
            }
          />

          <Route
            path="/invoices"
            element={
              <ProtectedRoute session={session} allowedRoles={['CASHIER', 'ADMINISTRATOR']}>
                <InvoicesView
                  orders={orders}
                  onSettleInvoice={handleSettleInvoice}
                />
              </ProtectedRoute>
            }
          />

          <Route
            path="/inventory"
            element={
              <ProtectedRoute session={session} allowedRoles={['LAB_ASSISTANT', 'ADMINISTRATOR']}>
                <InventoryView
                  inventory={inventory}
                  onUpdateQuantity={(id, delta) => {
                    setInventory((prev) =>
                      prev.map((item) =>
                        item.id === id
                          ? { ...item, quantityOnHand: Math.max(0, item.quantityOnHand + delta) }
                          : item
                      )
                    );
                  }}
                  onAddNewItem={(item) => setInventory((prev) => [...prev, item])}
                />
              </ProtectedRoute>
            }
          />

          <Route
            path="/qc"
            element={
              <ProtectedRoute session={session} allowedRoles={['LAB_ASSISTANT', 'ADMINISTRATOR']}>
                <QualityControlView
                  qcResults={qcResults}
                  onAddQcResult={handleAddQcResult}
                />
              </ProtectedRoute>
            }
          />

          <Route
            path="/audit-logs"
            element={
              <ProtectedRoute session={session} allowedRoles={['ADMINISTRATOR']}>
                <AuditLogsView auditLogs={auditLogs} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dossier"
            element={
              <ProtectedRoute session={session} allowedRoles={['ADMINISTRATOR']}>
                <ArchitectureDossierView />
              </ProtectedRoute>
            }
          />

          {/* Catch-all fallback */}
          <Route
            path="*"
            element={
              !session ? (
                <Navigate to="/login" replace />
              ) : (
                <Navigate
                  to={
                    currentRole === 'CASHIER'
                      ? '/cashier'
                      : currentRole === 'LAB_ASSISTANT'
                      ? '/lab-assistant'
                      : '/admin'
                  }
                  replace
                />
              )
            }
          />
        </Routes>
      </main>

      {/* Book New Order / Patient Registration Modal */}
      {showBookOrderModal && session && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full p-6 my-auto max-h-[90vh] overflow-y-auto space-y-4 border border-slate-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                Book Lab Investigation & Issue Accession (Xpert Diagnostics Lab)
              </h3>
              <button
                type="button"
                onClick={() => setShowBookOrderModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>
            <RegistrationBillingView
              patients={patients}
              orders={orders}
              onOrderCreated={handleOrderCreated}
              isUrduEnabled={isUrduEnabled}
              catalog={catalog}
            />
          </div>
        </div>
      )}

      {/* Printable A4 Diagnostic Report Modal */}
      {viewingReportOrder && session && (
        <DiagnosticReportModal
          order={viewingReportOrder}
          onClose={() => setViewingReportOrder(null)}
          isUrduEnabled={isUrduEnabled}
        />
      )}

      {/* Telephonic Read-Back Critical Call Modal */}
      {showCriticalModal && session && (
        <CriticalCallModal
          orderId={criticalModalContext.orderId || 'ORD_MDN_001'}
          accessionNumber={
            orders.find((o) => o.id === criticalModalContext.orderId)?.accessionNumber ||
            'XPT-2026-0101'
          }
          patientName={
            orders.find((o) => o.id === criticalModalContext.orderId)?.patient.name ||
            'Sher Ali Khan'
          }
          defaultDetails={
            criticalModalContext.details ||
            'Critical laboratory finding requiring statutory telephonic read-back communication.'
          }
          onClose={() => setShowCriticalModal(false)}
          onSaveCallLog={handleSaveCriticalCallLog}
        />
      )}
    </div>
  );
}
