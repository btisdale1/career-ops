import { useState, useEffect, useRef } from 'react';
import { api } from '../api/client.js';
import { Card, PageHeader, Button } from '../components/ui/index.jsx';
import { Terminal, Play, Square, ArrowUp, RefreshCw, HelpCircle } from 'lucide-react';

const COMMON_COMMANDS = [
  { label: 'Verify Pipeline', cmd: 'node verify-pipeline.mjs', desc: 'Validates integrity of applications.md and formats' },
  { label: 'Scan Portals', cmd: 'node scan.mjs', desc: 'Runs zero-token Greenfield/Ashby/Lever scanner' },
  { label: 'Check Updates', cmd: 'node update-system.mjs check', desc: 'Checks GitHub for system updates' },
  { label: 'Normalize Statuses', cmd: 'node normalize-statuses.mjs', desc: 'Ensures application statuses match canonical templates' },
  { label: 'Deduplicate Tracker', cmd: 'node dedup-tracker.mjs', desc: 'Cleans up duplicate entries in applications.md' },
  { label: 'Merge Tracker Additions', cmd: 'node merge-tracker.mjs', desc: 'Merges and synchronizes TSV files into tracker' }
];

export default function TerminalPage() {
  const [logs, setLogs] = useState([]);
  const [command, setCommand] = useState('');
  const [stdinInput, setStdinInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const logsEndRef = useRef(null);
  const inputRef = useRef(null);

  // Load command history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('career_ops_term_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const saveHistory = (newHistory) => {
    setHistory(newHistory);
    localStorage.setItem('career_ops_term_history', JSON.stringify(newHistory));
  };

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const runCommand = (cmdStr) => {
    if (!cmdStr.trim() || isRunning) return;

    setIsRunning(true);
    setLogs([
      { type: 'system', text: `\n$ ${cmdStr}\n` },
      { type: 'system', text: `Spawning command in workspace...\n` }
    ]);
    
    // Add to history if it's new
    if (history[0] !== cmdStr) {
      const newHist = [cmdStr, ...history.slice(0, 49)]; // Cap at 50
      saveHistory(newHist);
    }
    setHistoryIndex(-1);

    const evtSource = new EventSource(`/api/terminal/stream?cmd=${encodeURIComponent(cmdStr)}`);

    evtSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'done') {
        setIsRunning(false);
        setLogs(prev => [...prev, { type: 'system', text: `\nProcess exited with code ${data.code}.\n` }]);
        evtSource.close();
      } else {
        setLogs(prev => [...prev, data]);
      }
    };

    evtSource.onerror = (err) => {
      console.error('SSE Error:', err);
      setIsRunning(false);
      evtSource.close();
    };
  };

  const handleSendStdin = async (e) => {
    e.preventDefault();
    if (!stdinInput.trim() || !isRunning) return;
    try {
      await api.sendTerminalInput(stdinInput + '\n');
      setLogs(prev => [...prev, { type: 'stdin', text: `${stdinInput}\n` }]);
      setStdinInput('');
    } catch (err) {
      setLogs(prev => [...prev, { type: 'stderr', text: `\nFailed to send input: ${err.message}\n` }]);
    }
  };

  const handleKill = async () => {
    try {
      await api.killTerminalCommand();
    } catch (err) {
      console.error(err);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length === 0) return;
      const nextIndex = historyIndex + 1;
      if (nextIndex < history.length) {
        setHistoryIndex(nextIndex);
        setCommand(history[nextIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = historyIndex - 1;
      if (nextIndex >= 0) {
        setHistoryIndex(nextIndex);
        setCommand(history[nextIndex]);
      } else {
        setHistoryIndex(-1);
        setCommand('');
      }
    }
  };

  return (
    <div className="h-full flex flex-col animate-fade-in pb-8">
      <PageHeader
        title="Interactive Terminal"
        subtitle="Manage CLI processes, verify pipelines, and run updates directly"
        actions={
          isRunning && (
            <Button variant="danger" onClick={handleKill}>
              <Square className="w-4 h-4 fill-current" /> Terminate (SIGINT)
            </Button>
          )
        }
      />

      <div className="flex-1 p-8 min-h-0 flex flex-col lg:flex-row gap-6">
        {/* Terminal Screen */}
        <div className="flex-[3] flex flex-col bg-[#0b0b0f] border border-surface-300/20 rounded-xl overflow-hidden shadow-2xl h-full min-h-[400px]">
          {/* Header */}
          <div className="px-4 py-3 bg-[#111116] border-b border-surface-300/10 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-status-rejected/40" />
                <span className="w-3 h-3 rounded-full bg-status-responded/40" />
                <span className="w-3 h-3 rounded-full bg-status-offer/40" />
              </div>
              <span className="text-xs font-mono text-white/40 ml-2">career-ops bash terminal</span>
            </div>
            {isRunning && (
              <span className="flex items-center gap-1.5 text-xs text-primary-400 font-mono">
                <span className="w-2 h-2 rounded-full bg-primary-400 animate-ping" />
                Running Process
              </span>
            )}
          </div>

          {/* Logs Output */}
          <div className="flex-1 overflow-y-auto p-5 font-mono text-xs space-y-1 select-text scrollbar-thin scrollbar-thumb-surface-300">
            {logs.length === 0 && (
              <div className="text-white/20 italic p-4 text-center">
                Terminal initialized. Choose a tool below or enter a command...
              </div>
            )}
            {logs.map((log, i) => {
              let color = 'text-white/70';
              if (log.type === 'stderr') color = 'text-status-rejected';
              if (log.type === 'system') color = 'text-primary-400 font-semibold';
              if (log.type === 'stdin') color = 'text-status-offer font-bold';
              return (
                <div key={i} className={`${color} whitespace-pre-wrap leading-relaxed`}>
                  {log.text}
                </div>
              );
            })}
            <div ref={logsEndRef} />
          </div>

          {/* Interactive Shell Input bar */}
          <div className="border-t border-surface-300/10 bg-[#111116] p-4 shrink-0">
            {!isRunning ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  runCommand(command);
                }}
                className="flex items-center gap-3"
              >
                <span className="text-primary-400 font-mono font-bold text-sm shrink-0">$</span>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Enter CLI command (e.g. node verify-pipeline.mjs)..."
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 bg-transparent text-sm font-mono text-white focus:outline-none placeholder:text-white/20"
                />
                <Button size="sm" type="submit" disabled={!command.trim()}>
                  <Play className="w-3.5 h-3.5 fill-current" /> Run
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSendStdin} className="flex items-center gap-3">
                <span className="text-status-offer font-mono font-bold text-xs shrink-0">&gt; stdin:</span>
                <input
                  type="text"
                  placeholder="Send input to running CLI process (e.g. 'y' to confirm prompts)..."
                  value={stdinInput}
                  onChange={(e) => setStdinInput(e.target.value)}
                  className="flex-1 bg-transparent text-sm font-mono text-status-offer focus:outline-none placeholder:text-status-offer/20"
                />
                <Button size="sm" type="submit" variant="secondary" disabled={!stdinInput.trim()}>
                  Send Input
                </Button>
              </form>
            )}
          </div>
        </div>

        {/* Sidebar Actions & Shortcuts */}
        <div className="flex-1 flex flex-col gap-6 lg:max-w-xs shrink-0">
          <Card className="p-5 flex flex-col gap-4">
            <h3 className="font-heading font-semibold text-white flex items-center gap-2">
              <Terminal className="w-5 h-5 text-primary-400" />
              CLI Quick Actions
            </h3>
            <p className="text-xs text-white/50 leading-relaxed">
              Click any tool below to execute common maintenance scripts directly in your career-ops repository.
            </p>
            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
              {COMMON_COMMANDS.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setCommand(item.cmd);
                    runCommand(item.cmd);
                  }}
                  disabled={isRunning}
                  className="w-full text-left p-3 rounded-lg bg-surface-200 border border-surface-300/10 hover:border-primary-500/30 hover:bg-surface-300/30 transition-all group flex flex-col gap-1 disabled:opacity-50"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white/90 group-hover:text-primary-300 transition-colors">
                      {item.label}
                    </span>
                    <Play className="w-3 h-3 text-white/20 group-hover:text-primary-400 transition-colors fill-current" />
                  </div>
                  <code className="text-[10px] text-white/40 font-mono block overflow-hidden text-ellipsis whitespace-nowrap bg-black/25 px-1 py-0.5 rounded">
                    {item.cmd}
                  </code>
                  <p className="text-[10px] text-white/50 font-normal leading-normal mt-1">
                    {item.desc}
                  </p>
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-5 bg-surface-50 border-surface-300/10">
            <h4 className="text-xs font-semibold text-white/80 mb-2 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-primary-400" />
              Terminal Tips
            </h4>
            <ul className="text-[10px] text-white/50 space-y-2 list-disc list-inside">
              <li>Use the <kbd className="bg-surface-200 px-1 py-0.5 rounded text-white/70">Up</kbd> and <kbd className="bg-surface-200 px-1 py-0.5 rounded text-white/70">Down</kbd> arrows to browse your command history.</li>
              <li>When running a process, the input bar turns gold to send input to <code className="font-mono text-status-offer">stdin</code>.</li>
              <li>Press the red <code className="text-status-rejected font-semibold">Terminate</code> button above to force-kill a hanging script.</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
