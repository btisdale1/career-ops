import { Router } from 'express';
import { parseApplications, updateApplicationStatus } from '../lib/md-parser.mjs';

export function createApplicationsRouter(root) {
  const router = Router();

  router.get('/', (_req, res) => {
    try {
      const apps = parseApplications(root);
      res.json(apps);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.patch('/:reportNumber/status', (req, res) => {
    try {
      const { reportNumber } = req.params;
      const { status } = req.body;
      if (!status) return res.status(400).json({ error: 'status is required' });
      updateApplicationStatus(root, reportNumber, status);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
