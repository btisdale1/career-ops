import { Router } from 'express';
import fs from 'fs';
import path from 'path';

export function createCvRouter(root) {
  const router = Router();
  const filePath = () => path.join(root, 'cv.md');

  router.get('/', (_req, res) => {
    try {
      const p = filePath();
      if (!fs.existsSync(p)) return res.status(404).json({ error: 'cv.md not found' });
      res.json({ content: fs.readFileSync(p, 'utf-8') });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.put('/', (req, res) => {
    try {
      const { content } = req.body;
      if (typeof content !== 'string') return res.status(400).json({ error: 'content is required' });
      fs.writeFileSync(filePath(), content, 'utf-8');
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
