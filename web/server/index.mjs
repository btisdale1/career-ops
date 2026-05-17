import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import path from 'path';
import { createApplicationsRouter } from './routes/applications.mjs';
import { createProfileRouter } from './routes/profile.mjs';
import { createCvRouter } from './routes/cv.mjs';
import { createReportsRouter } from './routes/reports.mjs';
import { createPortalsRouter } from './routes/portals.mjs';
import { createPipelineRouter } from './routes/pipeline.mjs';
import { createScannerRouter } from './routes/scanner.mjs';
import { createPdfRouter } from './routes/pdf.mjs';
import { createStatesRouter } from './routes/states.mjs';
import { createMetricsRouter } from './routes/metrics.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = process.env.PORT || 3001;
// career-ops root — two levels up from web/server/
const CAREER_OPS_ROOT = process.env.CAREER_OPS_ROOT || path.resolve(__dirname, '../..');

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// API routes
app.use('/api/applications', createApplicationsRouter(CAREER_OPS_ROOT));
app.use('/api/profile', createProfileRouter(CAREER_OPS_ROOT));
app.use('/api/cv', createCvRouter(CAREER_OPS_ROOT));
app.use('/api/reports', createReportsRouter(CAREER_OPS_ROOT));
app.use('/api/portals', createPortalsRouter(CAREER_OPS_ROOT));
app.use('/api/pipeline', createPipelineRouter(CAREER_OPS_ROOT));
app.use('/api/scanner', createScannerRouter(CAREER_OPS_ROOT));
app.use('/api/pdf', createPdfRouter(CAREER_OPS_ROOT));
app.use('/api/states', createStatesRouter(CAREER_OPS_ROOT));
app.use('/api/metrics', createMetricsRouter(CAREER_OPS_ROOT));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', root: CAREER_OPS_ROOT });
});

// In production, serve the built frontend
const distPath = path.resolve(__dirname, '../dist');
app.use(express.static(distPath));
app.use((_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n  career-ops API server`);
  console.log(`  ─────────────────────`);
  console.log(`  API:   http://localhost:${PORT}/api`);
  console.log(`  Root:  ${CAREER_OPS_ROOT}\n`);
});
