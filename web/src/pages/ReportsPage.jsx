import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client.js';
import { PageHeader, Card, StatusBadge } from '../components/ui/index.jsx';

export default function ReportsPage() {
  const { data: reports, isLoading } = useQuery({ queryKey: ['reports'], queryFn: api.getReports });

  if (isLoading) return <div className="p-8">Loading reports...</div>;

  return (
    <div className="animate-fade-in pb-12">
      <PageHeader title="Evaluation Reports" subtitle={`${reports?.length || 0} offers analyzed`} />
      
      <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {reports?.map(report => (
          <Card key={report.filename} className="p-5 hover:border-primary-500/30 transition-colors cursor-pointer group">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-heading font-semibold text-white/90 leading-tight group-hover:text-primary-300 transition-colors line-clamp-2">
                {report.title}
              </h3>
              <span className="font-mono text-sm font-bold text-white/80 shrink-0 ml-2">{report.score}</span>
            </div>
            
            <div className="flex items-center gap-2 mb-3">
              {report.archetype && <span className="text-xs text-white/40">{report.archetype}</span>}
            </div>

            <div className="mt-4 pt-3 border-t border-surface-300/20 flex justify-between items-center text-xs text-white/40">
              <span className="font-mono">{report.date}</span>
              <span className="truncate ml-2">{report.legitimacy}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
