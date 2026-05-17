import { Router } from 'express';
import fs from 'fs';
import path from 'path';

export function createReportsRouter(root) {
  const router = Router();
  const reportsDir = () => path.join(root, 'reports');

  router.get('/', (_req, res) => {
    try {
      const dir = reportsDir();
      if (!fs.existsSync(dir)) return res.json([]);
      const files = fs.readdirSync(dir)
        .filter(f => f.endsWith('.md'))
        .sort()
        .reverse();

      const reports = files.map(f => {
        const content = fs.readFileSync(path.join(dir, f), 'utf-8').slice(0, 1500);
        const title = content.match(/^#\s+(.+)/m)?.[1] || f;
        const score = content.match(/\*\*Score:\*\*\s*(\d+\.?\d*\/5)/i)?.[1] || '';
        const url = content.match(/\*\*URL:\*\*\s*(https?:\/\/\S+)/m)?.[1] || '';
        const legitimacy = content.match(/\*\*Legitimacy:\*\*\s*(.+)/i)?.[1]?.trim() || '';
        const date = content.match(/\*\*Date:\*\*\s*(\d{4}-\d{2}-\d{2})/)?.[1] || '';
        const archetype = (content.match(/\*\*Archetype(?:\s+detected)?:\*\*\s*(.+)/i) ||
          content.match(/\*\*Arquetipo(?:\s+detectado)?\*\*\s*\|\s*(.+)/i))?.[1]?.replace(/\|/g, '').trim() || '';
        return { filename: f, title, score, url, legitimacy, date, archetype };
      });

      res.json(reports);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/:filename', (req, res) => {
    try {
      const filePath = path.join(reportsDir(), req.params.filename);
      if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Report not found' });
      res.json({ content: fs.readFileSync(filePath, 'utf-8'), filename: req.params.filename });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
