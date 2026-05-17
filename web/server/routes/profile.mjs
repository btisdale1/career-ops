import { Router } from 'express';
import path from 'path';
import { readYaml, writeYaml } from '../lib/yaml-io.mjs';

export function createProfileRouter(root) {
  const router = Router();
  const filePath = () => {
    const p = path.join(root, 'config', 'profile.yml');
    return p;
  };

  router.get('/', (_req, res) => {
    try {
      const data = readYaml(filePath());
      if (!data) return res.status(404).json({ error: 'profile.yml not found' });
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
