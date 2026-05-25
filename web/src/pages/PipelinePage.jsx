import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client.js';
import {
  Card, PageHeader, StatusBadge, ScoreBadge, Button, EmptyState, normalizeStatus
} from '../components/ui/index.jsx';
import {
  Search, SlidersHorizontal, LayoutGrid, Table2, ChevronDown,
  ExternalLink, FileText, X, KanbanSquare, Zap, MapPin, DollarSign, Calendar
} from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const STATUSES = ['evaluated', 'interested', 'applied', 'responded', 'interview', 'offer', 'rejected', 'discarded', 'skip'];

export default function PipelinePage() {
  const [view, setView] = useState('table');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [selectedApp, setSelectedApp] = useState(null);
  
  const queryClient = useQueryClient();

  const { data: apps = [], isLoading } = useQuery({ queryKey: ['applications'], queryFn: api.getApplications });

  const filtered = useMemo(() => {
    let result = apps;
    if (statusFilter === 'active') {
      const inactive = ['discarded', 'rejected', 'skip'];
      result = result.filter(a => !inactive.includes(normalizeStatus(a.status)));
    } else if (statusFilter) {
      result = result.filter(a => normalizeStatus(a.status) === statusFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(a =>
        a.company?.toLowerCase().includes(q) || a.role?.toLowerCase().includes(q) || a.notes?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [apps, statusFilter, search]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Pipeline Tracker"
        subtitle={`${apps.length} applications tracked`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant={view === 'table' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setView('table')}
            >
              <Table2 className="w-4 h-4" /> Table
            </Button>
            <Button
              variant={view === 'kanban' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setView('kanban')}
            >
              <LayoutGrid className="w-4 h-4" /> Kanban
            </Button>
          </div>
        }
      />

      {/* Filter Bar */}
      <div className="px-8 py-4 border-b border-surface-300/20 flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="Search companies, roles..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-surface-100 border border-surface-300/40 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <FilterChip label="Active" active={statusFilter === 'active'} onClick={() => setStatusFilter('active')} />
          <FilterChip label="All" active={!statusFilter} onClick={() => setStatusFilter(null)} />
          {STATUSES.map(s => (
            <FilterChip key={s} label={s} active={statusFilter === s} onClick={() => setStatusFilter(s === statusFilter ? 'active' : s)} />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        {isLoading ? (
          <div className="animate-pulse space-y-3">
            {[...Array(8)].map((_, i) => <div key={i} className="h-12 bg-surface-200 rounded-lg" />)}
          </div>
        ) : view === 'table' ? (
          <TableView apps={filtered} onSelect={setSelectedApp} />
        ) : (
          <KanbanView apps={filtered} onSelect={setSelectedApp} />
        )}
      </div>

      {/* Report Slide-out Panel */}
      {selectedApp && (
        <ReportPanel 
          app={selectedApp} 
          onClose={() => setSelectedApp(null)} 
          onStatusUpdate={(rn, s) => {
            api.updateStatus(rn, s).then(() => {
              // Update local state to reflect change immediately in the modal
              setSelectedApp(prev => ({ ...prev, status: s }));
              // Invalidate query to update the main list
              queryClient.invalidateQueries(['applications']);
            });
          }}
        />
      )}
    </div>
  );
}

/* ── Table View ──────────────────────────────────────────────── */
function TableView({ apps, onSelect }) {
  const [sortKey, setSortKey] = useState('number');
  const [sortDir, setSortDir] = useState('desc');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ reportNumber, status }) => api.updateStatus(reportNumber, status),
    onSuccess: () => queryClient.invalidateQueries(['applications']),
  });

  const sorted = useMemo(() => {
    const copy = [...apps];
    copy.sort((a, b) => {
      let va = a[sortKey], vb = b[sortKey];
      if (sortKey === 'score') { va = a.score || 0; vb = b.score || 0; }
      if (sortKey === 'number') { va = a.number || 0; vb = b.number || 0; }
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return copy;
  }, [apps, sortKey, sortDir]);

  const toggleSort = key => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  if (apps.length === 0) return <EmptyState icon={KanbanSquare} title="No applications found" description="Paste a job URL in the CLI to start tracking" />;

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-white/40 border-b border-surface-300/20">
              {[
                { key: 'number', label: '#', w: 'w-12' },
                { key: 'date', label: 'Date', w: 'w-24' },
                { key: 'company', label: 'Company' },
                { key: 'role', label: 'Role' },
                { key: 'score', label: 'Score', w: 'w-16' },
                { key: 'status', label: 'Status', w: 'w-28' },
                { key: 'hasPdf', label: 'PDF', w: 'w-12' },
                { key: 'notes', label: 'Notes' },
              ].map(col => (
                <th
                  key={col.key}
                  className={`px-4 py-3 font-medium cursor-pointer hover:text-white/60 transition-colors select-none ${col.w || ''}`}
                  onClick={() => toggleSort(col.key)}
                >
                  <span className="flex items-center gap-1">
                    {col.label}
                    {sortKey === col.key && <ChevronDown className={`w-3 h-3 transition-transform ${sortDir === 'asc' ? 'rotate-180' : ''}`} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-300/10">
            {sorted.map(app => (
              <tr
                key={app.number}
                className="hover:bg-surface-200/30 transition-colors cursor-pointer group"
                onClick={() => app.reportPath && onSelect(app)}
              >
                <td className="px-4 py-3 text-xs font-mono text-white/40">{app.number}</td>
                <td className="px-4 py-3 text-xs font-mono text-white/40">{app.date}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white/90">{app.company}</span>
                    {app.jobUrl && (
                      <a href={app.jobUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                         className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <ExternalLink className="w-3 h-3 text-primary-400" />
                      </a>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-white/60 max-w-[260px] truncate">{app.role}</td>
                <td className="px-4 py-3"><ScoreBadge score={app.score} /></td>
                <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                  <StatusDropdown
                    current={app.status}
                    reportNumber={app.reportNumber}
                    onUpdate={(rn, s) => mutation.mutate({ reportNumber: rn, status: s })}
                  />
                </td>
                <td className="px-4 py-3 text-center">{app.hasPdf ? '✅' : '❌'}</td>
                <td className="px-4 py-3 text-xs text-white/40 max-w-[200px] truncate">{app.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/* ── Kanban View ─────────────────────────────────────────────── */
function KanbanView({ apps, onSelect }) {
  const columns = useMemo(() => {
    const cols = {};
    for (const s of STATUSES) cols[s] = [];
    for (const app of apps) {
      const ns = normalizeStatus(app.status);
      if (cols[ns]) cols[ns].push(app);
      else cols.evaluated.push(app);
    }
    return cols;
  }, [apps]);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: '60vh' }}>
      {STATUSES.filter(s => columns[s]?.length > 0 || ['evaluated', 'applied', 'interview', 'offer'].includes(s)).map(status => (
        <div key={status} className="flex-shrink-0 w-72">
          <div className="flex items-center gap-2 mb-3 px-1">
            <StatusBadge status={status} />
            <span className="text-xs text-white/30 font-mono">{columns[status]?.length || 0}</span>
          </div>
          <div className="space-y-2">
            {(columns[status] || []).map(app => (
              <Card
                key={app.number}
                className="p-3 cursor-pointer hover:border-primary-500/40 transition-all duration-200 hover:shadow-lg hover:shadow-primary-500/5"
                onClick={() => app.reportPath && onSelect(app)}
              >
                <div className="flex justify-between items-start mb-1.5">
                  <span className="text-sm font-medium text-white/90 leading-tight">{app.company}</span>
                  <ScoreBadge score={app.score} />
                </div>
                <p className="text-xs text-white/50 truncate">{app.role}</p>
                {(app.remote || app.archetype) && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {app.remote && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-status-applied/10 text-status-applied max-w-[120px] truncate">
                        📍 {app.remote.replace(/\s*\(.*\)/, '').replace(/Full\s+/, '')}
                      </span>
                    )}
                    {app.archetype && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary-500/10 text-primary-300 max-w-[120px] truncate">
                        🎭 {app.archetype.split('/')[0].split('|')[0].trim()}
                      </span>
                    )}
                  </div>
                )}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-surface-300/5">
                  <span className="text-[10px] text-white/30 font-mono">{app.date}</span>
                  <div className="flex gap-1">
                    {app.hasPdf && <span className="text-[10px]">✅</span>}
                    {app.jobUrl && <ExternalLink className="w-3 h-3 text-primary-400/50" />}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Status Dropdown ─────────────────────────────────────────── */
function StatusDropdown({ current, reportNumber, onUpdate }) {
  const [open, setOpen] = useState(false);
  const labels = { evaluated: 'Evaluated', interested: 'Interested', applied: 'Applied', responded: 'Responded', interview: 'Interview', offer: 'Offer', rejected: 'Rejected', discarded: 'Discarded', skip: 'SKIP' };

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1">
        <StatusBadge status={current} />
        <ChevronDown className="w-3 h-3 text-white/30" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute z-50 top-8 left-0 bg-surface-100 border border-surface-300/40 rounded-lg shadow-xl py-1 min-w-[140px]">
            {STATUSES.map(s => (
              <button
                key={s}
                onClick={() => { onUpdate(reportNumber, labels[s]); setOpen(false); }}
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-surface-200/60 transition-colors flex items-center gap-2"
              >
                <StatusBadge status={s} />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ── Report Panel ────────────────────────────────────────────── */
function ReportPanel({ app, onClose, onStatusUpdate }) {
  const { data, isLoading } = useQuery({
    queryKey: ['report', app.reportPath],
    queryFn: () => {
      const filename = app.reportPath.replace('reports/', '');
      return api.getReport(filename);
    },
    enabled: !!app.reportPath,
  });

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-4xl bg-surface-50 border-l border-surface-300/40 z-50 animate-slide-in-right flex flex-col overflow-hidden">
        {/* Fixed Header */}
        <div className="shrink-0 bg-surface-50 border-b border-surface-300/30 px-8 py-5 flex items-start justify-between z-20 shadow-sm">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-1.5">
              <h2 className="font-heading font-bold text-2xl text-white tracking-tight">{app.company}</h2>
              <ScoreBadge score={app.score} className="text-lg px-2 py-0.5 bg-surface-200/50 rounded-md border border-surface-300/30" />
              <div className="ml-2">
                <StatusDropdown
                  current={app.status}
                  reportNumber={app.reportNumber}
                  onUpdate={onStatusUpdate}
                />
              </div>
            </div>
            <p className="text-base text-white/70 font-medium mb-3">{app.role}</p>
            
            {/* Metadata UI Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {app.date && (
                <span className="px-2.5 py-1 bg-surface-200/50 text-white/60 text-xs rounded-md border border-surface-300/20 font-mono flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-white/40" /> {app.date}
                </span>
              )}
              {app.archetype && (
                <span className="px-2.5 py-1 bg-primary-500/10 text-primary-300 text-xs rounded-md border border-primary-500/20 flex items-center gap-1">
                  🎭 {app.archetype}
                </span>
              )}
              {app.remote && (
                <span className="px-2.5 py-1 bg-status-applied/10 text-status-applied text-xs rounded-md border border-status-applied/20 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-status-applied/75" /> {app.remote}
                </span>
              )}
              {app.comp && (
                <span className="px-2.5 py-1 bg-status-responded/10 text-status-responded text-xs rounded-md border border-status-responded/20 font-mono flex items-center gap-1">
                  <DollarSign className="w-3 h-3 text-status-responded/75" /> {app.comp}
                </span>
              )}
              {app.legitimacy && (
                <span className="px-2.5 py-1 bg-status-interview/10 text-status-interview text-xs rounded-md border border-status-interview/20 flex items-center gap-1">
                  🛡️ {app.legitimacy}
                </span>
              )}
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              {app.jobUrl && (
                <a href={app.jobUrl} target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:text-primary-300 text-sm flex items-center gap-1.5 transition-colors font-medium">
                  <ExternalLink className="w-4 h-4" /> Position URL
                </a>
              )}
              {app.hasPdf && app.reportPath && (
                <div className="flex items-center gap-1.5 text-xs font-mono text-status-offer bg-status-offer/10 px-2.5 py-1 rounded-md border border-status-offer/20">
                  <FileText className="w-3.5 h-3.5" />
                  Resume: {app.reportPath.replace('reports/', 'output/').replace('.md', '.pdf')}
                </div>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-2 -mr-2 -mt-2 text-white/40 hover:text-white hover:bg-surface-200/50 rounded-lg transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-8 pb-16 pt-6 relative">
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(10)].map((_, i) => <div key={i} className="h-4 bg-surface-200 rounded" style={{ width: `${60 + Math.random() * 40}%` }} />)}
            </div>
          ) : data?.content ? (
            <div className="space-y-6">
              {app.tldr && (
                <div className="bg-primary-500/5 border border-primary-500/10 rounded-xl p-4 flex gap-3.5 items-start">
                  <div className="mt-0.5 shrink-0 bg-primary-500/10 p-1.5 rounded-lg border border-primary-500/20">
                    <Zap className="w-4 h-4 text-primary-400 fill-primary-400/20" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-primary-300 uppercase tracking-wider mb-1 font-mono">Quick Summary / TL;DR</h4>
                    <p className="text-sm text-white/80 leading-relaxed italic">{app.tldr}</p>
                  </div>
                </div>
              )}
              <div className="prose prose-invert prose-base max-w-none prose-headings:font-heading prose-headings:text-primary-300 prose-headings:font-semibold prose-h2:sticky prose-h2:top-[-17px] prose-h2:bg-surface-50/95 prose-h2:backdrop-blur-md prose-h2:py-3 prose-h2:px-8 prose-h2:-mx-8 prose-h2:z-10 prose-h2:border-b prose-h2:border-surface-300/30 prose-h2:mt-8 prose-h2:shadow-sm prose-a:text-primary-400 prose-strong:text-white/90 prose-th:bg-surface-200/50 prose-th:px-4 prose-th:py-2.5 prose-th:text-white/80 prose-td:px-4 prose-td:py-2.5 prose-td:border-b prose-td:border-surface-300/20 prose-tr:hover:bg-surface-200/20 prose-table:border prose-table:border-surface-300/30 prose-table:rounded-lg prose-table:overflow-hidden">
              <Markdown remarkPlugins={[remarkGfm]}>
                {data.content
                  .replace(/^#\s+.*$/m, '') // Remove redundant H1 title
                  .replace(/^(?:\*\*)?(?:Date|Archetype(?: detected)?|Score|Legitimacy|URL|PDF|Arquetipo(?: detectado)?|Fecha|Puntaje):?(?:\*\*)?\s*.*$/gm, '') // Remove metadata lines
                  .replace(/.*https?:\/\/\S+.*/g, '') // Remove any line containing a URL from the header area
                  .replace(/\n{3,}/g, '\n\n') // Clean up extra empty lines
                  .trim()
                }
              </Markdown>
            </div></div>
          ) : (
            <p className="text-white/40 text-sm">Report not available</p>
          )}
        </div>
      </div>
    </>
  );
}

/* ── Filter Chip ─────────────────────────────────────────────── */
function FilterChip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all capitalize ${
        active
          ? 'bg-primary-500/20 text-primary-300 ring-1 ring-primary-500/30'
          : 'text-white/40 hover:text-white/60 hover:bg-surface-200/40'
      }`}
    >
      {label}
    </button>
  );
}
