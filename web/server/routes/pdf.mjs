import { Router } from 'express';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

export function createPdfRouter(root) {
  const router = Router();
  const outputDir = () => path.join(root, 'output');

  router.post('/generate', (req, res) => {
    const { htmlPath, outputPath, format } = req.body;
    if (!htmlPath || !outputPath) return res.status(400).json({ error: 'htmlPath and outputPath required' });

    const args = [path.join(root, 'generate-pdf.mjs'), htmlPath, outputPath];
    if (format) args.push(`--format=${format}`);

    const child = spawn('node', args, { cwd: root });
    let stdout = '', stderr = '';

    child.stdout.on('data', d => { stdout += d; });
    child.stderr.on('data', d => { stderr += d; });
    child.on('close', code => {
      if (code !== 0) return res.status(500).json({ error: stderr || 'PDF generation failed' });
      res.json({ ok: true, path: outputPath, stdout });
    });
  });

  router.get('/list', (_req, res) => {
    try {
      const dir = outputDir();
      if (!fs.existsSync(dir)) return res.json([]);
      const files = fs.readdirSync(dir).filter(f => f.endsWith('.pdf')).sort().reverse();
      const pdfs = files.map(f => {
        const stats = fs.statSync(path.join(dir, f));
        return { filename: f, size: stats.size, modified: stats.mtime };
      });
      res.json(pdfs);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/:filename', (req, res) => {
    const filePath = path.join(outputDir(), req.params.filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'PDF not found' });
    res.sendFile(filePath);
  });

  return router;
}
