import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client.js';
import { PageHeader, Button, Card, StatusBadge } from '../components/ui/index.jsx';
import { Radar, Terminal, Inbox, ExternalLink, Play } from 'lucide-react';

export default function ScannerPage() {
  const [logs, setLogs] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const logsEndRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: pipeline, refetch: refetchPipeline } = useQuery({
    queryKey: ['pipeline'],
    queryFn: api.getPipeline,
  });

  const startScan = () => {
    setIsScanning(true);
    setLogs([]);
    const evtSource = new EventSource('/api/scanner/stream');
    
    evtSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'done') {
        setIsScanning(false);
        evtSource.close();
        refetchPipeline(); // Refresh pipeline when scan finishes
        queryClient.invalidateQueries(['applications']);
      } else {
        setLogs(prev => [...prev, data]);
      }
    };
    
    evtSource.onerror = (err) => {
      console.error('SSE Error:', err);
      setIsScanning(false);
      evtSource.close();
      refetchPipeline();
    };
  };

  const startEvaluate = () => {
    setIsEvaluating(true);
    setLogs([{ type: 'stdout', text: 'Starting AI Evaluation Pipeline...\n' }]);
    const evtSource = new EventSource('/api/pipeline/evaluate/stream');
    
    evtSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'done') {
        setIsEvaluating(false);
        evtSource.close();
        refetchPipeline();
        queryClient.invalidateQueries(['applications']);
      } else {
        setLogs(prev => [...prev, data]);
      }
    };
    
    evtSource.onerror = (err) => {
      console.error('SSE Error:', err);
      setIsEvaluating(false);
      evtSource.close();
      refetchPipeline();
    };
  };

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="h-full flex flex-col animate-fade-in">
      <PageHeader
        title="Portal Scanner & Pipeline"
        subtitle="Zero-token automated discovery & AI Evaluation"
        actions={
          <div className="flex items-center gap-3">
            <Button onClick={startScan} disabled={isScanning || isEvaluating} variant="secondary">
              {isScanning ? <Terminal className="w-4 h-4 animate-pulse" /> : <Radar className="w-4 h-4" />}
              {isScanning ? 'Running...' : 'Run Scan'}
            </Button>
            <Button onClick={startEvaluate} disabled={isScanning || isEvaluating || pipeline?.pending?.length === 0}>
              <Play className="w-4 h-4" />
              {isEvaluating ? 'Evaluating...' : 'Evaluate Inbox'}
            </Button>
          </div>
        }
      />
      
      <div className="flex-1 p-8 min-h-0 flex gap-6">
        {/* Scanner Terminal */}
        <Card className="flex-[3] flex flex-col bg-[#0d0d12] border-surface-300/30 font-mono text-xs overflow-hidden h-full">
          <div className="px-4 py-2 bg-surface-200 border-b border-surface-300/30 flex items-center gap-2 shrink-0">
            <Terminal className="w-4 h-4 text-white/40" />
            <span className="text-white/50">scan.mjs output</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-1">
            {logs.length === 0 && !isScanning && (
              <div className="text-white/30 italic">Click "Run Scan" to start the automated discovery process...</div>
            )}
            {logs.map((log, i) => (
              <div key={i} className={`${log.type === 'stderr' ? 'text-status-rejected' : 'text-white/70'} whitespace-pre-wrap`}>
                {log.text}
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </Card>

        {/* Pipeline Inbox */}
        <Card className="flex-[2] flex flex-col h-full overflow-hidden border-surface-300/30 bg-surface-100">
          <div className="px-5 py-4 border-b border-surface-300/20 bg-surface-50 shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Inbox className="w-5 h-5 text-primary-400" />
              <h3 className="font-medium text-white/90">Pending Inbox</h3>
            </div>
            {pipeline?.pending?.length > 0 && (
              <span className="px-2 py-0.5 bg-primary-500/20 text-primary-300 text-xs rounded-full font-mono">
                {pipeline.pending.length} new
              </span>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto p-2">
            {pipeline?.pending?.length === 0 ? (
              <div className="h-full flex items-center justify-center text-white/30 text-sm text-center px-6">
                No pending offers.<br />Run the scanner to find new jobs.
              </div>
            ) : (
              <div className="space-y-1">
                {pipeline?.pending?.map((job, i) => (
                  <div key={i} className="p-3 hover:bg-surface-200/50 rounded-lg transition-colors border border-transparent hover:border-surface-300/20 group">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-sm text-white/90">{job.company || 'Unknown'}</span>
                      <a href={job.url} target="_blank" rel="noopener noreferrer" className="text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                    <p className="text-xs text-white/50 line-clamp-2">{job.title || job.url}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {pipeline?.pending?.length > 0 && (
            <div className="p-4 bg-surface-50 border-t border-surface-300/20 shrink-0">
              <div className="text-xs text-white/50 mb-3 bg-surface-200/50 p-2.5 rounded-md border border-surface-300/20">
                Click <strong className="text-white/80">Evaluate Inbox</strong> above to process these jobs using your AI agent.
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
