import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

export function createPipelineRouter(root) {
  const router = Router();
  const filePath = () => path.join(root, 'data', 'pipeline.md');

  router.get('/', (_req, res) => {
    try {
      const p = filePath();
      if (!fs.existsSync(p)) return res.json({ pending: [], processed: [] });
      const content = fs.readFileSync(p, 'utf-8');
      const pending = [];
      const processed = [];
      
      for (const line of content.split('\n')) {
        const unchecked = line.match(/^-\s*\[\s*\]\s*(.+)/);
        const checked = line.match(/^-\s*\[x\]\s*(.+)/i);
        if (unchecked) {
          const parts = unchecked[1].split('|').map(s => s.trim());
          pending.push({ url: parts[0], company: parts[1] || '', title: parts[2] || '' });
        } else if (checked) {
          const parts = checked[1].split('|').map(s => s.trim());
          processed.push({ url: parts[0], company: parts[1] || '', title: parts[2] || '' });
        }
      }
      res.json({ pending, processed });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/', (req, res) => {
    try {
      const { url, company, title } = req.body;
      if (!url) return res.status(400).json({ error: 'url is required' });
      const p = filePath();
      let content = fs.existsSync(p) ? fs.readFileSync(p, 'utf-8') : '# Pipeline\n\n## Pendientes\n';
      content += `\n- [ ] ${url} | ${company || ''} | ${title || ''}`;
      fs.writeFileSync(p, content, 'utf-8');
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/evaluate/stream', (req, res) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    // Run the gemini agent in headless mode
    // We pass the full command as a single string to spawn because shell: true
    // with an array of arguments causes /bin/sh to treat them as script arguments ($0, $1) instead of passing them to the command!
    const child = spawn('gemini -p "/career-ops pipeline"', { cwd: root, env: { ...process.env }, shell: true });

    child.stdout.on('data', (data) => {
      res.write(`data: ${JSON.stringify({ type: 'stdout', text: data.toString() })}\n\n`);
    });

    child.stderr.on('data', (data) => {
      res.write(`data: ${JSON.stringify({ type: 'stderr', text: data.toString() })}\n\n`);
    });

    child.on('error', (err) => {
      res.write(`data: ${JSON.stringify({ type: 'stderr', text: `Failed to start process: ${err.message}` })}\n\n`);
    });

    child.on('close', (code) => {
      res.write(`data: ${JSON.stringify({ type: 'done', code })}\n\n`);
      res.end();
    });

    req.on('close', () => { child.kill(); });
  });

  return router;
}
