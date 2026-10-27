/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router, Request, Response } from 'express';
import {
  PatientsService,
  OrdersService,
  SpecimensService,
  ResultsService,
  PathologistService,
  BillingService,
  QualityControlService,
  DashboardService,
  AuditService,
  db,
} from '../services/lisServices';
import { MARDAN_DOCTORS } from '../seed/seedData';
import { CLINICAL_CATALOG } from '../../data/clinicalCatalog';

export const apiRouter = Router();

const patientsService = new PatientsService();
const ordersService = new OrdersService();
const specimensService = new SpecimensService();
const resultsService = new ResultsService();
const pathologistService = new PathologistService();
const billingService = new BillingService();
const qcService = new QualityControlService();
const dashboardService = new DashboardService();

// PATIENTS CONTROLLER
apiRouter.get('/patients', (req: Request, res: Response) => {
  const q = req.query.q as string;
  if (q) {
    return res.json(patientsService.search(q));
  }
  return res.json(patientsService.getAll());
});

apiRouter.get('/patients/:id', (req: Request, res: Response) => {
  const patient = patientsService.getById(req.params.id);
  if (!patient) return res.status(404).json({ error: 'Patient not found' });
  return res.json(patient);
});

apiRouter.post('/patients', (req: Request, res: Response) => {
  try {
    const patient = patientsService.create(req.body);
    return res.status(201).json(patient);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// ORDERS CONTROLLER
apiRouter.get('/orders', (req: Request, res: Response) => {
  return res.json(ordersService.getAll());
});

apiRouter.get('/orders/:id', (req: Request, res: Response) => {
  const order = ordersService.getById(req.params.id) || ordersService.getByAccession(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  return res.json(order);
});

apiRouter.post('/orders', (req: Request, res: Response) => {
  try {
    const order = ordersService.create(req.body);
    return res.status(201).json(order);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// SPECIMENS CONTROLLER
apiRouter.patch('/specimens/:id/status', (req: Request, res: Response) => {
  try {
    const specimen = specimensService.updateStatus({
      specimenId: req.params.id,
      ...req.body,
    });
    return res.json(specimen);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// RESULTS CONTROLLER
apiRouter.post('/results/enter', (req: Request, res: Response) => {
  try {
    const item = resultsService.enterResults(req.body);
    return res.json(item);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/results/verify', (req: Request, res: Response) => {
  try {
    const item = resultsService.technicalVerify(req.body);
    return res.json(item);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/results/authorize', (req: Request, res: Response) => {
  try {
    const item = pathologistService.clinicalAuthorize(req.body);
    return res.json(item);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/results/critical-call', (req: Request, res: Response) => {
  try {
    const callLog = pathologistService.logCriticalCall(req.body);
    return res.status(201).json(callLog);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// REPORTS CONTROLLER
apiRouter.get('/reports/:orderId', (req: Request, res: Response) => {
  const order = ordersService.getById(req.params.orderId) || ordersService.getByAccession(req.params.orderId);
  if (!order) return res.status(404).json({ error: 'Report not found' });
  return res.json({
    laboratory: 'Xpert Diagnostics Lab',
    license: 'KPHCC-MDN-7721-PLMS',
    location: 'Near Mardan Medical Complex, Mardan, KP, Pakistan',
    order,
  });
});

// BILLING CONTROLLER
apiRouter.post('/billing/settle', (req: Request, res: Response) => {
  try {
    const settledOrder = billingService.settleInvoice(req.body);
    return res.json(settledOrder);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

apiRouter.get('/billing/summary', (req: Request, res: Response) => {
  return res.json(billingService.getShiftSummary());
});

// QUALITY CONTROL CONTROLLER
apiRouter.get('/qc', (req: Request, res: Response) => {
  return res.json(qcService.getAll());
});

apiRouter.post('/qc', (req: Request, res: Response) => {
  try {
    const qcResult = qcService.recordRun(req.body);
    return res.status(201).json(qcResult);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// DASHBOARD CONTROLLER
apiRouter.get('/dashboard', (req: Request, res: Response) => {
  return res.json(dashboardService.getMetrics());
});

// CATALOG & DOCTORS
apiRouter.get('/catalog', (req: Request, res: Response) => {
  return res.json(CLINICAL_CATALOG);
});

apiRouter.get('/doctors', (req: Request, res: Response) => {
  return res.json(MARDAN_DOCTORS);
});

// AUDIT LOGS
apiRouter.get('/audit-logs', (req: Request, res: Response) => {
  return res.json(AuditService.getAll());
});

// SEED REPOPULATE SCRIPT ENDPOINT
apiRouter.post('/seed/reset', (req: Request, res: Response) => {
  db.reset();
  AuditService.log('DATABASE_SEEDED', 'System', 'ALL', 'Populated sample Mardan doctors, patients, CBC panels, and mock orders.');
  return res.json({
    message: 'Xpert Diagnostic Labs (Mardan) database reset and populated with seed data successfully.',
    doctorsCount: MARDAN_DOCTORS.length,
    patientsCount: db.patients.length,
    ordersCount: db.orders.length,
  });
});
