import express from 'express';
import cors from 'cors';
import path from 'path';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/users.routes';
import leadRoutes from './modules/leads/leads.routes';
import customerRoutes from './modules/customers/customers.routes';
import projectRoutes from './modules/projects/projects.routes';
import productRoutes from './modules/products/products.routes';
import invoiceRoutes from './modules/invoices/invoices.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';
import gstRoutes from './modules/gst/gst.routes';
import proposalRoutes from './modules/proposals/proposals.routes';
import metaRoutes from './modules/meta/meta.routes';
import supplierRoutes from './modules/suppliers/suppliers.routes';
import purchaseRoutes from './modules/purchases/purchases.routes';
import companyRoutes from './modules/companies/companies.routes';
import settingsRoutes from './modules/settings/settings.routes';
import leadConfigRoutes from './modules/lead-config/lead-config.routes';

const app = express();

app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(express.json({ verify: (req, _res, buffer) => { (req as any).rawBody = buffer; } }));

// Serve uploaded files
app.use('/uploads', express.static(path.resolve(config.uploadDir)));

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/leads', leadRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/invoices', invoiceRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/gst', gstRoutes);
app.use('/api/v1/proposals', proposalRoutes);
app.use('/api/v1/meta', metaRoutes);
app.use('/api/v1/suppliers', supplierRoutes);
app.use('/api/v1/purchases', purchaseRoutes);
app.use('/api/v1/companies', companyRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/lead-config', leadConfigRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`);
});

export default app;
