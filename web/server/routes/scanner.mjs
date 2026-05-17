import { Router } from 'express';
import { spawn } from 'child_process';
import path from 'path';
import { parseTsv } from '../lib/tsv-parser.mjs';

export function createScannerRouter(root) {
  const router = Router();

  // Run scan.mjs and stream output via SSE
  router.get('/stream', (req, res) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    const child = spawn('node', ['scan.mjs'], { cwd: root, env: { ...process.env } });

    child.stdout.on('data', (data) => {
      res.write(`data: ${JSON.stringify({ type: 'stdout', text: data.toString() })}\n\n`);
    });

    child.stderr.on('data', (data) => {
      res.write(`data: ${JSON.stringify({ type: 'stderr', text: data.toString() })}\n\n`);
    });

    child.on('close', (code) => {
      res.write(`data: ${JSON.stringify({ type: 'done', code })}\n\n`);
      res.end();
    });

    req.on('close', () => { child.kill(); });
  });

  // Scan history
  router.get('/history', (_req, res) => {
    try {
      const data = parseTsv(path.join(root, 'data', 'scan-history.tsv'));
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
