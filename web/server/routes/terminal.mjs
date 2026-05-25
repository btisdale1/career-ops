import { Router } from 'express';
import { spawn } from 'child_process';

let activeChild = null;

export function createTerminalRouter(root) {
  const router = Router();

  // Stream command output using Server-Sent Events (SSE)
  router.get('/stream', (req, res) => {
    const cmd = req.query.cmd;
    if (!cmd) {
      return res.status(400).json({ error: 'Command is required' });
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    if (activeChild) {
      try {
        activeChild.kill('SIGKILL');
      } catch (e) {}
    }

    // Force color and full xterm emulation in the environment so agents/tools render nicely
    const child = spawn(cmd, {
      cwd: root,
      env: { 
        ...process.env, 
        FORCE_COLOR: '1', 
        TERM: 'xterm-256color',
        PAGER: 'cat'
      },
      shell: true
    });

    activeChild = child;

    child.stdout.on('data', (data) => {
      res.write(`data: ${JSON.stringify({ type: 'stdout', text: data.toString() })}\n\n`);
    });

    child.stderr.on('data', (data) => {
      res.write(`data: ${JSON.stringify({ type: 'stderr', text: data.toString() })}\n\n`);
    });

    child.on('close', (code) => {
      res.write(`data: ${JSON.stringify({ type: 'done', code })}\n\n`);
      res.end();
      if (activeChild === child) {
        activeChild = null;
      }
    });

    child.on('error', (err) => {
      res.write(`data: ${JSON.stringify({ type: 'stderr', text: `Failed to execute command: ${err.message}\n` })}\n\n`);
    });

    req.on('close', () => {
      if (activeChild === child) {
        child.kill();
        activeChild = null;
      }
    });
  });

  // Send input (stdin) to the currently running process
  router.post('/input', (req, res) => {
    const { input } = req.body;
    if (!activeChild) {
      return res.status(400).json({ error: 'No active command process running' });
    }

    try {
      activeChild.stdin.write(input);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Terminate the active process
  router.post('/kill', (req, res) => {
    if (activeChild) {
      try {
        activeChild.kill('SIGINT');
        res.json({ ok: true });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    } else {
      res.json({ ok: false, message: 'No active process to terminate' });
    }
  });

  return router;
}
