import { Router } from 'express';
import path from 'path';
import { readYaml } from '../lib/yaml-io.mjs';

export function createStatesRouter(root) {
  const router = Router();

  router.get('/', (_req, res) => {
    try {
      const data = readYaml(path.join(root, 'templates', 'states.yml'));
      if (!data) return res.status(404).json({ error: 'states.yml not found' });
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
