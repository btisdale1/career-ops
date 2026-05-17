import { Router } from 'express';
import path from 'path';
import { readYaml, writeYaml } from '../lib/yaml-io.mjs';

export function createPortalsRouter(root) {
  const router = Router();
  const filePath = () => path.join(root, 'portals.yml');
  const examplePath = () => path.join(root, 'templates', 'portals.example.yml');

  router.get('/', (_req, res) => {
    try {
      let data = readYaml(filePath());
      if (!data) data = readYaml(examplePath());
      if (!data) return res.status(404).json({ error: 'portals.yml not found' });
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.put('/', (req, res) => {
    try {
      writeYaml(filePath(), req.body);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
